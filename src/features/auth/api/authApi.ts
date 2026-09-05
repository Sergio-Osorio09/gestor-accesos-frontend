import { post } from '../../../shared/api/httpClient'

/** El objeto `user` que devuelven `/login`, `/me` y `/verify-email`. */
export interface User {
  id: string
  email: string
  displayName: string
  roles: string[]
}

/** Cuerpo genérico del `202` de `/register` y `/resend-verification`. */
export interface AcceptedResponse {
  message: string
}

export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}

/**
 * `202` tanto si la cuenta se creó como si el email ya estaba registrado: la
 * respuesta es idéntica a propósito (`specs/registro.md` escenario 2). La
 * interfaz no puede, y no debe, distinguir los dos casos.
 */
export function register(payload: RegisterPayload, signal?: AbortSignal) {
  return post<AcceptedResponse>('/auth/register', payload, signal)
}

export function verifyEmail(token: string, signal?: AbortSignal) {
  return post<User>('/auth/verify-email', { token }, signal)
}

export function resendVerification(email: string, signal?: AbortSignal) {
  return post<AcceptedResponse>('/auth/resend-verification', { email }, signal)
}
