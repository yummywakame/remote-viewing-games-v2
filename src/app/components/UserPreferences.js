'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import DOMPurify from 'isomorphic-dompurify'

const UserPreferences = ({ isOpen, onClose, userName, voiceSpeed, selectedVoice, onUpdatePreferences }) => {
  const [name, setName] = useState(userName || '')
  const [speed, setSpeed] = useState(1.2)
  const [voice, setVoice] = useState(selectedVoice?.name || '')
  const [voices, setVoices] = useState([])
  const [longIntroEnabled, setLongIntroEnabled] = useState(true) 
  const modalRef = useRef(null)

  useEffect(() => {
    const savedName = localStorage.getItem('userPreferencesName') || ''
    const savedSpeed = parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2
    const savedVoice = localStorage.getItem('userPreferencesVoiceName') || ''
    const savedLongIntro = localStorage.getItem('gameLongIntro')

    setName(DOMPurify.sanitize(savedName))
    setSpeed(savedSpeed)
    setVoice(savedVoice)
    setLongIntroEnabled(savedLongIntro === 'false' ? false : true)

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)
        if (savedVoice) {
          const selectedVoice = availableVoices.find(v => v.name === savedVoice)
          if (selectedVoice) {
            setVoice(selectedVoice.name)
          }
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const handleSave = useCallback(() => {
    const newVoice = voices.find(v => v.name === voice) || null
    onUpdatePreferences(name, speed, newVoice)
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(name))
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(speed.toString()))
    localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(voice))
    localStorage.setItem('gameLongIntro', DOMPurify.sanitize(longIntroEnabled.toString()))
    onClose()
  }, [name, speed, voice, voices, longIntroEnabled, onUpdatePreferences, onClose])

  const handleReset = useCallback(() => {
    setName('')
    setSpeed(1.2)
    setVoice('')
    setLongIntroEnabled(true)
  }, [])

  const handleOutsideClick = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }, [onClose])

  const previewVoice = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance("This is a preview of the selected voice and speed.")
      utterance.voice = voices.find(v => v.name === voice) || null
      utterance.rate = speed
      window.speechSynthesis.speak(utterance)
    }
  }, [voice, speed, voices])

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOutsideClick}
    >
      <motion.div
        ref={modalRef}
        className="bg-[var(--gray-800)] text-white rounded-xl shadow-lg w-[400px] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">User Preferences</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="voice" className="block text-sm font-medium mb-1">
                Voice
              </label>
              <select
                id="voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Default</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-grow">
                <label htmlFor="voiceSpeed" className="block text-sm font-medium mb-1">
                  Voice Speed: {speed.toFixed(1)}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    id="voiceSpeed"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="flex-grow"
                  />
                  <button
                    onClick={previewVoice}
                    className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors self-end"
                    aria-label="Preview voice"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium">Welcome message length</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${!longIntroEnabled ? 'text-white' : 'text-gray-400'}`}>Brief</span>
                <Switch
                  checked={longIntroEnabled}
                  onCheckedChange={setLongIntroEnabled}
                  defaultChecked={true}
                  className="bg-gray-600 data-[state=checked]:bg-blue-500"
                />
                <span className={`text-xs ${longIntroEnabled ? 'text-white' : 'text-gray-400'}`}>Full explanation</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-gray-300 hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default UserPreferences

