// app/_components/PaymentHistory.tsx
'use client'

import { useEffect, useState } from "react"
import { useLightning } from "@/lib/useLightning"

export default function PaymentHistory({ projectId }: { projectId: number }) {
  const { history } = useLightning()
  const [items, setItems] = useState([])

  useEffect(() => {
    history(projectId).then(setItems)
  }, [projectId])

  return (
    <div className="p-4 bg-white rounded-lg shadow mt-4">
      <h2 className="text-xl font-semibold mb-3">Transactions Lightning</h2>

      <div className="space-y-3">
        {items.map(tx => (
          <div key={tx.id} className="border rounded-lg p-3">
            <div className="flex justify-between">
              <span className="font-medium">{tx.amount_sats} sats</span>
              <span className={tx.status === "settled" ? "text-green-600" : "text-yellow-600"}>
                {tx.status}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Hash: {tx.payment_hash}
            </div>
            <div className="text-xs text-gray-400">
              {new Date(tx.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
