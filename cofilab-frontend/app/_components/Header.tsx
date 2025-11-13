// Header.tsx
'use client'

import TopbarUser from './TopbarUser'

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white text-black px-4 md:px-6 py-4 shadow-sm">
      {/* Logo / Nom de l’app */}
      <h1 className="text-xl md:text-2xl font-bold text-[#f2a900] cursor-pointer">
        ⚡ CoFiLab
      </h1>
      {/* Topbar user / solde */}
      <TopbarUser />
    </header>
  )
}
