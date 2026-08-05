import { readFile, readdir, stat } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const SCAN_ROOTS = ['app', 'server', 'shared']
const SCAN_EXTENSIONS = new Set(['.ts', '.vue', '.mjs', '.cjs'])
const GENERIC_BASENAMES = new Set([
  'utils',
  'util',
  'helpers',
  'helper',
  'common',
  'misc',
  'manager',
])
const ALLOWED_TODO = /\bTODO\([^)\n]+\):\s*\S/
const BARE_TODO_OR_FIXME = /\b(TODO|FIXME)\b/g
const CHECKS = [
  {
    name: 'as-any',
    pattern: /\bas\s+any\b/g,
    message: 'uses "as any", which the Code integrity invariant in AGENTS.md forbids',
  },
  {
    name: 'ts-suppression',
    pattern: /@ts-ignore|@ts-expect-error/g,
    message: '"@ts-ignore"/"@ts-expect-error" suppress the type checker instead of fixing the type',
  },
  {
    name: 'console-log',
    pattern: /console\.log\(/g,
    message: 'leaves a "console.log(" call in shipped source',
  },
  {
    name: 'empty-catch',
    pattern: /catch\s*(\([^)]*\))?\s*\{\s*\}/g,
    message:
      'has an empty "catch" block; a catch must rethrow, log, notify, report telemetry, or explain the omission',
  },
]

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function listFiles(root) {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }

  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name)

      if (entry.isDirectory()) {
        return listFiles(path)
      }

      return SCAN_EXTENSIONS.has(extname(entry.name)) ? [path] : []
    }),
  )

  return files.flat()
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length
}

async function scanFile(path, findings) {
  const displayPath = relative(ROOT, path)
  const base = basename(path, extname(path)).toLowerCase()

  if (GENERIC_BASENAMES.has(base)) {
    findings.push(
      `${displayPath}: generic dump filename "${basename(path)}" hides the file's real ownership seam`,
    )
  }

  const text = await readFile(path, 'utf8')

  for (const check of CHECKS) {
    for (const match of text.matchAll(check.pattern)) {
      findings.push(`${displayPath}:${lineNumberAt(text, match.index)}: ${check.message}`)
    }
  }

  for (const match of text.matchAll(BARE_TODO_OR_FIXME)) {
    const lineStart = text.lastIndexOf('\n', match.index) + 1
    const lineEndIndex = text.indexOf('\n', match.index)
    const fullLine = text.slice(lineStart, lineEndIndex === -1 ? text.length : lineEndIndex)

    if (match[1] === 'FIXME' || !ALLOWED_TODO.test(fullLine)) {
      findings.push(
        `${displayPath}:${lineNumberAt(text, match.index)}: bare "${match[1]}" without the required "TODO(<ref>): description" form`,
      )
    }
  }
}

async function main() {
  const findings = []

  for (const scanRoot of SCAN_ROOTS) {
    const absoluteRoot = join(ROOT, scanRoot)

    if (!(await pathExists(absoluteRoot))) {
      continue
    }

    const files = await listFiles(absoluteRoot)

    for (const file of files) {
      await scanFile(file, findings)
    }
  }

  if (findings.length > 0) {
    console.error(`slop-scan: ${findings.length} finding(s)`)

    for (const finding of findings) {
      console.error(`FAIL ${finding}`)
    }

    process.exitCode = 1
    return
  }

  console.log('slop-scan: clean')
}

main().catch((error) => {
  console.error(`FAIL slop-scan: ${error.stack ?? error.message}`)
  process.exitCode = 1
})
