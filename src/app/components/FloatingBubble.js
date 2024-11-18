'use client'

import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingBubble({ word = '' }) {
  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-[50px] right-[50px] z-[200]"
        >
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
            <p className="text-xl font-bold text-gray-900">{word}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}