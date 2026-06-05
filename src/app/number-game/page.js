'use client'

import NumberGame from '../components/NumberGame'
import { motion } from 'framer-motion'
import { Sparkles, Eye, Brain, Hash } from 'lucide-react'

export default function NumberGamePage() {
  return (
    <>
      {/* Floating icons */}
      <motion.div
        className="fixed-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {[Eye, Brain, Hash, Sparkles].map((Icon, index) => (
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

      {/* Number Game component */}
      <div className="relative min-h-screen">
        <NumberGame />
      </div>
    </>
  )
}
