import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
const CHECK = join(ROOT, 'scripts', 'onboarding', 'task-intake-check.mjs')
const validPlan = join(ROOT, 'docs', 'onboarding', 'examples', 'verified-task-plan.md')

function expectExit(file, expected) {
  const result = spawnSync(process.execPath, [CHECK, '--file', file], { encoding: 'utf8' })

  if (result.status !== expected) {
    throw new Error(
      `expected exit ${expected} for ${file}; got ${result.status}; ${result.stdout}${result.stderr}`,
    )
  }
}

async function main() {
  expectExit(validPlan, 0)
  const directory = await mkdtemp(join(tmpdir(), 'deploy-lab-intake-'))
  const invalidPlan = join(directory, 'invalid.md')

  try {
    await writeFile(invalidPlan, '## Goal\n\nToo vague.\n')
    expectExit(invalidPlan, 1)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }

  console.log('task intake check: valid and invalid plans behave as expected')
}

main().catch((error) => {
  console.error(`FAIL task intake test: ${error.message}`)
  process.exitCode = 1
})
