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
import { sanitizeInput, selectNewItem } from '@/utils/gameUtils'
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
  const currentItemRef = useRef(null)

  // State
  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListening, setIsListeningLocal] = useState(false)
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)

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
    if (cancelSpeech) cancelSpeech()
    if (stopListening) stopListening()
    setAndLogGameState('ending', 'end game')
    updateCurrentItem(null)
    setLastHeardWord('')
    if (speak) await speak("Thank you for playing!")
    setAndLogGameState('initial', 'game ended')
    setIsIntroComplete(false)
    
    if (window) {
      const highestTimeoutId = window.setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        window.clearTimeout(i)
      }
    }
    
    router.push('/')
  }, [setAndLogGameState, updateCurrentItem, setIsIntroComplete, router])

  // Speech control functions
  const { speak, stopListening, cancelSpeech, startListening } = SpeechHandler({
    gameState,
    isSpeakingLocal,
    setIsSpeakingLocal,
    setGlobalIsSpeaking,
    setGlobalIsListening,
    setIsListeningLocal,
    handleVoiceCommand,
    currentItemRef,
    selectedItems,
    updateCurrentItem,
    endGame,
    gameType,
    voiceSpeed,
    selectedVoice,
    selectNewItem  // Add this line
})

  // Core utility functions


  // Initialize startListening ref early

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
    startListening()
  }, [setAndLogGameState, speak, selectNewItem, userName, gameType, selectedItems, currentItem, updateCurrentItem, longIntroEnabled, setIsIntroComplete])


  // Speech control functions

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
    if (gameState === 'playing' && !isListening && !isSpeakingLocal) {
      console.log('Starting listening')
      startListening()
    }
  }, [gameState, isListening, isSpeakingLocal])

  useEffect(() => {
    console.log('isListening state changed:', isListening)
  }, [isListening])

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

