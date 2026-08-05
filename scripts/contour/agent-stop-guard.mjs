import { execFileSync } from 'node:child_process'
import process from 'node:process'

const provider = process.argv.find((argument) => argument.startsWith('--provider='))?.split('=')[1]

let diffCheck
try {
  diffCheck = execFileSync('git', ['diff', '--check'], { encoding: 'utf8' })
} catch (error) {
  diffCheck = `${error.stdout ?? ''}${error.stderr ?? ''}`
}

if (!diffCheck.trim()) {
  process.exit(0)
}

const message = `DeployLab diff integrity check failed:\n${diffCheck.trim()}`

if (provider === 'codex') {
  process.stdout.write(
    `${JSON.stringify({
      continue: false,
      stopReason: message,
      systemMessage: 'Fix git diff --check failures before ending the turn.',
    })}\n`,
  )
  process.exit(0)
}

process.stderr.write(`${message}\n`)
process.exit(2)
