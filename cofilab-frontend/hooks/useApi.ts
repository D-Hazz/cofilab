'use client'

import api from '@/services/api'
import { Project, Task } from '@/types'

export const useApi = () => {
  const getProjects = async (): Promise<Project[]> => {
    const res = await api.get('/projects/')
    return res.data
  }

  const getTasks = async (): Promise<Task[]> => {
    const res = await api.get('/tasks/')
    return res.data
  }

  const createProject = async (payload: Partial<Project>) => {
    const res = await api.post('/projects/', payload)
    return res.data
  }

  const createTask = async (payload: Partial<Task>) => {
    const res = await api.post('/tasks/', payload)
    return res.data
  }

  const updateTask = async (taskId: number, payload: Partial<Task>) => {
    const res = await api.patch(`/tasks/${taskId}/`, payload)
    return res.data
  }

  return { getProjects, getTasks, createProject, createTask, updateTask }
}
