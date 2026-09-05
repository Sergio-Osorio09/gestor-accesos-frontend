import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { problem } from '../../../test/problem'
import { renderApp } from '../../../test/render'

const TOKEN = 'a'.repeat(64)

const USER = {
  id: '9f1c2f4e-3a7b-4c8d-9e0f-1a2b3c4d5e6f',
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  roles: ['BUYER'],
}

function stubVerify(response: () => Response) {
  const bodies: unknown[] = []
  server.use(
    http.post('/api/v1/auth/verify-email', async ({ request }) => {
      bodies.push(await request.json())
      return response()
    }),
  )
  return bodies
}

describe('VerifyEmailPage', () => {
  // Escenario 8 — verificación con un token válido
  it('confirma la cuenta y ofrece el enlace al login', async () => {
    const bodies = stubVerify(() => HttpResponse.json(USER, { status: 200 }))
    renderApp(`/verify-email?token=${TOKEN}`)

    expect(await screen.findByText(/Listo, Ada Lovelace/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'iniciar sesión' })).toHaveAttribute('href', '/login')
    expect(bodies).toEqual([{ token: TOKEN }])
  })

  // Caso límite 4.6 — el token es de un solo uso: no se reintenta
  it('envía el token una sola vez, incluso bajo StrictMode', async () => {
    const bodies = stubVerify(() => HttpResponse.json(USER, { status: 200 }))
    renderApp(`/verify-email?token=${TOKEN}`, { strict: true })

    await screen.findByText(/Listo, Ada Lovelace/)
    expect(bodies).toHaveLength(1)
  })

  // Escenario 9 — token caducado
  it('avisa de la caducidad y ofrece pedir un enlace nuevo', async () => {
    stubVerify(() => problem(410, 'VERIFICATION_TOKEN_EXPIRED'))
    renderApp(`/verify-email?token=${TOKEN}`)

    expect(await screen.findByText(/ha caducado/)).toHaveTextContent('24 horas')
    expect(screen.getByRole('button', { name: /Reenviar el correo/ })).toBeEnabled()
    expect(screen.getByLabelText(/Email con el que te registraste/)).toBeInTheDocument()
  })

  // Escenario 10 — token ya usado: responde igual que uno inexistente
  it('trata un token ya consumido como un enlace que ya no sirve', async () => {
    stubVerify(() => problem(410, 'VERIFICATION_TOKEN_INVALID'))
    renderApp(`/verify-email?token=${TOKEN}`)

    expect(await screen.findByText(/ya no sirve/)).toBeInTheDocument()
    expect(screen.queryByText(/ha caducado/)).not.toBeInTheDocument()
  })

  it('no muestra el detail crudo del servidor', async () => {
    stubVerify(() => problem(410, 'VERIFICATION_TOKEN_INVALID'))
    renderApp(`/verify-email?token=${TOKEN}`)

    await screen.findByText(/ya no sirve/)
    expect(document.body.textContent).not.toContain('Texto para humanos')
  })

  it('no llama a la API si el enlace llega sin token', async () => {
    const bodies = stubVerify(() => HttpResponse.json(USER, { status: 200 }))
    renderApp('/verify-email')

    expect(await screen.findByText(/le falta el código de confirmación/)).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('nunca guarda el token en el almacenamiento del navegador', async () => {
    stubVerify(() => HttpResponse.json(USER, { status: 200 }))
    renderApp(`/verify-email?token=${TOKEN}`)

    await screen.findByText(/Listo, Ada Lovelace/)
    const stored = JSON.stringify({ ...localStorage, ...sessionStorage })
    expect(stored).not.toContain(TOKEN)
  })

  it('avisa sin dar por inválido el token si la API no responde', async () => {
    server.use(http.post('/api/v1/auth/verify-email', () => HttpResponse.error()))
    renderApp(`/verify-email?token=${TOKEN}`)

    expect(await screen.findByText(/No hemos podido contactar/)).toBeInTheDocument()
    expect(screen.queryByText(/ya no sirve/)).not.toBeInTheDocument()
  })

  it('muestra que está confirmando mientras espera la respuesta', async () => {
    const nunca = new Promise<never>(() => {})
    server.use(http.post('/api/v1/auth/verify-email', () => nunca))
    renderApp(`/verify-email?token=${TOKEN}`)

    await waitFor(() =>
      expect(screen.getByText('Confirmando tu dirección…')).toBeInTheDocument(),
    )
  })
})
