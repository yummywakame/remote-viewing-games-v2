'use client'

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import UserPreferences from './UserPreferences'
import GameDisplay from './GameDisplay'
import { GameStateContext } from '../layout'
import DOMPurify from 'isomorphic-dompurify'
import Promise from 'promise';

export default function BaseGame({ 
    GameSettings,
    gameType,
    onGameStateChange = () => {},
    renderGameContent,
    handleVoiceCommand,
    selectNewItem,
    itemTable,
    longIntroEnabled,
    backgroundMode,
    isIntroComplete,
    setIsIntroComplete
  }) {
  // Context and Router
  const { setIsListening: setGlobalIsListening, setIsSpeaking: setGlobalIsSpeaking, setOnOpenGameSettings } = useContext(GameStateContext)
  const router = useRouter()

  // Refs
  const speechSynthesis = useRef(null)
  const recognition = useRef(null)
  const currentItemRef = useRef(null)
  const startListeningRef = useRef(null)

  // State
  const [savedItems, setSavedItems] = useState(Object.keys(itemTable))
  const [selectedItems] = useState(savedItems)
  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListening, setIsListeningLocal] = useState(false)
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)

  // Core utility functions
  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
  }, [onGameStateChange])

  const updateCurrentItem = useCallback((newItem) => {
    console.log('Updating current item from:', currentItem, 'to:', newItem)
    setCurrentItem(newItem)
    currentItemRef.current = newItem
  }, [currentItem])

  // Speech control functions
  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop()
    }
    console.log('Setting isListening to false')
    setGlobalIsListening(false)
    setIsListeningLocal(false)
  }, [setGlobalIsListening])

  const cancelSpeech = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
    }
    setGlobalIsSpeaking(false)
    setIsSpeakingLocal(false)
  }, [setGlobalIsSpeaking])

  // Initialize startListening ref early
  startListeningRef.current = () => {
    if (gameState !== 'playing' || isSpeakingLocal) {
      console.log('Not starting listening because game state is not playing or is currently speaking')
      return
    }

    if (!recognition.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'

      recognition.current.onresult = (event) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript.trim().toLowerCase()
        setLastHeardWord(transcript)
        console.log('Voice command received with current item:', currentItemRef.current)
        const newItem = handleVoiceCommand(
          transcript, 
          currentItemRef.current, 
          speak, 
          () => selectNewItem(selectedItems, currentItemRef.current, updateCurrentItem),
          endGame,
          gameType
        )
        if (newItem) {
          console.log('Updating item from voice command to:', newItem)
          updateCurrentItem(newItem)
        }
      }

      recognition.current.onstart = () => {
        console.log('Speech recognition started')
        setGlobalIsListening(true)
        setIsListeningLocal(true)
      }

      recognition.current.onend = () => {
        console.log('Speech recognition ended')
        setGlobalIsListening(false)
        setIsListeningLocal(false)
        if (gameState === 'playing' && !isSpeakingLocal) {
          startListeningRef.current()
        }
      }
    }

    if (!isListening && !isSpeakingLocal && gameState === 'playing') {
      console.log('Starting speech recognition')
      try {
        recognition.current.start()
      } catch (error) {
        if (error.name === 'InvalidStateError') {
          console.log('Speech recognition is already started')
        } else {
          console.error('Error starting speech recognition:', error)
        }
      }
    }
  }

  // Define speak function with access to startListeningRef
  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !speechSynthesis.current) {
        resolve()
        return
      }
      setGlobalIsSpeaking(true)
      setIsSpeakingLocal(true)
      stopListening()
      console.log('Started speaking')
      const utterance = new SpeechSynthesisUtterance(DOMPurify.sanitize(text))
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.rate = voiceSpeed
      utterance.onend = () => {
        console.log('Finished speaking')
        setGlobalIsSpeaking(false)
        setIsSpeakingLocal(false)
        if (gameState === 'playing') {
          startListeningRef.current()
        }
        resolve()
      }
      speechSynthesis.current.speak(utterance)
    })
  }, [selectedVoice, voiceSpeed, setGlobalIsSpeaking, stopListening, gameState, setGlobalIsSpeaking])

  // Game control functions
  const endGame = useCallback(async () => {
    console.log('Ending game...')
    cancelSpeech()
    stopListening()
    setAndLogGameState('ending', 'end game')
    updateCurrentItem(null)
    setLastHeardWord('')
    await speak("Thank you for playing!")
    setAndLogGameState('initial', 'game ended')
    setIsIntroComplete(false)
    
    if (window) {
      const highestTimeoutId = window.setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i)
      }
    }
    
    if (recognition.current) {
      recognition.current.onend = null
      recognition.current.stop()
      recognition.current = null
    }
    
    router.push('/')
  }, [cancelSpeech, stopListening, setAndLogGameState, speak, router, updateCurrentItem, setIsIntroComplete])

  const handleNextItem = useCallback(async () => {
    if (gameState === 'playing' && !isSpeakingLocal) {
      const newItem = await selectNewItem(selectedItems, currentItemRef.current, updateCurrentItem)
      console.log('Next item selected:', newItem)
      updateCurrentItem(newItem)
      speak(`What ${gameType.toLowerCase()} is this?`)
    }
  }, [gameState, isSpeakingLocal, selectNewItem, selectedItems, updateCurrentItem, speak, gameType])

  const startGame = useCallback(async () => {
    setAndLogGameState('intro', 'start game')
    if (longIntroEnabled) {
      await speak(`Welcome to the ${gameType} Game ${userName || ''}! When prompted, say the ${gameType.toLowerCase()} you think it is, or say 'help' at any time for further instructions. Good luck!`)
    } else {
      await speak("Let's begin!")
    }
    setIsIntroComplete(true)
    setAndLogGameState('playing', 'game started')
    const newItem = await selectNewItem(selectedItems, currentItem, updateCurrentItem)
    updateCurrentItem(newItem)
    await speak(`What ${gameType.toLowerCase()} is this?`)
    startListeningRef.current()
  }, [setAndLogGameState, speak, selectNewItem, userName, gameType, selectedItems, currentItem, updateCurrentItem, longIntroEnabled, setIsIntroComplete])

  // Event handlers
  const handleBackgroundClick = useCallback(() => {
    if (gameState === 'playing') {
      console.log('Background clicked, triggering next item')
      handleNextItem()
    }
  }, [gameState, handleNextItem])

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(userName))
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(voiceSpeed.toString()))
    localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(selectedVoice?.name || ''))
    localStorage.setItem(
      `${gameType.toLowerCase()}GameSelectedItems`, 
      DOMPurify.sanitize(JSON.stringify(selectedItems))
    )
    localStorage.setItem(
      `${gameType.toLowerCase()}GameLongIntro`, 
      DOMPurify.sanitize(longIntroEnabled.toString())
    )
  }, [userName, voiceSpeed, selectedVoice, selectedItems, longIntroEnabled, gameType])


  // Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${gameType.toLowerCase()}GameSelectedItems`)
      if (saved) {
        try {
          const parsedItems = JSON.parse(saved)
          if (Array.isArray(parsedItems) && parsedItems.length >= 2) {
            setSavedItems(parsedItems)
          }
        } catch (error) {
          console.error('Error parsing saved items:', error)
        }
      }
    }
  }, [gameType, itemTable])

  useEffect(() => {
    const savedName = localStorage.getItem('userPreferencesName') || ''
    const savedVoiceSpeed = parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2
    const savedVoiceName = localStorage.getItem('userPreferencesVoiceName')
    
    setUserName(DOMPurify.sanitize(savedName))
    setVoiceSpeed(savedVoiceSpeed)

    if (savedVoiceName && speechSynthesis.current) {
      const voices = speechSynthesis.current.getVoices()
      const voice = voices.find(v => v.name === DOMPurify.sanitize(savedVoiceName))
      setSelectedVoice(voice || null)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = speechSynthesis.current.getVoices()
        if (voices.length > 0) {
          const utterance = new SpeechSynthesisUtterance()
          utterance.voice = voices[0]
        }
      }
      loadVoices()
      speechSynthesis.current.onvoiceschanged = loadVoices
    }

    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (recognition.current) {
        recognition.current.stop()
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (gameState === 'playing' && !isListening && !isSpeakingLocal) {
      console.log('Setting up timeout to start listening')
      const timeoutId = setTimeout(() => {
        console.log('Timeout finished, calling startListening')
        startListeningRef.current()
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [gameState, isListening, isSpeakingLocal])

  useEffect(() => {
    console.log('isListening state changed:', isListening)
  }, [isListening])

  useEffect(() => {
    setOnOpenGameSettings(() => () => setIsSettingsOpen(true))
    return () => setOnOpenGameSettings(null)
  }, [setOnOpenGameSettings])

  // Render
  return (
    <div className="relative h-screen overflow-auto">
      <GameDisplay
        gameType={gameType}
        currentItem={currentItem}
        itemTable={itemTable}
        onClick={handleBackgroundClick}
        gameState={gameState}
        backgroundMode={backgroundMode}
        isIntroComplete={isIntroComplete}
      />
      <div className="fixed inset-0 pt-16 pointer-events-none">
        <div className="flex items-center justify-center h-full">
          <div className="game-content text-center pointer-events-auto">
            {renderGameContent({
              gameState,
              startGame,
              endGame,
              isButtonAnimated,
              gameType: typeof window !== 'undefined' ? DOMPurify.sanitize(gameType) : gameType,
              onOpenGameSettings: () => setIsSettingsOpen(true)
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSettingsOpen && (
          <GameSettings
            key="settings"
            title={`${gameType} Game`}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            itemTable={itemTable}
            selectedItems={selectedItems}
            longIntroEnabled={longIntroEnabled}
          />
        )}
      </AnimatePresence>
      {gameState !== 'initial' && (
        <FloatingBubble word={lastHeardWord} />
      )}
      <UserPreferences
        isOpen={isUserPreferencesOpen}
        onClose={() => setIsUserPreferencesOpen(false)}
      />      
    </div>
  )
}

