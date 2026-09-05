import { HttpResponse } from 'msw'

/**
 * Respuestas del catálogo de `specs/api-contract.md`, tal y como las devuelve
 * el backend: RFC 7807 con la extensión `code`.
 */
export function problem(
  status: number,
  code: string,
  extra: Record<string, unknown> = {},
): Response {
  return HttpResponse.json(
    {
      type: `https://gestor-accesos/errors/${code.toLowerCase().replaceAll('_', '-')}`,
      title: code,
      status,
      detail: 'Texto para humanos que el frontend no debe mostrar tal cual.',
      code,
      ...extra,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

/** El cuerpo genérico del 202, idéntico en registro y en reenvío. */
export const ACCEPTED_BODY = {
  message: 'Si la dirección es válida, recibirás un correo para confirmar tu cuenta.',
}
