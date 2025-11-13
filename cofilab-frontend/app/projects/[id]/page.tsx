'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projects } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import FundingWidget from '@/app/_components/FundingWidget'
import { Users, ClipboardList, Wallet, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type UserLite = { id?: number; username?: string }
type Task = {
  id: number
  title: string
  description?: string
  status?: string
  reward_sats?: number
  assigned_to?: UserLite | null
}
type Project = {
  id: number
  name: string
  description?: string
  total_budget?: number
  manager?: UserLite | null
  project_image?: string | null // relative path e.g. /media/...
  project_image_url?: string | null // absolute URL if backend provides it
  funded_sats?: number | null // optional field from backend if available
  contributors_count?: number | null // optional field from backend if available
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [tasksList, setTasksList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const proj = await projects.retrieve(id as string)
        setProject(proj)
        const taskRes = await projects.tasks(id as string)
        setTasksList(Array.isArray(taskRes) ? taskRes : [])
      } catch (err) {
        console.error('Error loading project', err)
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, router])

  if (loading) return <div className="p-6 text-gray-600">Chargement du projet...</div>
  if (!project) return <div className="p-6 text-red-600">Projet introuvable.</div>

  // Compute funded sats:
  // Prefer backend-provided funded_sats if available, otherwise sum rewards of completed tasks
  const completedTasks = tasksList.filter(t => t.status === 'done')
  const fundedFromTasks = completedTasks.reduce((acc, t) => acc + (t.reward_sats || 0), 0)
  const funded = typeof project.funded_sats === 'number' ? project.funded_sats : fundedFromTasks

  // Compute contributors:
  // Prefer backend count if available, otherwise derive unique assigned_to usernames/ids from tasks
  const contributors = typeof project.contributors_count === 'number'
    ? project.contributors_count
    : (() => {
        const set = new Set<number | string>()
        tasksList.forEach(t => {
          const uid = (t.assigned_to as any)?.id ?? (t.assigned_to as any)?.username
          if (uid !== undefined && uid !== null) set.add(uid)
        })
        return Math.max(1, set.size) // at least 1 to avoid showing 0 when there are tasks but no assigned users
      })()

  // Project image resolution: prefer absolute project_image_url, fallback to NEXT_PUBLIC_API_URL + project_image
  const apiRoot = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '') : (process.env.NEXT_PUBLIC_API_URL || '')
  const projectImageUrl = project.project_image_url || (project.project_image ? `${apiRoot}${project.project_image}` : null)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <Header />

        <main className="p-6 flex-1 overflow-auto space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {projectImageUrl ? (
                <img
                  src={projectImageUrl}
                  alt={`${project.name} cover`}
                  className="h-16 w-16 rounded-md object-cover shadow"
                />
              ) : (
                <div className="h-16 w-16 rounded-md bg-neutral-100 flex items-center justify-center text-sm text-neutral-500 border">
                  Image
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">{project.name}</h1>
                <div className="text-sm text-muted-foreground">
                  Manager: {project.manager?.username || 'N/A'}
                </div>
              </div>
            </div>

            <Button variant="secondary" onClick={() => router.push('/projects')}>
              ← Retour
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-6 space-y-4 md:space-y-0">
            {/* Détails du projet */}
            <div className="flex-1 p-4 bg-white rounded-lg shadow space-y-4">
              <p className="text-gray-700">{project.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex justify-between">
                  <span className="font-medium">Budget total :</span>
                  <span>{(project.total_budget ?? 0).toLocaleString()} sats</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Financé :</span>
                  <span>{funded.toLocaleString()} sats</span>
                </div>
              </div>

              <div className="mt-2">
                <FundingWidget funded={funded} total={project.total_budget ?? 100000} />
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="p-4 bg-white rounded-lg shadow space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Statistiques</h2>

              <div className="flex items-center space-x-2 text-gray-700">
                <Users className="w-5 h-5" />
                <span><strong>{contributors}</strong> contributeurs</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <ClipboardList className="w-5 h-5" />
                <span><strong>{tasksList.length}</strong> tâches au total</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span><strong>{completedTasks.length}</strong> tâches terminées</span>
              </div>
            </div>
          </div>

          {/* Liste des Tâches */}
          <div className="p-4 bg-white rounded-lg shadow space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Tâches</h2>
            {tasksList.length === 0 && <p className="text-gray-500">Aucune tâche pour le moment.</p>}
            {tasksList.map((task) => (
              <div key={task.id} className="p-3 border rounded-lg flex justify-between items-start hover:bg-gray-50 transition">
                <div className="flex-1 pr-4">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Assigné à: <strong>{task.assigned_to?.username || 'Aucun'}</strong></p>
                </div>

                <div className="flex flex-col items-end space-y-1 text-sm pt-1">
                  <div className="flex items-center space-x-1">
                    {task.status === 'done' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <ClipboardList className="w-4 h-4 text-gray-400" />
                    )}
                    <span>{task.status === 'done' ? 'Terminé' : 'À faire'}</span>
                  </div>
                  <span className="font-bold text-sm text-yellow-600">{(task.reward_sats ?? 0).toLocaleString()} sats</span>
                </div>
              </div>
            ))}
          </div>

          {/* Contributeurs (simplifié) */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Contributeurs</span>
            </h2>
            <p className="text-gray-500">Actuellement <strong>{contributors}</strong> contributeur(s) ont soutenu ce projet.</p>
          </div>
        </main>
      </div>
    </div>
  )
}
