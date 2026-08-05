import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const REQUIRED_HEADINGS = [
  'Goal',
  'Non-goals',
  'Constraints',
  'Ownership seam',
  'Plan',
  'Verification',
  'Risk and stop condition',
]

function parseArguments(argv) {
  if (argv.length !== 2 || argv[0] !== '--file') {
    throw new Error('Usage: pnpm task:intake:check -- --file <plan.md>')
  }

  return resolve(argv[1])
}

async function main() {
  const file = parseArguments(process.argv.slice(2))
  const plan = await readFile(file, 'utf8')
  const missing = REQUIRED_HEADINGS.filter(
    (heading) => !new RegExp(`^## ${heading}\\s*$`, 'm').test(plan),
  )

  if (missing.length > 0) {
    throw new Error(
      `${file} is not a verifiable task plan; missing sections: ${missing.join(', ')}`,
    )
  }

  console.log(`PASS task intake: ${file} has ${REQUIRED_HEADINGS.length} required sections`)
}

main().catch((error) => {
  console.error(`FAIL task intake: ${error.message}`)
  process.exitCode = 1
})
