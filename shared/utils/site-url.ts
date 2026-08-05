export function normalizeSiteUrl(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  try {
    const url = new URL(value)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return undefined
    }

    return url.origin
  } catch {
    return undefined
  }
}
