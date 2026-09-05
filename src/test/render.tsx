import { StrictMode, type ReactElement, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, type InitialEntry } from 'react-router-dom'
import { AppRoutes } from '../App'

interface Options {
  /** Monta bajo StrictMode, que invoca los efectos dos veces. */
  strict?: boolean
  /** Reloj falso: userEvent necesita saber cómo adelantarlo. */
  advanceTimers?: (ms: number) => void
}

/** Monta la app entera en una ruta concreta, para poder seguir navegaciones. */
export function renderApp(entry: InitialEntry, options: Options = {}) {
  return mount(<AppRoutes />, [entry], options)
}

/** Monta un componente suelto dentro de un router, sin rutas de la app. */
export function renderWithRouter(ui: ReactElement, options: Options = {}) {
  return mount(ui, ['/'], options)
}

function mount(ui: ReactElement, entries: InitialEntry[], options: Options) {
  const user = userEvent.setup(
    options.advanceTimers ? { advanceTimers: options.advanceTimers } : {},
  )
  const tree: ReactNode = <MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>
  const view = render(options.strict ? <StrictMode>{tree}</StrictMode> : tree)
  return { user, ...view }
}
