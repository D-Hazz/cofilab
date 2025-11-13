'use client'

import axios, { AxiosRequestConfig } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000/api'

const api = axios.create({
  baseURL: API_BASE,
  // Ne PAS définir Content-Type globalement — laisser axios / le navigateur le gérer pour FormData
  timeout: 20000,
})

api.interceptors.request.use((config: AxiosRequestConfig) => {
  // Récupération du token uniquement côté client
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Si la payload est un FormData, supprimer explicitement Content-Type
  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData
  if (isFormData && config.headers) {
    // supprimer les variantes possibles de l'en-tête
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (config.headers as any)['Content-Type']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (config.headers as any)['content-type']
  }

  return config
})

// Optionnel : interceptor de réponse pour normaliser erreurs
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Propager un objet d'erreur plus lisible côté client
    const payload = err?.response?.data || { detail: err.message || 'Network error' }
    return Promise.reject(payload)
  }
)

interface ChallengeResponse {
  k1: string
}

// --- Auth LNURL ---
export const lnurl = {
  async getChallenge(): Promise<ChallengeResponse> {
    const res = await api.get('/lnurl/challenge/')
    return res.data
  },
  async verify(k1: string, sig: string, key: string) {
    const res = await api.post('/lnurl/verify/', { k1, sig, key })
    if (res.data?.access) {
      localStorage.setItem('token', res.data.access)
    }
    return res.data
  },
}

// --- CRUD: Projects ---
export const projects = {
  async list() {
    const res = await api.get('/projects/')
    return res.data
  },

  async retrieve(id: string | number) {
    const res = await api.get(`/projects/${id}/`)
    return res.data
  },

  // Accepts FormData or plain object — if FormData is used, interceptor supprime Content-Type automatiquement
  async create(data: FormData | Record<string, unknown>) {
    const res = await api.post('/projects/', data as unknown as FormData)
    return res.data
  },

  async tasks(id: string | number) {
    const res = await api.get(`/projects/${id}/tasks/`)
    return res.data
  },
}

// --- Tasks ---
export const tasks = {
  async list() {
    const res = await api.get('/tasks/')
    return res.data
  },

  async create(data: Record<string, unknown>) {
    const res = await api.post('/tasks/', data)
    return res.data
  },

  async update(id: number, data: Record<string, unknown>) {
    const res = await api.patch(`/tasks/${id}/`, data)
    return res.data
  },
}

// --- Profiles ---
export const profiles = {
  async getMe() {
    const res = await api.get('/profiles/me/')
    return res.data
  },

  async retrieve(id: string | number) {
    const res = await api.get(`/profiles/${id}/`)
    return res.data
  },

  async update(id: string | number, data: Record<string, unknown>) {
    const res = await api.patch(`/profiles/${id}/`, data)
    return res.data
  },
}

// --- Skills ---
export const skills = {
  async list() {
    const res = await api.get('/skills/')
    return res.data
  },
}

export default api
