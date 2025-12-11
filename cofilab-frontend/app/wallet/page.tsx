'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useBreez } from '@/contexts/BreezContext'
import QRCode from 'react-qr-code'
import Sidebar from '@/app/_components/Sidebar'

export default function WalletPage() {
  const {
    isConnected,
    loading,
    error,
    balance,
    transactions,
    refreshData,
    payInvoice,
    receiveInvoice,
    linkedInvoice,
    linkedAmount,
    setLinkedInvoice,
    clearLinkedInvoice,
  } = useBreez()

  const [payBolt11, setPayBolt11] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const [recvAmount, setRecvAmount] = useState<string>('')
  const [recvInvoice, setRecvInvoice] = useState<string | null>(null)
  const [recvLoading, setRecvLoading] = useState(false)
  const [recvError, setRecvError] = useState<string | null>(null)

  // Prix BTC (CoinGecko)
  const [btcPriceUsd, setBtcPriceUsd] = useState<number | null>(null)
  const [btcPriceChange, setBtcPriceChange] = useState<number | null>(null)
  const [btcLoading, setBtcLoading] = useState(false)
  const [btcError, setBtcError] = useState<string | null>(null)

  // Ref pour télécharger le QR
  const qrWrapperRef = useRef<HTMLDivElement | null>(null)

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setPayError(null)
    setPayLoading(true)
    try {
      await payInvoice(payBolt11.trim())
      setPayBolt11('')
    } catch (err: any) {
      setPayError(err?.message || 'Erreur lors du paiement')
    }
    setPayLoading(false)
  }

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecvError(null)
    setRecvLoading(true)
    try {
      const amountSat = recvAmount ? parseInt(recvAmount, 10) || 0 : 0
      const invoice = await receiveInvoice(amountSat)
      setRecvInvoice(invoice || null)
      setLinkedInvoice(invoice || null)
    } catch (err: any) {
      setRecvError(err?.message || 'Erreur lors de la création de la facture')
    }
    setRecvLoading(false)
  }

  const currentInvoice = recvInvoice || linkedInvoice || null
  const qrValue = currentInvoice ? `lightning:${currentInvoice}` : ''

  // Récupération prix BTC (CoinGecko “simple price” free endpoint)
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setBtcLoading(true)
        setBtcError(null)
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        )
        if (!res.ok) throw new Error('Erreur API CoinGecko')
        const data = await res.json()
        const usd = data?.bitcoin?.usd
        const change = data?.bitcoin?.usd_24h_change
        if (typeof usd === 'number') setBtcPriceUsd(usd)
        if (typeof change === 'number') setBtcPriceChange(change)
      } catch (err: any) {
        console.error('Erreur CoinGecko:', err)
        setBtcError('Indispo.')
      } finally {
        setBtcLoading(false)
      }
    }

    fetchPrice()
    const id = setInterval(fetchPrice, 60000)
    return () => clearInterval(id)
  }, [])

  const fiatEstimateUsd =
    btcPriceUsd && balance.sats
      ? (balance.sats / 100_000_000) * btcPriceUsd
      : null

  const handleCopyInvoice = async () => {
    if (!currentInvoice) return
    try {
      await navigator.clipboard.writeText(currentInvoice)
      alert('Invoice copiée dans le presse-papier.')
    } catch {
      alert('Impossible de copier l’invoice.')
    }
  }

  const handleDownloadQr = async () => {
    if (!qrWrapperRef.current) return
    try {
      const svg = qrWrapperRef.current.querySelector('svg')
      if (!svg) return

      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svg)
      const svgBlob = new Blob([svgString], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const url = URL.createObjectURL(svgBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'cofilab-invoice-qr.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur download QR:', err)
      alert('Impossible de télécharger le QR code.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar à gauche */}
      <Sidebar />

      {/* Contenu principal à droite */}
      <div className="flex-1 relative">
        {/* Badge BTC fixe */}
        <div className="fixed inset-x-0 top-0 z-20 flex justify-center pointer-events-none">
          <div className="mt-3 pointer-events-auto rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-700">BTC / USD</span>
            {btcLoading && (
              <span className="text-slate-400">Chargement…</span>
            )}
            {btcError && <span className="text-red-500">{btcError}</span>}
            {!btcLoading && !btcError && btcPriceUsd && (
              <>
                <span className="font-mono text-slate-800">
                  {btcPriceUsd.toLocaleString('en-US', {
                    maximumFractionDigits: 2,
                  })}
                </span>
                {btcPriceChange !== null && (
                  <span
                    className={
                      btcPriceChange >= 0
                        ? 'text-emerald-600'
                        : 'text-red-600'
                    }
                  >
                    {btcPriceChange >= 0 ? '+' : ''}
                    {btcPriceChange.toFixed(2)}%
                  </span>
                )}
                {fiatEstimateUsd !== null && (
                  <span className="ml-2 text-slate-500">
                    Wallet ≈{' '}
                    <span className="font-semibold text-slate-800">
                      {fiatEstimateUsd.toLocaleString('en-US', {
                        maximumFractionDigits: 2,
                      })}{' '}
                      $
                    </span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-8 pt-16 space-y-8">
          {/* Header */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                CoFiLab Wallet
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Collaborate. Fund. Earn. — with Bitcoin Lightning.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Lightning powered by Breez
              </div>
              <Link
                href="/projects"
                className="hidden md:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-slate-400 transition"
              >
                Voir les projets
              </Link>
            </div>
          </header>

          {/* Alerte connexion */}
          {!isConnected && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-amber-800">
                  Aucun wallet Lightning connecté.
                </p>
                <p className="mt-1 text-xs text-amber-700/90">
                  Connecte un wallet avec ton mnemonic pour financer ou recevoir
                  des sats sur CoFiLab.
                </p>
              </div>
              <Link
                href="/connect-wallet"
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-400 transition"
              >
                Connecter un wallet
              </Link>
            </div>
          )}

          {/* Bandeau statut + solde */}
          <section className="grid gap-4 md:grid-cols-3">
            {/* Statut */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Statut Lightning
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    <span
                      className={
                        isConnected ? 'text-emerald-600' : 'text-red-600'
                      }
                    >
                      {isConnected ? 'Connecté' : 'Non connecté'}
                    </span>
                  </p>
                  {error && (
                    <p className="mt-1 text-[11px] text-red-500">
                      Erreur : {error}
                    </p>
                  )}
                </div>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] text-slate-700 hover:border-slate-400 disabled:opacity-50"
                >
                  {loading ? 'Rafraîchissement…' : 'Rafraîchir'}
                </button>
              </div>
            </div>

            {/* Solde sats */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Solde disponible
              </p>
              <p className="mt-3 text-3xl font-mono font-semibold text-amber-600">
                {balance.sats.toLocaleString('fr-FR')}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  sats
                </span>
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {fiatEstimateUsd !== null
                  ? `≈ ${fiatEstimateUsd.toLocaleString('en-US', {
                      maximumFractionDigits: 2,
                    })} $`
                  : 'Estimation fiat en attente du prix BTC.'}
              </p>
            </div>

            {/* Résumé projets / CTA */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  CoFiLab Insight
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Utilise ce wallet pour financer des projets ou recevoir des
                  récompenses liées à tes contributions.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/projects?role=financeur"
                  className="flex-1 rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white text-center hover:bg-amber-400 transition"
                >
                  Financer un projet
                </Link>
                <Link
                  href="/projects?role=executant"
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 text-center hover:border-slate-400 transition"
                >
                  Rejoindre un projet
                </Link>
              </div>
            </div>
          </section>

          {/* Grille principale : Envoyer / Recevoir / Historique */}
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)]">
            {/* Colonne gauche : envoyer + historique */}
            <div className="space-y-6">
              {/* Envoyer */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Envoyer des fonds
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    Payer une invoice BOLT11
                  </span>
                </div>

                <form onSubmit={handlePay} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Invoice BOLT11
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                      rows={3}
                      value={payBolt11}
                      onChange={(e) => setPayBolt11(e.target.value)}
                      placeholder="lnbc1... (invoice du bénéficiaire)"
                    />
                  </div>
                  {payError && (
                    <p className="text-xs text-red-500">{payError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={payLoading || !payBolt11.trim() || !isConnected}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 disabled:opacity-50 transition"
                  >
                    {payLoading ? 'Envoi en cours…' : 'Payer en sats'}
                  </button>
                </form>
              </div>

              {/* Historique */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">
                    Historique des transactions
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    Dernières opérations Lightning
                  </span>
                </div>

                {transactions.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucune transaction pour le moment.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-80 overflow-auto text-sm pr-1">
                    {transactions.map((tx) => (
                      <li
                        key={tx.id || `${tx.timestamp}-${tx.amount}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-amber-700">
                            {tx.amount} sats
                          </span>
                          {tx.timestamp && (
                            <span className="text-[11px] text-slate-500">
                              {new Date(tx.timestamp * 1000).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {tx.description && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {tx.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Colonne droite : recevoir + QR */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Recevoir des fonds
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                    Générer une invoice
                  </span>
                </div>

                <form onSubmit={handleReceive} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Montant à recevoir (sats, optionnel)
                    </label>
                    <input
                      type="number"
                      min={0}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/60"
                      value={recvAmount}
                      onChange={(e) => setRecvAmount(e.target.value)}
                      placeholder="0 pour amountless"
                    />
                  </div>
                  {recvError && (
                    <p className="text-xs text-red-500">{recvError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={recvLoading || !isConnected}
                    className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-400 disabled:opacity-50 transition"
                  >
                    {recvLoading ? 'Création…' : 'Générer une invoice'}
                  </button>
                </form>

                {currentInvoice && (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        ref={qrWrapperRef}
                        className="rounded-2xl bg-white p-3 shadow-lg"
                      >
                        <QRCode
                          value={qrValue}
                          size={200}
                          bgColor="#FFFFFF"
                          fgColor="#020617"
                          level="M"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCopyInvoice}
                          className="text-[11px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:border-slate-400"
                        >
                          Copier l’invoice
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadQr}
                          className="text-[11px] rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700 hover:border-slate-400"
                        >
                          Télécharger le QR
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 text-center max-w-xs">
                        Scanne ce QR avec un wallet Lightning compatible pour
                        payer cette invoice.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Montant détecté :{' '}
                        <span className="font-mono text-amber-700">
                          {linkedAmount ?? 'inconnu / amountless'} sats
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Invoice BOLT11
                      </label>
                      <textarea
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-900 break-all"
                        rows={4}
                        readOnly
                        value={currentInvoice}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={clearLinkedInvoice}
                      className="text-[11px] text-slate-500 hover:text-slate-700 underline underline-offset-4"
                    >
                      Effacer l’invoice
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
