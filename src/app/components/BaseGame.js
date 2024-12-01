'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import UserPreferences from './UserPreferences'
import GameDisplay from './GameDisplay'
import Header from './Header'
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
  const [savedItems, setSavedItems] = useState(Object.keys(itemTable))

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

  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [selectedItems] = useState(savedItems)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.2)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)

  const speechSynthesis = useRef(null)
  const recognition = useRef(null)
  const currentItemRef = useRef(null)
  const router = useRouter()

  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
  }, [onGameStateChange])

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !speechSynthesis.current) {
        resolve()
        return
      }
      setIsSpeaking(true)
      console.log('Started speaking')
      const utterance = new SpeechSynthesisUtterance(DOMPurify.sanitize(text))
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      utterance.rate = voiceSpeed
      utterance.onend = () => {
        console.log('Finished speaking')
        setIsSpeaking(false)
        resolve()
      }
      speechSynthesis.current.speak(utterance)
    })
  }, [selectedVoice, voiceSpeed])

  const updateCurrentItem = useCallback((newItem) => {
    console.log('Updating current item from:', currentItem, 'to:', newItem)
    setCurrentItem(newItem)
    currentItemRef.current = newItem
  }, [currentItem])

  const handleNextItem = useCallback(async () => {
    if (gameState === 'playing' && !isSpeaking) {
      const newItem = await selectNewItem(selectedItems, currentItemRef.current, updateCurrentItem)
      console.log('Next item selected:', newItem)
      updateCurrentItem(newItem)
      speak(`What ${gameType.toLowerCase()} is this?`)
    }
  }, [gameState, isSpeaking, selectNewItem, selectedItems, updateCurrentItem, speak, gameType])

  const cancelSpeech = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
    }
    setIsSpeaking(false)
  }, [])

  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop()
    }
    console.log('Setting isListening to false');
    setIsListening(false)
  }, [])

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
    
    // Clear any ongoing timeouts or intervals
    if (window) {
      const highestTimeoutId = window.setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i);
      }
    }
    
    // Ensure speech recognition is fully stopped
    if (recognition.current) {
      recognition.current.onend = null;
      recognition.current.stop();
      recognition.current = null;
    }
    
    router.push('/')
  }, [cancelSpeech, stopListening, setAndLogGameState, speak, router, updateCurrentItem, setIsIntroComplete])

  const startListening = useCallback(() => {
    if (gameState !== 'playing') {
      console.log('Not starting listening because game state is not playing')
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
        console.log('Setting isListening to true');
        setIsListening(true)
      }

      recognition.current.onend = () => {
        console.log('Speech recognition ended')
        if (gameState === 'playing' && !isSpeaking) {
          recognition.current.start()
        } else {
          setIsListening(false)
        }
      }
    }

    if (!isListening && !isSpeaking && gameState === 'playing') {
      console.log('Starting speech recognition')
      recognition.current.start()
    }
  }, [gameState, isListening, isSpeaking, handleVoiceCommand, speak, selectNewItem, endGame, selectedItems, updateCurrentItem, gameType])

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
    startListening()
  }, [setAndLogGameState, speak, selectNewItem, startListening, userName, gameType, selectedItems, currentItem, updateCurrentItem, longIntroEnabled, setIsIntroComplete])

  const handleBackgroundClick = useCallback(() => {
    if (gameState === 'playing') {
      console.log('Background clicked, triggering next item');
      handleNextItem();
    }
  }, [gameState, handleNextItem]);

  const handleSaveSettings = useCallback(() => {
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(userName))
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(voiceSpeed.toString()))
    localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(selectedVoice?.name || ''))
    localStorage.setItem(
      `${gameType.toLowerCase()}GameSelectedItems`, 
      DOMPurify.sanitize(JSON.stringify(selectedItems))
    );
    localStorage.setItem(
      `${gameType.toLowerCase()}GameLongIntro`, 
      DOMPurify.sanitize(longIntroEnabled.toString())
    );
  }, [userName, voiceSpeed, selectedVoice, selectedItems, longIntroEnabled, gameType])

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
    if (gameState === 'playing' && !isListening && !isSpeaking) {
      console.log('Setting up timeout to start listening')
      const timeoutId = setTimeout(() => {
        console.log('Timeout finished, calling startListening')
        startListening()
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [gameState, isListening, isSpeaking, startListening])


  const handleTitleClick = useCallback(async () => {
    if (gameState !== 'initial') {
      await endGame()
    } else {
      router.push('/')
    }
  }, [gameState, endGame, router])

  useEffect(() => {
    console.log('isListening state changed:', isListening);
  }, [isListening]);

  return (
    <div className="relative h-screen overflow-auto">
      {/* Remove duplicate header from here since it's already in layout.js */}
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
              gameType: typeof window !== 'undefined' ? DOMPurify.sanitize(gameType) : gameType
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

