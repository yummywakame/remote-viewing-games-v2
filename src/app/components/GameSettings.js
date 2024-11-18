'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function GameSettings({ title, onClose, onSave, colorTable, selectedColors }) {
  const [localSelectedColors, setLocalSelectedColors] = React.useState(selectedColors)
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    setLocalSelectedColors(selectedColors)
  }, [selectedColors])

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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]" // Updated z-index to match UserPreferences
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOutsideClick}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-[var(--gray-800)] text-white rounded-xl shadow-lg w-[400px] overflow-hidden"
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
              <label
                key={color}
                className={`
                  relative p-4 rounded-lg cursor-pointer
                  transition-all duration-200
                  ${localSelectedColors.includes(color) ? 'ring-2 ring-offset-2 ring-offset-gray-800' : 'ring-1 ring-gray-600'}
                  hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800
                `}
                style={{ backgroundColor: hex + '20' }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={localSelectedColors.includes(color)}
                  onChange={() => handleCheckboxChange(color)}
                  disabled={localSelectedColors.length <= 2 && localSelectedColors.includes(color)}
                />
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full shadow-inner"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="capitalize font-medium" style={{ color: hex }}>
                    {color}
                  </span>
                </div>
                {localSelectedColors.includes(color) && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
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
            className="px-4 py-2 rounded-full border border-[var(--gray-600)] text-[var(--gray-300)] hover:bg-[var(--gray-700)] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[var(--purple-600)] to-[var(--blue-600)] text-white hover:from-[var(--purple-700)] hover:to-[var(--blue-700)] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Save Changes
          </button>
        </div>
        </div>
      </motion.div>
    </motion.div>
  )
}