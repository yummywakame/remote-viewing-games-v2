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
  backgroundMode,
  isIntroComplete,
  setIsIntroComplete,
  selectedItems,
  onSaveSettings,
  longIntroEnabled,
  userName,
  voiceSpeed,
  selectedVoice,
  onUpdateUserPreferences
}) {
  // Context and Router
  const { 
    setIsListening: setGlobalIsListening, 
    setIsSpeaking: setGlobalIsSpeaking, 
    setOnOpenGameSettings, 
    setIsGamePlaying,
    setExitGame
  } = useContext(GameStateContext)
  const router = useRouter()

  // Refs
  const speechSynthesis = useRef(null)
  const recognition = useRef(null)
  const currentItemRef = useRef(null)
  const startListeningRef = useRef(null)

  // State
  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListening, setIsListeningLocal] = useState(false)
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)

  // Core utility functions
  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
    setIsGamePlaying(newState === 'intro' || newState === 'playing')
  }, [onGameStateChange, setIsGamePlaying])

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
      recognition.current.continuous = false 
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

      recognition.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error)
        // Only handle non-no-speech errors
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
          setGlobalIsListening(false)
          setIsListeningLocal(false)
          if (gameState === 'playing' && !isSpeakingLocal) {
            startListeningRef.current()
          }
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
          setGlobalIsListening(false)
          setIsListeningLocal(false)
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
      const voices = speechSynthesis.current.getVoices()
      const savedVoiceName = localStorage.getItem('userPreferencesVoiceName')
      const savedVoice = voices.find(v => v.name === savedVoiceName)
      utterance.voice = savedVoice || voices[0]
      utterance.rate = voiceSpeed
      utterance.onend = () => {
        console.log('Finished speaking')
        setGlobalIsSpeaking(false)
        setIsSpeakingLocal(false)
        if (gameState === 'playing') {
          setTimeout(() => {
            startListeningRef.current()
          }, 100) 
        }
        resolve()
      }
      speechSynthesis.current.speak(utterance)
    })
  }, [selectedVoice, voiceSpeed, setGlobalIsSpeaking, stopListening, gameState])

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
    onSaveSettings(selectedItems)
  }, [selectedItems, onSaveSettings])

  // Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = speechSynthesis.current.getVoices()
        if (voices.length > 0) {
          const savedVoiceName = localStorage.getItem('userPreferencesVoiceName')
          if (savedVoiceName) {
            const savedVoice = voices.find(v => v.name === savedVoiceName)
            if (savedVoice) {
              selectedVoice = savedVoice
            }
          }
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
      console.log('Starting listening')
      startListeningRef.current()
    }
  }, [gameState, isListening, isSpeakingLocal])

  useEffect(() => {
    console.log('isListening state changed:', isListening)
  }, [isListening])

  useEffect(() => {
    setOnOpenGameSettings(() => () => setIsSettingsOpen(true))
    return () => setOnOpenGameSettings(null)
  }, [setOnOpenGameSettings])

  useEffect(() => {
    setExitGame(() => async () => {
      console.log('Exiting game...')
      await endGame()
    })

    return () => setExitGame(null)
  }, [setExitGame, endGame])

  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem('userPreferencesVoiceName', selectedVoice.name)
    }
  }, [selectedVoice])

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
          />
        )}
      </AnimatePresence>
      {gameState !== 'initial' && (
        <FloatingBubble word={lastHeardWord} />
      )}
      <UserPreferences
        isOpen={isUserPreferencesOpen}
        onClose={() => setIsUserPreferencesOpen(false)}
        userName={userName}
        voiceSpeed={voiceSpeed}
        selectedVoice={selectedVoice}
        onUpdatePreferences={onUpdateUserPreferences}
      />      
    </div>
  )
}

