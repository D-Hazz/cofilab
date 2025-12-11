// app/projects/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projects } from '@/services/api'
import { profiles } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import FundingWidget from '@/app/_components/FundingWidget'
import { Users, ClipboardList, Wallet, CheckCircle, Pencil, Trash, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PaymentHistory from '@/app/_components/PaymentHistory'
import { useLightning } from '@/lib/useLightning'


type UserLite = { id?: number; username?: string }

type Task = {
  id: number
  title: string
  description?: string
  status?: string
  reward_sats?: number
  assigned_to?: UserLite | null
  weight?: number
  // Assumer que assigned_to_id est inclus dans le type Task pour l'édition/création
  assigned_to_id?: { id: number | undefined } | null 
}

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
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const [fundModal, setFundModal] = useState(false)
  const [amount, setAmount] = useState(0)
  const [invoice, setInvoice] = useState<string | null>(null)
  
  // 🛑 CORRECTION 1 : Utilisation des noms de fonctions du hook useLightning
  const { createFundingInvoice, checkFundingInvoice } = useLightning() 

  // CRUD Modal States
  // ... (Reste du code d'état et de l'initialisation) ...
  const [users, setUsers] = useState<UserLite[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    reward_sats: 0,
    status: 'todo',
    assigned_to_id: undefined as number | undefined,
    weight: 0,
  })

  const openCreateModal = () => {
    setEditingTask(null)
    setForm({ title: '', description: '', reward_sats: 0, status: 'todo', assigned_to_id: undefined, weight: 0 })
    setOpenModal(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      reward_sats: task.reward_sats || 0,
      status: task.status || 'todo',
      // Assurer que l'ID est correctement extrait
      assigned_to_id: task.assigned_to?.id, 
      weight: task.weight || 0,
    })
    setOpenModal(true)
  }

  const handleSubmit = async () => {
    try {
      // Transforme assigned_to en nombre ou null (pas de string vide ou tableau)
      let assignedToVal: number | null = null
      // Vérification simplifiée pour l'ID d'assignation
      if (form.assigned_to_id) {
        assignedToVal = Number(form.assigned_to_id)
      }

      const payload = {
          ...form,
          assigned_to_id: assignedToVal,
      }

        if (!editingTask) {
          await projects.createTask(id as string, payload)
        } else {
          await projects.updateTask(editingTask.id, payload)
        }

        const refreshed = await projects.tasks(id as string)
        setTasksList(refreshed)
        setOpenModal(false)
      } catch (e) {
        console.error('Error saving task', e)
      }
    }


  const deleteTask = async (taskId: number) => {
    if (!confirm('Supprimer cette tâche ?')) return

    try {
      await projects.deleteTask(taskId)
      setTasksList(tasksList.filter(t => t.id !== taskId))
    } catch (e) {
      console.error('Error deleting task', e)
    }
  }
    
  // 🛑 CORRECTION 2 : Utilisation des fonctions createFundingInvoice et checkFundingInvoice
  async function processPayment() {
    // Validation basique du montant
    if (!amount || amount <= 0) {
      alert("Montant invalide")
      return
    }

    // Vérifie que le projet existe
    if (!project) {
      alert("Projet introuvable")
      return
    }

    // Crée une facture Lightning via le hook
    const res = await createFundingInvoice(amount, project.id)
    // res = { invoice: string, invoice_id: string }

    setInvoice(res.invoice) // ln_invoice affichée en QR Code

    // Polling pour vérifier l’état du paiement
    const interval = setInterval(async () => {
      // Utilise checkFundingInvoice et res.invoice_id
      const status = await checkFundingInvoice(res.invoice_id) 
      
      // Le backend /funding/verify/ renvoie "settled" si payé (vu dans payments/views.py MOCK)
      if (status === "settled") { 
        clearInterval(interval)
        alert("Paiement confirmé 🎉")
        window.location.reload()
      }
    }, 2500)
  }


  // Charge projet + tâches
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


  // Charge utilisateurs pour l’assignation
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const list = await profiles.list()
        setUsers(list)
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs", error)
      }
    }

    fetchUsers()
  }, [])

  if (loading) return <div className="p-6 text-gray-600">Chargement du projet...</div>
  if (!project) return <div className="p-6 text-red-600">Projet introuvable.</div>

  const completedTasks = tasksList.filter(t => t.status === 'done')
  const fundedTasks = completedTasks.reduce((acc, t) => acc + (t.reward_sats || 0), 0)
  const funded = project.funded_sats ?? fundedTasks

  const contributors = project.contributors_count ?? new Set(
    tasksList.map(t => t.assigned_to?.id)
  ).size

  const apiRoot = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : ''
  const projectImageUrl = project.project_image || (project.project_image ? `${apiRoot}${project.project_image}` : null)

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
                <img src={projectImageUrl} className="h-16 w-16 rounded-md object-cover shadow" />
              ) : (
                <div className="h-16 w-16 rounded-md bg-neutral-100 flex items-center justify-center border">
                  Image
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">{project.name}</h1>
                <div className="text-sm text-muted-foreground">Manager: {project.manager_username}</div>
              </div>
            </div>

            <Button variant="secondary" onClick={() => router.push('/projects')}>
              ← Retour
            </Button>
          </div>

          {/* DETAILS */}
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
            
            <div className="flex-1 p-4 bg-white rounded-lg shadow space-y-4">
              <p className="text-gray-700">{project.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span className="font-medium">Budget :</span>
                  <span>{(project.total_budget ?? 0).toLocaleString()} sats</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Financé :</span>
                  <span>{funded.toLocaleString()} sats</span>
                </div>
              </div>

              <FundingWidget funded={funded} total={project.total_budget ?? 100000} />
              <PaymentHistory projectId={project.id} />
              <Button onClick={() => setFundModal(true)}>
                <Wallet className="w-4 h-4 mr-2" />
                Financer le projet
              </Button>


            </div>

            <div className="p-4 bg-white rounded-lg shadow space-y-3">
              <h2 className="text-xl font-semibold mb-3">Statistiques</h2>

              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span><strong>{contributors}</strong> contributeurs</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <ClipboardList className="w-5 h-5" />
                <span><strong>{tasksList.length}</strong> tâches</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span><strong>{completedTasks.length}</strong> terminées</span>
              </div>
            </div>

          </div>

          {/* TASKS */}
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Tâches</h2>

              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter tâche
              </Button>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasksList.map(task => (
              <div
                key={task.id}
                className="p-3 border rounded-lg hover:bg-gray-50 transition flex justify-between items-start"
              >
                <div className="flex-1 pr-4">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Assigné à : <strong>{task.assigned_to ? task.assigned_to.username : 'Aucun'}</strong>
                  </p>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1">
                    {task.status === 'done' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                    )}
                    <span>{task.status === 'done' ? 'Terminé' : 'À faire'}</span>
                  </div>

                  <span className="font-bold text-sm text-yellow-600">
                    {(task.reward_sats ?? 0).toLocaleString()} sats
                  </span>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(task)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteTask(task.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>


          {/* CONTRIBUTEURS */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Contributeurs</span>
            </h2>
            <p className="text-gray-500">
              <strong>{contributors}</strong> contributeur(s) ont soutenu ce projet.
            </p>
          </div>
        </main>
      </div>

      {/* MODAL CRUD */}
      {/* ... (Modal de CRUD des tâches) ... */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Modifier la tâche' : 'Créer une tâche'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <Input
              placeholder="Titre"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />

            <Textarea
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />

            <Input
              type="number"
              placeholder="Reward sats"
              value={form.reward_sats}
              onChange={e => setForm({ ...form, reward_sats: Number(e.target.value) })}
            />

            <select
              className="border rounded p-2 w-full"
              value={form.assigned_to_id ?? ''}
              onChange={e => {
                const val = e.target.value
                setForm({ ...form, assigned_to_id: val === '' ? undefined : Number(val) })
              }}
            >
              <option value="">-- Assigné à --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>

            <select
              className="border rounded p-2 w-full"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="todo">À faire</option>
              <option value="done">Terminé</option>
            </select>

            <Input
              type="number"
              step="0.01"
              placeholder="Poids"
              value={form.weight}
              onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || 1 })}
            />


            <Button className="w-full mt-2" onClick={handleSubmit}>
              {editingTask ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL FINANCEMENT */}
      <Dialog open={fundModal} onOpenChange={setFundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Financer via Lightning</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Montant en sats"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />

            <Button onClick={processPayment}>
              Générer l’Invoice
            </Button>

            {invoice && (
              <div className="mt-3 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${invoice}`}
                  className="rounded-md border"
                />
                <p className="text-sm text-gray-500 mt-2 break-all">{invoice}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}