'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { motion, usePresence } from 'framer-motion'

export default function GameSettings({ title, onClose, onSave, colorTable, selectedColors }) {
  const [localSelectedColors, setLocalSelectedColors] = React.useState(selectedColors)
  const modalRef = React.useRef(null)
  const [isPresent, safeToRemove] = usePresence()

  React.useEffect(() => {
    setLocalSelectedColors(selectedColors)
  }, [selectedColors])

  React.useEffect(() => {
    !isPresent && setTimeout(safeToRemove, 300)
  }, [isPresent, safeToRemove])

  const handleCheckboxChange = (color) => {
    setLocalSelectedColors((prev) => {
      if (prev.includes(color)) {
        return prev.length > 2 ? prev.filter((c) => c !== color) : prev
      } else {
        return [...prev, color]
      }
    })
  }

  const handleSave = () => {
    onSave(localSelectedColors)
    onClose()
  }

  const handleReset = () => {
    setLocalSelectedColors(Object.keys(colorTable))
  }

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOutsideClick}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-gray-800 text-white rounded-xl shadow-lg w-[400px] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{title} Settings</h2>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(colorTable).map(([color, hex]) => (
              <label key={color} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSelectedColors.includes(color)}
                  onChange={() => handleCheckboxChange(color)}
                  disabled={localSelectedColors.length <= 2 && localSelectedColors.includes(color)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700"
                />
                <span 
                  className="capitalize font-medium"
                  style={{ color: hex }}
                >
                  {color}
                </span>
              </label>
            ))}
          </div>
          
          {localSelectedColors.length <= 2 && (
            <p className="text-sm text-gray-400 mb-6">
              You must select at least two colors.
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}