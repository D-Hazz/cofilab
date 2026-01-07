"use client"

import React, { useState } from "react"
import { useBreez } from "@/contexts/BreezContext"

export default function TestBreezPage() {
  const { isConnected } = useBreez()
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const [nodeId, setNodeId] = useState<string | null>(null)
  const [rawWalletInfo, setRawWalletInfo] = useState<any>(null)
  const [rawBalances, setRawBalances] = useState<any>(null)

  async function runTest() {
    setLoading(true)
    setError(null)

    try {
      // On importe getBreezSdk dynamiquement pour rester côté client
      const { getBreezSdk } = await import("@/lib/breez")
      const sdk = await getBreezSdk()

      const infoRes = await sdk.getInfo()
      const txs = await sdk.listPayments({})

      console.log("Breez getInfo() brut =", infoRes)
      console.log("Breez listPayments() brut =", txs)

      const candidateNodeId =
        infoRes?.nodeInfo?.id ||
        infoRes?.walletInfo?.nodeId ||
        infoRes?.walletInfo?.nodePubkey ||
        infoRes?.walletInfo?.nodePubKey ||
        null

      setInfo(infoRes)
      setPayments(txs || [])
      setNodeId(candidateNodeId)
      setRawWalletInfo(infoRes?.walletInfo ?? null)
      setRawBalances(infoRes?.balances ?? null)
    } catch (err: any) {
      setError(err.message || "Erreur inconnue")
      console.error("Test Breez error:", err)
    }

    setLoading(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">🔧 Test Breez Liquid Web</h1>

      <p className="text-sm text-slate-600">
        Cette page appelle <code>getInfo()</code> et <code>listPayments()</code> sur le SDK Breez
        déjà initialisé via ton mnemonic (via la page <code>/connect-wallet</code>).
      </p>

      {!isConnected && (
        <p className="text-sm text-red-600">
          Aucun wallet connecté dans ce contexte. Va d’abord sur <code>/connect-wallet</code> pour
          initialiser Breez avec ton mnemonic, puis reviens ici.
        </p>
      )}

      <button
        onClick={runTest}
        disabled={loading || !isConnected}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
      >
        {loading ? "Chargement…" : "Tester Breez (getInfo + listPayments)"}
      </button>

      {error && (
        <div className="p-4 border rounded bg-red-50 border-red-200">
          <h2 className="text-xl font-bold text-red-600">❌ Erreur</h2>
          <pre className="text-sm mt-2 text-red-500 whitespace-pre-wrap break-all">
            {error}
          </pre>
        </div>
      )}

      {info && (
        <div className="p-4 border rounded bg-amber-50 border-amber-200 space-y-2">
          <h2 className="text-lg font-semibold text-amber-700">Résumé rapide</h2>
          <p className="text-sm text-slate-800 break-all">
            Node/pubkey (si présent) :{" "}
            <span className="font-mono">
              {nodeId ?? "aucun champ nodeId / nodePubkey trouvé"}
            </span>
          </p>
          <p className="text-sm text-slate-800">
            Balance (walletInfo.balanceSat) :{" "}
            <span className="font-mono">
              {rawWalletInfo?.balanceSat ?? "non défini"}
            </span>
          </p>
          <p className="text-sm text-slate-800">
            Balances objet complet :{" "}
            <code className="text-xs">
              {rawBalances ? JSON.stringify(rawBalances) : "aucun champ balances"}
            </code>
          </p>
        </div>
      )}

      {info && (
        <div className="p-4 border rounded bg-green-50 border-green-200">
          <h2 className="text-xl font-bold text-green-600">🟢 getInfo() – réponse brute</h2>
          <pre className="text-xs mt-2 max-h-96 overflow-auto whitespace-pre">
            {JSON.stringify(info, null, 2)}
          </pre>
        </div>
      )}

      {payments.length > 0 && (
        <div className="p-4 border rounded bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold text-blue-600">
            📜 Paiements ({payments.length})
          </h2>
          <pre className="text-xs mt-2 max-h-96 overflow-auto whitespace-pre">
            {JSON.stringify(payments, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
