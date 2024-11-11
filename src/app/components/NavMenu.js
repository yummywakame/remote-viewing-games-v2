'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="text-xl font-bold"
            onClick={() => closeMenu()}
          >
            Remote Viewing Games
          </Link>
          <button
            onClick={toggleMenu}
            className="p-2 focus:outline-none"
            aria-expanded={isOpen}
            aria-label="Toggle menu"
          >
            <span className="sr-only">Open main menu</span>
            <div className="w-6 h-6 flex flex-col justify-between">
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      <div 
        className={`absolute left-0 right-0 overflow-hidden transition-all duration-300 px-4 bg-gray-900/90 ${
          isOpen ? 'max-h-64' : 'max-h-0'
        }`}
      >
        <nav className="py-2 space-y-2 max-w-7xl mx-auto">
          <Link href="/color-game" className="block py-2 pl-2.5 text-white hover:text-gray-300 transition-colors" onClick={closeMenu}>Color Game</Link>
          <Link href="/shape-game" className="block py-2 pl-2.5 text-white hover:text-gray-300 transition-colors" onClick={closeMenu}>Shape Game</Link>
          <Link href="/number-game" className="block py-2 pl-2.5 text-white hover:text-gray-300 transition-colors" onClick={closeMenu}>Number Game</Link>
          <Link href="/preferences" className="block py-2 pl-2.5 text-white hover:text-gray-300 transition-colors" onClick={closeMenu}>Preferences</Link>
        </nav>
      </div>
    </header>
  )
}