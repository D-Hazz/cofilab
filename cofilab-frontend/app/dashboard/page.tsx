'use client'

import { useEffect } from 'react'
import { useBreez } from '@/contexts/BreezContext'
import WalletBalance from '@/app/_components/WalletBalance'
import ActionButtons from '@/app/_components/ActionButtons'
import RecentActivities from '@/app/_components/RecentActivities'

export default function DashboardPage() {
  const { balance, transactions, isConnected } = useBreez()

  // ✅ Le useEffect doit être placé AVANT le return
  useEffect(() => {
    console.log('🔹 Solde:', balance)
    console.log('🔹 Transactions:', transactions)
    console.log('🔹 Connecté:', isConnected)
  }, [balance, transactions, isConnected])

  if (!isConnected)
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Connexion au réseau Breez…
      </div>
    )

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ✅ Barre d’état de connexion */}
        <div className="flex justify-end">
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              isConnected
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {isConnected ? 'Connecté à Breez' : 'Hors ligne'}
          </span>
        </div>
        <WalletBalance balance={balance} />
        <ActionButtons />
        <RecentActivities transactions={transactions} />
      </div>
    </main>
  )
}
