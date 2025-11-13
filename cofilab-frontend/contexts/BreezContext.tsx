'use client'

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { getBreezSdk } from '@/lib/breez'
import bolt11 from 'bolt11'

interface Balance { sats: number; fiat: number }
interface Transaction { id?: string; amount: number; description: string; timestamp?: number }

interface BreezContextType {
  isConnected: boolean
  loading: boolean
  error: string | null
  attempt: number
  balance: Balance
  transactions: Transaction[]
  refreshData: () => Promise<void>
  payInvoice: (invoice: string) => Promise<void>
  receiveInvoice: (amountSat?: number) => Promise<string>
  // New
  linkedInvoice: string | null
  linkedAmount: number | null
  setLinkedInvoice: (invoice: string | null) => void
  clearLinkedInvoice: () => void
}

const BreezContext = createContext<BreezContextType | undefined>(undefined)

function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)) }

export const BreezProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [balance, setBalance] = useState<Balance>({ sats: 0, fiat: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const initializingRef = useRef(false)
  const maxRetries = 5
  const baseDelayMs = 800

  // linked invoice state
  const [linkedInvoice, setLinkedInvoiceState] = useState<string | null>(null)
  const [linkedAmount, setLinkedAmount] = useState<number | null>(null)

  function decodeBolt11Amount(invoice: string): number | undefined {
    try {
      const decoded = bolt11.decode(invoice)
      if (decoded.satoshis) return Number(decoded.satoshis)
      if (decoded.millisatoshis) return Math.floor(Number(decoded.millisatoshis) / 1000)
    } catch { /* ignore */ }
    return undefined
  }

  const setLinkedInvoice = (invoice: string | null) => {
    if (!invoice) {
      setLinkedInvoiceState(null)
      setLinkedAmount(null)
      return
    }
    setLinkedInvoiceState(invoice)
    const amt = decodeBolt11Amount(invoice)
    setLinkedAmount(typeof amt === 'number' ? amt : null)
  }

  const clearLinkedInvoice = () => setLinkedInvoice(null)

  const initSdkWithRetry = async () => {
    if (initializingRef.current) return
    initializingRef.current = true
    setLoading(true)
    setError(null)

    for (let i = 0; i <= maxRetries; i++) {
      setAttempt(i + 1)
      try {
        const sdk = await getBreezSdk()
        if (!sdk) throw new Error('Breez SDK non retourné')
        const info = await sdk.nodeInfo?.()
        setBalance({ sats: info?.balances?.sat ?? 0, fiat: 0 })
        const txs = (await sdk.listPayments?.()) || []
        setTransactions(txs.map((tx: any) => ({
          id: tx.id, amount: tx.amountSats, description: tx.comment || tx.description || '', timestamp: tx.timestamp
        })))
        setIsConnected(true); setError(null)
        break
      } catch (err: any) {
        const message = err?.message || String(err)
        console.warn(`Breez init attempt ${i + 1} failed:`, message)
        setError(message); setIsConnected(false)
        if (i === maxRetries) { console.error('Breez init: max retries reached'); break }
        const delay = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random()*200)
        await sleep(delay)
      }
    }

    setLoading(false)
    initializingRef.current = false
  }

  useEffect(() => { initSdkWithRetry() }, [])

  const refreshData = async () => {
    try {
      const sdk = await getBreezSdk()
      if (!sdk) return
      const info = await sdk.nodeInfo?.()
      setBalance({ sats: info?.balances?.sat ?? 0, fiat: 0 })
      const txs = (await sdk.listPayments?.()) || []
      setTransactions(txs.map((tx: any) => ({
        id: tx.id, amount: tx.amountSats, description: tx.comment || tx.description || '', timestamp: tx.timestamp
      })))
    } catch (err) { console.error('Breez refreshData error:', err); throw err }
  }

  const payInvoice = async (invoice: string) => {
    const sdk = await getBreezSdk()
    if (!sdk) throw new Error('Breez SDK non initialisé.')
    try { await sdk.payInvoice?.({ bolt11: invoice }); await refreshData() } catch (err) { console.error('Breez payInvoice error:', err); throw err }
  }

  const receiveInvoice = async (amountSat = 0) => {
    const sdk = await getBreezSdk()
    if (!sdk) throw new Error('Breez SDK non initialisé.')
    try {
      const invoice = await sdk.receivePayment?.({ amountSats: amountSat })
      await refreshData()
      return invoice?.bolt11 ?? invoice
    } catch (err) { console.error('Breez receiveInvoice error:', err); throw err }
  }

  return (
    <BreezContext.Provider value={{
      isConnected, loading, error, attempt, balance, transactions,
      refreshData, payInvoice, receiveInvoice,
      linkedInvoice, linkedAmount, setLinkedInvoice, clearLinkedInvoice
    }}>
      {children}
    </BreezContext.Provider>
  )
}

export const useBreez = () => {
  const context = useContext(BreezContext)
  if (!context) throw new Error('useBreez doit être utilisé dans BreezProvider')
  return context
}
