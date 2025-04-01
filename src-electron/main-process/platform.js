import { platform } from 'os'

export function isMac () {
  return getPlatform() === 'mac'
}
export function isWindows () {
  return getPlatform() === 'windows'
}
export function isLinux () {
  return getPlatform() === 'linux'
}

export function getPlatform () {
  const currentPlatform = platform()

  switch (currentPlatform) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
    case 'sunos':
      return 'linux'
    case 'darwin':
      return 'mac'
    case 'win32':
      return 'windows'
    default:
      throw new Error(`Did not recognize platform ${currentPlatform}`)
  }
}
