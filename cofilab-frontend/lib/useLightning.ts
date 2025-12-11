// lib/useLightning.ts
import { useState } from "react"
import { lightning } from "@/services/lightning"

export function useLightning() {
  const [loading, setLoading] = useState(false)

  /**
   * Crée une facture de FINANCEMENT.
   */
  const createFundingInvoice = async (amount_sats: number, project_id: number) => {
    setLoading(true)
    try {
      // Appelle la fonction correspondante dans le service
      return await lightning.createInvoice({ amount_sats, project_id })
    } finally {
      setLoading(false)
    }
  }
  
  /**
   * Crée une facture de PAIEMENT de tâche.
   */
  const createPaymentInvoice = async (amount_sats: number, task_id: number) => {
    setLoading(true)
    try {
      // Appelle la fonction correspondante dans le service
      return await lightning.createTaskInvoice({ amount_sats, task_id })
    } finally {
      setLoading(false)
    }
  }


  /**
   * Vérifie la facture de FINANCEMENT.
   */
  const checkFundingInvoice = async (invoice_id: string) => {
    return lightning.checkFunding(invoice_id)
  }

  /**
   * Vérifie la facture de PAIEMENT de tâche.
   */
  const checkTaskInvoice = async (invoice_id: string) => {
    return lightning.checkTaskPayment(invoice_id)
  }

  /**
   * Récupère l'historique des paiements de l'utilisateur.
   */
  const history = async (user_id: number) => { 
    return lightning.history(user_id)
  }

  return { 
      loading, 
      createFundingInvoice, 
      createPaymentInvoice, // Ajout de la création de facture de paiement
      checkFundingInvoice, 
      checkTaskInvoice, 
      history 
  }
}