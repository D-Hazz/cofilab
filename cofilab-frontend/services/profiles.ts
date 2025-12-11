export const profiles = {
  async list() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/`)
    if (!res.ok) throw new Error('Failed to fetch profiles')
    return res.json()
  },

  async retrieve(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/${id}/`)
    if (!res.ok) throw new Error('Failed to fetch profile')
    return res.json()
  }
}
