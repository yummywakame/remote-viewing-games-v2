'use client'

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import UserPreferences from './UserPreferences'
import GameDisplay from './GameDisplay'
import { GameStateContext } from '../layout'
import DOMPurify from 'isomorphic-dompurify'
import { selectNewItem } from '@/utils/gameUtils'
import SpeechHandler from './SpeechHandler'

export default function BaseGame({ 
  GameSettings,
  gameType,
  onGameStateChange = () => {},
  renderGameContent,
  handleVoiceCommand,
  itemTable,
  backgroundMode,
  isIntroComplete,
  setIsIntroComplete,
  selectedItems,
  onSaveSettings,
  userName,
  voiceSpeed,
  selectedVoice,
  onUpdateUserPreferences,
  selectNewItemProp,
  speak
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
  const currentItemRef = useRef(null)

  // State
  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListeningLocal, setIsListeningLocal] = useState(false)
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)

  // Create refs for speech functions
  const speechFunctionsRef = useRef({
    speak: null,
    stopListening: null,
    cancelSpeech: null,
    startListening: null
  })

  // Create a stable reference to the speak function
  const speakRef = useRef(speak)
  useEffect(() => {
    speakRef.current = speak
  }, [speak])

  const updateCurrentItem = useCallback((newItem) => {
    console.log('Updating current item from:', currentItem, 'to:', newItem)
    setCurrentItem(newItem)
    currentItemRef.current = newItem
  }, [currentItem])

  // Core utility functions
  const setAndLogGameState = useCallback((newState, action) => {
    setGameState(newState)
    onGameStateChange(newState)
    console.log(`Game state changed to ${newState} (${action})`)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
    setIsGamePlaying(newState === 'intro' || newState === 'playing')
  }, [onGameStateChange, setIsGamePlaying])

  const endGame = useCallback(async () => {
    console.log('Ending game...')
    if (speechFunctionsRef.current.cancelSpeech) speechFunctionsRef.current.cancelSpeech()
    if (speechFunctionsRef.current.stopListening) speechFunctionsRef.current.stopListening()
    setAndLogGameState('ending', 'end game')
    updateCurrentItem(null)
    setLastHeardWord('')
    if (speechFunctionsRef.current.speak) await speechFunctionsRef.current.speak("Thank you for playing!")
    setAndLogGameState('initial', 'game ended')
    setIsIntroComplete(false)
    
    // Clear any pending timeouts
    if (window) {
      const highestTimeoutId = window.setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i)
      }
    }
    
    // Ensure we're not listening or speaking when navigating away
    setGlobalIsListening(false)
    setGlobalIsSpeaking(false)
    setIsListeningLocal(false)
    setIsSpeakingLocal(false)
    
    router.push('/')
  }, [setAndLogGameState, updateCurrentItem, setIsIntroComplete, router, setGlobalIsListening, setGlobalIsSpeaking, setIsListeningLocal, setIsSpeakingLocal])

  // Initialize SpeechHandler after endGame is defined
  const speechHandler = SpeechHandler({
    gameState,
    gameType,
    currentItem,
    selectedItems,
    updateCurrentItem,
    setAndLogGameState,
    setIsIntroComplete,
    setGlobalIsListening,
    setGlobalIsSpeaking,
    isListeningLocal,
    setIsListeningLocal,
    isSpeakingLocal,
    setIsSpeakingLocal,
    setParentIsListening: setIsListeningLocal,
    setParentIsSpeaking: setIsSpeakingLocal,
    handleVoiceCommand,
    currentItemRef,
    endGame,
    router,
    userName,
    longIntroEnabled,
    setLongIntroEnabled,
    voiceSpeed,
    selectedVoice,
    selectNewItem: selectNewItemProp || selectNewItem,
    speak: speakRef.current
  })

  // Update speech functions ref when SpeechHandler is initialized
  useEffect(() => {
    if (speechHandler) {
      speechFunctionsRef.current = speechHandler
    }
  }, [speechHandler])

  const handleNextItem = useCallback(async () => {
    if (gameState === 'playing' && !isSpeakingLocal) {
      const newItem = await (selectNewItemProp || selectNewItem)(selectedItems, currentItemRef.current, updateCurrentItem)
      console.log('Next item selected:', newItem)
      updateCurrentItem(newItem)
      speechFunctionsRef.current.speak(`What ${gameType.toLowerCase()} is this?`)
    }
  }, [gameState, isSpeakingLocal, selectNewItemProp, selectNewItem, selectedItems, updateCurrentItem, gameType])

  const startGame = useCallback(async () => {
    console.log('Starting game...')
    setAndLogGameState('intro', 'start game')
    if (longIntroEnabled) {
      await speechFunctionsRef.current.speak(`Welcome to the ${gameType} Game ${userName || ''}! When prompted, say the ${gameType.toLowerCase()} you think it is, or say 'help' at any time for further instructions. Good luck!`)
    } else {
      await speechFunctionsRef.current.speak("Let's begin!")
    }
    setIsIntroComplete(true)
    setAndLogGameState('playing', 'game started')
    const newItem = await (selectNewItemProp || selectNewItem)(selectedItems, currentItem, updateCurrentItem)
    updateCurrentItem(newItem)
    await speechFunctionsRef.current.speak(`What ${gameType.toLowerCase()} is this?`)
    speechFunctionsRef.current.startListening()
  }, [setAndLogGameState, selectNewItemProp, selectNewItem, userName, gameType, selectedItems, currentItem, updateCurrentItem, longIntroEnabled, setIsIntroComplete])

  // Game control functions

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
    if (selectedVoice) {
      localStorage.setItem('userPreferencesVoiceName', selectedVoice.name)
    }
  }, [selectedVoice])

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
    if (gameState === 'playing' && !isListeningLocal && !isSpeakingLocal) {
      console.log('Starting listening')
      speechFunctionsRef.current.startListening()
    }
  }, [gameState, isListeningLocal, isSpeakingLocal])

  useEffect(() => {
    console.log('isListening state changed:', isListeningLocal)
  }, [isListeningLocal])

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

