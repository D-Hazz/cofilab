'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/hooks/api'

interface Props {
  onLoginClick?: () => void
}

export default function AuthButton({ onLoginClick }: Props) {
  const [isAuth, setIsAuth] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuth(!!token)
  }, [])

  const handleLogout = () => {
    logout()
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    router.push('/auth/login')
  }

  if (!isAuth) {
    return (
      <Button onClick={onLoginClick} className="bg-blue-500 hover:bg-blue-600 text-white">
        Se connecter
      </Button>
    )
  }

  return (
    <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
      Se déconnecter
    </Button>
  )
}
