import { useEffect, useId, useState } from 'react'
import { ApiError } from '../../../shared/api/apiError'
import { messageFor } from '../../../shared/api/errorMessages'
import { resendVerification } from '../api/authApi'
import { resendVerificationSchema } from '../schemas/registerSchema'

export const RESEND_COOLDOWN_SECONDS = 60

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; message: string }

interface ResendVerificationProps {
  /** Si se conoce, no se pide; si no, se muestra un campo para escribirlo. */
  email?: string
  /** Segundos de espera ya en curso, por ejemplo tras acabar de registrarse. */
  initialCooldownSeconds?: number
}

/**
 * Reenvío del correo de verificación (`specs/registro.md` escenario 11).
 *
 * La cuenta atrás es cortesía, no defensa: el cooldown real es de 60 s por
 * cuenta y lo aplica el backend. Si llega un `429 RESEND_TOO_SOON` se respeta
 * el `retryAfterSeconds` de la respuesta.
 */
export function ResendVerification({ email, initialCooldownSeconds = 0 }: ResendVerificationProps) {
  const inputId = useId()
  const [typedEmail, setTypedEmail] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [cooldown, setCooldown] = useState(initialCooldownSeconds)

  const waiting = cooldown > 0

  // La dependencia es `waiting`, no `cooldown`: si fuera el valor, cada segundo
  // destruiría y recrearía el intervalo, y la cuenta atrás se iría retrasando.
  useEffect(() => {
    if (!waiting) return
    const timer = setInterval(() => setCooldown((left) => Math.max(0, left - 1)), 1000)
    return () => clearInterval(timer)
  }, [waiting])

  const send = async (event: React.FormEvent) => {
    event.preventDefault()

    const parsed = resendVerificationSchema.safeParse({ email: email ?? typedEmail })
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? 'Escribe un email válido.')
      return
    }
    setEmailError(undefined)
    setStatus({ kind: 'sending' })

    try {
      const response = await resendVerification(parsed.data.email)
      setStatus({ kind: 'done', message: response.message })
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      setStatus({ kind: 'done', message: messageFor(error) })
      if (error instanceof ApiError && error.is('RESEND_TOO_SOON')) {
        setCooldown(error.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS)
      }
    }
  }

  const sending = status.kind === 'sending'

  return (
    <form className="resend" onSubmit={send} noValidate>
      {email === undefined && (
        <div className="field">
          <label htmlFor={inputId}>Email con el que te registraste</label>
          <input
            id={inputId}
            type="email"
            autoComplete="email"
            value={typedEmail}
            onChange={(event) => setTypedEmail(event.target.value)}
            aria-invalid={emailError ? true : undefined}
          />
          {emailError && (
            <p className="field__error" role="alert">
              {emailError}
            </p>
          )}
        </div>
      )}

      <button className="button" type="submit" disabled={waiting || sending}>
        {sending
          ? 'Enviando…'
          : waiting
            ? `Reenviar en ${cooldown} s`
            : 'Reenviar el correo de confirmación'}
      </button>

      {status.kind === 'done' && (
        <p className="resend__status" role="status">
          {status.message}
        </p>
      )}
    </form>
  )
}
