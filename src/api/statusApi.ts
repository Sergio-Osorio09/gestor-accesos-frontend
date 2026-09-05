export interface ServiceStatus {
  service: string
  status: string
  apiVersion: string
  timestamp: string
}

export async function fetchStatus(signal?: AbortSignal): Promise<ServiceStatus> {
  const response = await fetch('/api/v1/status', {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`La API respondió ${response.status}`)
  }

  return response.json() as Promise<ServiceStatus>
}
