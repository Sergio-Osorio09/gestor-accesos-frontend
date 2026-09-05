import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderApp } from '../../../test/render'

const ENTRY = { pathname: '/check-your-email', state: { email: 'ada@example.com' } }

describe('CheckYourEmailPage', () => {
  // Escenario 2 — la interfaz no puede delatar lo que el 202 se calla
  it('no afirma que la cuenta se haya creado', () => {
    renderApp(ENTRY)

    expect(screen.getByText(/Si la dirección/)).toHaveTextContent(
      'Si la dirección ada@example.com es válida, te hemos enviado un correo',
    )

    const texto = document.body.textContent ?? ''
    for (const afirmacion of [
      /cuenta creada/i,
      /hemos creado tu cuenta/i,
      /tu cuenta (ya )?(está|esta) (creada|lista)/i,
      /registro completado/i,
    ]) {
      expect(texto).not.toMatch(afirmacion)
    }
  })

  it('avisa de que el enlace caduca en 24 horas', () => {
    renderApp(ENTRY)
    expect(screen.getByText(/caduca en 24 horas/)).toBeInTheDocument()
  })

  // Caso límite 4.7 — el cooldown de 60 s se refleja en el botón
  it('deja el reenvío en espera nada más llegar de registrarse', () => {
    renderApp(ENTRY)

    const boton = screen.getByRole('button', { name: /Reenviar en 60 s/ })
    expect(boton).toBeDisabled()
  })

  it('vuelve al registro si se llega sin haber pasado por el formulario', () => {
    renderApp('/check-your-email')

    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument()
  })
})
