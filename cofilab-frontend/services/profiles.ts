// /cofilab-frontend/services/profiles.ts
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/profiles`

export const profiles = {
  // 🔹 Liste de tous les profils (public)
  async list() {
    const res = await fetch(`${API_BASE}/`)
    if (!res.ok) {
      throw new Error('Failed to fetch profiles')
    }
    return res.json()
  },

  // 🔹 Récupérer un profil par ID (public)
  async retrieve(id: string | number) {
    const res = await fetch(`${API_BASE}/${id}/`)
    if (!res.ok) {
      throw new Error('Failed to fetch profile')
    }
    return res.json()
  },

  // 🔹 Récupérer le profil de l’utilisateur connecté
  async getMe() {
    const res = await fetch(`${API_BASE}/me/`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('Failed to fetch my profile')
    }
    return res.json()
  },

  // 🔹 Mettre à jour un profil (multipart / FormData)
  async update(id: number, data: FormData) {
    const res = await fetch(`${API_BASE}/${id}/`, {
      method: 'PATCH',
      body: data,
      credentials: 'include',
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      console.error('Profile update error:', errData)
      throw new Error('Failed to update profile')
    }

    return res.json()
  },
}
