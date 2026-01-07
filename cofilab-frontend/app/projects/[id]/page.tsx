'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import QRCode from 'react-qr-code'
import { taskApplications, projects, profiles } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import FundingWidget from '@/app/_components/FundingWidget'
import { Users, ClipboardList, Wallet, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import PaymentHistory from '@/app/_components/PaymentHistory'
import { useLightning } from '@/lib/useLightning'
import { ProjectTasksSection, Task } from '@/app/_components/ProjectTasksSection'

type UserLite = { id?: number; username?: string }

type Project = {
  manager_username: string
  id: number
  name: string
  description?: string
  total_budget?: number
  manager?: UserLite | null
  project_image?: string | null
  project_image_url?: string | null
  funded_sats?: number | null
  contributors_count?: number | null
  funding_wallet_address?: string | null
  owner?: number | null
}

type MeProfile = {
  id: number
  username: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()

  // ⚠️ D'abord les states
  const [project, setProject] = useState<Project | null>(null)
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const [fundModal, setFundModal] = useState(false)
  const [amount, setAmount] = useState(0)
  const [fundingInvoice, setFundingInvoice] = useState<string | null>(null)
  const [fundingFundingId, setFundingFundingId] = useState<number | null>(null)

  const [me, setMe] = useState<MeProfile | null>(null)

  const {
    createProjectFundingInvoice,
    payToProject,
    loading: lightningLoading,
    isConnected,
  } = useLightning()

  const canOpenFundingModal =
    !!project?.funding_wallet_address && isConnected && !lightningLoading

  const canSubmitFunding =
    !!project?.funding_wallet_address &&
    isConnected &&
    !lightningLoading &&
    amount > 0

  const canManage =
    !!project &&
    !!me &&
    (project.manager_username === me.username || project.owner === me.id)
  async function payDirectFromBrowser() {
    if (!amount || amount <= 0) {
      alert('Montant invalide')
      return
    }
    if (!project) {
      alert('Projet introuvable')
      return
    }
    if (!isConnected) {
      alert("Aucun wallet Lightning connecté. Va d'abord sur la page Wallet.")
      return
    }
    if (!project.funding_wallet_address) {
      alert("Ce projet n'a pas de wallet configuré.")
      return
    }

    try {
      await payToProject({
        projectId: project.id,
        amountSats: amount,
        walletAddress: project.funding_wallet_address,
      })

      const proj = await projects.retrieve(id as string)
      setProject(proj)
      alert('Funding payé avec succès via MistyBreez.')
    } catch (e: any) {
      console.error('Erreur payDirectFromBrowser:', e)
      alert(`❌ Échec: ${e.message || 'Erreur inconnue'}`)
    }
  }

  async function processPayment() {
    if (!amount || amount <= 0) {
      alert('Montant invalide')
      return
    }
    if (!project) {
      alert('Projet introuvable')
      return
    }
    if (!isConnected) {
      alert("Aucun wallet Lightning connecté. Va d'abord sur la page Wallet.")
      return
    }
    if (!project.funding_wallet_address) {
      alert(
        "Ce projet n'a pas de wallet configuré (funding_wallet_address). Va sur la page Admin du projet.",
      )
      return
    }

    try {
      console.log('🚀 Génération invoice funding projet:', {
        projectId: project.id,
        amount,
      })

      const { invoice, fundingRecord } = await createProjectFundingInvoice({
        projectId: project.id,
        amountSats: amount,
        projectWalletAddress: project.funding_wallet_address,
      })

      setFundingInvoice(invoice)
      setFundingFundingId(fundingRecord.funding_id || fundingRecord.id)

      const proj = await projects.retrieve(id as string)
      setProject(proj)
    } catch (e: any) {
      console.error('❌ Erreur génération invoice funding:', e)
      alert(`❌ Échec: ${e.message || 'Erreur inconnue'}`)
    }
  }

  // Chargement projet + tâches
  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const proj = await projects.retrieve(id as string)
        setProject(proj)

        const list = await projects.tasks(id as string)
        setTasksList(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error(err)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, router])

  // Chargement du profil courant
  useEffect(() => {
    const loadMe = async () => {
      try {
        const meProfile = await profiles.getMe()
        setMe(meProfile)
      } catch (e) {
        console.error('Erreur chargement profil courant', e)
      }
    }
    loadMe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600">Chargement du projet…</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md w-full rounded-xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
            Projet introuvable
          </h2>
          <p className="mb-4 text-center text-sm text-gray-600">
            Le projet que vous recherchez n’existe plus ou l’identifiant est invalide.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/projects')}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              ← Retour à la liste des projets
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ ici seulement, project est défini
  const projectImageUrl = project.project_image_url || null

  const completedTasks = tasksList.filter((t) => t.status === 'done')
  const fundedTasks = completedTasks.reduce(
    (acc, t) => acc + (t.reward_sats || 0),
    0,
  )
  const funded = project.funded_sats ?? fundedTasks

  const contributors =
    project.contributors_count ??
    new Set(tasksList.map((t: any) => t.assigned_to?.id)).size

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-auto">
        <Header />

        <main className="p-6 flex-1 overflow-auto space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {projectImageUrl ? (
                <img
                  src={projectImageUrl}
                  className="h-16 w-16 rounded-md object-cover shadow"
                  alt={project.name}
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-neutral-100 flex items-center justify-center border">
                  Image
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  {project.name}
                </h1>
                <div className="text-sm text-muted-foreground">
                  Manager: {project.manager_username}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {canManage && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/projects/${id}/admin`)}
                >
                  ⚙️ Admin
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => router.push('/projects')}
              >
                ← Retour
              </Button>
            </div>
          </div>

          {/* DETAILS + STATS */}
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
            <div className="flex-1 p-4 bg-white rounded-lg shadow space-y-4">
              <p className="text-gray-700">{project.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span className="font-medium">Budget :</span>
                  <span>
                    {(project.total_budget ?? 0).toLocaleString()} sats
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Financé :</span>
                  <span>{funded.toLocaleString()} sats</span>
                </div>
              </div>

              <FundingWidget
                funded={funded}
                total={project.total_budget ?? 100000}
              />

              <PaymentHistory projectId={project.id} />

              <Button
                onClick={() => setFundModal(true)}
                disabled={!canOpenFundingModal}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {lightningLoading ? 'Traitement...' : 'Financer le projet'}
              </Button>

              {project.funding_wallet_address ? (
                <p className="text-xs text-green-700 mt-2 font-mono">
                  Wallet projet: {project.funding_wallet_address}
                </p>
              ) : (
                <p className="text-xs text-orange-600 mt-2">
                  Aucun wallet configuré. Va sur la page Admin du projet.
                </p>
              )}

              {!isConnected && (
                <p className="text-xs text-orange-600 mt-1">
                  Connecte d&apos;abord ton wallet Lightning (page Wallet).
                </p>
              )}
            </div>

            <div className="p-4 bg-white rounded-lg shadow space-y-3">
              <h2 className="text-xl font-semibold mb-3">Statistiques</h2>

              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span>
                  <strong>{contributors}</strong> contributeurs
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <ClipboardList className="w-5 h-5" />
                <span>
                  <strong>{tasksList.length}</strong> tâches
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>
                  <strong>{completedTasks.length}</strong> terminées
                </span>
              </div>
            </div>
          </div>

          {/* SECTION TÂCHES */}
          <ProjectTasksSection
            projectId={project.id}
            tasksList={tasksList}
            setTasksList={setTasksList}
            contributors={contributors}
            canManage={canManage}
          />
        </main>
      </div>

      {/* MODAL FINANCEMENT */}
      <Dialog
        open={fundModal}
        onOpenChange={(open) => {
          setFundModal(open)
          if (!open) {
            setFundingInvoice(null)
            setFundingFundingId(null)
            setAmount(0)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Financer via Lightning</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                type="number"
                placeholder="Montant en sats"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              {!project?.funding_wallet_address && (
                <p className="text-xs text-red-500 mt-2">
                  Aucun wallet de projet configuré (funding_wallet_address).
                </p>
              )}
              {!isConnected && (
                <p className="text-xs text-orange-500 mt-1">
                  Connecte d&apos;abord ton wallet Lightning.
                </p>
              )}
              {amount <= 0 && (
                <p className="text-xs text-orange-500 mt-1">
                  Indique un montant strictement positif.
                </p>
              )}

              {/* 🔍 Info montant reçu / frais (texte générique pour l’instant) */}
              {amount > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Montant reçu par le projet :{' '}
                  <strong>{amount.toLocaleString()} sats</strong> (hors frais Lightning).
                </p>
              )}
            </div>

            {!fundingInvoice && (
              <Button
                onClick={processPayment}
                disabled={!canSubmitFunding}
                className="w-full"
              >
                {lightningLoading
                  ? 'Génération en cours...'
                  : 'Générer la facture Lightning'}
              </Button>
            )}
            {!fundingInvoice && (
              <Button
                onClick={payDirectFromBrowser}
                disabled={!canSubmitFunding}
                className="w-full"
              >
                {lightningLoading ? 'Paiement en cours...' : 'Payer avec MistyBreez'}
              </Button>
            )}


            {fundingInvoice && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-sm text-gray-700">
                  Scanne ce QR avec ton wallet Lightning pour financer le
                  projet.
                </p>
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-md border">
                    <QRCode
                      value={`lightning:${fundingInvoice}`}
                      size={180}
                      level="H"
                    />
                  </div>
                </div>
                <div className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                  {fundingInvoice}
                </div>
                {fundingFundingId && (
                  <p className="text-xs text-gray-500">
                    Funding ID :{' '}
                    <span className="font-mono">{fundingFundingId}</span>
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        if (fundingInvoice) {
                          await navigator.clipboard.writeText(fundingInvoice)
                          alert('Invoice copiée dans le presse-papier.')
                        }
                      } catch {
                        alert("Impossible de copier l’invoice.")
                      }
                    }}
                  >
                    Copier l’invoice
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setFundModal(false)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
