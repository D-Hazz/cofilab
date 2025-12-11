const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000/api'

// --- Gestion du refresh token ---
export async function refreshAccessToken() {
  const refresh = localStorage.getItem('refresh_token')
  if (!refresh) return null

  try {
    const res = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) throw new Error('Refresh token invalide ou expiré')

    const data = await res.json()
    localStorage.setItem('token', data.access)
    return data.access
  } catch (err) {
    console.warn('Impossible de rafraîchir le token, déconnexion automatique...')
    logoutUser()
    return null
  }
}

// --- Fonction de déconnexion ---
export function logoutUser() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/auth/login'
}

// --- Fetch sécurisé avec détection automatique de session expirée ---
export async function secureFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  }

  let res = await fetch(`${API_BASE}${url}`, { ...options, headers })

  // Si la session a expiré (401 → tentative de refresh)
  if (res.status === 401) {
    const newToken = await refreshAccessToken()

    if (!newToken) {
      logoutUser()
      return res
    }

    // Re-tente la requête avec le nouveau token
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newToken}`,
    }
    res = await fetch(`${API_BASE}${url}`, { ...options, headers: retryHeaders })
  }

  return res
}
