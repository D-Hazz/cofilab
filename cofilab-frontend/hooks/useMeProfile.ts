// /cofilab-frontend/hooks/useMeProfile.ts
'use client'

import { useEffect, useState } from 'react'
import { profiles } from '@/services/api'

interface MeProfile {
  id: number
  username: string
  profile_picture?: string | null
}

export function useMeProfile() {
  const [me, setMe] = useState<MeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await profiles.getMe()
        if (mounted) setMe(data)
      } catch {
        if (mounted) setMe(null)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return { me, loading }
}
