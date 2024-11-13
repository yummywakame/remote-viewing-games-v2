import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FloatingBubble = ({ word }) => {
  return (
    <AnimatePresence>
      {word && (
        <motion.div
          key={word}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 right-4 bg-white bg-opacity-80 text-black px-4 py-2 rounded-full shadow-lg z-50"
        >
          {word}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingBubble