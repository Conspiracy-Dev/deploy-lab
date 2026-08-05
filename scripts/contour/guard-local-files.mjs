import { spawnSync } from 'node:child_process'

function stagedFiles() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' })

  if (result.error || result.status !== 0) {
    return []
  }

  return result.stdout.split(/\r?\n/).filter(Boolean)
}

function main() {
  const offenders = stagedFiles().filter((path) => path.toLowerCase().endsWith('.local.md'))

  if (offenders.length === 0) {
    console.log('guard-local-files: clean')
    return
  }

  console.error(`guard-local-files: ${offenders.length} staged file(s) must never be committed`)

  for (const offender of offenders) {
    console.error(
      `FAIL ${offender}: personal knowledge files are gitignored; unstage with 'git restore --staged'`,
    )
  }

  process.exitCode = 1
}

main()
