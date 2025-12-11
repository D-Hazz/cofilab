// frontend/app/_components/ProfileCompletion.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { profiles, skills, UserProfile as UserProfileType } from '@/services/api' // Importez le type UserProfile
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, CheckCircle } from 'lucide-react'

interface ProfileCompletionProps {
    // Plus besoin de profileId car on récupère 'me' (l'utilisateur connecté)
    onComplete: () => void; // Fonction à appeler après la sauvegarde réussie
}

// Constantes pour les choix (doivent correspondre aux TextChoices de Django)
const WORK_MODES = [
    { value: 'remote', label: 'Télétravail (Remote)' },
    { value: 'onsite', label: 'En Présentiel' },
    { value: 'hybrid', label: 'Hybride' },
    { value: 'travel', label: 'Disposé à voyager' },
]

const AVAILABILITIES = [
    { value: 'project', label: 'Par projet' },
    { value: 'full_time', label: 'Plein temps' },
    { value: 'part_time', label: 'Temps partiel' },
    { value: 'hourly', label: "À l'heure" },
]

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ onComplete }) => {
    const router = useRouter()
    const [formData, setFormData] = useState<UserProfileType | null>(null)
    const [allSkills, setAllSkills] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)


    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Charger le profil de l'utilisateur connecté ('me')
                const myProfile = await profiles.getMe()
                setFormData(myProfile)
                
                // 2. Charger la liste de toutes les compétences
                const skillList = await skills.list()
                setAllSkills(skillList)
            } catch (err: any) {
                // Si la connexion échoue (pas de token), rediriger vers la connexion
                if (err.status === 401 || err.status === 403) {
                     setError("Session expirée. Veuillez vous reconnecter.");
                     router.push('/auth/login?next=/profile/complete');
                } else {
                    setError("Impossible de charger le profil. Une erreur est survenue.");
                }
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData!, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: keyof UserProfileType, value: string) => {
        setFormData({ ...formData!, [name]: value as any })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePictureFile(e.target.files[0])
        }
    }

    const handleAddSkill = (skillId: string) => {
        const skillIdNum = parseInt(skillId);
        if (!formData?.skills.some(s => s.id === skillIdNum)) {
            const skillToAdd = allSkills.find(s => s.id === skillIdNum);
            if (skillToAdd) {
                setFormData(prev => ({ 
                    ...prev!, 
                    skills: [...(prev?.skills || []), skillToAdd] 
                }));
            }
        }
    }

    const handleRemoveSkill = (skillId: number) => {
        setFormData(prev => ({
            ...prev!,
            skills: prev!.skills.filter(s => s.id !== skillId)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData) return;

        setIsSaving(true)
        setError(null)

        try {
            // Création de l'objet FormData pour prendre en charge le FileField
            const dataToSubmit = new FormData();
            
            // Ajouter tous les champs texte/select
            Object.keys(formData).forEach(key => {
                // Exclure les champs de lecture seule
                if (key !== 'skills' && key !== 'username' && key !== 'id' && key !== 'created_at' && key !== 'updated_at' && key !== 'work_mode_display' && key !== 'availability_display') {
                    const value = (formData as any)[key];
                    // N'envoyer que les champs importants pour la complétion
                    if (value !== null && value !== undefined) {
                        dataToSubmit.append(key, value.toString());
                    }
                }
            });

            // 1. Ajouter la liste des IDs de compétences (champ 'skill_ids')
            const skillIds = formData.skills.map(s => s.id);
            skillIds.forEach(id => dataToSubmit.append('skill_ids', id.toString()));

            // 2. Ajouter le fichier d'image si un nouveau fichier a été sélectionné
            if (profilePictureFile) {
                dataToSubmit.append('profile_picture', profilePictureFile);
            }
            
            // Envoi de la requête PATCH au backend sur l'ID de l'utilisateur connecté
            await profiles.update(formData.id, dataToSubmit)
            
            // Appeler la fonction de complétion réussie (qui redirigera vers le dashboard)
            onComplete();

        } catch (err: any) {
            console.error(err.response?.data || err);
            setError("Erreur lors de la sauvegarde du profil. Veuillez vérifier les champs requis.");
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return <div className="p-6 text-gray-600 flex justify-center items-center h-48">Chargement du profil...</div>
    if (error && !formData) return <div className="p-6 text-red-500">{error}</div>
    if (!formData) return null


    const selectedSkillIds = formData.skills.map(s => s.id);


    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Étape 2: Compléter votre Profil Professionnel 🚀
            </h1>
            <p className="text-sm text-gray-600 mb-4">
                Ces informations sont essentielles pour vous connecter aux projets et aux autres membres de la communauté.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}

                {/* --- PHOTO DE PROFIL ET BIO --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Photo de Profil</label>
                        <img
                            src={profilePictureFile 
                                ? URL.createObjectURL(profilePictureFile) 
                                : (formData.profile_picture || '/default-avatar.png')}
                            alt="Aperçu"
                            className="w-full h-auto object-cover rounded-lg border"
                        />
                        <Input type="file" onChange={handleFileChange} accept="image/*" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Biographie / Description professionnelle</label>
                        <Textarea
                            id="bio"
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Décrivez votre expérience et ce que vous recherchez..."
                            required
                        />
                    </div>
                </div>

                {/* --- CONTACT ET LOCALISATION --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Ville actuelle</label>
                        <Input type="text" name="current_city" value={formData.current_city || ''} onChange={handleChange} placeholder="Paris, Berlin, etc." required />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">E-mail de contact</label>
                        {/* Note: contact_email est distinct de l'email de connexion */}
                        <Input type="email" name="contact_email" value={formData.contact_email || ''} onChange={handleChange} placeholder="contact@example.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Téléphone (Optionnel)</label>
                        <Input type="text" name="contact_phone" value={formData.contact_phone || ''} onChange={handleChange} placeholder="+123 456 7890" />
                    </div>
                </div>


                {/* --- MODE DE TRAVAIL ET DISPONIBILITÉ --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Moyen de travail</label>
                        <Select onValueChange={(v) => handleSelectChange('work_mode', v)} value={formData.work_mode || ''} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le mode de travail..." />
                            </SelectTrigger>
                            <SelectContent>
                                {WORK_MODES.map(mode => (
                                    <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Disponibilité</label>
                        <Select onValueChange={(v) => handleSelectChange('availability', v)} value={formData.availability || ''} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner la disponibilité..." />
                            </SelectTrigger>
                            <SelectContent>
                                {AVAILABILITIES.map(avail => (
                                    <SelectItem key={avail.value} value={avail.value}>{avail.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* --- COMPÉTENCES --- */}
                <div className="space-y-4 pt-2">
                    <h2 className="text-lg font-semibold text-gray-800">Compétences ({formData.skills.length})</h2>
                    <div className="flex flex-wrap gap-2 mb-3 border p-3 rounded-lg min-h-[50px]">
                        {formData.skills.map(skill => (
                            <Badge key={skill.id} className="bg-[#f2a900] text-white flex items-center space-x-1 cursor-pointer hover:bg-[#c98d00]">
                                <span>{skill.name}</span>
                                <X size={14} onClick={() => handleRemoveSkill(skill.id)} />
                            </Badge>
                        ))}
                    </div>

                    <Select onValueChange={handleAddSkill}>
                        <SelectTrigger>
                            <SelectValue placeholder="Ajouter une compétence..." />
                        </SelectTrigger>
                        <SelectContent>
                            {allSkills
                                .filter(skill => !selectedSkillIds.includes(skill.id))
                                .map(skill => (
                                    <SelectItem key={skill.id} value={String(skill.id)}>{skill.name}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>


                {/* --- BOUTON FINAL --- */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSaving}>
                        <CheckCircle size={18} className="mr-2" />
                        {isSaving ? 'Sauvegarde...' : 'Compléter mon Profil'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default ProfileCompletion