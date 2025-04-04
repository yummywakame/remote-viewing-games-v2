'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'

const ShapeGameSettings = React.memo(function ShapeGameSettings({ 
  onClose, 
  onSave: onSaveSettings, 
  itemTable, 
  selectedItems: selectedShapes
}) {
  const [localSelectedItems, setLocalSelectedItems] = React.useState(selectedShapes)
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    setLocalSelectedItems(selectedShapes)
  }, [selectedShapes])

  const handleCheckboxChange = React.useCallback((item) => {
    setLocalSelectedItems((prev) => {
      if (prev.includes(item)) {
        return prev.length > 2 ? prev.filter((c) => c !== item) : prev
      } else {
        return [...prev, item]
      }
    })
  }, [])

  const onSave = React.useCallback(() => {
    onClose()
    onSaveSettings(localSelectedItems)
  }, [onClose, onSaveSettings, localSelectedItems])

  const handleReset = React.useCallback(() => {
    setLocalSelectedItems(Object.keys(itemTable));
  }, [itemTable])

  const handleOutsideClick = React.useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }, [onClose])

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOutsideClick}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-[#1F2937] text-white rounded-xl shadow-lg w-[400px] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Shape Game Settings</h2>
            <button 
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(itemTable).map(([item, shape]) => (
              <label
                key={item}
                className={`
                  relative p-4 rounded-lg cursor-pointer
                  transition-all duration-200 flex items-center
                  ${localSelectedItems.includes(item) ? 'ring-2 ring-offset-2 ring-offset-gray-800 bg-gray-700' : 'ring-1 ring-gray-600'}
                  hover:ring-2 hover:ring-offset-2 hover:ring-offset-gray-800
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={localSelectedItems.includes(item)}
                  onChange={() => handleCheckboxChange(item)}
                  disabled={localSelectedItems.length <= 2 && localSelectedItems.includes(item)}
                  aria-label={`Select ${item} shape`}
                />
                <div className="w-8 h-8 flex items-center justify-center mr-3">
                  <Image
                    src={`${shape}`}
                    alt={item}
                    width={32}
                    height={32}
                    className="[&>svg]:text-white [&>svg]:fill-white [&>svg]:stroke-white invert"
                  />
                </div>
                <span className="capitalize font-medium">
                  {DOMPurify.sanitize(item)}
                </span>
                {localSelectedItems.includes(item) && (
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

          {localSelectedItems.length <= 1 && (
            <p className="text-sm text-red-400 mb-6">
              You must select at least two shapes.
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-gray-300 hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Reset
              </button>
              <button
                onClick={onSave}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                disabled={localSelectedItems.length <= 1}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default ShapeGameSettings

