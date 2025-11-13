// TopbarUser.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'

export default function TopbarUser() {
  const { user, token, isAuth, loading } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  // Simulation solde Breez
  useEffect(() => {
    if (!token) return
    const fetchBalance = async () => {
      setBalance(Math.floor(Math.random() * 50000) + 10000)
    }
    fetchBalance()
  }, [token])

  if (loading || !isAuth) return null

  return (
    <div className="flex items-center space-x-4">
      {/* Solde Breez */}
      <div
        className="flex items-center bg-[#1c2541] text-white px-3 py-2 rounded-lg shadow-sm relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
      >
        <Coins className="w-4 h-4 text-[#f2a900] mr-2 md:mr-2" />
        <span className="hidden md:inline">
          {balance ? `${balance.toLocaleString()} sats` : '--- sats'}
        </span>
        {/* Tooltip sur mobile */}
        {showTooltip && (
          <span className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
            {balance ? `${balance.toLocaleString()} sats` : '--- sats'}
          </span>
        )}
      </div>

      {/* Avatar + Nom */}
      <div
        className="flex items-center space-x-2 bg-white border px-3 py-2 rounded-lg shadow-sm relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(true)}
        onTouchEnd={() => setShowTooltip(false)}
      >
        <img
          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user?.username || 'guest'}`}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="hidden md:inline text-sm font-semibold text-gray-700">
          {user?.username || 'Invité'}
        </span>
        {/* Tooltip sur mobile */}
        {showTooltip && (
          <span className="md:hidden absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
            {user?.username || 'Invité'}
          </span>
        )}
      </div>
    </div>
  )
}
