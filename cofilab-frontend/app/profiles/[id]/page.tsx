'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { profiles } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import { Mail, Phone, MapPin, Briefcase, Clock, User, Award, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ICON_SIZE = 18

export default function UserProfilePage() {
    const params = useParams()
    const id = Array.isArray(params.id) ? params.id[0] : params.id
    const router = useRouter()

    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // ⚠️ TODO: Déterminer si c'est le profil de l'utilisateur connecté pour afficher le bouton d'édition
    const [isMyProfile, setIsMyProfile] = useState(false); 

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
                // 🚨 Logique à implémenter pour vérifier l'utilisateur (ex: récupérer le profil courant via getMe et comparer l'ID)
                // Pour l'instant, on suppose la vérification ailleurs ou on laisse le bouton d'édition visible.
            } catch (err: any) {
                console.error(err)
                setError("Profil introuvable ou erreur de chargement.")
            } finally {
                setLoading(false)
            }
        }
        loadProfile()
    }, [id])

    // Fonction pour générer l'URL de l'image (nécessite la variable d'environnement de base API)
    const getProfileImageUrl = (path: string | null) => {
        if (!path) return '/default-prof.png';
        // Assurez-vous que NEXT_PUBLIC_API_BASE est défini et pointe vers la racine de l'API (ex: http://localhost:8000/api/)
        const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace('/api', '') || ''; 
        return `${apiBase}${path}`; // Django renvoie le chemin relatif (ex: /media/profiles/pictures/...)
    }

    if (loading) return <div className="p-6 text-gray-600">Chargement du profil...</div>
    if (error) return <div className="p-6 text-red-500">{error}</div>
    if (!profile) return null

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-auto">
                <Header />

                <main className="p-6 flex-1 overflow-auto">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header Profil */}
                        <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between space-x-6">
                            <div className="flex items-center space-x-6">
                                <img
                                    src={getProfileImageUrl(profile.profile_picture)}
                                    alt={`Photo de profil de ${profile.username}`}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-[#1c2541]"
                                />
                                <div>
                                    <h1 className="text-3xl font-extrabold text-gray-900">{profile.username}</h1>
                                    <p className="text-gray-600 mt-1">{profile.bio || "Pas de biographie fournie."}</p>
                                </div>
                            </div>
                             {/* Bouton d'édition visible uniquement si c'est le profil de l'utilisateur connecté */}
                            {isMyProfile && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => router.push(`/profiles/edit`)}
                                    className="mt-4 md:mt-0"
                                >
                                    <Edit size={16} className="mr-2" /> Modifier
                                </Button>
                            )}
                        </div>

                        {/* Informations de base */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Contact & Localisation */}
                            <div className="bg-white p-6 rounded-xl shadow space-y-4">
                                <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#1c2541]">
                                    <User size={ICON_SIZE} /><span>Détails</span>
                                </h2>
                                {/* ... (le reste des détails du profil) ... */}
                                <p className="flex items-center space-x-2 text-gray-700">
                                    <Mail size={ICON_SIZE} className="text-blue-500" />
                                    <span>{profile.contact_email || 'Non spécifié'}</span>
                                </p>
                                <p className="flex items-center space-x-2 text-gray-700">
                                    <Phone size={ICON_SIZE} className="text-green-500" />
                                    <span>{profile.contact_phone || 'Non spécifié'}</span>
                                </p>
                                <p className="flex items-center space-x-2 text-gray-700">
                                    <MapPin size={ICON_SIZE} className="text-red-500" />
                                    <span>{profile.current_city || 'Localisation non spécifiée'}</span>
                                </p>
                            </div>

                            {/* Travail & Disponibilité */}
                            <div className="bg-white p-6 rounded-xl shadow space-y-4">
                                <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#1c2541]">
                                    <Briefcase size={ICON_SIZE} /><span>Statut Professionnel</span>
                                </h2>
                                <p className="flex justify-between items-center text-gray-700 border-b pb-2">
                                    <span className="font-medium">Moyen de travail :</span>
                                    <span className="text-sm font-semibold text-indigo-600">{profile.work_mode_display}</span>
                                </p>
                                <p className="flex justify-between items-center text-gray-700">
                                    <span className="font-medium">Disponibilité :</span>
                                    <span className="text-sm font-semibold text-teal-600">{profile.availability_display}</span>
                                </p>
                            </div>
                        </div>
                        
                        {/* Compétences */}
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h2 className="text-xl font-semibold flex items-center space-x-2 text-[#1c2541] mb-4">
                                <Award size={ICON_SIZE} /><span>Compétences</span>
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills && profile.skills.length > 0 ? (
                                    profile.skills.map((skill: any) => (
                                        <span key={skill.id} className="px-3 py-1 bg-[#f2a900]/20 text-[#1c2541] rounded-full text-sm font-medium">
                                            {skill.name}
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