// /cofilab-frontend/services/funding.ts
'use client'

import api from './api'

// ---------- Types ----------
export interface CreateFundingInvoicePayload {
  project_id: number
  amount_sats: number
  wallet_address?: string
  is_anonymous?: boolean
  is_amountpublic?: boolean
  fees_sats?: number
  status?: string
  tx_id?: string | null
  proof_hash?: string | null
}

export interface FundingPayload {
  project_id: number
  wallet_address: string
  amount_sats: number
  tx_id?: string | null
  proof_hash?: string | null
  is_anonymous?: boolean
  is_amountpublic?: boolean
  fees_sats?: number  
  status?: string
}

// ---------- Funding projets (NOUVEAU FLUX) ----------
export async function createFunding(payload: FundingPayload) {
  console.log('📝 [API] createFunding payload:', payload)
  const res = await api.post('/payments/funding/', payload)
  return res.data
}

// ---------- Paiements de tâches (inchangés) ----------
export async function payTask(payload: { taskid: number; userid: number }) {
  const res = await api.post('/payments/pay-task/', payload)
  return res.data
}

export async function verifyPayment(invoiceId: string) {
  const res = await api.get(`/payments/verify/${invoiceId}/`)
  return res.data
}

// ---------- Anciennes fonctions (compatibilité, pas utilisées dans le nouveau flux) ----------
export async function createFundingInvoice(payload: CreateFundingInvoicePayload) {
  console.warn('createFundingInvoice deprecated, utiliser le nouveau flux Breez → funding')
  return {
    invoice: 'lnbc1000n1p_mock_invoice',
    invoice_id: 'mock_invoice_id',
    funding_id: 999,
  }
}

export async function verifyFundingPayment(invoiceId: string) {
  console.warn('verifyFundingPayment deprecated, utiliser le nouveau flux')
  return { status: 'settled' }
}

// ---------- Compatibilité projets ----------
export async function generateProjectInvoice(projectId: number, amountSats: number) {
  const res = await api.post(`/projects/${projectId}/invoice/`, {
    project_id: projectId,
    amount_sats: amountSats,
  })
  return res.data
}

// ---------- Listes / Stats ----------
export async function getProjectFundings(projectId: number) {
  const res = await api.get(`/payments/project-fundings/${projectId}/`)
  return res.data
}

export async function getUserFundings(userId?: number) {
  const endpoint = userId
    ? `/payments/user-fundings/${userId}/`
    : '/payments/user-fundings/me/'
  const res = await api.get(endpoint)
  return res.data
}

// /cofilab-frontend/services/funding.ts
export async function confirmFunding(fundingId: number, txId: string) {
  const res = await api.post('/payments/funding/confirm/', {
    payment_id: fundingId, // ConfirmPaymentSerializer.payment_id
    tx_id: txId,
  })
  return res.data
}
