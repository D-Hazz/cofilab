'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { connectBreezWithMnemonic } from '@/lib/breez'
import { useBreez } from '@/contexts/BreezContext'
import Link from 'next/link'
import Sidebar from '@/app/_components/Sidebar'

const LOCAL_STORAGE_KEY = 'cofilab_mnemonic'

export default function ConnectWalletPage() {
  const [mnemonic, setMnemonic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshData } = useBreez()
  const router = useRouter()

  // Charger le mnemonic depuis localStorage si présent
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored && !mnemonic) {
        setMnemonic(stored)
      }
    } catch (e) {
      console.warn('Impossible de lire le mnemonic depuis localStorage')
    }
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const trimmed = mnemonic.trim()
      // On tente la connexion
      await connectBreezWithMnemonic(trimmed)
      await refreshData()
      // On persiste pour ne pas devoir retaper à chaque fois
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, trimmed)
      } catch (e) {
        console.warn('Impossible d’écrire le mnemonic dans localStorage')
      }
      router.push('/wallet')
    } catch (err: any) {
      console.error('Connect wallet error:', err)
      setError(err?.message || 'Connexion impossible avec ce mnemonic')
    }
    setLoading(false)
  }

  const words = mnemonic.trim().split(/\s+/).filter(Boolean)

  const handleClearStored = () => {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY)
    } catch (e) {
      console.warn('Impossible de supprimer le mnemonic dans localStorage')
    }
    setMnemonic('')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar fixe à gauche */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-xl w-full space-y-8 py-8">
          {/* Logo / retour */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition"
            >
              <span className="text-lg">←</span> Retour au wallet
            </Link>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px]">
              CoFiLab · Lightning Onboarding
            </span>
          </div>

          {/* Carte centrale */}
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-xl">
            <div className="mb-5 flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Connecter ton wallet Lightning
              </h1>
              <p className="text-sm text-slate-600">
                Utilise la phrase mnemonic de ton wallet pour lier ton solde
                Lightning à CoFiLab. Le mnemonic est conservé dans ton
                navigateur pour éviter de te reconnecter à chaque fois.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">
                  Phrase mnemonic (12 ou 24 mots)
                </label>
                <textarea
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                  rows={3}
                  value={mnemonic}
                  onChange={(e) => setMnemonic(e.target.value)}
                  placeholder="ex: word1 word2 word3 ... word12"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Colle ou saisis ta phrase. Vérifie bien l’ordre des mots avant
                  de connecter ton wallet.
                </p>
              </div>

              {/* Aperçu des mots */}
              {words.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-medium text-slate-600 mb-2">
                    Aperçu des mots détectés ({words.length}) :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {words.map((w, idx) => (
                      <span
                        key={`${w}-${idx}`}
                        className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-800 border border-slate-200"
                      >
                        <span className="mr-1 text-[10px] text-slate-400">
                          {idx + 1}.
                        </span>
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={loading || !mnemonic.trim()}
                  className="w-full inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {loading ? 'Connexion en cours…' : 'Connecter le wallet'}
                </button>

                {words.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearStored}
                    className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400 transition"
                  >
                    Effacer le mnemonic stocké
                  </button>
                )}
              </div>
            </form>

            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Tip : utilise un environnement privé et ne partage jamais ton mnemonic.
              </span>
              <span className="text-amber-600">
                Collaborate. Fund. Earn.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
