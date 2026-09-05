import { setupServer } from 'msw/node'

/** Sin handlers por defecto: cada test declara las respuestas que espera. */
export const server = setupServer()
