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
          className="fixed top-[90px] left-0 right-0 flex justify-center z-[300]"
        >
          <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
            <p className="text-xl font-bold text-gray-900">{word}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

