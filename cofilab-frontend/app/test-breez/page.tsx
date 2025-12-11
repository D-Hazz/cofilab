// cofilab-frontend/app/test-breez/page.tsx
"use client"

import React, { useState } from "react"
import { getBreezSdk } from "@/lib/breez"

export default function TestBreezPage() {
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function runTest() {
    setLoading(true)
    setError(null)

    try {
      const sdk = await getBreezSdk()
      
      // ✅ Liquid SDK méthodes correctes
      const nodeInfo = await sdk.getInfo()
      const request = {}
      const txs = await sdk.listPayments(request)

 
      
      setInfo(nodeInfo)
      setPayments(txs)
      
    } catch (err: any) {
      setError(err.message || "Erreur inconnue")
      console.error('Test error:', err)
    }

    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">🔧 Test Breez Liquid Web</h1>

      <button
        onClick={runTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? "Chargement…" : "Tester Breez"}
      </button>

      {error && (
        <div className="p-4 border rounded bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-600">❌ Erreur</h2>
          <pre className="text-sm mt-2 text-red-500">{error}</pre>
        </div>
      )}

      {info && (
        <div className="p-4 border rounded bg-green-50 border-green-200">
          <h2 className="text-xl font-bold text-green-600">🟢 Node Info</h2>
          <pre className="text-sm mt-2 max-h-96 overflow-auto">{JSON.stringify(info, null, 2)}</pre>
        </div>
      )}

      {payments.length > 0 && (
        <div className="p-4 border rounded bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold text-blue-600">📜 Paiements ({payments.length})</h2>
          <pre className="text-sm mt-2 max-h-96 overflow-auto">
            {JSON.stringify(payments, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
