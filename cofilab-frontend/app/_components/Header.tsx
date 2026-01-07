// Header.tsx
'use client'

import Image from 'next/image'
import TopbarUser from './TopbarUser'

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white text-black px-4 md:px-6 py-4 shadow-sm">
      {/* Logo / Nom de l’app */}
      <div className="flex items-center gap-2 cursor-pointer">
        <Image
          src="/logo_cofilab.png"
          alt="CoFiLab"
          width={40}
          height={40}
          className="h-8 w-auto md:h-9"
          priority
        />
        <span className="text-xl md:text-2xl font-bold text-[#f2a900]">
          CoFiLab
        </span>
      </div>

      {/* Topbar user / solde */}
      <TopbarUser />
    </header>
  )
}
