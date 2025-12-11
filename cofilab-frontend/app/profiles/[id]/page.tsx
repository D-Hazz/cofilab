'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { profiles } from '@/services/api'
import { projects } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import InviteModal from '@/app/_components/InviteModal'

import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  User,
  Award,
  Edit,
  PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const ICON_SIZE = 18

export default function UserProfilePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Profil connecté ?
  const [isMyProfile, setIsMyProfile] = useState(false)

  // Popup d'invitation
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [projectsList, setProjectsList] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const data = await profiles.retrieve(id as string)
        setProfile(data)
        setError(null)

        const currentUserId = localStorage.getItem('userId')
        setIsMyProfile(currentUserId === id)
      } catch (err) {
        setError('Profil introuvable ou erreur de chargement.')
        setIsMyProfile(false)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [id])

  // Charger la liste des projets
  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const data = await projects.list()
      setProjectsList(data)
    } catch {
      alert("Impossible de charger les projets.")
    } finally {
      setLoadingProjects(false)
    }
  }

  // Fonction d'invitation
  const sendInvitation = async (projectId: number) => {
    try {
      await projects.inviteContributor(projectId, profile.id)

      alert(
        `Invitation envoyée à ${profile.username} pour rejoindre le projet #${projectId}`,
      )
      setShowInviteModal(false)
    } catch {
      alert("Erreur lors de l'envoi de l'invitation.")
    }
  }

  // Gérer les URLs des images de profil
  const getProfileImageUrl = (path: string | null): string => {
    if (!path) return '/default-prof.png'
    if (path.startsWith('http://') || path.startsWith('https://')) return path

    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000').replace(
      /\/+$/,
      '',
    )
    const p = path.startsWith('/') ? path : `/${path}`

    return `${base}${p}`
  }

  const handleEditProfile = () => {
    router.push(`/profiles/${id}/edit/`)
  }

  if (loading) return <div className="p-6 text-gray-600">Chargement...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>
  if (!profile) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-auto">
        <Header />

        <main className="p-6 flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* HEADER PROFIL */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-6">
                <img
                  src={getProfileImageUrl(profile.profile_picture)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#1c2541]"
                  alt="profile picture"
                />
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    {profile.username}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {profile.bio || 'Pas de biographie fournie.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-4 md:mt-0">
                {/* Bouton Modifier mon profil */}
                {isMyProfile && (
                  <Button
                    variant="outline"
                    onClick={handleEditProfile}
                    className="bg-[#f2a900] text-[#1c2541] hover:bg-[#f2a900]/80 border-none shadow-md"
                  >
                    <Edit size={16} className="mr-2" />
                    Modifier
                  </Button>
                )}

                {/* Bouton Inviter à contribuer */}
                {!isMyProfile && (
                  <Button
                    className="bg-[#1c2541] text-white hover:bg-[#1c2541]/80 shadow-md"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <PlusCircle size={16} className="mr-2" />
                    Inviter à contribuer
                  </Button>
                )}

                {showInviteModal && (
                  <InviteModal
                    recipientId={profile.id}
                    recipientUsername={profile.username}
                    onClose={() => setShowInviteModal(false)}
                  />
                )}
              </div>
            </div>

            {/* INFORMATIONS */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact */}
              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1c2541]">
                  <User size={ICON_SIZE} /> Détails
                </h2>

                <p className="flex items-center gap-2 text-gray-700">
                  <Mail size={ICON_SIZE} className="text-blue-500" />
                  {profile.contact_email || 'Non spécifié'}
                </p>

                <p className="flex items-center gap-2 text-gray-700">
                  <Phone size={ICON_SIZE} className="text-green-500" />
                  {profile.contact_phone || 'Non spécifié'}
                </p>

                <p className="flex items-center gap-2 text-gray-700">
                  <MapPin size={ICON_SIZE} className="text-red-500" />
                  {profile.current_city || 'Localisation non spécifiée'}
                </p>

                {/* Adresse publique du wallet */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-800 mb-1">
                    Adresse publique du wallet Lightning
                  </p>
                  <p className="text-xs text-gray-700 break-all bg-gray-100 rounded-md px-3 py-2">
                    {profile.wallet_public_address || 'Non renseignée'}
                  </p>
                </div>
              </div>

              {/* Travail */}
              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1c2541]">
                  <Briefcase size={ICON_SIZE} /> Statut Professionnel
                </h2>

                <p className="flex justify-between items-center text-gray-700 border-b pb-2">
                  <span className="font-medium">Mode de travail :</span>
                  <span className="text-sm font-semibold text-indigo-600">
                    {profile.work_mode_display}
                  </span>
                </p>

                <p className="flex justify-between items-center text-gray-700">
                  <span className="font-medium">Disponibilité :</span>
                  <span className="text-sm font-semibold text-teal-600">
                    {profile.availability_display}
                  </span>
                </p>
              </div>
            </div>

            {/* COMPETENCES */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1c2541] mb-4">
                <Award size={ICON_SIZE} /> Compétences
              </h2>

              <div className="flex flex-wrap gap-2">
                {profile.skills?.length > 0 ? (
                  profile.skills.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-3 py-1 bg-[#f2a900]/20 text-[#1c2541] rounded-full text-sm font-medium"
                    >
                      {s.name}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">Aucune compétence listée.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
