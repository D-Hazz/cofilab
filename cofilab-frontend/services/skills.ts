// cofilab-frontend/services/skills.ts
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}/api/skills/`

export const skills = {
  /**
   * 🔹 Liste des compétences (public)
   */
  async list(): Promise<any[]> {
    const res = await fetch(API_BASE)
    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      throw new Error(errData?.detail || 'Failed to fetch skills')
    }
    return res.json()
  },

  /**
   * 🔹 Création d'une compétence personnalisée (auth requise)
   * @param name - Nom de la compétence
   * @returns Nouvelle compétence créée ou existante
   */
  async createCustom(name: string): Promise<any> {
    const res = await fetch(`${API_BASE}create_custom/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Erreur serveur' }))
      console.error('Skill creation error:', errData)
      throw new Error(errData.detail || 'Failed to create skill')
    }

    return res.json()
  },
}
