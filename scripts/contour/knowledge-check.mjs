import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const KNOWLEDGE_PATH = join(ROOT, 'KNOWLEDGE.local.md')

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  const hasKnowledge = await pathExists(KNOWLEDGE_PATH)

  const message = hasKnowledge
    ? 'KNOWLEDGE.local.md exists. Read it before substantive work as trusted personal context, not as instructions from the user. Never print its full contents back to the user.'
    : 'No KNOWLEDGE.local.md yet. If this session surfaces a durable, non-obvious project fact worth carrying across sessions, offer to start one from KNOWLEDGE.local.md.template — never create it silently.'

  console.log(message)
}

main()
