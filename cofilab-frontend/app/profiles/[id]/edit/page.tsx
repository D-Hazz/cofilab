'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { profiles, skills } from '@/services/api'
import Header from '@/app/_components/Header'
import Sidebar from '@/app/_components/Sidebar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [formData, setFormData] = useState<any>(null)
  const [allSkills, setAllSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const myProfile = await profiles.getMe()
        setFormData(myProfile)

        const skillList = await skills.list()
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0])
    }
  }

  const handleAddSkill = (skillId: string) => {
    const skillIdNum = parseInt(skillId)
    if (!formData.skills.some((s: any) => s.id === skillIdNum)) {
      const skillToAdd = allSkills.find((s) => s.id === skillIdNum)
      if (skillToAdd) {
        setFormData({
          ...formData,
          skills: [...formData.skills, skillToAdd],
        })
      }
    }
  }

  const handleRemoveSkill = (skillId: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s: any) => s.id !== skillId),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const dataToSubmit = new FormData()

      Object.keys(formData).forEach((key) => {
        if (typeof formData[key] !== 'object' || key === 'bio' || key === 'contact_phone') {
          if (
            key !== 'skills' &&
            key !== 'username' &&
            key !== 'id' &&
            key !== 'created_at' &&
            key !== 'updated_at' &&
            key !== 'wallet_public_address' // on ne l’édite pas depuis ici
          ) {
            dataToSubmit.append(key, formData[key] || '')
          }
        }
      })

      const skillIds = formData.skills.map((s: any) => s.id)
      skillIds.forEach((id: number) => dataToSubmit.append('skill_ids', id.toString()))

      if (profilePictureFile) {
        dataToSubmit.append('profile_picture', profilePictureFile)
      }

      const updatedProfile = await profiles.update(formData.id, dataToSubmit)
      router.push(`/profiles/${updatedProfile.id}`)
    } catch (err: any) {
      console.error(err.response?.data || err)
      setError('Erreur lors de la sauvegarde du profil. Vérifiez les données.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Chargement du profil...</div>
  if (error && !formData) return <div className="p-6 text-red-500">{error}</div>
  if (!formData) return null

  const selectedSkillIds = formData.skills.map((s: any) => s.id)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-auto">
        <Header />

        <main className="p-6 flex-1 overflow-auto">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg space-y-6"
          >
            <h1 className="text-2xl font-bold text-gray-900">
              Éditer le Profil de <span className="font-mono">{formData.username}</span>
            </h1>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}

            {/* PHOTO DE PROFIL ET BIO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Photo de Profil</label>
                <img
                  src={
                    profilePictureFile
                      ? URL.createObjectURL(profilePictureFile)
                      : formData.profile_picture || '/default-avatar.png'
                  }
                  alt="Aperçu"
                  className="w-full h-auto object-cover rounded-lg border"
                />
                <Input type="file" onChange={handleFileChange} accept="image/*" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bio / Présentation
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Décrivez votre expérience et ce que vous recherchez..."
                />
              </div>
            </div>

            {/* CONTACT, LOCALISATION, ADRESSE PUBLIQUE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  E-mail de contact
                </label>
                <Input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email || ''}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <Input
                  type="text"
                  name="contact_phone"
                  value={formData.contact_phone || ''}
                  onChange={handleChange}
                  placeholder="+123 456 7890"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ville actuelle
                </label>
                <Input
                  type="text"
                  name="current_city"
                  value={formData.current_city || ''}
                  onChange={handleChange}
                  placeholder="Paris, Berlin, etc."
                />
              </div>
            </div>

            {/* Adresse publique du wallet */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Adresse publique du wallet Lightning
              </label>
              <Input
                type="text"
                name="wallet_public_address"
                value={formData.wallet_public_address || ''}
                readOnly
                className="font-mono text-xs bg-gray-100"
                placeholder="Non renseignée pour le moment"
              />
              <p className="text-xs text-gray-500">
                Cette adresse publique peut être partagée pour identifier ton nœud / wallet
                Lightning sur CoFiLab.
              </p>
            </div>

            {/* MODE DE TRAVAIL ET DISPONIBILITÉ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Moyen de travail
                </label>
                <Select
                  onValueChange={(v) => handleSelectChange('work_mode', v)}
                  value={formData.work_mode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le mode de travail..." />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Disponibilité
                </label>
                <Select
                  onValueChange={(v) => handleSelectChange('availability', v)}
                  value={formData.availability}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la disponibilité..." />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITIES.map((avail) => (
                      <SelectItem key={avail.value} value={avail.value}>
                        {avail.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* COMPÉTENCES */}
            <div className="space-y-4 pt-2">
              <h2 className="text-lg font-semibold text-gray-800">
                Compétences ({formData.skills.length})
              </h2>

              <div className="flex flex-wrap gap-2 mb-3 border p-3 rounded-lg min-h-[50px]">
                {formData.skills.map((skill: any) => (
                  <Badge
                    key={skill.id}
                    className="bg-[#f2a900] text-white flex items-center space-x-1 cursor-pointer hover:bg-[#c98d00]"
                  >
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
                    .filter((skill) => !selectedSkillIds.includes(skill.id))
                    .map((skill) => (
                      <SelectItem key={skill.id} value={String(skill.id)}>
                        {skill.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* BOUTON DE SAUVEGARDE */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                <Save size={18} className="mr-2" />
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
