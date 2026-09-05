import { ApiError, NetworkError, type ProblemDetail } from './apiError'

const BASE_URL = '/api/v1'

/**
 * Cliente HTTP de la API.
 *
 * Todas las peticiones a `/api/v1/auth` viajan con `credentials: "include"`
 * para que el navegador adjunte la cookie `refresh_token`, que JavaScript no
 * puede leer.
 */
export async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json, application/problem+json',
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (signal?.aborted) throw cause
    throw new NetworkError(cause)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function readProblem(response: Response): Promise<ProblemDetail> {
  try {
    return (await response.json()) as ProblemDetail
  } catch {
    // Un error sin cuerpo legible (un 502 de un proxy, por ejemplo) no lleva
    // `code`; ApiError lo trata como UNKNOWN.
    return {}
  }
}
