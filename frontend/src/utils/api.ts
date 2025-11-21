const normalizeBackendUrl = (host?: string) => {
  if (!host) return ''
  const trimmed = host.trim().replace(/\/+$/, '')
  return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`
}

const env = import.meta.env as Record<string, string | undefined>
const backendHost = env.backend_ip ?? env.VITE_BACKEND_IP
export const backendBaseUrl = normalizeBackendUrl(backendHost)

export const apiUrl = (path: string) =>
  backendBaseUrl ? `${backendBaseUrl}${path}` : path
