import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { managedGitleaksPath } from './gitleaks-path.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const managedBinary = managedGitleaksPath(ROOT)
const binary = managedBinary && existsSync(managedBinary) ? managedBinary : 'gitleaks'
const result = spawnSync(binary, process.argv.slice(2), { cwd: ROOT, stdio: 'inherit' })

if (result.error?.code === 'ENOENT') {
  console.error(
    'Gitleaks is not installed. Run `pnpm setup` to fetch the verified official binary.',
  )
  process.exitCode = 1
} else if (result.error) {
  console.error(`Could not run Gitleaks: ${result.error.message}`)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
