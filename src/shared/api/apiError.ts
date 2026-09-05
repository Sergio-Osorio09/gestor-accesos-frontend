/**
 * Errores de la API, según RFC 7807 (`specs/api-contract.md` §1.3).
 *
 * El frontend enruta por `code`, nunca por `detail`: `detail` es texto para
 * humanos y puede cambiar sin aviso; `code` es parte del contrato.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'WEAK_PASSWORD'
  | 'VERIFICATION_TOKEN_INVALID'
  | 'VERIFICATION_TOKEN_EXPIRED'
  | 'RESEND_TOO_SOON'

export interface FieldError {
  field: string
  message: string
}

export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  code?: string
  errors?: FieldError[]
  retryAfterSeconds?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly errors: FieldError[]
  readonly retryAfterSeconds?: number

  constructor(status: number, problem: ProblemDetail) {
    super(problem.code ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = problem.code ?? 'UNKNOWN'
    this.errors = problem.errors ?? []
    this.retryAfterSeconds = problem.retryAfterSeconds
  }

  is(code: ErrorCode): boolean {
    return this.code === code
  }
}

/** Fallo de red o respuesta ilegible: la petición no llegó a completarse. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('No se pudo contactar con el servidor.')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
