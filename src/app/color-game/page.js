'use client'

import { useState, useCallback } from 'react'
import ColorGame from '../components/ColorGame'
import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Shapes } from 'lucide-react'

export default function ColorGamePage() {
  const [gameState, setGameState] = useState('initial')

  const handleGameStateChange = useCallback((newState) => {
    setGameState(newState)
  }, [])

  const handleEndGame = useCallback(() => {
    setGameState('initial')
  }, [])

  return (
    <>
      {/* Full viewport background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
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

      {/* Color Game component */}
      <div className="relative min-h-screen flex items-center justify-center">
        <ColorGame 
          onGameStateChange={handleGameStateChange}
          endGame={handleEndGame}
        />
      </div>

      {/* Decorative bottom gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </>
  )
}

