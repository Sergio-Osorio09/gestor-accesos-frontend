import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { ACCEPTED_BODY, problem } from '../../../test/problem'
import { renderApp } from '../../../test/render'

const VALID = {
  email: 'ada@example.com',
  password: 'una frase larga y poco comun',
  displayName: 'Ada Lovelace',
}

/** Registra el endpoint y devuelve el espía con los cuerpos recibidos. */
function stubRegister(response: () => Response) {
  const bodies: unknown[] = []
  server.use(
    http.post('/api/v1/auth/register', async ({ request }) => {
      bodies.push(await request.json())
      return response()
    }),
  )
  return bodies
}

async function fillForm(user: ReturnType<typeof renderApp>['user'], values = VALID) {
  await user.type(screen.getByLabelText('Email'), values.email)
  await user.type(screen.getByLabelText('Nombre visible'), values.displayName)
  await user.type(screen.getByLabelText('Contraseña'), values.password)
}

function accepted() {
  return HttpResponse.json(ACCEPTED_BODY, { status: 202 })
}

describe('RegisterPage', () => {
  // Escenario 1 — registro con datos válidos
  it('envía el alta y lleva a la pantalla de espera del correo', async () => {
    const bodies = stubRegister(accepted)
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument()
    expect(bodies).toEqual([VALID])
  })

  // Casos límite 4.1 y 4.10 — lo que se envía va normalizado
  it('envía el email en minúsculas y el nombre en NFC, sin espacios sobrantes', async () => {
    const bodies = stubRegister(accepted)
    const { user } = renderApp('/register')

    await fillForm(user, {
      ...VALID,
      email: '  Ada@Example.COM  ',
      displayName: '  Adá Lovelace  ',
    })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      email: 'ada@example.com',
      displayName: 'Adá Lovelace'.normalize('NFC'),
      password: VALID.password,
    })
  })

  // Escenario 2 — un email ya registrado es indistinguible de uno nuevo
  it('muestra exactamente lo mismo si el email ya estaba registrado', async () => {
    stubRegister(accepted)
    const primera = renderApp('/register')
    await fillForm(primera.user)
    await primera.user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await screen.findByRole('heading', { name: 'Revisa tu correo' })
    const pantallaCuentaNueva = primera.container.innerHTML
    primera.unmount()

    // Segundo intento con el mismo email: el backend responde el mismo 202.
    stubRegister(accepted)
    const segunda = renderApp('/register')
    await fillForm(segunda.user)
    await segunda.user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await screen.findByRole('heading', { name: 'Revisa tu correo' })

    expect(segunda.container.innerHTML).toBe(pantallaCuentaNueva)
  })

  // Escenario 4 — la contraseña corta se corta en el navegador
  it('no llega a llamar a la API si la contraseña tiene menos de 12 caracteres', async () => {
    const bodies = stubRegister(accepted)
    const { user } = renderApp('/register')

    await fillForm(user, { ...VALID, password: 'corta123' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('12 caracteres')
    expect(bodies).toHaveLength(0)
  })

  // Escenario 5 — contraseña común: solo el backend tiene la lista
  it('muestra el error de contraseña débil que devuelve el backend', async () => {
    stubRegister(() => problem(400, 'WEAK_PASSWORD'))
    const { user } = renderApp('/register')

    await fillForm(user, { ...VALID, password: 'contrasena123' })
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/f[áa]cil de adivinar/i)
    expect(screen.queryByRole('heading', { name: 'Revisa tu correo' })).not.toBeInTheDocument()
  })

  it('no muestra el detail crudo del servidor', async () => {
    stubRegister(() => problem(400, 'WEAK_PASSWORD'))
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await screen.findByRole('alert')
    expect(document.body.textContent).not.toContain('Texto para humanos')
  })

  // Escenario 3 — el backend señala el campo con VALIDATION_ERROR
  it('coloca el error en el campo que señala el array errors', async () => {
    stubRegister(() =>
      problem(400, 'VALIDATION_ERROR', {
        errors: [{ field: 'email', message: 'must be a well-formed email address' }],
      }),
    )
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInvalid())
    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe un email válido')
  })

  it('avisa sin culpar al usuario cuando la API no responde', async () => {
    server.use(http.post('/api/v1/auth/register', () => HttpResponse.error()))
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No hemos podido contactar')
  })

  it('no guarda la contraseña en el almacenamiento del navegador', async () => {
    stubRegister(accepted)
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await screen.findByRole('heading', { name: 'Revisa tu correo' })

    const stored = JSON.stringify({ ...localStorage, ...sessionStorage })
    expect(stored).not.toContain(VALID.password)
  })

  it('deshabilita el botón mientras la petición está en vuelo', async () => {
    const nunca = new Promise<never>(() => {})
    server.use(http.post('/api/v1/auth/register', () => nunca))
    const { user } = renderApp('/register')

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('button', { name: 'Creando cuenta…' })).toBeDisabled()
  })
})

describe('medidor de fuerza', () => {
  it('es orientativo y no bloquea el envío', async () => {
    const bodies = stubRegister(accepted)
    const { user } = renderApp('/register')

    await fillForm(user, { ...VALID, password: 'aaaaaaaaaaaa' })
    expect(screen.getByText(/Fuerza orientativa/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
  })

  it('cuenta los bytes de la contraseña, no los caracteres', async () => {
    const { user } = renderApp('/register')
    await user.type(screen.getByLabelText('Contraseña'), '\u{1F512}\u{1F512}')

    expect(screen.getByText(/llevas 8/)).toBeInTheDocument()
  })
})
