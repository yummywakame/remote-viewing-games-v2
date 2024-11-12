import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FloatingBubble = ({ word }) => {
  return (
    <AnimatePresence>
      {word && (
        <motion.div
          key={word}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute bottom-8 right-8 bg-white rounded-full shadow-lg px-6 py-3"
        >
          <p className="text-lg font-semibold text-gray-800">{word}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingBubble