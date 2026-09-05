import { Link, useNavigate } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <main className="page page--narrow">
      <header className="header">
        <p className="eyebrow">Marketplace · Crear cuenta</p>
        <h1>Crea tu cuenta</h1>
        <p className="lead">
          Te enviaremos un correo para confirmar que la dirección es tuya. Todas las cuentas
          nuevas entran como compradoras.
        </p>
      </header>

      <section className="card">
        <RegisterForm
          onRegistered={(email) =>
            navigate('/check-your-email', { replace: true, state: { email } })
          }
        />
      </section>

      <p className="hint">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>.
      </p>
    </main>
  )
}
