import { Link, Navigate, useLocation } from 'react-router-dom'
import { ResendVerification, RESEND_COOLDOWN_SECONDS } from '../components/ResendVerification'

interface CheckYourEmailState {
  email?: string
}

/**
 * Pantalla que sigue al `202` del registro.
 *
 * **No puede afirmar que la cuenta se haya creado.** El registro responde lo
 * mismo exista o no el email (`specs/registro.md` escenario 2), así que decir
 * "cuenta creada" delataría justo lo que la respuesta se calla. Aquí es donde
 * se paga la contrapartida de la anti-enumeración.
 */
export function CheckYourEmailPage() {
  const location = useLocation()
  const { email } = (location.state ?? {}) as CheckYourEmailState

  // Sin email no hay nada que reenviar: se llegó aquí escribiendo la URL.
  if (!email) {
    return <Navigate to="/register" replace />
  }

  return (
    <main className="page page--narrow">
      <header className="header">
        <p className="eyebrow">Marketplace · Confirma tu email</p>
        <h1>Revisa tu correo</h1>
        <p className="lead">
          Si la dirección <strong>{email}</strong> es válida, te hemos enviado un correo para
          confirmar tu cuenta. El enlace caduca en 24 horas.
        </p>
      </header>

      <section className="card">
        <h2>¿No te ha llegado?</h2>
        <p>
          Mira en la carpeta de spam. Si sigue sin aparecer, podemos enviarlo otra vez pasados{' '}
          {RESEND_COOLDOWN_SECONDS} segundos.
        </p>
        <ResendVerification email={email} initialCooldownSeconds={RESEND_COOLDOWN_SECONDS} />
      </section>

      <p className="hint">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </main>
  )
}
