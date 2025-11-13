'use client'

import { useEffect, useState } from 'react'
import { useBreez } from '@/contexts/BreezContext'

/**
 * Dynamic bolt11 loader + async decoder
 * - évite un import top-level pour prévenir l'erreur de build si bolt11
 *   n'est pas installé ou si Next tente de résoudre côté serveur.
 */
let _bolt11: any = null
async function loadBolt11() {
  if (_bolt11) return _bolt11
  try {
    _bolt11 = await import('bolt11')
    return _bolt11
  } catch (err) {
    console.warn('bolt11 module not available:', err)
    _bolt11 = null
    return null
  }
}

/**
 * Decode a bolt11 invoice and return sats if present (or undefined).
 */
export async function decodeBolt11AmountAsync(invoice: string): Promise<number | undefined> {
  const mod = await loadBolt11()
  if (!mod) return undefined
  try {
    const decodeFn = (mod && (mod.decode || mod.default?.decode)) ?? null
    if (!decodeFn && typeof mod === 'function') {
      const decoded = mod(invoice)
      if (decoded.satoshis) return Number(decoded.satoshis)
      if (decoded.millisatoshis) return Math.floor(Number(decoded.millisatoshis) / 1000)
      return undefined
    }
    if (!decodeFn) return undefined
    const decoded = decodeFn(invoice)
    if (decoded.satoshis) return Number(decoded.satoshis)
    if (decoded.millisatoshis) return Math.floor(Number(decoded.millisatoshis) / 1000)
  } catch {
    // ignore decode errors
  }
  return undefined
}

type WalletBalanceProps = {
  balance?: number | null
}

export default function WalletBalance({ balance: propBalance }: WalletBalanceProps) {
  // safe context access (useBreez throws if provider absent)
  let ctx: any = null
  try {
    ctx = useBreez()
  } catch {
    ctx = null
  }

  const [localLoading, setLocalLoading] = useState(false)
  const [displaySats, setDisplaySats] = useState<number | null>(null)

  // On récupère la vraie balance au montage si le provider est disponible
  useEffect(() => {
    let mounted = true
    async function ensureFresh() {
      if (!ctx) return
      try {
        setLocalLoading(true)
        await ctx.refreshData()
      } catch {
        // ignore refresh errors here, already surfaced in ctx.error
      } finally {
        if (mounted) setLocalLoading(false)
      }
    }
    ensureFresh()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx])

  // Synchronisation de l'affichage : priorité au prop passé depuis le parent,
  // sinon utilisation de la balance du contexte (mise à jour réactive)
  useEffect(() => {
    if (typeof propBalance === 'number') {
      setDisplaySats(propBalance)
      return
    }
    if (!ctx) {
      setDisplaySats(null)
      return
    }
    setDisplaySats(ctx.balance?.sats ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propBalance, ctx?.balance?.sats, ctx?.loading, ctx?.linkedAmount])

  const handleRefresh = async () => {
    if (!ctx?.refreshData) return
    try {
      setLocalLoading(true)
      await ctx.refreshData()
    } finally {
      setLocalLoading(false)
    }
  }

  // rendu tolérant : si pas de contexte et pas de prop, affichage neutre
  if (!ctx && typeof propBalance !== 'number') {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-md flex flex-col gap-1">
        <span className="text-sm opacity-80">Wallet Balance</span>
        <h2 className="text-3xl font-semibold">—</h2>
        <div className="text-xs opacity-80">Breez non initialisé</div>
      </div>
    )
  }

  const loading = ctx?.loading ?? false

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-md flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-sm opacity-80">Wallet Balance</span>
          <h2 className="text-3xl font-semibold">
            {loading || localLoading
              ? 'Loading...'
              : displaySats !== null
              ? `${displaySats.toLocaleString()} sats`
              : '0 sats'}
          </h2>

          {/* Montant lié (si présent dans le contexte) */}
          {ctx?.linkedAmount ? (
            <div className="text-sm opacity-90 mt-1">
              Facture liée : <strong>{ctx.linkedAmount.toLocaleString()} sats</strong>
            </div>
          ) : null}
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || localLoading}
          className="ml-4 text-xs bg-white/10 hover:bg-white/20 rounded px-2 py-1"
          aria-label="Refresh wallet balance"
        >
          {localLoading ? '...' : 'Refresh'}
        </button>
      </div>

      <div className="text-xs opacity-80">
        {ctx?.error ? (
          <span className="text-yellow-200">Erreur: {ctx.error}</span>
        ) : ctx?.isConnected ? (
          <span>Connected</span>
        ) : (
          <span>Not connected</span>
        )}
      </div>
    </div>
  )
}
