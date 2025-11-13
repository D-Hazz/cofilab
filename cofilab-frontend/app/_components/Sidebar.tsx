'use client'

import Link from 'next/link'
import { Home, ClipboardList, Users, PlusCircle } from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', href: '/projects', icon: Home },
    { name: 'Mes Projets', href: '/projects/mine', icon: ClipboardList },
    { name: 'Contributeurs', href: '/contributors', icon: Users },
    { name: 'Nouveau Projet', href: '/projects/new', icon: PlusCircle },
  ]

  // Tooltip state for touch devices
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <aside className="flex flex-col h-screen bg-[#0b132b] text-white shadow-md
                       w-16 md:w-64 transition-width duration-300">
      {/* Logo */}
      <div className="text-xl font-bold mb-6 text-[#f2a900] text-center md:text-left px-2">
        <span className="hidden md:inline">Menu</span>
        <span className="md:hidden">CL</span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col space-y-2 px-1 md:px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative group flex items-center justify-center md:justify-start gap-0 md:gap-3 p-2 rounded-lg hover:bg-[#1c2541] transition-colors"
              onMouseEnter={() => setTooltip(item.name)}
              onMouseLeave={() => setTooltip(null)}
              onTouchStart={() => setTooltip(item.name)}
              onTouchEnd={() => setTooltip(null)}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden md:inline">{item.name}</span>

              {/* Tooltip for small screens */}
              <span
                className={`absolute left-16 top-1/2 -translate-y-1/2
                            bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg
                            whitespace-nowrap opacity-0 group-hover:opacity-100
                            transition-opacity md:hidden`}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto text-gray-400 text-xs px-2 text-center md:text-left pb-4">
        <span className="hidden md:inline">© 2025 CoFiLab</span>
        <span className="md:hidden">© 25</span>
      </div>
    </aside>
  )
}
