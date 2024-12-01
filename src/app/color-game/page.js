'use client'

import ColorGame from '../components/ColorGame'
import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Shapes } from 'lucide-react'

export default function ColorGamePage() {
  return (
    <>
      {/* Full viewport background */}
      <div className="fixed-full">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
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

      {/* Color Game component */}
      <div className="relative min-h-screen">
        <ColorGame />
      </div>

      {/* Decorative bottom gradient */}
      <div className="fixed-bottom h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none"></div>
    </>
  )
}

