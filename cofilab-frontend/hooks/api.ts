// cofilab-frontend/hooks/api.ts
'use client'

import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api'

// --- JWT Token Storage ---
const getAccessToken = () => typeof window !== 'undefined' ? localStorage.getItem('access') : null
const setAccessToken = (token: string) => typeof window !== 'undefined' && localStorage.setItem('access', token)
const removeTokens = () => typeof window !== 'undefined' && (localStorage.removeItem('access'), localStorage.removeItem('refresh'))

// --- Axios Instance ---
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// --- Request Interceptor to add token ---
api.interceptors.request.use(config => {
  const token = getAccessToken()
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
  return config
})

// --- Response Interceptor to handle 401 ---
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      removeTokens()
      // Optionally redirect to login
    }
    return Promise.reject(err)
  }
)

// --- Types ---
export interface User {
  id: number
  username: string
}

export interface Project {
  id: number
  name: string
  description: string
  total_budget: number
  is_public: boolean
  manager: User
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  weight: number
  assigned_to?: User | null
  status: string
  validated: boolean
  reward_sats: number
  rewarded: boolean
  project: number | Project
  assigned_to_username?: string | null
  created_at: string
}

export interface Funding {
  id: number
  project: number
  wallet_address: string
  amount_sats: number
  is_anonymous: boolean
  is_amount_public: boolean
  proof_hash: string
  created_at: string
}

export interface Payment {
  id: number
  task: number
  user: number
  ln_invoice: string
  amount_sats: number
  status: string
  paid_at?: string | null
}

// --- LNURL Login ---
export const lnurlChallenge = async (k1?: string) => {
  const res = await api.get('/lnurl/challenge/', { params: { k1 } })
  return res.data // { k1, expires_at }
}

export const lnurlVerify = async (payload: { k1: string; pubkey: string; sig: string }) => {
  const res = await api.post('/lnurl/verify/', payload)
  const { access, refresh } = res.data
  setAccessToken(access)
  return res.data
}

// --- Auth Helpers ---
export const logout = () => removeTokens()

// --- CRUD Endpoints ---
export const projectApi = {
  list: async (): Promise<Project[]> => (await api.get('/projects/')).data,
  get: async (id: number): Promise<Project> => (await api.get(`/projects/${id}/`)).data,
  create: async (payload: Partial<Project>) => (await api.post('/projects/', payload)).data,
  update: async (id: number, payload: Partial<Project>) => (await api.patch(`/projects/${id}/`, payload)).data,
  delete: async (id: number) => (await api.delete(`/projects/${id}/`)).data,
}

export const taskApi = {
  list: async (): Promise<Task[]> => (await api.get('/tasks/')).data,
  get: async (id: number): Promise<Task> => (await api.get(`/tasks/${id}/`)).data,
  create: async (payload: Partial<Task>) => (await api.post('/tasks/', payload)).data,
  update: async (id: number, payload: Partial<Task>) => (await api.patch(`/tasks/${id}/`, payload)).data,
  delete: async (id: number) => (await api.delete(`/tasks/${id}/`)).data,
}

export const fundingApi = {
  list: async (): Promise<Funding[]> => (await api.get('/fundings/')).data,
  get: async (id: number): Promise<Funding> => (await api.get(`/fundings/${id}/`)).data,
  create: async (payload: Partial<Funding>) => (await api.post('/fundings/', payload)).data,
  update: async (id: number, payload: Partial<Funding>) => (await api.patch(`/fundings/${id}/`, payload)).data,
  delete: async (id: number) => (await api.delete(`/fundings/${id}/`)).data,
}

export const paymentApi = {
  list: async (): Promise<Payment[]> => (await api.get('/payments/')).data,
  get: async (id: number): Promise<Payment> => (await api.get(`/payments/${id}/`)).data,
  create: async (payload: Partial<Payment>) => (await api.post('/payments/', payload)).data,
  update: async (id: number, payload: Partial<Payment>) => (await api.patch(`/payments/${id}/`, payload)).data,
  delete: async (id: number) => (await api.delete(`/payments/${id}/`)).data,
}

export const projects = {
  // Récupérer 1 projet
  retrieve: async (id: string | number) =>
    (await api.get(`/projects/${id}/`)).data,

  // Récupérer toutes les tâches d’un projet
  tasks: async (id: string | number) =>
    (await api.get(`/projects/${id}/tasks/`)).data,

  // Créer une tâche dans un projet
  createTask: async (projectId: string | number, payload: any) =>
    (await api.post(`/projects/${projectId}/tasks/`, payload)).data,

  // Mettre à jour une tâche
  updateTask: async (taskId: string | number, payload: any) =>
    (await api.patch(`/tasks/${taskId}/`, payload)).data,

  // Supprimer une tâche
  deleteTask: async (taskId: string | number) =>
    (await api.delete(`/tasks/${taskId}/`)).data,
}

export default api
