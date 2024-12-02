'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Header = ({ isListening, isSpeaking, onOpenUserPreferences, onOpenGameSettings, isGamePlaying, onExitGame }) => {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm z-[200]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center h-16">
          {/* Left side */}
          <div className="absolute left-0 flex items-center space-x-4">
            <button
              onClick={onOpenUserPreferences}
              className={`text-gray-400 hover:text-white transition-colors ${isGamePlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Open user preferences"
              disabled={isGamePlaying}
            >
              <User size={24} />
            </button>
          </div>

          {/* Center title */}
          <Link
            href="/"
            className={`text-white text-xl font-bold hover:text-gray-300 transition-colors ${isHomePage ? 'pointer-events-none' : ''}`}
            onClick={(e) => {
              if (!isHomePage) {
                e.preventDefault();
                onExitGame();
              }
            }}
          >
            MindSight Games
          </Link>

          {/* Right side */}
          <div className="absolute right-0 flex items-center space-x-4">
            {!isHomePage && (
              <>
                {isListening && !isSpeaking ? (
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                ) : isSpeaking ? (
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                )}
                {onOpenGameSettings && (
                  <motion.button
                    onClick={onOpenGameSettings}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Open game settings"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      animate={{ rotate: 0 }}
                      whileHover={{ rotate: 180 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Settings size={24} />
                    </motion.div>
                  </motion.button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
