import { z } from 'zod'

/**
 * Reglas de `POST /api/v1/auth/register` (`specs/api-contract.md` §2.6).
 *
 * Es la misma validación que hace el navegador antes de enviar y la que usan
 * los tests. **La validación que manda es la del backend**: la lista de
 * contraseñas comunes vive allí y no se duplica aquí (añadiría 100 KB de
 * descarga a cada visita).
 */

export const EMAIL_MAX_LENGTH = 254
export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_BYTES = 72
export const DISPLAY_NAME_MIN_LENGTH = 2
export const DISPLAY_NAME_MAX_LENGTH = 100

/** Caracteres de control y de formato — incluidos los de ancho cero. */
const INVISIBLE = /[\p{Cc}\p{Cf}]/u

const encoder = new TextEncoder()

export function utf8ByteLength(value: string): number {
  return encoder.encode(value).length
}

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Escribe tu email.')
  .max(EMAIL_MAX_LENGTH, `El email no puede pasar de ${EMAIL_MAX_LENGTH} caracteres.`)
  .pipe(z.email('Escribe un email válido, con @ y dominio.'))

// La contraseña no se normaliza: ni espacios, ni mayúsculas, ni forma Unicode
// (registro.md §4.4). Solo el email y el nombre visible se normalizan.
const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .refine(
    (value) => utf8ByteLength(value) <= PASSWORD_MAX_BYTES,
    // El límite es en bytes, no en caracteres: los acentos y los emojis ocupan
    // más de uno. BCrypt trunca en silencio a partir de 72, así que se rechaza.
    `La contraseña no puede pasar de ${PASSWORD_MAX_BYTES} bytes. Los acentos y los emojis ocupan más de uno.`,
  )

const displayName = z
  .string()
  .transform((value) => value.normalize('NFC').trim())
  .pipe(
    z
      .string()
      .min(DISPLAY_NAME_MIN_LENGTH, `El nombre necesita al menos ${DISPLAY_NAME_MIN_LENGTH} caracteres.`)
      .max(DISPLAY_NAME_MAX_LENGTH, `El nombre no puede pasar de ${DISPLAY_NAME_MAX_LENGTH} caracteres.`)
      .refine(
        (value) => !INVISIBLE.test(value),
        'El nombre no puede llevar caracteres invisibles ni de control.',
      ),
  )

export const registerSchema = z.object({ email, password, displayName })

/** Lo que escribe la persona; lo que se envía sale de `registerSchema.parse`. */
export type RegisterFormValues = z.input<typeof registerSchema>
export type RegisterRequest = z.output<typeof registerSchema>

export const resendVerificationSchema = z.object({ email })

export type ResendVerificationFormValues = z.input<typeof resendVerificationSchema>
