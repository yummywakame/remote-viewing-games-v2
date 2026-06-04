'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import DOMPurify from 'isomorphic-dompurify'

const OPENAI_VOICES = [
  { id: 'alloy',   label: 'Alloy'   },
  { id: 'ash',     label: 'Ash'     },
  { id: 'ballad',  label: 'Ballad'  },
  { id: 'coral',   label: 'Coral'   },
  { id: 'echo',    label: 'Echo'    },
  { id: 'fable',   label: 'Fable'   },
  { id: 'nova',    label: 'Nova'    },
  { id: 'onyx',    label: 'Onyx'    },
  { id: 'sage',    label: 'Sage'    },
  { id: 'shimmer', label: 'Shimmer' },
]

const DEFAULT_VOICE = 'echo'

const UserPreferences = ({ isOpen, onClose, userName, voiceSpeed, voiceName, onUpdatePreferences }) => {
  const [name, setName] = useState(userName || '')
  const [speed, setSpeed] = useState(voiceSpeed || 1.1)
  const [voice, setVoice] = useState(voiceName || DEFAULT_VOICE)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const previewAudioRef = useRef(null)
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setName(DOMPurify.sanitize(localStorage.getItem('userPreferencesName') || ''))
    setSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.1)
    setVoice(localStorage.getItem('userPreferencesVoiceName') || DEFAULT_VOICE)
    setLongIntroEnabled(localStorage.getItem('gameLongIntro') !== 'false')
    setAutoAdvance(localStorage.getItem('gameAutoAdvance') !== 'false')
  }, [isOpen])

  const handleSave = useCallback(() => {
    // Write localStorage before calling onUpdatePreferences so any sync listeners read fresh values
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(name))
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(speed.toString()))
    localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(voice))
    localStorage.setItem('gameLongIntro', DOMPurify.sanitize(longIntroEnabled.toString()))
    localStorage.setItem('gameAutoAdvance', DOMPurify.sanitize(autoAdvance.toString()))
    onUpdatePreferences(name, speed, voice)
    onClose()
  }, [name, speed, voice, longIntroEnabled, autoAdvance, onUpdatePreferences, onClose])

  const handleReset = useCallback(() => {
    setName('')
    setSpeed(1.1)
    setVoice(DEFAULT_VOICE)
    setLongIntroEnabled(true)
    setAutoAdvance(true)
  }, [])

  const handleOutsideClick = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose()
  }, [onClose])

  const previewVoice = useCallback(async () => {
    if (isPreviewing) {
      previewAudioRef.current?.pause()
      setIsPreviewing(false)
      return
    }

    setIsPreviewing(true)
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'This is a preview of the selected voice and speed.',
          voice,
          speed,
        }),
      })
      if (!res.ok) throw new Error('Preview failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      previewAudioRef.current = audio
      audio.onended = () => { URL.revokeObjectURL(url); setIsPreviewing(false) }
      audio.onerror = () => { URL.revokeObjectURL(url); setIsPreviewing(false) }
      audio.play()
    } catch (err) {
      console.error('[Preview]', err)
      setIsPreviewing(false)
    }
  }, [voice, speed, isPreviewing])

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
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="voice" className="block text-sm font-medium mb-1">Voice</label>
              <select
                id="voice"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {OPENAI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors self-end ${
                      isPreviewing ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
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

            <div className="space-y-2">
              <span className="block text-sm font-medium">Next item</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs ${!autoAdvance ? 'text-white' : 'text-gray-400'}`}>Manual</span>
                <Switch
                  checked={autoAdvance}
                  onCheckedChange={setAutoAdvance}
                  defaultChecked={true}
                  className="bg-gray-600 data-[state=checked]:bg-blue-500"
                />
                <span className={`text-xs ${autoAdvance ? 'text-white' : 'text-gray-400'}`}>Auto-advance</span>
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
