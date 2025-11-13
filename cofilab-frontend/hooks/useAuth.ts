'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (!t) {
      router.push('/auth/login')
    } else {
      setToken(t)
      const u = localStorage.getItem('user')
      setUser(u ? JSON.parse(u) : null)
    }
    setLoading(false)
  }, [router])

  return { user, token, loading, isAuth: !!token }
}
