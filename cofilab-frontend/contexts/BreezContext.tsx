'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { getBreezSdk, isBreezInitialized } from '@/lib/breez'
import bolt11 from 'bolt11'

interface Balance {
  sats: number
  fiat: number
}

interface Transaction {
  id?: string
  amount: number
  description: string
  timestamp?: number
}

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
  linkedInvoice: string | null
  linkedAmount: number | null
  setLinkedInvoice: (invoice: string | null) => void
  clearLinkedInvoice: () => void
}

const BreezContext = createContext<BreezContextType | undefined>(undefined)

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export const BreezProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [balance, setBalance] = useState<Balance>({ sats: 0, fiat: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const initializingRef = useRef(false)
  const maxRetries = 3
  const baseDelayMs = 500

  const [linkedInvoice, setLinkedInvoiceState] = useState<string | null>(null)
  const [linkedAmount, setLinkedAmount] = useState<number | null>(null)

  function decodeBolt11Amount(invoice: string): number | undefined {
    try {
      const decoded = bolt11.decode(invoice)
      if (decoded.satoshis) return Number(decoded.satoshis)
      if (decoded.millisatoshis)
        return Math.floor(Number(decoded.millisatoshis) / 1000)
    } catch {
      // ignore
    }
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

  async function loadWalletData(sdk: any) {
    const info = await sdk.getInfo()
    const walletInfo = info.walletInfo
    setBalance({
      sats:
        walletInfo?.balanceSat ??
        info.balances?.sat ??
        info.balances?.liquidSat ??
        0,
      fiat: 0,
    })

    const txs = await sdk.listPayments({})

    setTransactions(
      (txs || []).map((tx: any) => ({
        id: tx.id,
        amount: Math.abs(tx.amountSat ?? tx.amountSats ?? tx.amount ?? 0),
        description:
          tx.details?.description || tx.comment || tx.description || '',
        timestamp: tx.timestamp,
      })),
    )
  }

  const initSdkWithRetry = async () => {
    if (initializingRef.current) return
    if (!isBreezInitialized()) return // rien à faire si pas encore connecté par mnemonic

    initializingRef.current = true
    setLoading(true)
    setError(null)

    for (let i = 0; i <= maxRetries; i++) {
      setAttempt(i + 1)
      try {
        const sdk = await getBreezSdk()
        await loadWalletData(sdk)

        setIsConnected(true)
        setError(null)
        console.info('✅ Breez SDK connecté et données chargées')
        break
      } catch (err: any) {
        const message = err?.message || String(err)
        console.warn(`Breez init attempt ${i + 1} failed:`, message)
        setError(message)
        setIsConnected(false)

        if (i === maxRetries) {
          console.error('Breez init: max retries reached')
          break
        }

        const delay =
          baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 200)
        await sleep(delay)
      }
    }

    setLoading(false)
    initializingRef.current = false
  }

  useEffect(() => {
    // au mount, on tente de charger seulement si un SDK existe déjà (ex: après reload)
    initSdkWithRetry()
  }, [])

  const refreshData = async () => {
    if (!isBreezInitialized()) return

    try {
      const sdk = await getBreezSdk()
      await loadWalletData(sdk)
      setIsConnected(true)
    } catch (err) {
      console.error('Breez refreshData error:', err)
      setIsConnected(false)
      throw err
    }
  }

  const payInvoice = async (invoice: string) => {
    const sdk = await getBreezSdk()
    if (!sdk) throw new Error('Breez SDK non initialisé.')

    try {
      const prepare = await sdk.prepareSendPayment({
        destination: invoice,
      })

      await sdk.sendPayment({
        prepareResponse: prepare,
      })

      await refreshData()
    } catch (err) {
      console.error('Breez payInvoice error:', err)
      throw err
    }
  }

  const receiveInvoice = async (amountSat = 0) => {
    const sdk = await getBreezSdk()
    if (!sdk) throw new Error('Breez SDK non initialisé.')

    try {
      const prepare = await sdk.prepareReceivePayment({
        paymentMethod: 'lightning',
        amount:
          amountSat > 0
            ? { type: 'bitcoin', payerAmountSat: amountSat }
            : undefined,
      })

      const res = await sdk.receivePayment({
        prepareResponse: prepare,
      })

      await refreshData()
      return res.destination || ''
    } catch (err) {
      console.error('Breez receiveInvoice error:', err)
      throw err
    }
  }

  return (
    <BreezContext.Provider
      value={{
        isConnected,
        loading,
        error,
        attempt,
        balance,
        transactions,
        refreshData,
        payInvoice,
        receiveInvoice,
        linkedInvoice,
        linkedAmount,
        setLinkedInvoice,
        clearLinkedInvoice,
      }}
    >
      {children}
    </BreezContext.Provider>
  )
}

export const useBreez = () => {
  const context = useContext(BreezContext)
  if (!context) throw new Error('useBreez doit être utilisé dans BreezProvider')
  return context
}
