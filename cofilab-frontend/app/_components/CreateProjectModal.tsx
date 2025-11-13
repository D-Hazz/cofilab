'use client'

import { useState, useEffect } from 'react'
import { PlusCircle, Loader2, ImageIcon, X } from 'lucide-react'
import { projects } from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface CreateProjectModalProps {
  onProjectCreated: () => void
}

interface ProjectFormData {
  name: string
  description: string
  total_budget: string
  is_public: boolean
  project_image: File | null
}

export default function CreateProjectModal({ onProjectCreated }: CreateProjectModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    total_budget: '0',
    is_public: true,
    project_image: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    // build preview when project_image changes
    if (formData.project_image) {
      const url = URL.createObjectURL(formData.project_image)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setImagePreview(null)
    }
  }, [formData.project_image])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_public: checked }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData(prev => ({ ...prev, project_image: file }))
    } else {
      setFormData(prev => ({ ...prev, project_image: null }))
    }
  }

  const clearImage = () => {
    setFormData(prev => ({ ...prev, project_image: null }))
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Le nom du projet est obligatoire.')
      return
    }

    const budgetNum = parseFloat(formData.total_budget)
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('Veuillez saisir un budget valide (> 0).')
      return
    }

    setIsLoading(true)

    try {
      const data = new FormData()
      data.append('name', formData.name.trim())
      data.append('description', formData.description.trim())
      data.append('total_budget', budgetNum.toString())
      data.append('is_public', formData.is_public ? 'true' : 'false')

      if (formData.project_image) {
        data.append('project_image', formData.project_image)
      }

      await projects.create(data)

      toast.success('Projet créé avec succès !')
      onProjectCreated()
      setIsOpen(false)
      setFormData({
        name: '',
        description: '',
        total_budget: '0',
        is_public: true,
        project_image: null
      })
      setImagePreview(null)
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
      toast.error('Erreur lors de la création du projet, veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-[#f2a900] hover:bg-[#d39400] text-white">
          <PlusCircle size={18} /> Créer un projet
        </Button>
      </DialogTrigger>

      <DialogContent className="mx-4 w-full max-w-2xl rounded-lg p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">Créer un nouveau projet</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Remplissez les informations ci-dessous pour lancer votre nouveau projet CoFiLab.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 grid gap-6">
          {/* Row: Name + Budget */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-center">
            <div className="sm:col-span-8">
              <Label htmlFor="name" className="mb-1 font-medium">Nom du projet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex. Programme d'alimentation en micro-subventions"
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div className="sm:col-span-4">
              <Label htmlFor="total_budget" className="mb-1 font-medium">Budget (sats)</Label>
              <Input
                id="total_budget"
                type="number"
                min={1}
                value={formData.total_budget}
                onChange={handleChange}
                required
                placeholder="10000"
                disabled={isLoading}
                className="w-full"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="mb-1 font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Décrivez brièvement l'objectif, les bénéficiaires et les résultats attendus..."
              disabled={isLoading}
              rows={4}
              className="w-full resize-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Astuce: soyez concis — 1 à 3 phrases suffisent pour un aperçu clair.
            </p>
          </div>

          {/* Image upload + preview */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 items-start">
            <div className="sm:col-span-8">
              <Label className="mb-1 font-medium">Image du projet</Label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="project_image"
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <ImageIcon size={16} />
                  <span className="text-sm">Choisir une image</span>
                </label>
                <input
                  id="project_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={isLoading}
                />
                <span className="text-xs text-muted-foreground">PNG, JPG, ≤ 5MB</span>
              </div>
            </div>

            <div className="sm:col-span-4">
              <Label className="mb-1 font-medium">Aperçu</Label>
              <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md border bg-neutral-50">
                {imagePreview ? (
                  <div className="relative h-full w-full">
                    <img
                      src={imagePreview}
                      alt="Aperçu projet"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/60 p-1 text-white"
                      aria-label="Supprimer l'image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-xs text-muted-foreground">
                    <span>Pas d'image</span>
                    <span className="text-xxs">L'image est optionnelle</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Public switch */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={handleSwitchChange}
                disabled={isLoading}
              />
              <Label htmlFor="is_public" className="font-medium">Rendre public</Label>
            </div>

            <div className="text-sm text-muted-foreground">
              Le projet public sera visible par tous les utilisateurs.
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
              }}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>

            <Button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1c2541] hover:bg-[#0b132b]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> En cours...
                </>
              ) : (
                'Créer le projet'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
