import { describe, expect, it } from 'vitest'
import { registerSchema, resendVerificationSchema, utf8ByteLength } from './registerSchema'

const VALID = {
  email: 'ada@example.com',
  password: 'una frase larga y poco comun',
  displayName: 'Ada Lovelace',
}

function errorOn(field: string, input: Record<string, unknown>) {
  const result = registerSchema.safeParse(input)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)
}

describe('registerSchema', () => {
  it('acepta unos datos válidos', () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true)
  })

  // Escenario 3 — email con formato inválido
  it.each([
    ['sin arroba', 'adaexample.com'],
    ['sin dominio', 'ada@'],
    ['vacío', ''],
  ])('rechaza un email %s', (_caso, email) => {
    expect(errorOn('email', { ...VALID, email })).toBeDefined()
  })

  it('rechaza un email de más de 254 caracteres', () => {
    const email = `${'a'.repeat(250)}@example.com`
    expect(email.length).toBeGreaterThan(254)
    expect(errorOn('email', { ...VALID, email })).toBeDefined()
  })

  // Caso límite 4.1 — normalización del email
  it('normaliza el email a minúsculas y sin espacios en los extremos', () => {
    const parsed = registerSchema.parse({ ...VALID, email: '  Ada@Example.com  ' })
    expect(parsed.email).toBe('ada@example.com')
  })

  // Caso límite 4.2 — los alias son direcciones distintas, no se canonizan
  it('no canoniza alias ni puntos de la dirección', () => {
    expect(registerSchema.parse({ ...VALID, email: 'ada+tienda@gmail.com' }).email).toBe(
      'ada+tienda@gmail.com',
    )
    expect(registerSchema.parse({ ...VALID, email: 'a.d.a@gmail.com' }).email).toBe(
      'a.d.a@gmail.com',
    )
  })

  // Escenario 4 — contraseña demasiado corta
  it('rechaza una contraseña de menos de 12 caracteres', () => {
    const issue = errorOn('password', { ...VALID, password: 'corta123' })
    expect(issue?.message).toContain('12')
  })

  it('acepta 12 caracteres sin exigir mayúsculas, dígitos ni símbolos', () => {
    expect(registerSchema.safeParse({ ...VALID, password: 'abcdefghijkl' }).success).toBe(true)
  })

  // Escenario 6 y caso límite 4.4 — el límite de BCrypt se cuenta en bytes
  it('rechaza una contraseña de más de 72 bytes UTF-8 aunque tenga menos caracteres', () => {
    const password = '\u{1F512}'.repeat(19) // 4 bytes cada uno: 76 bytes
    expect(utf8ByteLength(password)).toBeGreaterThan(72)
    expect(errorOn('password', { ...VALID, password })).toBeDefined()
  })

  it('acepta una contraseña de exactamente 72 bytes', () => {
    const password = 'a'.repeat(72)
    expect(utf8ByteLength(password)).toBe(72)
    expect(registerSchema.safeParse({ ...VALID, password }).success).toBe(true)
  })

  // Caso límite 4.4 — la contraseña no se normaliza nunca
  it('no normaliza la contraseña: ni espacios, ni mayúsculas, ni forma Unicode', () => {
    const password = '  Café CON Leche  '
    const parsed = registerSchema.parse({ ...VALID, password })
    expect(parsed.password).toBe(password)
    expect(parsed.password).not.toBe(password.normalize('NFC'))
  })

  // Escenario 7 — nombre visible fuera de los límites
  it.each([
    ['vacío', ''],
    ['de un solo carácter', 'A'],
    ['de más de 100 caracteres', 'A'.repeat(101)],
  ])('rechaza un nombre visible %s', (_caso, displayName) => {
    expect(errorOn('displayName', { ...VALID, displayName })).toBeDefined()
  })

  // Caso límite 4.10 — Unicode en el nombre visible
  it('normaliza el nombre visible a NFC y recorta los espacios', () => {
    const descompuesto = '  Ada\u0301  ' // "Ada" + acento combinante (NFD)
    const parsed = registerSchema.parse({ ...VALID, displayName: descompuesto })
    expect(parsed.displayName).toBe('Ada\u0301'.normalize('NFC'))
    expect(parsed.displayName).toHaveLength(3)
  })

  it.each([
    ['de control', 'Ada\u0007Lovelace'],
    ['de ancho cero', 'Ada\u200BLovelace'],
  ])('rechaza un nombre visible con caracteres %s', (_caso, displayName) => {
    expect(errorOn('displayName', { ...VALID, displayName })).toBeDefined()
  })

  it('no exige unicidad del nombre visible: dos personas pueden llamarse igual', () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true)
    expect(registerSchema.safeParse({ ...VALID, email: 'otra@example.com' }).success).toBe(true)
  })
})

describe('resendVerificationSchema', () => {
  it('normaliza el email igual que el registro', () => {
    expect(resendVerificationSchema.parse({ email: ' Ada@Example.com ' }).email).toBe(
      'ada@example.com',
    )
  })

  it('rechaza un email malformado', () => {
    expect(resendVerificationSchema.safeParse({ email: 'ada' }).success).toBe(false)
  })
})
