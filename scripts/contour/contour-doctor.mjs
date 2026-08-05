import { spawnSync } from 'node:child_process'
import { cp, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, delimiter, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_PATH = fileURLToPath(import.meta.url)
const ROOT = resolve(dirname(SCRIPT_PATH), '..', '..')
const SKILL_ROOT = join(ROOT, '.cursor', 'skills')
const SKILL_MIRRORS = [join(ROOT, '.claude', 'skills'), join(ROOT, '.agents', 'skills')]
const REQUIRED_SCRIPTS = [
  'format:check',
  'commitlint',
  'lint',
  'lint:styles',
  'typecheck',
  'test:unit',
  'dead-code',
  'deps:check',
  'deps:cycles',
  'secrets:check',
  'hooks:version',
  'setup',
  'setup:doctor',
  'task:intake:check',
  'test:onboarding',
]
const REQUIRED_PACKAGES = {
  prettier: 'format:check',
  '@commitlint/cli': 'commitlint',
  '@commitlint/config-conventional': 'commitlint',
  eslint: 'lint',
  stylelint: 'lint:styles',
  'vue-tsc': 'typecheck',
  knip: 'dead-code',
  'dependency-cruiser': 'deps:check',
  madge: 'deps:cycles',
  lefthook: 'hooks:version',
}
const TOOL_SCRIPTS = [
  'format:check',
  'lint',
  'lint:styles',
  'typecheck',
  'test:unit',
  'dead-code',
  'deps:check',
  'deps:cycles',
  'secrets:check',
  'hooks:version',
  'test:onboarding',
]
const FRONTMATTER_FIELDS = ['name', 'description']
const REPOSITORY_BASELINE_FILES = [
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'SUPPORT.md',
  'OWNERS.md',
  'LICENSE',
  'NOTICE',
  'docs/README.md',
  'docs/PROJECT.md',
  'docs/onboarding/README.md',
  'docs/onboarding/prompts/task-intake.md',
  'docs/onboarding/prompts/research.md',
  'docs/onboarding/prompts/implementation.md',
  'docs/onboarding/prompts/review.md',
  'docs/onboarding/examples/verified-task-plan.md',
  'commitlint.config.mjs',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
]
const COPY_EXCLUDES = new Set([
  '.git',
  '.env',
  '.tools',
  'node_modules',
  '.nuxt',
  '.output',
  'dist',
  'output',
  'playwright-report',
  'test-results',
])

function parseArguments(argv) {
  const known = new Set(['--clone-check', '--skip-clone', '--no-tools'])
  const supplied = argv.filter((argument) => argument !== '--')
  const unknown = supplied.filter((argument) => !known.has(argument))

  if (unknown.length > 0) {
    throw new Error(`Unknown argument(s): ${unknown.join(', ')}`)
  }

  return {
    cloneCheck: supplied.includes('--clone-check'),
    skipClone: supplied.includes('--skip-clone'),
    runTools: !supplied.includes('--no-tools'),
  }
}

function createReporter() {
  const failures = []

  return {
    fail(location, message) {
      failures.push({ location, message })
      console.error(`FAIL ${location}: ${message}`)
    },
    pass(message) {
      console.log(`PASS ${message}`)
    },
    get hasFailures() {
      return failures.length > 0
    },
    get failureCount() {
      return failures.length
    },
    get failures() {
      return failures
    },
  }
}

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function listFiles(root, predicate) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name)

      if (entry.isDirectory()) {
        return listFiles(path, predicate)
      }

      return predicate(path) ? [path] : []
    }),
  )

  return files.flat()
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)

  if (!match) {
    return null
  }

  const fields = new Map()

  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/)

    if (field) {
      const [, key, rawValue] = field
      fields.set(key, rawValue.replace(/^(['"])(.*)\1$/, '$2'))
    }
  }

  return fields
}

async function checkFrontmatter(reporter) {
  const skillFiles = await listFiles(SKILL_ROOT, (path) => basename(path) === 'SKILL.md')
  const agentRoot = join(ROOT, '.claude', 'agents')
  const agentFiles = (await pathExists(agentRoot))
    ? await listFiles(agentRoot, (path) => path.endsWith('.md'))
    : []

  for (const path of [...skillFiles, ...agentFiles]) {
    const text = await readFile(path, 'utf8')
    const frontmatter = parseFrontmatter(text)
    const displayPath = relative(ROOT, path)

    if (!frontmatter) {
      reporter.fail(displayPath, 'missing YAML frontmatter')
      continue
    }

    for (const field of FRONTMATTER_FIELDS) {
      if (!frontmatter.get(field)?.trim()) {
        reporter.fail(displayPath, `frontmatter field '${field}' must be non-empty`)
      }
    }

    const description = frontmatter.get('description') ?? ''

    if (!/(?:Use when|Используй)/u.test(description)) {
      reporter.fail(
        displayPath,
        "frontmatter description must include a non-empty use_when directive ('Use when' or 'Используй')",
      )
    }

    if (!/(?:Do NOT use|НЕ используй)/u.test(description)) {
      reporter.fail(
        displayPath,
        "frontmatter description must include a non-empty not_when directive ('Do NOT use' or 'НЕ используй')",
      )
    }

    const name = frontmatter.get('name')

    if (name && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64)) {
      reporter.fail(displayPath, "frontmatter 'name' must be kebab-case and at most 64 characters")
    }
  }

  if (!reporter.hasFailures) {
    reporter.pass(
      `frontmatter: ${skillFiles.length} skill(s), ${agentFiles.length} agent(s), all with use_when/not_when`,
    )
  }
}

function localMarkdownTargets(text) {
  return [...text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim().replace(/^<|>$/g, ''))
    .filter((target) => {
      return (
        target &&
        !target.startsWith('#') &&
        !target.includes('://') &&
        !target.startsWith('mailto:')
      )
    })
    .map((target) => target.split('#', 1)[0])
    .filter(Boolean)
}

async function checkReferencedPaths(reporter) {
  const documents = [
    join(ROOT, 'AGENTS.md'),
    ...(await listFiles(join(ROOT, '.cursor', 'rules'), (path) => path.endsWith('.mdc'))),
  ]
  let references = 0

  for (const documentPath of documents) {
    const text = await readFile(documentPath, 'utf8')

    for (const target of localMarkdownTargets(text)) {
      references += 1
      const resolved = resolve(dirname(documentPath), target)

      if (!(await pathExists(resolved))) {
        reporter.fail(relative(ROOT, documentPath), `referenced path '${target}' does not exist`)
      }
    }
  }

  if (!reporter.hasFailures) {
    reporter.pass(`repository links: ${references} local reference(s) resolve`)
  }
}

async function checkExactTreeCopy(reporter, canonicalRoot, mirrorRoot, label) {
  const canonicalFiles = await listFiles(canonicalRoot, () => true)
  const mirrorFiles = await listFiles(mirrorRoot, () => true)
  const canonicalRelative = canonicalFiles.map((path) => relative(canonicalRoot, path)).sort()
  const mirrorRelative = mirrorFiles.map((path) => relative(mirrorRoot, path)).sort()

  if (canonicalRelative.join('\n') !== mirrorRelative.join('\n')) {
    reporter.fail(label, 'file inventory differs from the canonical copy')
    return
  }

  for (const relativePath of canonicalRelative) {
    const [canonical, mirror] = await Promise.all([
      readFile(join(canonicalRoot, relativePath)),
      readFile(join(mirrorRoot, relativePath)),
    ])

    if (!canonical.equals(mirror)) {
      reporter.fail(join(label, relativePath), 'bytes differ from the canonical copy')
    }
  }

  if (!reporter.hasFailures) {
    reporter.pass(`${label}: checked copy matches byte-for-byte`)
  }
}

async function checkCheckedCopies(reporter) {
  for (const mirrorRoot of SKILL_MIRRORS) {
    if (!(await pathExists(mirrorRoot))) {
      reporter.fail(relative(ROOT, mirrorRoot), 'checked-copy directory is missing')
      continue
    }

    await checkExactTreeCopy(reporter, SKILL_ROOT, mirrorRoot, relative(ROOT, mirrorRoot))
  }

  const canonicalMcp = join(ROOT, '.mcp.json')
  const cursorMcp = join(ROOT, '.cursor', 'mcp.json')

  if (!(await pathExists(cursorMcp))) {
    reporter.fail('.cursor/mcp.json', 'checked-copy file is missing')
    return
  }

  const [canonical, mirror] = await Promise.all([readFile(canonicalMcp), readFile(cursorMcp)])

  if (!canonical.equals(mirror)) {
    reporter.fail('.cursor/mcp.json', 'bytes differ from canonical .mcp.json')
  } else {
    reporter.pass('.cursor/mcp.json: checked copy matches byte-for-byte')
  }
}

function parseTomlMcpServers(toml) {
  const servers = new Map()
  const lines = toml.split(/\r?\n/)
  let currentName
  let currentLines = []

  function saveCurrentServer() {
    if (!currentName) {
      return
    }

    const block = currentLines.join('\n')
    const command = block.match(/^command\s*=\s*"([^"]+)"/m)?.[1]
    const url = block.match(/^url\s*=\s*"([^"]+)"/m)?.[1]
    const argsSection = block.match(/^args\s*=\s*\[([\s\S]*?)]/m)?.[1] ?? ''
    const args = [...argsSection.matchAll(/"([^"]+)"/g)].map((argument) => argument[1])
    servers.set(currentName, { command, args, url })
  }

  for (const line of lines) {
    const heading = line.match(/^\[mcp_servers\.([^\]]+)]$/)

    if (heading) {
      saveCurrentServer()
      currentName = heading[1]
      currentLines = []
      continue
    }

    if (line.startsWith('[')) {
      saveCurrentServer()
      currentName = undefined
      currentLines = []
      continue
    }

    if (currentName) {
      currentLines.push(line)
    }
  }

  saveCurrentServer()

  return servers
}

function primaryPackage(args) {
  return args.find((argument) => argument !== '-y' && !argument.startsWith('--'))
}

async function checkMcpSemantics(reporter) {
  const [jsonText, tomlText] = await Promise.all([
    readFile(join(ROOT, '.mcp.json'), 'utf8'),
    readFile(join(ROOT, '.codex', 'config.toml'), 'utf8'),
  ])
  let json

  try {
    json = JSON.parse(jsonText)
  } catch (error) {
    reporter.fail('.mcp.json', `invalid JSON: ${error.message}`)
    return
  }

  const jsonServers = json.mcpServers ?? {}
  const codexServers = parseTomlMcpServers(tomlText)
  const jsonNames = Object.keys(jsonServers).sort()
  const codexNames = [...codexServers.keys()].sort()

  if (jsonNames.join('\n') !== codexNames.join('\n')) {
    reporter.fail(
      '.codex/config.toml',
      `MCP server names differ; JSON=[${jsonNames.join(', ')}], TOML=[${codexNames.join(', ')}]`,
    )
    return
  }

  for (const name of jsonNames) {
    const jsonServer = jsonServers[name]
    const codexServer = codexServers.get(name)

    const jsonHasUrl = typeof jsonServer.url === 'string'
    const codexHasUrl = typeof codexServer.url === 'string'

    if (jsonHasUrl !== codexHasUrl) {
      reporter.fail(
        `.codex/config.toml:mcp_servers.${name}`,
        `transport differs; JSON uses ${jsonHasUrl ? 'url' : 'command'}, TOML uses ${codexHasUrl ? 'url' : 'command'}`,
      )
      continue
    }

    if (jsonHasUrl) {
      if (jsonServer.url !== codexServer.url) {
        reporter.fail(
          `.codex/config.toml:mcp_servers.${name}`,
          `URL differs; JSON='${jsonServer.url}', TOML='${codexServer.url}'`,
        )
      }
      continue
    }

    if (jsonServer.command !== codexServer.command) {
      reporter.fail(
        `.codex/config.toml:mcp_servers.${name}`,
        `command differs; JSON='${jsonServer.command}', TOML='${codexServer.command}'`,
      )
    }

    const jsonPackage = primaryPackage(jsonServer.args ?? [])
    const codexPackage = primaryPackage(codexServer.args)

    if (jsonPackage !== codexPackage) {
      reporter.fail(
        `.codex/config.toml:mcp_servers.${name}`,
        `primary package differs; JSON='${jsonPackage}', TOML='${codexPackage}'`,
      )
    }
  }

  if (!reporter.hasFailures) {
    reporter.pass(`MCP semantics: ${jsonNames.length} server(s) agree across JSON and TOML`)
  }
}

async function checkProviderRouting(reporter) {
  const [agents, claudeRouter, cursorRouter] = await Promise.all([
    pathExists(join(ROOT, 'AGENTS.md')),
    readFile(join(ROOT, 'CLAUDE.md'), 'utf8'),
    readFile(join(ROOT, '.cursor', 'rules', '00-router.mdc'), 'utf8'),
  ])

  if (!agents) {
    reporter.fail('AGENTS.md', 'canonical router is missing')
  }

  if (!claudeRouter.includes('@AGENTS.md')) {
    reporter.fail('CLAUDE.md', 'must import the canonical AGENTS.md router')
  }

  if (!cursorRouter.includes('AGENTS.md')) {
    reporter.fail('.cursor/rules/00-router.mdc', 'must point Cursor to AGENTS.md')
  }

  if (!reporter.hasFailures) {
    reporter.pass('provider routing: Codex canonical, Claude import, Cursor pointer')
  }
}

async function checkRepositoryBaseline(reporter) {
  for (const file of REPOSITORY_BASELINE_FILES) {
    if (!(await pathExists(join(ROOT, file)))) {
      reporter.fail(file, 'required repository-baseline file is missing')
    }
  }

  const [packageText, lefthookText] = await Promise.all([
    readFile(join(ROOT, 'package.json'), 'utf8'),
    readFile(join(ROOT, 'lefthook.yml'), 'utf8'),
  ])
  const packageJson = JSON.parse(packageText)

  if (packageJson.license !== 'Apache-2.0') {
    reporter.fail('package.json', "license must be 'Apache-2.0'")
  }

  if (!packageJson.author?.trim()) {
    reporter.fail('package.json', 'author must identify the repository owner')
  }

  if (packageJson.scripts?.prepare !== 'lefthook install') {
    reporter.fail('package.json', 'prepare must install Lefthook in a fresh clone')
  }

  if (!/^commit-msg:\s*[\s\S]*?commitlint/m.test(lefthookText)) {
    reporter.fail('lefthook.yml', 'commit-msg must run Commitlint')
  }

  if (
    !/^\s*onboarding:/m.test(await readFile(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8'))
  ) {
    reporter.fail('.github/workflows/ci.yml', 'must prove pnpm setup on Windows, macOS, and Linux')
  }

  if (!reporter.hasFailures) {
    reporter.pass('repository baseline: docs, Apache metadata, and commit-msg gate are present')
  }
}

async function checkToolConfiguration(reporter) {
  const packageJson = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'))
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

  for (const script of REQUIRED_SCRIPTS) {
    if (!packageJson.scripts?.[script]) {
      reporter.fail('package.json', `missing '${script}' script`)
    }
  }

  for (const [dependency, script] of Object.entries(REQUIRED_PACKAGES)) {
    if (!dependencies[dependency]) {
      reporter.fail('package.json', `missing '${dependency}' required by '${script}'`)
    }
  }

  const requiredFiles = [
    '.dependency-cruiser.cjs',
    '.gitleaks.toml',
    'knip.json',
    'lefthook.yml',
    'eslint.config.mjs',
    'stylelint.config.mjs',
    'scripts/onboarding/setup.mjs',
    'scripts/onboarding/doctor.mjs',
    'scripts/onboarding/task-intake-check.mjs',
    'scripts/onboarding/task-intake-check.test.mjs',
    'scripts/tooling/install-gitleaks.mjs',
    'scripts/tooling/run-gitleaks.mjs',
  ]

  for (const file of requiredFiles) {
    if (!(await pathExists(join(ROOT, file)))) {
      reporter.fail(file, 'required tool configuration is missing')
    }
  }

  if (!reporter.hasFailures) {
    reporter.pass('tooling: scripts, packages, and configuration are present')
  }
}

function pnpmBinary() {
  return process.env.CONTOUR_DOCTOR_PNPM ?? (process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm')
}

function run(command, args, cwd) {
  const options = {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH ?? ''}`,
    },
  }

  if (process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')) {
    const commandLine = `call ${[command, ...args].join(' ')}`
    return spawnSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/c', commandLine], options)
  }

  return spawnSync(command, args, options)
}

function reportCommand(reporter, command, args, cwd) {
  const result = run(command, args, cwd)
  const label = `${command} ${args.join(' ')}`

  if (result.error) {
    reporter.fail(label, `could not start: ${result.error.message}`)
    return
  }

  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
    reporter.fail(label, `exit ${result.status}; ${output || 'no output'}`)
    return
  }

  reporter.pass(`${label}: exit 0`)
}

function runToolChecks(reporter) {
  for (const script of TOOL_SCRIPTS) {
    reportCommand(reporter, pnpmBinary(), ['run', script], ROOT)
  }
}

async function copyRepository(destination) {
  await cp(ROOT, destination, {
    recursive: true,
    filter(source) {
      return !COPY_EXCLUDES.has(basename(source))
    },
  })
}

function runCloneCheck(reporter) {
  const prefix = join(tmpdir(), 'deploy-lab-contour-doctor-')

  return mkdtemp(prefix).then(async (cloneRoot) => {
    try {
      await copyRepository(cloneRoot)
      const failureCountBeforeInstall = reporter.failureCount
      reportCommand(reporter, 'git', ['init', '--quiet'], cloneRoot)

      if (reporter.failureCount > failureCountBeforeInstall) {
        return
      }

      reportCommand(reporter, pnpmBinary(), ['setup'], cloneRoot)

      if (reporter.failureCount > failureCountBeforeInstall) {
        return
      }

      reportCommand(
        reporter,
        process.execPath,
        [join(cloneRoot, 'scripts', 'contour', 'contour-doctor.mjs'), '--skip-clone'],
        cloneRoot,
      )
    } finally {
      await rm(cloneRoot, { recursive: true, force: true })
    }
  })
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const reporter = createReporter()

  await checkFrontmatter(reporter)
  await checkReferencedPaths(reporter)
  await checkCheckedCopies(reporter)
  await checkMcpSemantics(reporter)
  await checkProviderRouting(reporter)
  await checkRepositoryBaseline(reporter)
  await checkToolConfiguration(reporter)

  if (options.runTools) {
    runToolChecks(reporter)
  }

  if (options.cloneCheck && !options.skipClone) {
    await runCloneCheck(reporter)
  }

  if (reporter.hasFailures) {
    console.error(`contour-doctor: ${reporter.failures.length} failure(s)`)
    process.exitCode = 1
    return
  }

  console.log('contour-doctor: healthy')
}

main().catch((error) => {
  console.error(`FAIL contour-doctor: ${error.stack ?? error.message}`)
  process.exitCode = 1
})
