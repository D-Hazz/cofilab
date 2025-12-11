'use client'

import { useEffect, useState } from 'react'
import { notificationsApi } from '@/services/api'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NotificationsModalProps {
  open: boolean
  onClose: () => void
}

export default function NotificationsModal({ open, onClose }: NotificationsModalProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return

    let mounted = true

    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const res = await notificationsApi.list()
        if (mounted) setItems(res)
      } catch (error: any) {
        console.error('Erreur notifications modal:', error.detail || error.message || error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [open])

  const markAsRead = async (id: number) => {
    await notificationsApi.markRead(id)
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-4 relative">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Notifications</h2>

        {loading ? (
          <p className="text-gray-500">Chargement...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-600">Aucune nouvelle notification.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-lg border ${
                  notif.read ? 'bg-gray-100' : 'bg-[#f8fafc]'
                }`}
              >
                <div className="font-medium">{notif.title || 'Notification'}</div>
                <div className="text-sm text-gray-600">{notif.message}</div>

                {!notif.read && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => markAsRead(notif.id)}
                  >
                    Marquer comme lu
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
