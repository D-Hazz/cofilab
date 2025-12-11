// services/lightning.ts
import api from "./api"

export const lightning = {

  /**
   * Crée une facture Lightning (LN) pour le **FINANCEMENT** d'un projet (API: /funding/create-invoice/).
   * @param payload - { amount_sats: nombre de satoshis, project_id: ID du projet }
   * @returns { invoice: string (bolt11), invoice_id: string }
   */
  async createInvoice(payload: { amount_sats: number; project_id: number }) {
    if (payload.amount_sats <= 0) {
      throw new Error("Le montant doit être supérieur à zéro.")
    }

    const res = await api.post("/payments/funding/create-invoice/", {
      amount_sats: payload.amount_sats,
      project_id: payload.project_id 
    })

    return {
      invoice: res.data.invoice,
      invoice_id: res.data.invoice_id
    }
  },

  /**
   * Crée une facture Lightning (LN) pour le **PAIEMENT** d'une tâche (API: /payments/create-invoice/).
   * @param payload - { amount_sats: nombre de satoshis, task_id: ID de la tâche }
   * @returns { invoice: string (bolt11), invoice_id: string }
   */
  async createTaskInvoice(payload: { amount_sats: number; task_id: number }) {
    if (payload.amount_sats <= 0) {
      throw new Error("Le montant doit être supérieur à zéro.")
    }

    // Appel à l'API /payments/ avec task_id
    const invoiceRes = await api.post("/payments/create-invoice/", {
      amount_sats: payload.amount_sats,
      task_id: payload.task_id 
    }).then(r => r.data)

    return { 
      invoice: invoiceRes.ln_invoice, 
      invoice_id: invoiceRes.ln_invoice // L'ID de la facture est souvent la facture elle-même dans certains backends
    }
  },

  /**
   * Vérifie le statut d'une facture de **FINANCEMENT** (API: /funding/verify/).
   * @param invoice_id - ID unique de la facture.
   * @returns { status: "pending" | "settled" | ... }
   */
  async checkFunding(invoice_id: string) {
    const res = await api.get(`payments/funding/verify/${invoice_id}/`)
    return res.data.status
  },

  /**
   * Vérifie le statut d'une facture de **PAIEMENT** de tâche (API: /payments/verify-payment/).
   * @param invoice_id - ID unique de la facture.
   * @returns { status: "pending" | "paid" | ... }
   */
  async checkTaskPayment(invoice_id: string) {
    const res = await api.get(`/payments/verify-payment/${invoice_id}/`)
    return res.data.status
  },

  /**
   * Récupère l'historique des **PAIEMENTS** (API: /payments/payment-history/).
   * @param user_id - ID de l'utilisateur.
   * @returns Liste des transactions.
   */
  history(user_id: number) {
     return api.get(`/payments/payment-history/${user_id}/`)
       .then(r => r.data)
  },
}