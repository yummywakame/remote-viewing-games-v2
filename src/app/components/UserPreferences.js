'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, X } from 'lucide-react'
import DOMPurify from 'dompurify'

const PreviewButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Volume2 className={`h-4 w-4 ${!isHovered ? 'animate-pulse' : ''}`} />
      <motion.span
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
      >
        Preview
      </motion.span>
    </motion.button>
  )
}

export default function UserPreferences({ isOpen, onClose }) {
  const [name, setName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)

  useEffect(() => {
    const loadPreferences = () => {
      const savedName = localStorage.getItem('userPreferencesName') || ''
      const savedVoiceSpeed = parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2
      setName(DOMPurify.sanitize(savedName))
      setVoiceSpeed(savedVoiceSpeed)
    }

    loadPreferences()
  }, [])

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'))
      setAvailableVoices(englishVoices)
      const preferredVoice = englishVoices.find(voice => voice.name === localStorage.getItem('userPreferencesVoiceName'))
      setSelectedVoice(preferredVoice || englishVoices[0])
    }

    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  const handleSave = useCallback(() => {
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(name))
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(voiceSpeed.toString()))
    if (selectedVoice) {
      localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(selectedVoice.name))
    }
    onClose()
  }, [name, voiceSpeed, selectedVoice, onClose])

  const handleReset = useCallback(() => {
    setVoiceSpeed(1.2)
    setSelectedVoice(availableVoices[0])
    localStorage.removeItem('userPreferencesVoiceSpeed')
    localStorage.removeItem('userPreferencesVoiceName')
  }, [availableVoices])

  const handlePreview = useCallback(() => {
    if (!selectedVoice) return;
    const utterance = new SpeechSynthesisUtterance(`Hello ${DOMPurify.sanitize(name || 'there')}! This is a preview of the selected voice and speed.`)
    utterance.voice = selectedVoice
    utterance.rate = voiceSpeed
    speechSynthesis.speak(utterance)
  }, [name, voiceSpeed, selectedVoice])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[var(--gray-800)] text-white rounded-xl shadow-lg w-[400px] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">User Preferences</h2>
                <button 
                  onClick={onClose}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
                  aria-label="Close preferences"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">
                    Your first name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(DOMPurify.sanitize(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="voice" className="block text-sm font-medium text-gray-400 mb-1">
                    Voice (if available)
                  </label>
                  <select
                    id="voice"
                    value={selectedVoice?.name}
                    onChange={(e) => setSelectedVoice(availableVoices.find(voice => voice.name === e.target.value))}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  >
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="speed" className="block text-sm font-medium text-gray-400 mb-1">
                    Voice Speed
                  </label>
                  <input
                    type="range"
                    id="speed"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSpeed}
                    onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                    className="w-full"
                  />
            <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
              <span>{voiceSpeed.toFixed(1)}x</span>
              <PreviewButton onClick={handlePreview} />
            </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
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
      )}
    </AnimatePresence>
  )
}