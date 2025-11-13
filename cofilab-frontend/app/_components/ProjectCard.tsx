'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, ExternalLink, User, Clock } from 'lucide-react'

// Définition de l'interface du projet (exportée pour réutilisation)
export interface Project {
  id: number
  name: string
  description: string
  total_budget: number
  manager_username: string
  is_public: boolean
  tasks: any[]
  project_image: string | null
  created_at: string
}

// Constantes pour l'URL et l'image par défaut (Mise à jour pour les tests)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'
const DEFAULT_IMAGE = '/default-project-cover.png'

interface ProjectCardProps {
  project: Project
}

// Fonction pour générer l'URL de l'image (gère path absolu et path relatif)
const getProjectImageUrl = (path: string | null): string => {
  if (!path) return DEFAULT_IMAGE

  // Si l'API renvoie déjà une URL complète, on la retourne directement
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  // Sinon, concatène proprement l'API_BASE_URL et le path
  const base = (process.env.NEXT_PUBLIC_API_URL || API_BASE_URL).replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

const formatSats = (sats: number): string => {
  return new Intl.NumberFormat('fr-FR').format(sats) + ' ⚡sats'
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()

  // Formatage de la date de création
  const createdAt = new Date(project.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  const imageUrl = getProjectImageUrl(project.project_image)

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Image de Couverture */}
      <div className="h-48 w-full relative">
        <img
          src={imageUrl}
          alt={`Couverture du projet ${project.name}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Si l'image backend est K.O, on revient à l'image par défaut locale
            e.currentTarget.onerror = null
            e.currentTarget.src = DEFAULT_IMAGE
          }}
        />
        <span className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full ${project.is_public ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {project.is_public ? 'Public' : 'Privé'}
        </span>
      </div>

      <CardHeader className="flex-grow">
        <CardTitle className="text-xl">{project.name}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-gray-600">
          {project.description || 'Description non fournie.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center space-x-2 text-gray-700">
          <DollarSign size={16} className="text-yellow-600" />
          <span className="font-medium">Budget :</span>
          <span>{formatSats(project.total_budget)}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <User size={16} className="text-indigo-600" />
          <span className="font-medium">Manager :</span>
          <span>{project.manager_username}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <Clock size={16} className="text-gray-500" />
          <span className="font-medium">Créé le :</span>
          <span>{createdAt}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full text-[#1c2541] border-[#1c2541] hover:bg-gray-100"
          onClick={() => router.push(`/projects/${project.id}`)}
        >
          Voir Détails <ExternalLink size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  )
}
