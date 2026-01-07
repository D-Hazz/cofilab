'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Paperclip,
  SendHorizontal,
  MoveDown,
  Download,
  Maximize2,
  X,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Sidebar from '@/app/_components/Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { taskChannels } from '@/services/taskChannels'

type MessageRole = 'manager' | 'executant' | 'system' | 'other'

interface TaskMessage {
  id: number
  sender_id: number
  sender_username: string
  sender_role?: string
  message_type: 'text' | 'file' | 'image' | 'link'
  text?: string
  file?: string
  image?: string
  link?: string
  created_at: string
  is_system?: boolean
}

interface TaskChannel {
  id: number
  task_title: string
  messages: TaskMessage[]
  created_at: string
}

/* ---------- Header ---------- */
function Header({
  title,
  onScrollToBottom,
}: {
  title: string
  onScrollToBottom: () => void
}) {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="p-4 border-b bg-white shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-full shrink-0"
          aria-label="Retour"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">
            {title || 'Canal de communication'}
          </h1>
          {title && (
            <p className="text-xs text-gray-500 truncate">
              Canal de communication de la tâche
            </p>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-full shrink-0"
        aria-label="Aller en bas"
        onClick={onScrollToBottom}
      >
        <MoveDown className="h-4 w-4" />
      </Button>
    </div>
  )
}

/* ---------- Contenu du canal ---------- */
function TaskChannelContent({
  channel,
  setChannel,
}: {
  channel: TaskChannel | null
  setChannel: (c: TaskChannel | null) => void
}) {
  const { taskId } = useParams()
  const { user } = useAuth()
  const currentUserId: number | null = user?.id ?? null

  const [inputValue, setInputValue] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isUrl = (value: string) => {
    if (!value.trim()) return false
    try {
      const maybeUrl =
        value.startsWith('http://') || value.startsWith('https://')
          ? value
          : `https://${value}`
      const u = new URL(maybeUrl)
      return !!u.hostname && u.hostname.includes('.')
    } catch {
      return false
    }
  }

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [])

  /* Chargement initial */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await taskChannels.retrieveByTask(Number(taskId))
        if (res.length > 0) {
          setChannel(res[0])
          setTimeout(scrollToBottom, 100)
        } else {
          setChannel({
            id: 0,
            messages: [],
            task_title: 'Pas de canal',
            created_at: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error(e)
        setChannel({
          id: 0,
          messages: [],
          task_title: 'Erreur chargement canal',
          created_at: new Date().toISOString(),
        })
      }
    }
    load()
  }, [taskId, setChannel, scrollToBottom])

  const refreshChannel = async () => {
    if (!channel?.id || channel.id === 0) return
    try {
      const updated = await taskChannels.retrieve(channel.id)
      setChannel(updated)
    } catch (e) {
      console.error('Erreur rafraîchissement canal', e)
    }
  }

  /* Polling léger */
  useEffect(() => {
    if (!channel?.id) return
    const interval = setInterval(() => {
      refreshChannel()
    }, 3000)
    return () => clearInterval(interval)
  }, [channel?.id])

  const send = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed && !file) return
    if (!channel?.id || channel.id === 0) return

    const data = new FormData()

    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 'file'
      data.append('message_type', type)
      if (type === 'image') {
        data.append('image', file)
      } else {
        data.append('file', file)
      }
    } else if (trimmed) {
      if (isUrl(trimmed)) {
        data.append('message_type', 'link')
        data.append('link', trimmed)
      } else {
        data.append('message_type', 'text')
        data.append('text', trimmed)
      }
    }

    try {
      await taskChannels.sendMessage(channel.id, data)
      setInputValue('')
      setFile(null)
      setShowPreview(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await refreshChannel()
      setTimeout(scrollToBottom, 100)
    } catch (e) {
      console.error('Erreur envoi message', e)
    }
  }

  const handleImageClick = useCallback((imageUrl: string) => {
    setFullscreenImage(imageUrl)
  }, [])

  const handleDownload = useCallback((fileUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  if (!channel) {
    return (
      <div className="flex items-center justify-center flex-1 bg-gray-50">
        Chargement du canal...
      </div>
    )
  }

  const messages = channel.messages ?? []

  const getRole = (m: TaskMessage): MessageRole => {
    if (m.is_system) return 'system'
    if (m.sender_role === 'manager') return 'manager'
    if (m.sender_role === 'executant' || m.sender_role === 'executor')
      return 'executant'
    return 'other'
  }

  const getBadgeLabel = (role: MessageRole) => {
    switch (role) {
      case 'manager':
        return 'Manager'
      case 'executant':
        return 'Exécutant'
      case 'system':
        return 'CoFiLab'
      default:
        return 'Collaborateur'
    }
  }

  /* Classes des bulles selon rôle + côté */
  const getBubbleClasses = (isMine: boolean, role: MessageRole) => {
    if (role === 'system') {
      return 'bg-cofilab-bitcoin text-white rounded-2xl px-4 py-3 mx-auto'
    }
    if (isMine) {
      // messages de l'utilisateur courant → à droite, couleur verte
      return 'bg-green-500 text-white rounded-2xl rounded-br-none px-4 py-3'
    }
    // autre participant → à gauche, gris
    return 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-3'
  }

  const getBadgeClasses = (role: MessageRole) => {
    switch (role) {
      case 'manager':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'executant':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'system':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  const getContainerClasses = (isMine: boolean, role: MessageRole) => {
    if (role === 'system') {
      return 'flex justify-center mb-3'
    }
    return `flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`
  }

  return (
    <>
      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-2 bg-gray-50"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <SendHorizontal className="h-8 w-8 text-orange-400" />
            </div>
            <p className="text-lg font-medium text-gray-600 mb-2">
              Aucun message
            </p>
            <p className="text-sm text-gray-500">
              Commencez la conversation en envoyant un message
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isMine = currentUserId !== null && m.sender_id === currentUserId
          const role = getRole(m)

          return (
            <div key={m.id} className={getContainerClasses(isMine, role)}>
              <div className="flex flex-col max-w-[75%]">
                {/* Infos auteur (à gauche uniquement, hors système) */}
                {!isMine && role !== 'system' && (
                  <div className="flex items-center gap-2 mb-1 ml-2">
                    <span className="text-xs font-medium text-gray-700">
                      {m.sender_username}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${getBadgeClasses(
                        role,
                      )}`}
                    >
                      {getBadgeLabel(role)}
                    </span>
                  </div>
                )}

                <div className={`${getBubbleClasses(isMine, role)} shadow-sm`}>
                  <div className="space-y-2 break-words">
                    {m.message_type === 'text' && (
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    )}

                    {m.message_type === 'file' && m.file && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {m.file.split('/').pop()}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                m.file!,
                                m.file.split('/').pop()!,
                              )
                            }
                            className="h-7 w-7 p-0 hover:bg-gray-100"
                            title="Télécharger"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <a
                          href={m.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline block"
                        >
                          Ouvrir dans un nouvel onglet
                        </a>
                      </div>
                    )}

                    {m.message_type === 'image' && m.image && (
                      <div className="relative">
                        <img
                          src={m.image}
                          className="max-w-full max-h-96 cursor-pointer rounded-lg border shadow-sm hover:shadow-md transition-shadow object-contain"
                          alt="Image envoyée"
                          onClick={() => handleImageClick(m.image!)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageClick(m.image!)
                          }}
                          title="Agrandir"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {m.message_type === 'link' && m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block px-3 py-2 rounded-lg ${
                          isMine ? 'bg-white/20' : 'bg-gray-200'
                        } hover:opacity-90 transition-opacity`}
                      >
                        <span className="text-sm underline break-all">
                          {m.link}
                        </span>
                      </a>
                    )}
                  </div>

                  <div
                    className={`flex ${
                      role === 'system' ? 'justify-center' : 'justify-end'
                    } mt-2 ${
                      isMine && role !== 'system'
                        ? 'text-white/80'
                        : 'text-gray-500'
                    }`}
                  >
                    <span className="text-xs">
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {role === 'system' && (
                  <div className="flex justify-center mt-1">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full ${getBadgeClasses(
                        role,
                      )}`}
                    >
                      {getBadgeLabel(role)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Zone input */}
      <div className="border-t bg-white px-4 py-3 shadow-lg">
        {file && (
          <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Prévisualisation"
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <Paperclip className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {file.type.startsWith('image/') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="h-8 border-blue-200 hover:bg-blue-50"
                  >
                    Prévisualiser
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-full border-gray-300 hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Ajouter un fichier"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />

          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Écrire un message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            className="flex-1 rounded-full border-gray-300 focus:border-green-500 focus:ring-green-500"
          />

          <Button
            type="button"
            size="icon"
            className="shrink-0 rounded-full bg-orange-500 hover:bg-orange-600"
            onClick={send}
            disabled={!inputValue.trim() && !file}
            aria-label="Envoyer le message"
          >
            <SendHorizontal className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Modale prévisualisation fichier */}
      {showPreview && file && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] w-full">
            {file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Prévisualisation"
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-h-[70vh] overflow-auto">
                <Paperclip className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} Mo
                </p>
                <p className="text-xs text-gray-400 mb-6">
                  Ce fichier sera envoyé tel quel
                </p>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(false)}
              className="absolute -top-12 -right-4 h-10 w-10 p-0 hover:bg-white/20 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modale plein écran image */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-6xl max-h-[95vh] w-full">
            <img
              src={fullscreenImage}
              alt="Image plein écran"
              className="w-full h-auto max-h-[95vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setFullscreenImage(null)
              }}
              className="absolute -top-14 right-0 h-12 w-12 p-0 hover:bg:white/30 bg-white/20 backdrop-blur-sm rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- Page principale ---------- */
export default function TaskChannelPage() {
  const [channel, setChannel] = useState<TaskChannel | null>(null)

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottomFromHeader = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={channel?.task_title || 'Canal de communication'}
          onScrollToBottom={scrollToBottomFromHeader}
        />
        {/* on passe le ref interne au composant qui gère les messages */}
        <TaskChannelContent channel={channel} setChannel={setChannel} />
      </div>
    </div>
  )
}
