'use client'

import axios, { AxiosRequestConfig } from 'axios'

// --- Config ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
})

// --- Interceptors ---
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const isFormData =
    typeof FormData !== 'undefined' && config.data instanceof FormData

  if (isFormData && config.headers) {
    delete (config.headers as any)['Content-Type']
    delete (config.headers as any)['content-type']
  }

  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const payload = err?.response?.data || { detail: err.message || 'Network error' }
    return Promise.reject(payload)
  }
)

// ======================
// TYPES
// ======================

interface Notification {
  id: number
  title: string
  message: string
  read: boolean
  created_at: string
}

interface UserRegistration {
  username?: string
  email?: string
  password?: string
  password2?: string
}

interface Skill {
  id: number
  name: string
}

interface Task {
  id: number
  title: string
}

interface Project {
  id: number
  name: string
  tasks: Task[]
}

interface UserProfile {
  id: number
  username: string
  contact_email: string
  contact_phone: string
  current_city: string
  work_mode: string
  availability: string
  bio: string
  profile_picture?: string
  skill_ids?: number[]
  skills: Skill[]
  created_at: string
  updated_at: string
}

// ======================
// NOTIFICATIONS (fixé)
// ======================

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    const res = await api.get('/notifications/')
    return res.data
  },

  async markRead(notificationId: number) {
    const res = await api.patch(`/notifications/${notificationId}/`, { read: true })
    return res.data
  },
}

// ======================
// AUTH
// ======================
export const auth = {
  async register(data: UserRegistration): Promise<UserProfile> {
    const res = await api.post('/register/', data)
    return res.data
  },

  async getChallenge() {
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

// ======================
// PROJECTS
// ======================
export const projects = {
  async list(): Promise<Project[]> {
    const res = await api.get('/projects/')
    return res.data
  },

  async retrieve(id: number | string): Promise<Project> {
    const res = await api.get(`/projects/${id}/`)
    return res.data
  },

  async create(data: FormData | Record<string, unknown>) {
    const res = await api.post('/projects/', data)
    return res.data
  },

  async inviteContributor(projectId: number, userId: number) {
    const res = await api.post(`/projects/${projectId}/invite/`, {
      user_id: userId,
    })
    return res.data
  },

  async tasks(id: number | string): Promise<Task[]> {
    const res = await api.get(`/projects/${id}/tasks/`)
    return res.data
  },

  async createTask(projectId: number | string, data: any): Promise<Task> {
    const payload = {
      ...data,
      project: projectId,
      assigned_to: data.assigned_to || null,
    }
    const res = await api.post('/tasks/', payload)
    return res.data
  },

  async updateTask(taskId: number, data: any): Promise<Task> {
    const payload = {
      ...data,
      assigned_to: data.assigned_to || null,
    }
    const res = await api.patch(`/tasks/${taskId}/`, payload)
    return res.data
  },

  async deleteTask(taskId: number) {
    const res = await api.delete(`/tasks/${taskId}/`)
    return res.data
  },
}

// ======================
// PROFILES
// ======================

export const profiles = {
  async list() {
    const res = await api.get('/profiles/')
    return res.data
  },

  async getMe() {
    const res = await api.get('/profiles/me/')
    return res.data
  },

  async retrieve(id: number | string) {
    const res = await api.get(`/profiles/${id}/`)
    return res.data
  },

  async update(id: number | string, data: any) {
    const res = await api.patch(`/profiles/${id}/`, data)
    return res.data
  },
}

// ======================
// SKILLS
// ======================

export const skills = {
  async list(): Promise<Skill[]> {
    const res = await api.get('/skills/')
    return res.data
  },
}

// ======================
// INVITATIONS
// ======================

export const invitations = {
  async invite(projectId: number, userId: number) {
    const res = await api.post('/invitations/', {
      project_id: projectId,
      recipient_id: userId,
    })
    return res.data
  },

  async listSent() {
    const res = await api.get('/invitations/?filter=sent')
    return res.data
  },

  async listReceived() {
    const res = await api.get('/invitations/?filter=received')
    return res.data
  },

  async accept(id: number) {
    const res = await api.post(`/invitations/${id}/accept/`)
    return res.data
  },

  async reject(id: number) {
    const res = await api.post(`/invitations/${id}/reject/`)
    return res.data
  },
}

export default api
