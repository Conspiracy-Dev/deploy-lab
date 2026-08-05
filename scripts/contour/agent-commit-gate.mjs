import { spawnSync } from 'node:child_process'
import { delimiter, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const provider = process.argv.find((argument) => argument.startsWith('--provider='))?.split('=')[1]

const input = await new Promise((resolve, reject) => {
  let text = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (chunk) => {
    text += chunk
  })
  process.stdin.on('end', () => resolve(text))
  process.stdin.on('error', reject)
})

let payload
try {
  payload = JSON.parse(input)
} catch {
  process.exit(0)
}

const command = payload.tool_input?.command ?? payload.toolInput?.command ?? ''

if (!/\bgit\s+commit\b/.test(command)) {
  process.exit(0)
}

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const GATE_SCRIPTS = [
  'format:check',
  'lint',
  'lint:styles',
  'slop-scan',
  'guard-local-files',
  'secrets:check',
]

function pnpmBinary() {
  return process.env.CONTOUR_DOCTOR_PNPM ?? (process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm')
}

function run(binary, args, cwd) {
  const options = {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}`,
    },
  }

  if (process.platform === 'win32' && binary.toLowerCase().endsWith('.cmd')) {
    const commandLine = `call ${[binary, ...args].join(' ')}`
    return spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', commandLine], options)
  }

  return spawnSync(binary, args, options)
}

const failures = []

for (const script of GATE_SCRIPTS) {
  const result = run(pnpmBinary(), ['run', script], ROOT)

  if (result.error) {
    failures.push(`${script}: could not start (${result.error.message})`)
    break
  }

  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    failures.push(`${script}: exit ${result.status}\n${output || 'no output'}`)
    break
  }
}

if (failures.length === 0) {
  process.exit(0)
}

const message = `Blocked by DeployLab commit gate: pre-commit checks did not pass.\n\n${failures.join('\n\n')}\n\nFix the failure, or explain the constraint to the user and ask before bypassing verification.`

if (provider === 'codex') {
  process.stdout.write(
    `${JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: message,
      },
    })}\n`,
  )
  process.exit(0)
}

process.stderr.write(`${message}\n`)
process.exit(2)
