import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/apiError'
import { messageFor } from '../../../shared/api/errorMessages'
import { verifyEmail, type User } from '../api/authApi'
import { ResendVerification } from '../components/ResendVerification'

type VerificationState =
  | { kind: 'verifying' }
  | { kind: 'verified'; user: User }
  | { kind: 'expired'; message: string }
  | { kind: 'invalid'; message: string }
  | { kind: 'failed'; message: string }

/**
 * Consume el token que viaja en el enlace del correo.
 *
 * El token sale del query string y **no se guarda en ningún sitio**: ni en
 * `localStorage` ni en `sessionStorage`. Es una credencial de un solo uso.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<VerificationState>(() =>
    token
      ? { kind: 'verifying' }
      : {
          kind: 'invalid',
          message: 'El enlace está incompleto: le falta el código de confirmación.',
        },
  )
  const alreadySent = useRef(false)

  useEffect(() => {
    if (!token) return

    // El token es de un solo uso: una segunda petición lo encontraría consumido
    // y mostraría un fallo falso. Por eso se envía una vez y no se reintenta,
    // ni siquiera con el doble montaje de StrictMode.
    if (alreadySent.current) return
    alreadySent.current = true

    verifyEmail(token)
      .then((user) => setState({ kind: 'verified', user }))
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.is('VERIFICATION_TOKEN_EXPIRED')) {
          setState({ kind: 'expired', message: messageFor(error) })
          return
        }
        if (error instanceof ApiError && error.is('VERIFICATION_TOKEN_INVALID')) {
          setState({ kind: 'invalid', message: messageFor(error) })
          return
        }
        setState({ kind: 'failed', message: messageFor(error) })
      })
  }, [token])

  return (
    <main className="page page--narrow">
      <header className="header">
        <p className="eyebrow">Marketplace · Confirmar email</p>
        <h1>Confirmación de tu cuenta</h1>
      </header>

      <section className="card">
        <Outcome state={state} />
      </section>
    </main>
  )
}

function Outcome({ state }: { state: VerificationState }) {
  switch (state.kind) {
    case 'verifying':
      return <p className="state state--checking">Confirmando tu dirección…</p>

    case 'verified':
      return (
        <div className="state state--online">
          <p>
            <strong>Listo, {state.user.displayName}.</strong> Tu email quedó confirmado.
          </p>
          <p>
            Ya puedes <Link to="/login">iniciar sesión</Link>.
          </p>
        </div>
      )

    case 'expired':
      return (
        <div className="state state--offline">
          <p>{state.message}</p>
          <p>Pídenos uno nuevo y volvemos a empezar.</p>
          <ResendVerification />
        </div>
      )

    case 'invalid':
      return (
        <div className="state state--offline">
          <p>{state.message}</p>
          <p className="hint">
            Si ya confirmaste tu cuenta, <Link to="/login">inicia sesión</Link>. Si no, pide un
            enlace nuevo desde el formulario de <Link to="/register">registro</Link>.
          </p>
        </div>
      )

    case 'failed':
      return (
        <div className="state state--offline">
          <p>{state.message}</p>
        </div>
      )
  }
}
