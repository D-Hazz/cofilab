'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { profiles } from '@/services/profiles'
import Sidebar from '@/app/_components/Sidebar'
import Header from '@/app/_components/Header'
import { MapPin, Mail } from 'lucide-react'

const DEFAULT_IMAGE = '/default-prof.png'

interface UserProfile {
  id: number
  username: string
  bio: string | null
  current_city: string | null
  contact_email: string | null
  profile_picture: string | null
  skills: { id: number; name: string }[]
}

const getProfileImageUrl = (path: string | null): string => {
  if (!path) return DEFAULT_IMAGE
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000').replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`

  return `${base}${p}`
}

export default function UsersListPage() {
  const router = useRouter()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔍 Recherche + filtres
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [sort, setSort] = useState<'az' | 'city'>('az')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await profiles.list()
        setUsers(data)
      } catch (err) {
        console.error(err)
        setError('Impossible de charger les profils.')
      } finally {
        setLoading(false)
      }
    }
    loadUsers()
  }, [])

  // 📌 Villes et compétences uniques pour les filtres
  const cities = useMemo(() => {
    const setCity = new Set(users.map(u => u.current_city).filter(Boolean))
    return Array.from(setCity)
  }, [users])

  const skills = useMemo(() => {
    const setSkill = new Set(users.flatMap(u => u.skills?.map(s => s.name)))
    return Array.from(setSkill)
  }, [users])

  // 🎯 FILTRAGE + TRI
  const filtered = useMemo(() => {
    let data = [...users]

    // Recherche globale
    if (search.trim() !== '') {
      const s = search.toLowerCase()
      data = data.filter(u =>
        u.username.toLowerCase().includes(s) ||
        (u.bio || '').toLowerCase().includes(s)
      )
    }

    // Filtre ville
    if (cityFilter !== '') {
      data = data.filter(u => u.current_city === cityFilter)
    }

    // Filtre compétence
    if (skillFilter !== '') {
      data = data.filter(u =>
        u.skills?.some(s => s.name === skillFilter)
      )
    }

    // Tri
    if (sort === 'az') {
      data.sort((a, b) => a.username.localeCompare(b.username))
    } else if (sort === 'city') {
      data.sort((a, b) => (a.current_city || '').localeCompare(b.current_city || ''))
    }

    return data
  }, [users, search, cityFilter, skillFilter, sort])

  if (loading) return <div className="p-6 text-gray-600">Chargement...</div>
  if (error) return <div className="p-6 text-red-500">{error}</div>

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-auto">
        <Header />

        <main className="p-6 flex-1 overflow-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Utilisateurs</h1>

          {/* 🔎 BARRE DE RECHERCHE + FILTRES */}
          <div className="flex flex-wrap gap-3 mb-6">

            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              className="px-4 py-2 border rounded-lg w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="px-4 py-2 border rounded-lg"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">Ville — Toutes</option>
              {cities.map((v) => <option key={v}>{v}</option>)}
            </select>

            <select
              className="px-4 py-2 border rounded-lg"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">Compétence — Toutes</option>
              {skills.map((s) => <option key={s}>{s}</option>)}
            </select>

            <select
              className="px-4 py-2 border rounded-lg"
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
            >
              <option value="az">Tri A → Z</option>
              <option value="city">Tri par ville</option>
            </select>
          </div>

          {/* 🧑‍💼 LISTE DES UTILISATEURS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((user) => {
              const maxToShow = user.skills.slice(0, 3)
              const remaining = user.skills.length - maxToShow.length

              return (
                <div
                  key={user.id}
                  onClick={() => router.push(`/profiles/${user.id}`)}
                  className="cursor-pointer bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col items-center text-center"
                >
                  <img
                    src={getProfileImageUrl(user.profile_picture)}
                    alt={user.username}
                    className="w-20 h-20 rounded-full object-cover border-4 border-[#1c2541]"
                  />

                  <h2 className="text-xl font-bold mt-4">{user.username}</h2>

                  <p className="text-gray-600 text-sm line-clamp-2 mt-1 mb-3">
                    {user.bio || "Aucune biographie."}
                  </p>

                  <div className="flex items-center text-gray-700 text-sm space-x-2">
                    <MapPin size={16} className="text-red-500" />
                    <span>{user.current_city || "Non spécifié"}</span>
                  </div>

                  <div className="flex items-center text-gray-600 text-sm space-x-2 mt-1">
                    <Mail size={16} className="text-blue-500" />
                    <span>{user.contact_email || "—"}</span>
                  </div>

                  {/* ⭐ COMPÉTENCES LIMITÉES */}
                  <div className="text-xs text-gray-500 mt-3 flex flex-wrap justify-center gap-1">
                    {maxToShow.map((skill) => (
                      <span key={skill.id} className="px-2 py-0.5 bg-gray-100 rounded-full">
                        {skill.name}
                      </span>
                    ))}

                    {remaining > 0 && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                        +{remaining} autres
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
