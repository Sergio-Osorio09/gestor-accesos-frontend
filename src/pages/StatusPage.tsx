import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStatus, type ServiceStatus } from '../api/statusApi'

type ConnectionState =
  | { kind: 'checking' }
  | { kind: 'online'; status: ServiceStatus }
  | { kind: 'offline'; message: string }

const SPECS = [
  { file: 'overview.md', description: 'Problema, alcance y actores' },
  { file: 'stack.md', description: 'Tecnologías y justificación' },
  { file: 'api-contract.md', description: 'Convenciones y endpoints' },
  { file: 'arquitectura.md', description: 'Diagramas de componentes y flujo' },
  { file: 'registro.md', description: 'Alta de cuentas y verificación de email' },
  { file: 'login.md', description: 'Autenticación, renovación y cierre de sesión' },
]

export function StatusPage() {
  const [connection, setConnection] = useState<ConnectionState>({ kind: 'checking' })

  const check = useCallback((signal?: AbortSignal) => {
    setConnection({ kind: 'checking' })
    fetchStatus(signal)
      .then((status) => setConnection({ kind: 'online', status }))
      .catch((error: unknown) => {
        if (signal?.aborted) return
        setConnection({
          kind: 'offline',
          message: error instanceof Error ? error.message : 'Error desconocido',
        })
      })
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    check(controller.signal)
    return () => controller.abort()
  }, [check])

  return (
    <main className="page">
      <header className="header">
        <p className="eyebrow">Marketplace · Módulo de seguridad</p>
        <h1>gestor-accesos</h1>
        <p className="lead">
          Andamiaje del proyecto, desarrollado con Spec-Driven Development.
          Todavía sin lógica de negocio: la especificación va por delante del código.
        </p>
      </header>

      <section className="card">
        <h2>Conexión con la API</h2>
        <ConnectionPanel connection={connection} />
        <button className="button" onClick={() => check()} disabled={connection.kind === 'checking'}>
          {connection.kind === 'checking' ? 'Comprobando…' : 'Volver a comprobar'}
        </button>
      </section>

      <section className="card">
        <h2>Especificaciones escritas</h2>
        <ul className="specs">
          {SPECS.map((spec) => (
            <li key={spec.file}>
              <code>{spec.file}</code>
              <span>{spec.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Siguiente paso</h2>
        <p>
          El frontend de <code>specs/registro.md</code> ya está implementado:{' '}
          <Link to="/register">crear una cuenta</Link>. Necesita el backend levantado,
          que todavía no expone <code>/api/v1/auth/register</code>.
        </p>
      </section>
    </main>
  )
}

function ConnectionPanel({ connection }: { connection: ConnectionState }) {
  if (connection.kind === 'checking') {
    return <p className="state state--checking">Contactando con el backend…</p>
  }

  if (connection.kind === 'offline') {
    return (
      <div className="state state--offline">
        <p>
          <strong>Backend no disponible.</strong> {connection.message}
        </p>
        <p className="hint">
          Arráncalo con <code>cd backend &amp;&amp; ./mvnw spring-boot:run</code> (necesita JDK 21).
        </p>
      </div>
    )
  }

  const { status } = connection
  return (
    <div className="state state--online">
      <p>
        <strong>Backend conectado.</strong>
      </p>
      <dl className="details">
        <dt>Servicio</dt>
        <dd>{status.service}</dd>
        <dt>Estado</dt>
        <dd>{status.status}</dd>
        <dt>Versión de API</dt>
        <dd>{status.apiVersion}</dd>
        <dt>Respondido</dt>
        <dd>{new Date(status.timestamp).toLocaleString('es-PE')}</dd>
      </dl>
    </div>
  )
}
