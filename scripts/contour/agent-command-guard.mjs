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
const normalizedCommand = command.toLowerCase()
const blockedReason = [
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard can discard tracked work'],
  [/\bgit\s+clean\b/, 'git clean can remove untracked work'],
  [/\bgit\s+push\b[^\n]*(?:--force\b|-f\b)/, 'force-push can rewrite shared history'],
  [/(?:^|[;&|]\s*)rm\s+-rf\s+(?:\/|~)(?:\s|$)/, 'recursive deletion targets a filesystem root'],
  [
    /(?:^|[;&|]\s*)(?:rmdir|remove-item)\b[^\n]*(?:\s+\/s\b|\s+-recurse\b)[^\n]*(?:\s+[a-z]:\\?\s*$|\s+\\\\\?\\[a-z]:\\?\s*$)/,
    'recursive deletion targets a drive root',
  ],
  [
    /\bgit\s+\S+[^\n]*--no-verify\b/,
    '--no-verify bypasses the repository commit or push safety hooks',
  ],
  [
    /\b(?:cat|type|more|less|get-content)\b[^\n]*\.env\b(?!\.example)/,
    'printing .env risks exposing secrets into the transcript',
  ],
].find(([pattern]) => pattern.test(normalizedCommand))?.[1]

if (!blockedReason) {
  process.exit(0)
}

const message = `Blocked by DeployLab safety guard: ${blockedReason}. Use a targeted, recoverable command and obtain explicit user approval for destructive work.`

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
