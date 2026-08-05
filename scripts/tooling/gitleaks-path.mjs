import { join } from 'node:path'

export const GITLEAKS_VERSION = '8.30.1'

const ARTIFACTS = {
  'darwin-arm64': 'gitleaks_8.30.1_darwin_arm64.tar.gz',
  'darwin-x64': 'gitleaks_8.30.1_darwin_x64.tar.gz',
  'linux-arm64': 'gitleaks_8.30.1_linux_arm64.tar.gz',
  'linux-x64': 'gitleaks_8.30.1_linux_x64.tar.gz',
  'win32-arm64': 'gitleaks_8.30.1_windows_arm64.zip',
  'win32-x64': 'gitleaks_8.30.1_windows_x64.zip',
}

export function gitleaksArtifact(platform = process.platform, architecture = process.arch) {
  return ARTIFACTS[`${platform}-${architecture}`]
}

export function managedGitleaksPath(
  root,
  platform = process.platform,
  architecture = process.arch,
) {
  const artifact = gitleaksArtifact(platform, architecture)

  if (!artifact) {
    return undefined
  }

  const executable = platform === 'win32' ? 'gitleaks.exe' : 'gitleaks'
  return join(root, '.tools', 'gitleaks', GITLEAKS_VERSION, executable)
}
