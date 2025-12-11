// src/app/_components/InviteModal.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { projects as projectsService, invitations as invitationService } from '@/services/api'
import React from 'react'

type Props = {
  recipientId: number
  recipientUsername: string
  onClose: () => void
}

export default function InviteModal({ recipientId, recipientUsername, onClose }: Props) {
  const [projects, setProjects] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingProjectId, setSendingProjectId] = useState<number | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await projectsService.list()
        if (mounted) setProjects(data)
      } catch (e) {
        if (mounted) setError('Impossible de charger les projets')
      }
    })()
    return () => { mounted = false }
  }, [])

  const sendInvite = async (projectId: number) => {
    setSendingProjectId(projectId)
    try {
      await invitationService.invite(projectId, recipientId)
      alert(`Invitation envoyée à ${recipientUsername}`)
      onClose()
    } catch (err: any) {
      console.error(err)
      const msg = err?.detail || err?.message || 'Erreur lors de l\'invitation'
      alert(msg)
    } finally {
      setSendingProjectId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Inviter {recipientUsername} à rejoindre un projet</h2>

        {error && <p className="text-red-500">{error}</p>}

        {!projects && <p className="text-gray-500">Chargement...</p>}

        {projects && projects.length === 0 && <p className="text-gray-500">Aucun projet disponible.</p>}

        <div className="space-y-3 max-h-64 overflow-auto">
          {projects?.map((p: any) => (
            <div key={p.id} className="p-3 rounded-lg border flex justify-between items-center hover:bg-gray-100 cursor-pointer">
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p className="text-sm text-gray-600">{p.description}</p>
              </div>
              <div>
                <Button
                  onClick={() => sendInvite(p.id)}
                  disabled={sendingProjectId === p.id}
                >
                  {sendingProjectId === p.id ? 'Envoi...' : 'Inviter'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  )
}
