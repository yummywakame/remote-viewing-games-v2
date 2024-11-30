'use client'

import React, { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, X } from 'lucide-react'
import DOMPurify from 'dompurify'

const PreviewButton = memo(({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center justify-center p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Volume2 size={20} />
  </button>
));

const UserPreferences = memo(function UserPreferences({ isOpen, onClose }) {
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
      setAvailableVoices(voices)

      const savedVoiceName = localStorage.getItem('userPreferencesVoiceName')
      if (savedVoiceName) {
        const voice = voices.find(v => v.name === savedVoiceName)
        setSelectedVoice(voice || null)
      }
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
    setName('')
    setVoiceSpeed(1.2)
    setSelectedVoice(null)
    localStorage.removeItem('userPreferencesName')
    localStorage.removeItem('userPreferencesVoiceSpeed')
    localStorage.removeItem('userPreferencesVoiceName')
  }, [])

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
                    Voice
                  </label>
                  <select
                    id="voice"
                    value={selectedVoice ? selectedVoice.name : ''}
                    onChange={(e) => setSelectedVoice(availableVoices.find(v => v.name === e.target.value) || null)}
                    className="w-full px-3 py-2 bg-gray-700 rounded-md text-white"
                  >
                    <option value="">Select a voice</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="speed" className="block text-sm font-medium text-gray-400 mb-1">
                    Voice Speed: {voiceSpeed.toFixed(1)}
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
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Preview voice</span>
                  <PreviewButton onClick={handlePreview} disabled={!selectedVoice} />
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
});

export default UserPreferences;

