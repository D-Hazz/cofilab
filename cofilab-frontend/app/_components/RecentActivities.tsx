// app/_components/RecentActivities.tsx
'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Payment } from '@/types'

interface RecentActivitiesProps {
  // L'interface indique qu'il s'agit d'un tableau, mais la prop pourrait être omise ou null.
  transactions: Payment[]
  loading?: boolean
}

// 💡 CORRECTION: Ajoutez un tableau vide par défaut à la déstructuration
export default function RecentActivities({ transactions = [], loading = false }: RecentActivitiesProps) {
// ------------------------------ OU -------------------------------
// Si vous ne voulez pas ajouter de valeur par défaut, corrigez la logique de rendu :

// export default function RecentActivities({ transactions, loading = false }: RecentActivitiesProps) {
//   // Ajoutez une vérification précoce pour garantir que 'transactions' est un tableau
//   const safeTransactions = transactions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-gray-500 text-sm">Chargement...</p>
        ) : (transactions?.length === 0 || !transactions) ? ( // 🌟 La vérification est corrigée ici
          // Cette ligne couvre maintenant [null, undefined, ou []]
          <p className="text-gray-500 text-sm">Aucune transaction pour le moment.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {/* Si vous utilisez le chaînage optionnel ci-dessus, assurez-vous de mapper 'transactions' */}
            {transactions.map((tx) => ( 
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  {/* La flèche devrait pointer VERS le compte si c'est un crédit (positif) */}
                  {tx.amount_sats > 0 ? ( 
                    <ArrowDown className="text-green-500 w-4 h-4" /> // Crédit (argent entrant)
                  ) : (
                    <ArrowUp className="text-red-500 w-4 h-4" /> // Débit (argent sortant)
                  )}
                  <span className="text-sm text-gray-700">{tx.ln_invoice || 'Lightning Tx'}</span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.amount_sats > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.amount_sats > 0 ? '+' : ''}{tx.amount_sats} sat
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}