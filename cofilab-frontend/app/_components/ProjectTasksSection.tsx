// /cofilab-frontend/app/_components/ProjectTasksSection.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  ClipboardList,
  CheckCircle,
  Pencil,
  Trash,
  Plus,
  Users,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { projects, profiles, taskApplications } from '@/services/api'

type UserLite = { id?: number; username?: string }

export type Task = {
  id: number
  title: string
  description?: string
  status?: string
  reward_sats?: number
  assigned_to?: UserLite | null
  weight?: number
  assigned_to_id?: number | null
}

type ProjectTasksSectionProps = {
  projectId: number
  tasksList: Task[]
  setTasksList: (tasks: Task[]) => void
  contributors: number
  canManage: boolean
}

export function ProjectTasksSection({
  projectId,
  tasksList,
  setTasksList,
  contributors,
  canManage,
}: ProjectTasksSectionProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserLite[]>([])
  const [openModal, setOpenModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  // Postulations de l'utilisateur connecté
  const [applications, setApplications] = useState<any[]>([])

  const [form, setForm] = useState({
    title: '',
    description: '',
    reward_sats: 0,
    status: 'todo',
    assigned_to_id: undefined as number | undefined,
    weight: 0,
  })

  // État pour le modal de postulation
  const [applyModal, setApplyModal] = useState(false)
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [selectedApplyTask, setSelectedApplyTask] = useState<Task | null>(null)
  const [applying, setApplying] = useState(false)

  // état pour le détail
  const [openDetailModal, setOpenDetailModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Chargement lazy des users au premier open du modal d'édition
  async function ensureUsersLoaded() {
    if (users.length === 0) {
      try {
        const list = await profiles.list()
        setUsers(list)
      } catch (e) {
        console.error('Erreur lors du chargement des utilisateurs', e)
      }
    }
  }

  // Charger toutes les postulations pour manager
  async function loadAllApplications() {
    try {
      const res = await taskApplications.listForProject(projectId)
      setApplications(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error('Erreur chargement postulations manager', e)
      setApplications([])
    }
  }

  // Charger les postulations de l'utilisateur connecté (candidat)
  async function loadMyApplications() {
    try {
      const res = await taskApplications.listMine()
      setApplications(Array.isArray(res) ? res : [])
    } catch (e) {
      console.error('Erreur chargement postulations', e)
      setApplications([])
    }
  }

  // Charger les tâches disponibles pour postuler
  async function loadAvailableTasks() {
    try {
      const allTasks = await projects.tasks(String(projectId))
      const available = allTasks.filter(
        (task: Task) =>
          !task.assigned_to &&
          task.status !== 'done' &&
          !applications.some(a => a.task === task.id)
      )

      setAvailableTasks(Array.isArray(available) ? available : [])
    } catch (e) {
      console.error('Erreur chargement tâches disponibles', e)
      setAvailableTasks([])
    }
  }

  // Fonction accepter/rejeter pour manager
  const handleApplication = async (applicationId: number, action: 'accept' | 'reject') => {
    try {
      if (action === 'accept') {
        await taskApplications.accept(applicationId)
      } else {
        await taskApplications.reject(applicationId)
      }
      // Recharger postulations et tâches pour mettre à jour badges et assignation
      if (canManage) await loadAllApplications()
      const refreshedTasks = await projects.tasks(String(projectId))
      setTasksList(refreshedTasks)
    } catch (e: any) {
      console.error('Erreur action candidature', e)
      alert(e?.detail || e?.message || "Impossible d'exécuter l'action")
    }
  }

  // Ouvrir modal postulation
  const openApplyModal = async () => {
    if (canManage) {
      await loadAllApplications()
    } else {
      await loadMyApplications()
      await loadAvailableTasks()
    }
    setApplyModal(true)
  }
  // Postuler à une tâche

  const applyToTask = async (task: Task) => {
    if (!task.id) return

    setApplying(true)
    try {
      console.log('📝 Postulation à la tâche:', task.id)

      await taskApplications.apply(task.id)

      alert(`✅ Candidature envoyée pour "${task.title}"`)

      setApplyModal(false)
      setSelectedApplyTask(null)
    } catch (e: any) {
      console.error('Erreur postulation:', e)
      alert(
        e?.detail ||
          e?.message ||
          "❌ Impossible d'envoyer la candidature"
      )
    } finally {
      setApplying(false)
    }
  }


  const openCreateModal = async () => {
    if (!canManage) return
    setEditingTask(null)
    setForm({
      title: '',
      description: '',
      reward_sats: 0,
      status: 'todo',
      assigned_to_id: undefined,
      weight: 0,
    })
    await ensureUsersLoaded()
    setOpenModal(true)
  }

  const openEditModal = async (task: Task) => {
    if (!canManage) return
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description || '',
      reward_sats: task.reward_sats || 0,
      status: task.status || 'todo',
      assigned_to_id: task.assigned_to?.id,
      weight: task.weight || 0,
    })
    await ensureUsersLoaded()
    setOpenModal(true)
  }

  const handleSubmit = async () => {
    if (!canManage) return
    try {
      let assignedToVal: number | null = null
      if (form.assigned_to_id) {
        assignedToVal = Number(form.assigned_to_id)
      }

      const payload = {
        ...form,
        assigned_to_id: assignedToVal,
      }

      if (!editingTask) {
        await projects.createTask(String(projectId), payload)
      } else {
        await projects.updateTask(editingTask.id.toString(), payload)
      }

      const refreshed = await projects.tasks(String(projectId))
      setTasksList(refreshed)
      setOpenModal(false)
    } catch (e) {
      console.error('Error saving task', e)
    }
  }

  const deleteTask = async (taskId: number) => {
    if (!canManage) return
    if (!confirm('Supprimer cette tâche ?')) return
    try {
      await projects.deleteTask(taskId)
      setTasksList(tasksList.filter((t) => t.id !== taskId))
    } catch (e) {
      console.error('Error deleting task', e)
    }
  }

  const completedTasks = tasksList.filter((t) => t.status === 'done')

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setOpenDetailModal(true)
  }

  return (
    <>
      {/* TASKS */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tâches</h2>

        <div className="flex gap-2">
          {canManage && (
            <Button onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-2" /> Ajouter tâche
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={openApplyModal}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Postuler
          </Button>
        </div>
      </div>

      {/* ... reste du JSX identique ... (je garde la partie affichage des tâches) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tasksList.map((task) => (
          <div
            key={task.id}
            className="p-3 border rounded-lg hover:bg-gray-50 transition flex justify-between items-start cursor-pointer"
            onClick={() => openTaskDetail(task)}
          >
            <div className="flex-1 pr-4">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {task.description}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Assigné à:{' '}
                <strong>
                  {task.assigned_to ? task.assigned_to.username : 'Aucun'}
                </strong>
              </p>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex items-center space-x-1">
                {task.status === 'done' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                )}
                <span>
                  {task.status === 'done' ? 'Terminé' : 'À faire'}
                </span>
              </div>

              <span className="font-bold text-sm text-yellow-600">
                {(task.reward_sats ?? 0).toLocaleString()} sats
              </span>
              {task.assigned_to && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(
                      `/projects/${projectId}/tasks/${task.id}/channel`
                    )
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Canal
                </Button>
              )}


              {canManage && (
                <div
                  className="flex space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditModal(task)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              )}
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
        <p className="text-xs text-gray-400 mt-1">
          {completedTasks.length} tâche(s) terminée(s).
        </p>
      </div>

      {/* MODAL CRUD TÂCHES (manager only) - identique */}
      {canManage && (
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
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Reward sats"
                value={form.reward_sats}
                onChange={(e) =>
                  setForm({ ...form, reward_sats: Number(e.target.value) })
                }
              />
              <select
                className="border rounded p-2 w-full"
                value={form.assigned_to_id ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({
                    ...form,
                    assigned_to_id: val === '' ? undefined : Number(val),
                  })
                }}
              >
                <option value="">-- Assigné à --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
              <select
                className="border rounded p-2 w-full"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value })
                }
              >
                <option value="todo">À faire</option>
                <option value="done">Terminé</option>
              </select>
              <Input
                type="number"
                step="0.01"
                placeholder="Poids"
                value={form.weight}
                onChange={(e) =>
                  setForm({
                    ...form,
                    weight: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  })
                }
              />
              <Button className="w-full mt-2" onClick={handleSubmit}>
                {editingTask ? 'Enregistrer' : 'Créer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DÉTAIL TÂCHE - identique */}
      {selectedTask && (
        <Dialog open={openDetailModal} onOpenChange={setOpenDetailModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Détail de la tâche</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Status :{' '}
                  <span className="font-medium">
                    {selectedTask.status === 'done' ? 'Terminé' : 'À faire'}
                  </span>
                </p>
              </div>
              {selectedTask.description && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              )}
              <p className="text-sm">
                Récompense :{' '}
                <span className="font-semibold text-yellow-700">
                  {(selectedTask.reward_sats ?? 0).toLocaleString()} sats
                </span>
              </p>
              <p className="text-sm">
                Assigné à :{' '}
                <span className="font-medium">
                  {selectedTask.assigned_to
                    ? selectedTask.assigned_to.username
                    : 'Aucun'}
                </span>
              </p>
              {selectedTask.weight !== undefined && (
                <p className="text-sm text-gray-600">
                  Poids : <span className="font-medium">{selectedTask.weight}</span>
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setOpenDetailModal(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL POSTULATION / MANAGER */}
      <Dialog open={applyModal} onOpenChange={setApplyModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {canManage ? 'Postulations aux tâches' : 'Postuler aux tâches disponibles'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {canManage ? (
              // --- Vue manager ---
              applications.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune postulation pour le moment.
                </p>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">{app.task_title}</p>
                      <p className="text-sm text-gray-600">
                        Candidat: <strong>{app.applicant_username}</strong>
                      </p>
                      <p className="text-xs mt-1">
                        Status: {app.status === 'pending' ? 'En attente' : app.status === 'accepted' ? 'Acceptée' : 'Rejetée'}
                      </p>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-500 text-white"
                          onClick={() => handleApplication(app.id, 'accept')}
                        >
                          Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApplication(app.id, 'reject')}
                        >
                          Rejeter
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              // --- Vue candidat ---
              availableTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune tâche disponible pour le moment.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    {availableTasks.length} tâche(s) disponible(s). Clique sur une tâche pour postuler.
                  </p>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableTasks.map((task) => {
                      const hasApplied = applications.some(
                        (a) => a.task === task.id && a.status === 'pending'
                      )

                      return (
                        <div
                          key={task.id}
                          className="p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition-all group"
                          onClick={() => setSelectedApplyTask(task)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-yellow-600 mb-1">
                                {(task.reward_sats ?? 0).toLocaleString()} sats
                              </div>
                              {hasApplied ? (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    applications.find(a => a.task === task.id)?.status === 'accepted'
                                      ? 'bg-green-100 text-green-600'
                                      : applications.find(a => a.task === task.id)?.status === 'rejected'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-yellow-100 text-yellow-600'
                                  }`}
                                >
                                  {applications.find(a => a.task === task.id)?.status === 'accepted'
                                    ? 'Acceptée'
                                    : applications.find(a => a.task === task.id)?.status === 'rejected'
                                    ? 'Rejetée'
                                    : 'En attente'}
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                  Disponible
                                </span>
                              )}

                            </div>
                          </div>

                          {selectedApplyTask?.id === task.id && (
                            <div className="mt-3 pt-3 border-t border-blue-200 bg-blue-50 rounded-lg p-3">
                              <p className="text-sm font-medium text-blue-900 mb-2">
                                Tu veux postuler à cette tâche ?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    applyToTask(task)
                                  }}
                                  disabled={applying || hasApplied}
                                >
                                  {hasApplied
                                    ? '⏳ Candidature en attente'
                                    : applying
                                    ? '🔄 Postulation...'
                                    : '✅ Postuler maintenant'}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedApplyTask(null)
                                  }}
                                  disabled={applying}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setApplyModal(false)
                  setSelectedApplyTask(null)
                }}
                disabled={applying}
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  )
}
