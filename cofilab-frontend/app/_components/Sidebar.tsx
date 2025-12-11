'use client'

import Link from 'next/link'
import { 
  Home, ClipboardList, Users, PlusCircle, LogOut, 
  LogIn, User, UserPlus, Edit, Bell, 
  Wallet
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { logoutUser } from '@/services/auth'
import { useRouter } from 'next/navigation'
import NotificationsModal from '@/app/_components/NotificationsModal'
import notificationsApi from '@/services/api'

export default function Sidebar() {
    const router = useRouter()

    const [notifOpen, setNotifOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const [isAuth, setIsAuth] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    const menuRef = useRef<HTMLDivElement>(null)

    const menuItems = [
        { name: 'Dashboard', href: '/projects', icon: Home },
        { name: 'Mes Projets', href: '/projects/mine', icon: ClipboardList },
        { name: 'Contributeurs', href: '/profiles', icon: Users },
        { name: 'Invitations', href: '/invitations', icon: UserPlus },
        { name: 'Nouveau Projet', href: '/projects/new', icon: PlusCircle },
        { name: 'Mon wallet', href: '/wallet', icon: Wallet },
    ]

    // 🔔 Charge les notifications + état auth
    useEffect(() => {
    const load = async () => {
        try {
        const token = localStorage.getItem('token')
        const userId = localStorage.getItem('userId')

        setIsAuth(!!token)
        setCurrentUserId(userId)

        if (!token) return // ⚡️ Ne pas appeler l'API si non authentifié

        const res = await notifications.list()
        setUnreadCount(res.filter((n: any) => !n.read).length)

        } catch (e: any) {
        console.error("Erreur notifications:", e.detail || e.message || e)
        }
    }
    load()
    }, [])


    // Clique hors du menu → fermer
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleLogout = () => {
        logoutUser()
        setIsAuth(false)
        setCurrentUserId(null)
        setIsProfileMenuOpen(false)
        router.push('/auth/login')
    }

    const handleLogin = () => router.push('/login')

    return (
        <>
            {/* 🟦 MODAL NOTIFICATIONS */}
            <NotificationsModal
                open={notifOpen}
                onClose={async () => {
                    setNotifOpen(false)
                    const res = await notifications.list()
                    setUnreadCount(res.filter((n: any) => !n.read).length)
                }}
            />

            <aside className="flex flex-col h-screen bg-[#0b132b] text-white shadow-md w-16 md:w-64 transition-width duration-300">

                {/* LOGO */}
                <div className="text-xl font-bold mb-6 text-[#f2a900] text-center md:text-left px-2 pt-4">
                    <span className="hidden md:inline">CoFiLab</span>
                    <span className="md:hidden">CL</span>
                </div>

                {/* 🔔 NOTIFICATIONS BUTTON */}
                <button
                    onClick={() => isAuth && setNotifOpen(true)}
                    disabled={!isAuth}
                    className="relative flex items-center justify-center md:justify-start gap-3 p-2 mb-2 rounded-lg bg-[#1c2541] hover:bg-[#3a506b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    <Bell className="w-5 h-5" />
                    <span className="hidden md:inline">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 bg-red-600 text-xs text-white w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                        </span>
                    )}
                </button>


                {/* MENU */}
                <nav className="flex-1 flex flex-col space-y-2 px-1 md:px-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="relative group flex items-center justify-center md:justify-start gap-0 md:gap-3 p-2 rounded-lg hover:bg-[#1c2541] transition-colors"
                            >
                                <Icon className="w-5 h-5" />
                                <span className="hidden md:inline">{item.name}</span>

                                {/* Tooltip mobile */}
                                <span
                                    className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity md:hidden"
                                >
                                    {item.name}
                                </span>
                            </Link>
                        )
                    })}
                </nav>


                {/* Connexion / Déconnexion / Profil (Bas de page) */}
                <div className="px-1 md:px-2 mb-3 mt-auto" ref={menuRef}>
                    {isAuth ? (
                        // Menu Drop-up pour Utilisateur Authentifié
                        <div className="relative">
                            {/* Bouton pour ouvrir le menu */}
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center justify-center md:justify-start gap-2 w-full p-2 rounded-lg bg-[#1c2541] hover:bg-[#3a506b] transition-colors text-sm text-white"
                            >
                                <User className="w-5 h-5" />
                                <span className="hidden md:inline">Mon Compte</span>
                            </button>

                            {/* Drop-up Menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute bottom-full mb-2 left-0 right-0 md:w-full bg-gray-700 rounded-lg shadow-xl z-10">
                                    
                                    {/* Lien 1: Voir mon Profil (Rond-point vers l'ID du profil si connu, ou "/profiles/me") */}
                                    <Link
                                        href={currentUserId ? `/profiles/${currentUserId}/` : "/profiles/me"} 
                                        onClick={() => setIsProfileMenuOpen(false)}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-600 rounded-t-lg transition-colors text-white text-sm md:justify-start justify-center"
                                    >
                                        <User className="w-5 h-5" />
                                        <span className="hidden md:inline">Voir mon Profil</span>
                                    </Link>

                                    {/* Lien 2: Modifier mon Profil (Ajout du bouton d'édition) */}
                                    {currentUserId && (
                                        <Link
                                            href={`/profiles/${currentUserId}/edit`}
                                            onClick={() => setIsProfileMenuOpen(false)}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-600 transition-colors text-white text-sm md:justify-start justify-center"
                                        >
                                            <Edit className="w-5 h-5 text-[#f2a900]" />
                                            <span className="hidden md:inline text-[#f2a900]">Modifier le Profil</span>
                                        </Link>
                                    )}
                                    
                                    {/* Option Déconnexion (coins arrondis uniquement si pas de lien d'édition au-dessus) */}
                                    <button
                                        onClick={handleLogout}
                                        className={`bg-red-700 text-white flex items-center justify-center md:justify-start gap-2 w-full p-2 hover:bg-gray-600 transition-colors text-sm 
                                            ${currentUserId ? 'rounded-b-lg' : 'rounded-b-lg rounded-t-lg'}`}
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="hidden md:inline">Déconnexion</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Bouton Connexion (non authentifié)
                        <button
                            onClick={handleLogin}
                            className="flex items-center justify-center md:justify-start gap-2 w-full p-2 rounded-lg bg-[#1c2541] hover:bg-[#3a506b] transition-colors text-sm text-green-400"
                        >
                            <LogIn className="w-5 h-5" />
                            <span className="hidden md:inline">Connexion / Inscription</span>
                        </button>
                    )}
                </div>

                {/* FOOTER */}
                <div className="mt-auto text-gray-400 text-xs px-2 text-center md:text-left pb-4 pt-2">
                    <span className="hidden md:inline">© 2025 CoFiLab</span>
                    <span className="md:hidden">© 25</span>
                </div>
            </aside>
        </>
    )
}
