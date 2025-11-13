'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Project, Task } from '@/types'

interface AppContextType {
  projects: Project[]
  setProjects: (projects: Project[]) => void
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  return (
    <AppContext.Provider value={{ projects, setProjects, tasks, setTasks }}>
      {children}
    </AppContext.Provider>
  )
}

export const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider')
  return ctx
}
