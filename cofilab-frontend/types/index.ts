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
}

export interface Task {
  id: number
  title: string
  description: string
  status: 'todo' | 'done'
  validated: boolean
  reward_sats: number
  rewarded: boolean
  assigned_to?: User
}

export interface Balance {
  sats: number
  fiat: number
}

export interface Transaction {
  id?: string
  amount: number
  description: string
  timestamp?: number
}
