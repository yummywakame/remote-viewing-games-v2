'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ColorGameSettings({ onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    setIsVisible(true)
    return () => setIsVisible(false)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Wait for the animation to finish before unmounting
  }

  const handleOutsideClick = (e) => {
    if (contentRef.current && !contentRef.current.contains(e.target)) {
      handleClose()
    }
  }

  return (
    <div 
      className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-50 ${
        isVisible ? 'bg-opacity-80' : 'bg-opacity-0'
      }`}
      onClick={handleOutsideClick}
    >
      <div className="flex items-center justify-center h-full p-5">
        <div 
          ref={contentRef}
          className={`bg-gray-800 rounded-lg p-6 max-w-[600px] w-full relative min-h-[300px] flex flex-col transition-all duration-300 ease-in-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors duration-200"
            onClick={handleClose}
          >
            <X size={24} />
          </button>
          <h2 className="text-2xl font-bold mb-4">Color Game Settings</h2>
          <div className="flex-grow">
            <p>Content goes here</p>
          </div>
          <button 
            className="neon-button mt-4 self-end"
            onClick={handleClose}
          >
            <span className="neon-button-background"></span>
            <span className="neon-button-gradient"></span>
            <span className="neon-button-text">Save</span>
          </button>
        </div>
      </div>
    </div>
  )
}