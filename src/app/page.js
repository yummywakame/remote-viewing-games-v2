'use client'

import { motion } from 'framer-motion'
import { Sparkles, Eye, EyeClosed, Brain, Shapes, Hash, Moon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import CosmicBackground from './components/CosmicBackground'

// Renders the same suit glyph used by the floating background icons — looks
// more like a real card suit than lucide's line-art Spade icon did.
const SpadeIcon = ({ className = '' }) => (
  <span className={`${className} inline-flex items-center justify-center text-6xl leading-none`} aria-hidden="true">
    ♠
  </span>
)

const GAMES = [
  { name: 'Color Game', href: '/color-game', icon: Eye, color: 'from-purple-600 to-blue-600', available: true },
  { name: 'Shape Game', href: '/shape-game', icon: Shapes, color: 'from-blue-600 to-green-500', available: true },
  { name: 'Number Game', href: '/number-game', icon: Hash, color: 'from-green-600 to-orange-600', available: true },
  { name: 'Card Game', href: '/card-game', icon: SpadeIcon, color: 'from-orange-600 to-pink-800', available: true },
]

export default function Home() {
  const [userName, setUserName] = useState(
    typeof window !== 'undefined'
      ? DOMPurify.sanitize(localStorage.getItem('userPreferencesName') || '')
      : ''
  )

  useEffect(() => {
    const syncName = () => setUserName(DOMPurify.sanitize(localStorage.getItem('userPreferencesName') || ''))
    syncName()
    window.addEventListener('preferencesUpdated', syncName)
    return () => window.removeEventListener('preferencesUpdated', syncName)
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="fixed-full">
        <CosmicBackground />
      </div>

      {/* Floating icons */}
      <motion.div
        className="fixed-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[
          { type: 'icon', Icon: Eye,      size: 36 },
          { type: 'icon', Icon: Brain,    size: 32 },
          { type: 'icon', Icon: Shapes,   size: 40 },
          { type: 'icon', Icon: Sparkles, size: 48 },
          { type: 'icon', Icon: Moon,     size: 28 },
          { type: 'text', char: '♣',      size: 32 },
          { type: 'icon', Icon: EyeClosed, size: 36 },
        ].map((item, index) => (
          <motion.div
            key={index}
            className="absolute text-white/20"
            initial={{ y: 0 }}
            animate={{
              y: [-20, 20, -20],
              x: index % 2 === 0 ? [-10, 10, -10] : [10, -10, 10],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: index * 0.5,
            }}
            style={{
              left: `${5 + index * 14}%`,
              top: `${15 + (index % 3) * 25}%`,
            }}
          >
            {item.type === 'icon'
              ? <item.Icon size={item.size} />
              : <span style={{ fontSize: item.size }}>♣</span>
            }
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="relative min-h-full flex flex-col px-4 sm:px-6 md:px-10">
        <motion.div
          className="text-center max-w-4xl mx-auto w-full my-auto pt-8 pb-20 min-[480px]:pb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-3xl min-[480px]:text-5xl md:text-6xl font-bold text-white/50 mb-3 min-[480px]:mb-8"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {userName ? `Hi ${userName}!` : 'Hi there!'}
          </motion.h2>

          <motion.div
            className="max-w-2xl mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-base min-[480px]:text-xl md:text-2xl text-gray-300 leading-relaxed">
              Challenge Your Perception,<br />Sharpen Your Mind's Eye!
            </p>

            <motion.div
              className="mt-12 grid grid-cols-1 min-[480px]:grid-cols-2 gap-4 md:gap-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {GAMES.map((game, index) => (
                <motion.div
                  key={game.name}
                  className="h-full"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Link href={game.href} scroll={false} className="block h-full">
                    <motion.div
                      className="group relative flex flex-col items-center justify-center h-full p-4 sm:p-5 md:p-6 rounded-2xl backdrop-blur-lg transition-shadow duration-300 shadow-lg hover:shadow-xl"
                      whileHover={game.available ? { scale: 1.05, y: -8 } : {}}
                      whileTap={game.available ? { scale: 0.95 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      {/* Background layer — faded at rest, full on hover */}
                      <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-50 group-hover:opacity-100 ${
                        game.available ? `bg-gradient-to-br ${game.color}` : 'bg-gray-700'
                      }`} />
                      {/* Content — always fully opaque */}
                      <div className="relative z-10 flex flex-col items-center">
                        <game.icon className="w-12 h-12 mb-4 text-white" />
                        <h2 className="text-xl font-bold text-white mb-2">{game.name}</h2>
                        {game.available ? (
                          <p className="text-sm text-gray-200">Start Playing</p>
                        ) : (
                          <p className="text-sm text-gray-400">Coming Soon</p>
                        )}
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <p className="text-sm min-[480px]:text-lg text-gray-400 mt-8">
              This app was created to allow you to test your MindSight skills without a partner. 
              The first time you play each game, please play it without your blindfold on so that you can get accustomed to how it looks and works.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

