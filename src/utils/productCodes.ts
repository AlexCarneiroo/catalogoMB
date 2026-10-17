const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randomToken(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}

export function createSku(): string {
  return `MB-${randomToken(8)}`
}

export function createCode(): string {
  return randomToken(6)
}
