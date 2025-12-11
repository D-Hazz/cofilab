'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

import { auth } from '@/services/api' // ✅ Importe l'objet 'auth'

// ...

export default function LnurlLoginPage() {
  const [challenge, setChallenge] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  const handleChallenge = async () => {
    // Utilisez 'auth.getChallenge()' au lieu de 'lnurl.getChallenge()'
    const res = await auth.getChallenge() 
    setChallenge(res.k1)
  }

  const handleVerify = async () => {
    const k1 = challenge
    const sig = prompt('Signature (sig):')
    const key = prompt('Public key:')
    if (!sig || !key) return
    // Utilisez 'auth.verify()' au lieu de 'lnurl.verify()'
    const res = await auth.verify(k1!, sig, key) 
    if (res.token) setVerified(true)
  }

   return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">LNURL Login</h1>

      {!challenge && !verified && (
        <Button onClick={handleChallenge}>Générer challenge LNURL</Button>
      )}

      {challenge && !verified && (
        <div className="space-y-3 text-center">
          <p className="text-sm text-gray-500">
            Challenge : <code>{challenge}</code>
          </p>
          <Button onClick={handleVerify}>Vérifier signature</Button>
        </div>
      )}

      {verified && (
        <p className="text-green-600 font-medium">
          ✅ Authentification réussie !
        </p>
      )}
    </div>
  )

}

 
