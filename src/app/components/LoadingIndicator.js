'use client'

import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'

// Generic "getting ready" indicator — shown wherever a game is waiting on something
// (e.g. fetching the intro voice line) before it can continue.
export default function LoadingIndicator({ label = 'Getting ready…' }) {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-[120]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-white/15 border-t-white/70"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Eye className="text-white" size={26} />
          </motion.div>
        </div>
        <p className="text-white/70 text-sm tracking-wide">{label}</p>
      </div>
    </motion.div>
  )
}
