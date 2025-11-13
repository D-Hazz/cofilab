// src/components/LNAuthButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { lnurl } from '@/services/api'
import { QRCodeCanvas as QRCode } from 'qrcode.react' 
// Importation de la fonction d'encodage Bech32
import { encodeLnurl } from '@/utils/lnurl' 

// 🌟 CHANGEMENT MAJEUR: L'URL est désormais l'endpoint de base du challenge,
// SANS les paramètres ?tag=login&k1=...
const LN_AUTH_BASE_URL = 'https://rich-monkeys-cross.loca.lt/' 
// Retirez les slashs s'ils reviennent : https://kind-bottles-live.loca.lt/api/lnurl/challenge

export default function LNAuthButton() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startAuth = async () => {
    setLoading(true)
    setError(null)
    setQrCodeUrl(null)
    
    try {
      // 1. L'appel local au backend pour le k1 n'est plus nécessaire ici.
      // Le wallet s'en charge. On encode directement l'URL de base.

      // 2. 💡 CHANGEMENT: Encoder l'URL de base (SANS ?k1)
      const encodedLnurl = encodeLnurl(LN_AUTH_BASE_URL)
      
      setQrCodeUrl(encodedLnurl)
      
      alert("Veuillez scanner le QR code. Format LNURL-Auth strict appliqué.")

    } catch (e) {
      console.error(e)
      // On garde l'ancien appel ici pour le cas où l'encodage échoue, mais il ne sera pas exécuté.
      setError("Erreur lors de la préparation du QR code.")
    } finally {
      setLoading(false)
    }
  }

  if (qrCodeUrl) {
    return (
      <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
        <p className="mb-2 text-sm text-gray-700">Scanner pour vous connecter avec Lightning. Code: <code className="font-bold">{qrCodeUrl.substring(0, 20)}...</code></p>
        
        {/* Le code QR encode la chaîne Bech32 (lnurl1...) */}
        <QRCode value={qrCodeUrl} size={256} level="L" /> 
        
        <Button onClick={() => setQrCodeUrl(null)} className="mt-4" variant="secondary">
            Annuler / Recommencer
        </Button>
        {error && <p className="text-red-500 mt-2 font-medium">{error}</p>}
      </div>
    )
  }

  return (
    <Button onClick={startAuth} disabled={loading}>
      {loading ? 'Chargement...' : 'Se connecter via LNURL'}
    </Button>
  )
}