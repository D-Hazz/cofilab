// src/services/auth.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.afrobitcoin.org/api'

export async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null

  const res = await fetch(`${API_BASE}/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) return null

  const data = await res.json()
  localStorage.setItem('token', data.access)
  return data.access
}
;/