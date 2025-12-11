'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (res.ok && data.access) {
        localStorage.setItem('token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        onClose()
        window.location.reload()
      } else {
        setError(data.detail || "Nom d'utilisateur ou mot de passe incorrect.")
      }
    } catch {
      setError('Erreur de connexion au serveur.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-6 rounded-xl shadow-lg w-96"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h2 className="text-xl font-bold text-center mb-4">Connexion</h2>
            <form onSubmit={handleLogin}>
              <Input
                type="text"
                placeholder="Nom d’utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mb-3"
                required
              />
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mb-3"
                required
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <Button type="submit" className="w-full bg-orange-500" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
            <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700 w-full">
              Fermer
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
