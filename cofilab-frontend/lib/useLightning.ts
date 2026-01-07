// cofilab-frontend/lib/useLightning.ts
'use client'

import { useState } from 'react'
import { payLightningAddress } from '@/lib/breez'
import { createFunding, verifyPayment, payTask, confirmFunding  } from '@/services/funding'
import { useBreez } from '@/contexts/BreezContext'

// ---------- Types ----------

export interface FundingPayload {
  project_id: number
  wallet_address: string
  amount_sats: number
  is_anonymous?: boolean
  is_amount_public?: boolean
}

interface PayToProjectArgs {
  projectId: number
  amountSats: number
  walletAddress: string // wallet PROJET (Lightning address ou lnurl)
}

interface CreateProjectFundingInvoiceArgs {
  projectId: number
  amountSats: number
  projectWalletAddress?: string | null
}


// ---------- Helpers ----------

function looksLikeLightningAddress(addr: string | null | undefined): boolean {
  if (!addr) return false
  const trimmed = addr.trim()
  if (!trimmed) return false

  return (
    trimmed.includes('@') || // Lightning Address BIP353
    trimmed.toLowerCase().startsWith('lnurl') ||
    trimmed.toLowerCase().startsWith('lightning:')
  )
}

// ---------- Hook PRINCIPAL ----------

export function useLightning() {
  const [loading, setLoading] = useState(false)
  const { isConnected, receiveInvoice } = useBreez()

  // ---- Compat legacy : création invoice paiement tâche ----
  const createPaymentInvoice = async (amount_sats: number, task_id: number) => {
    setLoading(true)
    try {
      // userid=0 : système / user courant côté API
      return await payTask({ taskid: task_id, userid: 0 })
    } finally {
      setLoading(false)
    }
  }

  const checkTaskInvoice = async (invoice_id: string) => {
    return verifyPayment(invoice_id)
  }

  const history = async (_user_id: number) => {
    return []
  }

  // ---------- FLUX 1 : Breez paie une Lightning address / LNURL ----------

  // /cofilab-frontend/lib/useLightning.ts (extrait)

  const payToProject = async ({
    projectId,
    amountSats,
    walletAddress,
  }: PayToProjectArgs) => {
    setLoading(true)
    try {
      console.log('🚀 [useLightning] Paiement Breez → Projet:', {
        projectId,
        amountSats,
        walletAddress,
      })

      const trimmed = (walletAddress ?? '').trim()
      if (!trimmed) {
        throw new Error('Wallet address du projet vide.')
      }

      if (!looksLikeLightningAddress(trimmed)) {
        console.warn(
          "⚠️ Adresse ne ressemble pas à une Lightning Address/LNURL, tentative quand même via Breez:",
          trimmed,
        )
      }

      // 1️⃣ Payer via Breez (LNURL / Lightning Address)
      const payment = await payLightningAddress(
        trimmed,
        amountSats,
        `Funding Project ${projectId}`,
      )

      console.log('✅ [BREEZ] Paiement retourné:', payment)

      const txId = payment.tx_id || payment.payment_hash || `tx_${Date.now()}`
      const proofHash =
        payment.payment_hash ||
        payment.tx_id ||
        `proof_${projectId}_${Date.now()}`

      // 2️⃣ Enregistrer le funding côté backend avec montant reçu + fees
      console.log('📝 [BACKEND] Enregistrement funding...')
      const fundingRecord = await createFunding({
        project_id: projectId,
        wallet_address: walletAddress,
        amount_sats: payment.amount_sats,  // montant effectivement reçu par le projet
        
        fees_sats: payment.fees_sats ?? 0, // nouveau champ, optionnel
        tx_id: txId,
        proof_hash: proofHash,
        is_anonymous: false,
        is_amountpublic: true,
      })

      console.log('✅ [BACKEND] Funding enregistré:', fundingRecord)
      // 2️⃣ Confirmer pour passer à PAID + MAJ budget
      await confirmFunding(fundingRecord.id, txId)
      return fundingRecord
    } catch (error: any) {
      console.error('❌ Erreur payToProject (useLightning):', error)
      throw error
    } finally {
      setLoading(false)
    }
  }


  // ---------- FLUX 2 : Générer une vraie invoice BOLT11 pour funding ----------

  const createProjectFundingInvoice = async ({
    projectId,
    amountSats,
    projectWalletAddress,
  }: CreateProjectFundingInvoiceArgs) => {
    if (!isConnected) {
      throw new Error('Wallet Breez non connecté.')
    }

    console.log(
      '[useLightning] createProjectFundingInvoice args =',
      projectId,
      amountSats,
      projectWalletAddress,
    )

    if (!amountSats || amountSats <= 0) {
      throw new Error('Montant invalide.')
    }

    const walletAddrToStore = (projectWalletAddress ?? '').trim()
    if (!walletAddrToStore) {
      // ton backend semble exiger wallet_address non vide
      throw new Error(
        "Wallet du projet manquant. Configure 'funding_wallet_address' dans l'admin projet.",
      )
    }

    setLoading(true)
    try {
      // 1️⃣ Générer l’invoice réelle via Breez (BOLT11)
      const invoice = await receiveInvoice(amountSats)

      // 2️⃣ Créer le funding en BD avec status = waiting_payment (à gérer côté API)
      const fundingRecord = await createFunding({
        project_id: projectId,
        wallet_address: walletAddrToStore, // on met le wallet du projet
        amount_sats: amountSats,
        proof_hash: invoice,               // on stocke l’invoice comme “preuve”
        tx_id: null,                       // backend peut l’ignorer pour waiting_payment
        is_anonymous: false,
        is_amountpublic: true,
      })

      console.log('✅ [BACKEND] Funding + invoice créés:', fundingRecord)
      return { invoice, fundingRecord }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    isConnected,
    createPaymentInvoice,
    checkTaskInvoice,
    history,
    payToProject,                // mode “je paie direct la Lightning address”
    createProjectFundingInvoice, // mode “je génère une facture à payer (BOLT11)”
  }
}
