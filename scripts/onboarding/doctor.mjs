import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GITLEAKS_VERSION, managedGitleaksPath } from '../tooling/gitleaks-path.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const failures = []

function fail(message) {
  failures.push(message)
  console.error(`FAIL setup: ${message}`)
}

function pass(message) {
  console.log(`PASS setup: ${message}`)
}

function run(command, args) {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command

  if (process.platform === 'win32') {
    return spawnSync(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/c', `call ${executable} ${args.join(' ')}`],
      {
        cwd: ROOT,
        encoding: 'utf8',
      },
    )
  }

  return spawnSync(executable, args, { cwd: ROOT, encoding: 'utf8' })
}

function checkNode() {
  const major = Number.parseInt(process.versions.node.split('.', 1)[0], 10)

  if (major !== 24) {
    fail(`Node.js 24 is required; found ${process.version}`)
    return
  }

  pass(`Node.js ${process.version}`)
}

function checkPnpm() {
  const result = run('corepack', ['pnpm', '--version'])

  if (result.error || result.status !== 0) {
    fail(`Corepack pnpm is unavailable${result.error ? `: ${result.error.message}` : ''}`)
    return
  }

  const version = result.stdout.trim()

  if (!version.startsWith('11.')) {
    fail(`pnpm 11 is required; found ${version || 'no version output'}`)
    return
  }

  pass(`pnpm ${version} via Corepack`)
}

function checkFiles() {
  const required = ['node_modules', '.env', '.env.example', 'lefthook.yml', 'AGENTS.md']
  const missing = required.filter((path) => !existsSync(resolve(ROOT, path)))

  if (missing.length > 0) {
    fail(`missing ${missing.join(', ')}; run pnpm setup from a clean clone`)
    return
  }

  pass('dependencies, local environment template, hooks config, and canonical router are present')
}

function checkPackageManager() {
  const packageJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))

  if (packageJson.packageManager !== 'pnpm@11.5.2') {
    fail(`packageManager must be pnpm@11.5.2; found ${packageJson.packageManager ?? 'unset'}`)
    return
  }

  pass('package manager is pinned in package.json')
}

function checkGitleaks() {
  const binary = managedGitleaksPath(ROOT)

  if (!binary || !existsSync(binary)) {
    fail(`verified Gitleaks ${GITLEAKS_VERSION} binary is missing; rerun pnpm setup`)
    return
  }

  const result = spawnSync(binary, ['version'], { cwd: ROOT, encoding: 'utf8' })

  if (result.error || result.status !== 0) {
    fail(`managed Gitleaks cannot run${result.error ? `: ${result.error.message}` : ''}`)
    return
  }

  pass(`Gitleaks ${result.stdout.trim() || GITLEAKS_VERSION}`)
}

function checkHooks() {
  const hook = resolve(ROOT, '.git', 'hooks', 'commit-msg')

  if (!existsSync(resolve(ROOT, '.git'))) {
    pass('Git hooks skipped outside a Git worktree')
    return
  }

  if (!existsSync(hook)) {
    fail('Lefthook commit-msg hook is missing; rerun pnpm setup')
    return
  }

  pass('Lefthook commit-msg hook is installed')
}

checkNode()
checkPnpm()
checkFiles()
checkPackageManager()
checkGitleaks()
checkHooks()

if (failures.length > 0) {
  console.error(`setup doctor: ${failures.length} failure(s)`)
  process.exitCode = 1
} else {
  console.log('setup doctor: ready')
}
