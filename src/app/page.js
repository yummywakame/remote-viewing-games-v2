'use client'

import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Shapes } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* Full viewport background */}
      <div className="fixed inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        </div>
      </div>

      {/* Floating icons */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
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
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold text-white mb-8"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Hi there!
          </motion.h1>

          <motion.div
            className="max-w-2xl mx-auto space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              This app was created to allow you to practice MindSight without a partner. 
              Remember to put your blindfold on before starting a game.
            </p>
            
            <p className="text-lg text-gray-400">
              More games are coming soon!
            </p>

            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/color-game"
                className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Eye className="mr-2" size={20} />
                Color Game
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative bottom gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </>
  )
}