'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GameSettings({ title, onClose, onSave, colorTable, selectedColors }) {
  const [localSelectedColors, setLocalSelectedColors] = React.useState(selectedColors)
  const modalRef = React.useRef(null)

  React.useEffect(() => {
    setLocalSelectedColors(selectedColors)
  }, [selectedColors])

  const handleCheckboxChange = React.useCallback((color) => {
    setLocalSelectedColors((prev) => {
      if (prev.includes(color)) {
        return prev.length > 2 ? prev.filter((c) => c !== color) : prev
      } else {
        return [...prev, color]
      }
    })
  }, [])

  const handleSave = React.useCallback(() => {
    onSave(localSelectedColors)
    onClose()
  }, [onSave, onClose, localSelectedColors])

  const handleReset = React.useCallback(() => {
    setLocalSelectedColors(Object.keys(colorTable))
  }, [colorTable])

  const handleOutsideClick = React.useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }, [onClose])

  // Rest of the component remains the same...
}