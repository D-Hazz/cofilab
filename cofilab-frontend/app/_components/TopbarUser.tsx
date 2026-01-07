// /cofilab-frontend/app/_components/TopbarUser.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Coins, User, Edit, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBreez } from '@/contexts/BreezContext'
import { useMeProfile } from '@/hooks/useMeProfile'

function getProfileImageUrl(path?: string | null): string {
  if (!path) return '/default-prof.png'
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:9000')
    .replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export default function TopbarUser() {
  // 🔹 TOUS les hooks en haut, sans condition
  const { user, isAuth, loading, logout } = useAuth()
  const { balance, isConnected, loading: breezLoading } = useBreez()
  const { me, loading: meLoading } = useMeProfile()

  const [showWalletTooltip, setShowWalletTooltip] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  // Fermer le menu profil en cliquant hors du bloc
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 🔹 Les returns conditionnels viennent APRÈS tous les hooks
  if (loading || !isAuth) {
    return null
  }

  const sats = balance?.sats ?? 0
  const hasBalance = isConnected && sats > 0

  const displayName = me?.username || user?.username || 'Invité'
  const avatarSrc = getProfileImageUrl(me?.profile_picture || null)
  const currentUserId = me?.id || (user as any)?.id

  const handleLogout = () => {
    logout?.()
    setShowProfileMenu(false)
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Solde Breez */}
      <Link
        href="/wallet"
        className="flex items-center bg-[#1c2541] text-white px-3 py-2 rounded-lg shadow-sm relative cursor-pointer hover:bg-[#222b4f] transition-colors"
        onMouseEnter={() => setShowWalletTooltip(true)}
        onMouseLeave={() => setShowWalletTooltip(false)}
        onTouchStart={() => setShowWalletTooltip(true)}
        onTouchEnd={() => setShowWalletTooltip(false)}
      >
        <Coins className="w-4 h-4 text-[#f2a900] mr-2 md:mr-2" />
        <span className="hidden md:inline">
          {breezLoading
            ? 'Chargement…'
            : hasBalance
            ? `${sats.toLocaleString('fr-FR')} sats`
            : isConnected
            ? '0 sats'
            : '--- sats'}
        </span>

        {/* Tooltip mobile solde */}
        {showWalletTooltip && (
          <span className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
            {breezLoading
              ? 'Chargement…'
              : hasBalance
              ? `${sats.toLocaleString('fr-FR')} sats`
              : isConnected
              ? '0 sats'
              : '--- sats'}
          </span>
        )}
      </Link>

      {/* Avatar + Nom + Dropdown */}
      <div className="relative" ref={profileMenuRef}>
        <button
          type="button"
          className="flex items-center space-x-2 bg-white border px-3 py-2 rounded-lg shadow-sm"
          onClick={() => setShowProfileMenu((open) => !open)}
        >
          <img
            src={meLoading ? '/default-prof.png' : avatarSrc}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="hidden md:inline text-sm font-semibold text-gray-700">
            {displayName}
          </span>
        </button>

        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <div className="px-3 py-2 border-b">
              <p className="text-xs text-gray-500">Connecté en tant que</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {displayName}
              </p>
            </div>

            {/* Mon profil */}
            <Link
              href={
                currentUserId ? `/profiles/${currentUserId}/` : '/profiles/me'
              }
              onClick={() => setShowProfileMenu(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="w-4 h-4" />
              <span>Mon profil</span>
            </Link>

            {/* Modifier profil */}
            {currentUserId && (
              <Link
                href={`/profiles/${currentUserId}/edit/`}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#f2a900] hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier le profil</span>
              </Link>
            )}

            {/* Déconnexion */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
