'use client'

import { useState } from 'react'
import api from '@/services/api'
import { useRouter } from 'next/navigation'

export default function LnurlLoginPage() {
  const [pubkey, setPubkey] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!pubkey) return alert("Saisir votre pubkey LNURL")
    setLoading(true)
    try {
      const challengeRes = await api.get(`/lnurl/challenge/`)
      const k1 = challengeRes.data.k1
      // placeholder signature: sha256(k1 + pubkey)
      const sig = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(k1 + pubkey)
      ).then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''))

      const verifyRes = await api.post('/lnurl/verify/', { k1, pubkey, sig })
      const { access } = verifyRes.data
      localStorage.setItem('access_token', access)
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`
      alert("Connexion réussie !")
      router.push('/projects')
    } catch (err) {
      console.error(err)
      alert("Erreur LNURL login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex h-screen items-center justify-center bg-gray-50">
      <div className="p-6 bg-white rounded-xl shadow-md flex flex-col gap-4 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center">Connexion LNURL</h1>
        <input
          type="text"
          placeholder="Pubkey LNURL"
          value={pubkey}
          onChange={e => setPubkey(e.target.value)}
          className="border p-2 rounded-md w-full"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </div>
    </main>
  )
}
