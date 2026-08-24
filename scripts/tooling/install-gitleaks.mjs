import { createHash } from 'node:crypto'
import { chmod, mkdir, stat, writeFile } from 'node:fs/promises'
import { gunzipSync, inflateRawSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GITLEAKS_VERSION, gitleaksArtifact, managedGitleaksPath } from './gitleaks-path.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const RELEASE_BASE = `https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}`
const DOWNLOAD_ATTEMPTS = 3
const DOWNLOAD_TIMEOUT_MS = 30_000

function fail(message) {
  throw new Error(`Gitleaks bootstrap: ${message}`)
}

function executableName(name) {
  return name.replace(/\\/g, '/').split('/').at(-1)
}

function extractTarExecutable(archive, expectedName) {
  const tar = gunzipSync(archive)
  let offset = 0

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '')
    const size = Number.parseInt(
      header.subarray(124, 136).toString('utf8').replace(/\0.*$/, '').trim() || '0',
      8,
    )

    if (!name) {
      break
    }

    const bodyStart = offset + 512
    const bodyEnd = bodyStart + size

    if (executableName(name) === expectedName) {
      return tar.subarray(bodyStart, bodyEnd)
    }

    offset = bodyStart + Math.ceil(size / 512) * 512
  }

  fail(`archive does not contain ${expectedName}`)
}

function extractZipExecutable(archive, expectedName) {
  const endSignature = 0x06054b50
  let endOffset = -1

  for (
    let offset = archive.length - 22;
    offset >= Math.max(0, archive.length - 65_557);
    offset -= 1
  ) {
    if (archive.readUInt32LE(offset) === endSignature) {
      endOffset = offset
      break
    }
  }

  if (endOffset === -1) {
    fail('ZIP end-of-central-directory record is missing')
  }

  let offset = archive.readUInt32LE(endOffset + 16)
  const entries = archive.readUInt16LE(endOffset + 10)

  for (let index = 0; index < entries; index += 1) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) {
      fail('ZIP central-directory entry is invalid')
    }

    const compression = archive.readUInt16LE(offset + 10)
    const compressedSize = archive.readUInt32LE(offset + 20)
    const fileNameLength = archive.readUInt16LE(offset + 28)
    const extraLength = archive.readUInt16LE(offset + 30)
    const commentLength = archive.readUInt16LE(offset + 32)
    const localOffset = archive.readUInt32LE(offset + 42)
    const name = archive.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8')

    if (executableName(name) === expectedName) {
      if (archive.readUInt32LE(localOffset) !== 0x04034b50) {
        fail('ZIP local-file header is invalid')
      }

      const localNameLength = archive.readUInt16LE(localOffset + 26)
      const localExtraLength = archive.readUInt16LE(localOffset + 28)
      const dataStart = localOffset + 30 + localNameLength + localExtraLength
      const compressed = archive.subarray(dataStart, dataStart + compressedSize)

      if (compression === 0) {
        return compressed
      }

      if (compression === 8) {
        return inflateRawSync(compressed)
      }

      fail(`ZIP compression method ${compression} is unsupported`)
    }

    offset += 46 + fileNameLength + extraLength + commentLength
  }

  fail(`archive does not contain ${expectedName}`)
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function fetchBytes(url) {
  let lastError

  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      lastError = error

      if (attempt < DOWNLOAD_ATTEMPTS) {
        console.warn(
          `Gitleaks bootstrap: download attempt ${attempt}/${DOWNLOAD_ATTEMPTS} failed; retrying`,
        )
      }
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError)
  fail(`download failed for ${url} after ${DOWNLOAD_ATTEMPTS} attempts: ${message}`)
}

async function main() {
  const artifact = gitleaksArtifact()
  const target = managedGitleaksPath(ROOT)

  if (!artifact || !target) {
    fail(
      `unsupported platform ${process.platform}/${process.arch}; install Gitleaks from its official release`,
    )
  }

  try {
    await stat(target)
    console.log(`Gitleaks bootstrap: using ${target}`)
    return
  } catch {
    // A missing managed binary is the expected first-run path.
  }

  const [checksums, archive] = await Promise.all([
    fetchBytes(`${RELEASE_BASE}/gitleaks_${GITLEAKS_VERSION}_checksums.txt`),
    fetchBytes(`${RELEASE_BASE}/${artifact}`),
  ])
  const checksumPattern = new RegExp(
    `^([a-f0-9]{64})\\s+[* ]?${artifact.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`,
    'im',
  )
  const expected = checksums.toString('utf8').match(checksumPattern)?.[1]?.toLowerCase()

  if (!expected) {
    fail(`official checksum manifest has no checksum for ${artifact}`)
  }

  const actual = sha256(archive)

  if (actual !== expected) {
    fail(`checksum mismatch for ${artifact}; expected ${expected}, got ${actual}`)
  }

  const executable = process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks'
  const binary = artifact.endsWith('.zip')
    ? extractZipExecutable(archive, executable)
    : extractTarExecutable(archive, executable)

  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, binary, { mode: 0o755 })

  if (process.platform !== 'win32') {
    await chmod(target, 0o755)
  }

  console.log(`Gitleaks bootstrap: installed ${GITLEAKS_VERSION} at ${target}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
