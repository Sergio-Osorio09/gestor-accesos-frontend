import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { ACCEPTED_BODY, problem } from '../../../test/problem'
import { renderWithRouter } from '../../../test/render'
import { ResendVerification } from './ResendVerification'

function stubResend(response: () => Response) {
  const bodies: unknown[] = []
  server.use(
    http.post('/api/v1/auth/resend-verification', async ({ request }) => {
      bodies.push(await request.json())
      return response()
    }),
  )
  return bodies
}

const accepted = () => HttpResponse.json(ACCEPTED_BODY, { status: 202 })

describe('ResendVerification', () => {
  // Escenario 11 — reenvío del correo de verificación
  it('reenvía el correo y muestra el mensaje genérico del 202', async () => {
    const bodies = stubResend(accepted)
    const { user } = renderWithRouter(<ResendVerification email="ada@example.com" />)

    await user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))

    expect(await screen.findByRole('status')).toHaveTextContent(ACCEPTED_BODY.message)
    expect(bodies).toEqual([{ email: 'ada@example.com' }])
  })

  // Caso límite 4.7 — mismo cuerpo exista o no la cuenta, o esté ya verificada
  it('no distingue una cuenta inexistente de una ya verificada', async () => {
    stubResend(accepted)
    const primera = renderWithRouter(<ResendVerification email="nadie@example.com" />)
    await primera.user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))
    await screen.findByRole('status')
    const pantalla = primera.container.innerHTML
    primera.unmount()

    stubResend(accepted)
    const segunda = renderWithRouter(<ResendVerification email="nadie@example.com" />)
    await segunda.user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))
    await screen.findByRole('status')

    expect(segunda.container.innerHTML).toBe(pantalla)
  })

  it('normaliza el email escrito a mano antes de enviarlo', async () => {
    const bodies = stubResend(accepted)
    const { user } = renderWithRouter(<ResendVerification />)

    await user.type(screen.getByLabelText(/Email con el que te registraste/), ' Ada@Example.COM ')
    await user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))

    await waitFor(() => expect(bodies).toEqual([{ email: 'ada@example.com' }]))
  })

  it('no llama a la API con un email malformado', async () => {
    const bodies = stubResend(accepted)
    const { user } = renderWithRouter(<ResendVerification />)

    await user.type(screen.getByLabelText(/Email con el que te registraste/), 'ada')
    await user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  // Caso límite 4.7 — el 429 manda sobre la cuenta atrás del navegador
  it('respeta el retryAfterSeconds del 429 RESEND_TOO_SOON', async () => {
    stubResend(() => problem(429, 'RESEND_TOO_SOON', { retryAfterSeconds: 43 }))
    const { user } = renderWithRouter(<ResendVerification email="ada@example.com" />)

    await user.click(screen.getByRole('button', { name: /Reenviar el correo/ }))

    expect(await screen.findByRole('status')).toHaveTextContent('Acabamos de enviarte un correo')
    expect(await screen.findByRole('button', { name: 'Reenviar en 43 s' })).toBeDisabled()
  })
})

describe('cuenta atrás del reenvío', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('descuenta los segundos y acaba habilitando el botón', async () => {
    renderWithRouter(<ResendVerification email="ada@example.com" initialCooldownSeconds={3} />, {
      advanceTimers: vi.advanceTimersByTime,
    })

    const tick = (seconds: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(seconds * 1000)
      })

    expect(screen.getByRole('button', { name: 'Reenviar en 3 s' })).toBeDisabled()

    await tick(2)
    expect(screen.getByRole('button', { name: 'Reenviar en 1 s' })).toBeDisabled()

    await tick(1)
    expect(screen.getByRole('button', { name: /Reenviar el correo/ })).toBeEnabled()
  })
})
