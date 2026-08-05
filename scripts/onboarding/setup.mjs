import { spawnSync } from 'node:child_process'
import { copyFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKIP_INSTALL = new Set(process.argv.slice(2))

if (![...SKIP_INSTALL].every((argument) => argument === '--skip-install')) {
  console.error('Usage: pnpm setup [-- --skip-install]')
  process.exit(1)
}

function command(name) {
  return process.platform === 'win32' ? `${name}.cmd` : name
}

function run(name, args) {
  const executable = command(name)
  const result =
    process.platform === 'win32'
      ? spawnSync(
          process.env.ComSpec ?? 'cmd.exe',
          ['/d', '/c', `call ${executable} ${args.join(' ')}`],
          {
            cwd: ROOT,
            stdio: 'inherit',
          },
        )
      : spawnSync(executable, args, { cwd: ROOT, stdio: 'inherit' })

  if (result.error) {
    throw new Error(`Could not start ${name}: ${result.error.message}`)
  }

  if (result.status !== 0) {
    throw new Error(`${name} ${args.join(' ')} exited ${result.status}`)
  }
}

async function ensureLocalEnv() {
  const example = resolve(ROOT, '.env.example')
  const local = resolve(ROOT, '.env')

  try {
    await stat(local)
    console.log('Setup: keeping existing .env')
  } catch {
    await copyFile(example, local)
    console.log('Setup: created .env from .env.example')
  }
}

async function main() {
  if (!SKIP_INSTALL.has('--skip-install')) {
    run('corepack', ['pnpm', 'install', '--frozen-lockfile'])
  }

  await ensureLocalEnv()
  run('corepack', ['pnpm', 'exec', 'lefthook', 'install'])
  const result = spawnSync(process.execPath, ['scripts/tooling/install-gitleaks.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  })

  if (result.error || result.status !== 0) {
    throw new Error(
      `Gitleaks installation failed${result.error ? `: ${result.error.message}` : ''}`,
    )
  }

  run('corepack', ['pnpm', 'run', 'setup:doctor'])
  console.log('Setup complete. Next: pnpm dev')
}

main().catch((error) => {
  console.error(`Setup failed: ${error.message}`)
  process.exitCode = 1
})
