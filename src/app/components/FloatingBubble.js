'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FloatingBubble = ({ word }) => {
  return (
    <AnimatePresence>
      {word && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.5 }}
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 text-black px-4 py-2 rounded-full shadow-lg"
        >
          {word}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingBubble