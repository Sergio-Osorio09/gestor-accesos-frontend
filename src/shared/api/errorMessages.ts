import { ApiError, NetworkError } from './apiError'

/**
 * Único mapa de `code` a mensaje en español. La interfaz nunca muestra el
 * `detail` que llega del servidor.
 *
 * Solo están los códigos que produce el registro (`specs/registro.md`); el
 * login añadirá los suyos al implementarse.
 */
const MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa los datos del formulario.',
  WEAK_PASSWORD:
    'Esa contraseña es demasiado fácil de adivinar: aparece en listas de contraseñas filtradas o se parece a tu email o a tu nombre. Prueba con una frase larga y poco común.',
  VERIFICATION_TOKEN_INVALID:
    'Este enlace de confirmación ya no sirve. Puede que lo hayas usado antes o que esté incompleto.',
  VERIFICATION_TOKEN_EXPIRED:
    'Este enlace de confirmación ha caducado. Los enlaces duran 24 horas.',
  RESEND_TOO_SOON: 'Acabamos de enviarte un correo. Espera un momento antes de pedir otro.',
}

const FALLBACK = 'Algo ha ido mal. Vuelve a intentarlo en unos minutos.'

export function messageFor(error: unknown): string {
  if (error instanceof NetworkError) {
    return 'No hemos podido contactar con el servidor. Comprueba tu conexión.'
  }
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? FALLBACK
  }
  return FALLBACK
}
