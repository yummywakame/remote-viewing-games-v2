'use client'

import { useCallback } from 'react'
import ColorGame from '../components/ColorGame'
import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Shapes } from 'lucide-react'

export default function ColorGamePage() {
  const handleGameStateChange = useCallback(() => {}, [])

  return (
    <>
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
        <ColorGame onGameStateChange={handleGameStateChange} />
      </div>
    </>
  )
}

