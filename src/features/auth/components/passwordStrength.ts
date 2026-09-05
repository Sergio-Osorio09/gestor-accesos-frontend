import { PASSWORD_MIN_LENGTH } from '../schemas/registerSchema'

export type Strength = 'weak' | 'fair' | 'strong'

export const STRENGTH_LABEL: Record<Strength, string> = {
  weak: 'Débil',
  fair: 'Aceptable',
  strong: 'Fuerte',
}

/**
 * El medidor es **solo orientativo**: quien decide es el backend, que tiene la
 * lista de contraseñas comunes. Esto mide longitud y variedad, no si la
 * contraseña está filtrada.
 */
export function strengthOf(password: string): Strength {
  if (password.length < PASSWORD_MIN_LENGTH) return 'weak'

  const variety = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}]/u].filter((pattern) =>
    pattern.test(password),
  ).length

  if (password.length >= 20 || variety >= 3) return 'strong'
  return 'fair'
}
