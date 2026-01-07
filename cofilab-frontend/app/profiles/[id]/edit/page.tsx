'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { profiles, skills } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Save } from 'lucide-react'

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

export default function EditProfilePage() {
  const router = useRouter()
  const params = useParams()
  
  // États
  const [formData, setFormData] = useState<any>(null)
  const [allSkills, setAllSkills] = useState<any[]>([])
  const [customSkill, setCustomSkill] = useState('')
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
      try {
        const [myProfile, skillList] = await Promise.all([
          profiles.getMe(),
          skills.list()
        ])
        setFormData(myProfile)
        setAllSkills(skillList)
      } catch (err: any) {
        setError("Impossible de charger le profil. Assurez-vous d'être connecté.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Handlers génériques
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }, [])

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setProfilePictureFile(e.target.files[0])
    }
  }, [])

  // Logique compétences optimisée
  const selectedSkillIds = formData?.skills?.map((s: any) => s.id) || []

  const addSkillIfNotExists = useCallback((skill: any) => {
    if (!formData?.skills?.some((s: any) => s.id === skill.id)) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }))
    }
  }, [formData])

  const handleAddSkillFromSelect = useCallback((skillId: string) => {
    const id = Number(skillId)
    const skill = allSkills.find((s) => s.id === id)
    if (skill) addSkillIfNotExists(skill)
  }, [allSkills, addSkillIfNotExists])

  const handleAddCustomSkill = useCallback(async () => {
    if (!customSkill.trim()) return
    try {
      const newSkill = await skills.createCustom(customSkill.trim())
      addSkillIfNotExists(newSkill)
      setCustomSkill('')
    } catch (err) {
      setError('Erreur lors de la création de la compétence personnalisée')
    }
  }, [customSkill, addSkillIfNotExists])

  const handleRemoveSkill = useCallback((skillId: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((s: any) => s.id !== skillId),
    }))
  }, [])

  // Soumission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setIsSaving(true)
    setError(null)

    try {
      const dataToSubmit = new FormData()
      const allowedFields = [
        'bio', 'contact_email', 'contact_phone', 'current_city',
        'work_mode', 'availability', 'wallet_public_address'
      ]

      // Champs scalaires
      allowedFields.forEach(key => {
        dataToSubmit.append(key, formData[key] || '')
      })

      // 🔥 COMPÉTENCES - Envoi UNIQUEMENT skill_ids (write_only)
      if (formData.skills && formData.skills.length > 0) {
        formData.skills.forEach((s: any) => {
          dataToSubmit.append('skill_ids', s.id.toString())  // ✅ Correct
        })
      } else {
        // Liste vide explicite pour clear skills
        dataToSubmit.append('skill_ids', '')  
      }

      // Photo
      if (profilePictureFile) {
        dataToSubmit.append('profile_picture', profilePictureFile)
      }

      const updatedProfile = await profiles.update(formData.id, dataToSubmit)
      router.push(`/profiles/${updatedProfile.id}`)
    } catch (err: any) {
      console.error(err)
      setError('Erreur lors de la sauvegarde. Vérifiez vos données.')
    } finally {
      setIsSaving(false)
    }
  }, [formData, profilePictureFile, router])


  // Loading & Error states
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Chargement du profil...</div>
      </div>
    )
  }

  if (error && !formData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="p-6 text-red-500 max-w-md text-center">{error}</div>
      </div>
    )
  }

  if (!formData) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Éditer le profil de{' '}
                <span className="font-mono text-[#f2a900]">{formData.username}</span>
              </h1>
              {error && (
                <p className="mt-2 text-red-500 bg-red-50 p-3 rounded-lg text-sm">{error}</p>
              )}
            </div>

            {/* Photo & Bio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Photo de profil</label>
                <div className="relative">
                  <img
                    src={profilePictureFile 
                      ? URL.createObjectURL(profilePictureFile)
                      : formData.profile_picture || '/default-avatar.png'
                    }
                    alt="Photo de profil"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
                <Input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*"
                  className="text-xs"
                />
              </div>
              <div className="lg:col-span-2 space-y-3">
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <Textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Présentez votre expérience, compétences et ce que vous recherchez..."
                  className="resize-vertical"
                />
              </div>
            </div>

            {/* Contact & Localisation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                <Input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email || ''}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <Input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleChange}
                  placeholder="+243 999 123 456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville actuelle</label>
                <Input
                  name="current_city"
                  value={formData.current_city || ''}
                  onChange={handleChange}
                  placeholder="Goma, Kinshasa, etc."
                />
              </div>
            </div>

            {/* Wallet Lightning */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Adresse publique Lightning
              </label>
              <Input
                name="wallet_public_address"
                value={formData.wallet_public_address || ''}
                onChange={handleChange}
                className="font-mono text-xs"
                placeholder="lnurl1... ou node pubkey"
              />
              <p className="text-xs text-gray-500">
                Adresse publique pour identifier votre nœud/wallet Lightning
              </p>
            </div>

            {/* Work Mode & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Mode de travail</label>
                <Select onValueChange={(v) => handleSelectChange('work_mode', v)} value={formData.work_mode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
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
                <Select onValueChange={(v) => handleSelectChange('availability', v)} value={formData.availability}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITIES.map(avail => (
                      <SelectItem key={avail.value} value={avail.value}>{avail.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Compétences */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Compétences ({formData.skills.length})
                </h2>
                
                {/* Compétences ajoutées */}
                <div className="flex flex-wrap gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl min-h-[60px] bg-gray-50">
                  {formData.skills.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Aucune compétence ajoutée</p>
                  ) : (
                    formData.skills.map((skill: any) => (
                      <Badge
                        key={skill.id}
                        className="bg-gradient-to-r from-[#f2a900] to-[#c98d00] text-white flex items-center gap-1 px-3 py-1 cursor-pointer hover:from-[#e69500] transition-all"
                      >
                        <span className="font-medium">{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 -m-0.5"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                {/* Ajout compétence personnalisée */}
                <div className="flex gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
                  <Input
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Nouvelle compétence (ex: Blockchain Dev)..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomSkill}
                    disabled={!customSkill.trim()}
                  >
                    Créer
                  </Button>
                </div>

                {/* Sélecteur compétences existantes */}
                <div className="pt-2">
                  <Select onValueChange={handleAddSkillFromSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ajouter une compétence existante..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allSkills
                        .filter(skill => !selectedSkillIds.includes(skill.id))
                        .map(skill => (
                          <SelectItem key={skill.id} value={String(skill.id)}>
                            {skill.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/profiles/${formData.id}`)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving || loading}>
                <Save size={18} className="mr-2" />
                {isSaving ? 'Sauvegarde en cours...' : 'Sauvegarder le profil'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
