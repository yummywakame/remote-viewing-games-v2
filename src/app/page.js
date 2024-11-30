'use client'

import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Shapes, Hexagon, Hash } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const savedName = localStorage.getItem('userPreferencesName') || ''
    setUserName(savedName)
  }, [])

  const games = [
    { name: 'Color Game', href: '/color-game', icon: Eye, color: 'from-purple-600 to-blue-600', available: true },
    { name: 'Shape Game', href: '/shape-game', icon: Shapes, color: 'from-blue-600 to-green-500', available: true },
    { name: 'Number Game', href: '#', icon: Hash, color: 'from-orange-600 to-red-600', available: false },
  ]

  return (
    <div className="overflow-auto">
      {/* Full viewport background */}
      <div className="fixed-full">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        </div>
      </div>

      {/* MindSight Games title */}
      <div className="fixed-top z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-16">
            <h1 className="text-white text-xl font-bold">
              MindSight Games
            </h1>
          </div>
        </div>
      </div>

      {/* Floating icons */}
      <motion.div
        className="fixed-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[Eye, Brain, Shapes, Sparkles].map((Icon, index) => (
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
              left: `${15 + index * 25}%`,
              top: `${20 + (index % 3) * 20}%`,
            }}
          >
            <Icon size={24 + index * 8} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main content */}
      <div className="relative min-h-screen flex items-center justify-center px-10">
        <motion.div
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-5xl md:text-6xl font-bold text-white mb-8"
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
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Challenge Your Perception,<br />Sharpen Your Mind!
            </p>

            <motion.div
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {games.map((game, index) => (
                <motion.div
                  key={game.name}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Link href={game.href}>
                    <motion.div
                      className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-opacity-20 backdrop-blur-lg ${
                        game.available ? `bg-gradient-to-br ${game.color}` : 'bg-gray-700'
                      } transition-all duration-300 shadow-lg hover:shadow-xl`}
                      whileHover={game.available ? { scale: 1.05, y: -5 } : {}}
                      whileTap={game.available ? { scale: 0.95 } : {}}
                    >
                      <game.icon className="w-12 h-12 mb-4 text-white" />
                      <h2 className="text-xl font-bold text-white mb-2">{game.name}</h2>
                      {game.available ? (
                        <p className="text-sm text-gray-200">Start Playing</p>
                      ) : (
                        <p className="text-sm text-gray-400">Coming Soon</p>
                      )}
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            <p className="text-lg text-gray-400 mt-8">
              This app was created to allow you to test your MindSight skills without a partner. 
              The first time you play each game, please play it without your blindfold on so that you can get accustomed to how it looks and works.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative bottom gradient */}
      <div className="fixed-bottom h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </div>
  )
}