'use client'

import { useEffect, useState, useMemo } from 'react'
import { invitations } from '@/services/api'
import Sidebar from '@/app/_components/Sidebar'
import Header from '@/app/_components/Header'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import { Mail, Send } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InvitationsPage() {
  const [received, setReceived] = useState<any[]>([])
  const [sent, setSent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const receivedInv = await invitations.listReceived()
        const sentInv = await invitations.listSent()

        if (!mounted) return

        setReceived(receivedInv)
        setSent(sentInv)
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const handleAccept = async (id: number) => {
    try {
      await invitations.accept(id)
      setReceived(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'accepted' } : i))
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleReject = async (id: number) => {
    try {
      await invitations.reject(id)
      setReceived(prev =>
        prev.map(i => (i.id === id ? { ...i, status: 'rejected' } : i))
      )
    } catch (e) {
      console.error(e)
    }
  }

  const filterItems = (items: any[]) =>
    items.filter(inv => {
      const project = inv.project?.name?.toLowerCase() || ''
      const sender = inv.sender?.username?.toLowerCase() || ''
      const recipient = inv.recipient?.username?.toLowerCase() || ''

      return (
        project.includes(search.toLowerCase()) ||
        sender.includes(search.toLowerCase()) ||
        recipient.includes(search.toLowerCase())
      )
    })

  const filteredReceived = useMemo(() => filterItems(received), [search, received])
  const filteredSent = useMemo(() => filterItems(sent), [search, sent])

  if (loading) return <div className="p-6 text-gray-600">Chargement...</div>

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header title="Invitations" />

        <div className="p-6 overflow-y-auto">
          <div className="max-w-lg mb-6">
            <Input
              placeholder="Rechercher une invitation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Tabs defaultValue="received" className="w-full">

            {/* TABS HEADER */}
            <TabsList className="mb-6">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Reçues ({received.length})
              </TabsTrigger>

              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Envoyées ({sent.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB – RECEIVED */}
            <TabsContent value="received">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Invitations reçues
              </h2>

              {filteredReceived.length === 0 ? (
                <p className="text-gray-500">Aucune invitation trouvée.</p>
              ) : (
                <div className="space-y-4">
                  {filteredReceived.map((inv, index) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white shadow rounded-xl p-4 flex justify-between items-start border"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">{inv.project?.name}</div>

                        <div className="text-sm text-gray-600">
                          De : <span className="font-medium">{inv.sender?.username}</span>
                        </div>

                        <Badge
                          variant={
                            inv.status === 'pending'
                              ? 'secondary'
                              : inv.status === 'accepted'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>

                      {inv.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handleAccept(inv.id)}>Accepter</Button>
                          <Button variant="outline" onClick={() => handleReject(inv.id)}>
                            Refuser
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB – SENT */}
            <TabsContent value="sent">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Invitations envoyées
              </h2>

              {filteredSent.length === 0 ? (
                <p className="text-gray-500">Aucune invitation trouvée.</p>
              ) : (
                <div className="space-y-4">
                  {filteredSent.map((inv, index) => (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white shadow rounded-xl p-4 flex justify-between items-start border"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">{inv.project?.name}</div>

                        <div className="text-sm text-gray-600">
                          À :{' '}
                          <span className="font-medium">{inv.recipient?.username}</span>
                        </div>

                        <Badge
                          variant={
                            inv.status === 'pending'
                              ? 'secondary'
                              : inv.status === 'accepted'
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
