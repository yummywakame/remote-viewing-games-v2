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
import useSpeech from './SpeechHandler'

const OUTRO_RESPONSES = [
  (name) => name ? `Thanks ${name}! Let's practice again soon.` : 'Thank you for playing!',
  (name) => name ? `Thanks ${name}! I hope we play again soon.` : 'Great session — thanks for playing!',
  (name) => name ? `That was a good practice session, ${name}!` : 'That was a great practice session!',
]
const TIMEOUT_MESSAGE = 'Goodbye!'

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
  voiceName = 'coral',
  voiceSpeed = 1.0,
  questionVariants,
  onUpdateUserPreferences,
  selectNewItemProp,
  onCurrentItemUpdate,
  currentItem,           // reactive state from game component — used for display
}) {
  const {
    setIsListening: setGlobalIsListening,
    setIsSpeaking: setGlobalIsSpeaking,
    setOnOpenGameSettings,
    setIsGamePlaying,
    setExitGame,
  } = useContext(GameStateContext)
  const router = useRouter()

  const currentItemRef = useRef(null)
  const outroIndexRef = useRef(0)
  const gameStateRef = useRef('initial')
  const lockStateChangeRef = useRef(false)
  const isUnmountingRef = useRef(false)
  const speakRef = useRef(null)

  const [gameState, setGameState] = useState('initial')
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [lastInteraction, setLastInteraction] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isButtonAnimated, setIsButtonAnimated] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [longIntroEnabled] = useState(
    () => typeof window !== 'undefined' ? localStorage.getItem('gameLongIntro') !== 'false' : true
  )

  // Auto-clear the speech bubble after 2 seconds
  useEffect(() => {
    if (!lastHeardWord) return
    const t = setTimeout(() => setLastHeardWord(''), 2000)
    return () => clearTimeout(t)
  }, [lastHeardWord])

  // Keep gameStateRef in sync
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // Keep internal ref in sync with the reactive currentItem prop from the game component
  useEffect(() => { currentItemRef.current = currentItem ?? null }, [currentItem])

  // ----- Voice -----

  const handleTranscript = useCallback((transcript) => {
    if (!transcript) return
    // Don't reset inactivity timer here — only reset on recognised commands/items
    // so background noise that gets transcribed doesn't keep the game alive.

    if (/\b(stop|end|quit|exit)\b/.test(transcript)) {
      setLastInteraction(Date.now())
      endGameRef.current?.()
      return
    }
    if (/\b(next|skip|forward)\b/.test(transcript)) {
      setLastInteraction(Date.now())
      handleNextItemRef.current?.()
      return
    }
    if (/\b(help|instructions)\b/.test(transcript)) {
      setLastInteraction(Date.now())
      speakRef.current?.(
        `To proceed to the next ${gameType.toLowerCase()} say 'next', or click anywhere on the screen. ` +
        `To end the game say 'stop'. For a hint ask 'what ${gameType.toLowerCase()} is it?'`
      )
      return
    }
    // Game-specific handling — only show bubble and reset timer if a word was recognised
    const matchedWord = handleVoiceCommand?.(transcript, speakRef.current)
    if (matchedWord) {
      setLastHeardWord(typeof matchedWord === 'string' ? matchedWord : transcript)
      setLastInteraction(Date.now())
    }
  }, [gameType, handleVoiceCommand])

  const { speak, stopListening, cancelSpeech } = useSpeech({
    gameState,
    voiceName,
    voiceSpeed,
    onTranscript: handleTranscript,
    onListeningChange: (val) => { setGlobalIsListening(val) },
    onSpeakingChange: (val) => { setGlobalIsSpeaking(val) },
  })

  // Keep speakRef current so handleTranscript (and others) always see the latest speak
  useEffect(() => { speakRef.current = speak }, [speak])

  // ----- Game state -----

  const setAndLogGameState = useCallback((newState, action) => {
    if (isUnmountingRef.current && !(newState === 'intro' && action === 'start game')) return
    if (lockStateChangeRef.current && gameState === 'playing' && newState === 'initial') return

    setGameState(newState)
    gameStateRef.current = newState
    onGameStateChange(newState)
    setIsButtonAnimated(newState === 'intro' || newState === 'playing')
    setIsGamePlaying(newState === 'intro' || newState === 'playing')

    if (newState !== 'playing') {
      currentItemRef.current = null
      onCurrentItemUpdate?.(null)
      setGlobalIsListening(false)
      setGlobalIsSpeaking(false)
    }
  }, [gameState, onGameStateChange, setIsGamePlaying, setGlobalIsListening, setGlobalIsSpeaking, onCurrentItemUpdate])

  // ----- Item management -----

  const updateCurrentItem = useCallback((newItem) => {
    currentItemRef.current = newItem
    onCurrentItemUpdate?.(newItem)

    if (newItem && itemTable?.[newItem]) {
      document.body.style.backgroundColor = itemTable[newItem]
    }
  }, [itemTable, onCurrentItemUpdate])

  // ----- Game flow -----

  const endGame = useCallback(async (isTimeout = false) => {
    cancelSpeech()
    stopListening()
    setAndLogGameState('ending', 'end game')
    updateCurrentItem(null)
    setLastHeardWord('')
    const outroText = isTimeout
      ? TIMEOUT_MESSAGE
      : (() => {
          const text = OUTRO_RESPONSES[outroIndexRef.current](userName)
          outroIndexRef.current = (outroIndexRef.current + 1) % OUTRO_RESPONSES.length
          return text
        })()
    await speak(outroText)
    setAndLogGameState('initial', 'game ended')
    setIsIntroComplete(false)
    setGlobalIsListening(false)
    setGlobalIsSpeaking(false)
    router.push('/')
  }, [
    cancelSpeech, stopListening, setAndLogGameState, updateCurrentItem,
    speak, setIsIntroComplete, router, setGlobalIsListening, setGlobalIsSpeaking, userName,
  ])

  // Stable ref so handleTranscript can call endGame without it being in the dep array
  const endGameRef = useRef(endGame)
  useEffect(() => { endGameRef.current = endGame }, [endGame])

  const handleNextItem = useCallback(async () => {
    if (gameState !== 'playing') return
    cancelSpeech()
    stopListening()

    const selectItemFunc = selectNewItemProp || selectNewItem
    const newItem = selectItemFunc(selectedItems, currentItemRef.current)
    if (!newItem) return

    updateCurrentItem(newItem)
    const question = questionVariants?.length
      ? questionVariants[Math.floor(Math.random() * questionVariants.length)]
      : `What ${gameType.toLowerCase()} is this?`
    await speak(question)
  }, [gameState, cancelSpeech, stopListening, selectNewItemProp, selectedItems, updateCurrentItem, speak, gameType, questionVariants])

  // Stable ref so handleTranscript can call handleNextItem
  const handleNextItemRef = useRef(handleNextItem)
  useEffect(() => { handleNextItemRef.current = handleNextItem }, [handleNextItem])

  const startGame = useCallback(async () => {
    lockStateChangeRef.current = true
    setAndLogGameState('intro', 'start game')
    cancelSpeech()
    stopListening()

    await new Promise((r) => setTimeout(r, 500))

    const introText = longIntroEnabled
      ? `Let's practice MindSight with ${gameType.toLowerCase()}s${userName ? `, ${userName}` : ''}! I'll show you different ${gameType.toLowerCase()}s, and you tell me what you sense. Say "Help" at any time for controls. Are you ready?`
      : `Let's play the ${gameType} Game!`

    await speak(introText)

    setAndLogGameState('playing', 'intro complete')
    setIsIntroComplete(true)

    const selectItemFunc = selectNewItemProp || selectNewItem
    const newItem = selectItemFunc(selectedItems, null)
    if (newItem) {
      updateCurrentItem(newItem)
      await speak(`What ${gameType.toLowerCase()} is this?`)
    }

    lockStateChangeRef.current = false
  }, [
    setAndLogGameState, cancelSpeech, stopListening, longIntroEnabled, userName,
    gameType, speak, setIsIntroComplete, selectNewItemProp, selectedItems, updateCurrentItem,
  ])

  // ----- UI handlers -----

  const handleBackgroundClick = useCallback(() => {
    if (gameState === 'playing') {
      setLastInteraction(Date.now())
      handleNextItem()
    }
  }, [gameState, handleNextItem])

  const handleSaveSettings = useCallback((newItems) => {
    onSaveSettings(newItems)
  }, [onSaveSettings])

  // Clear any leftover color-game-style element when the game ends
  useEffect(() => {
    if (gameState === 'initial') {
      document.getElementById('color-game-style')?.remove()
      document.body.style.backgroundColor = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [gameState])

  // ----- Lifecycle -----

  // End game after 2 minutes of inactivity (no voice or tap)
  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setTimeout(() => {
      endGameRef.current?.(true)
    }, 2 * 60 * 1000)
    return () => clearTimeout(timer)
  }, [gameState, lastInteraction])

  useEffect(() => {
    setOnOpenGameSettings(() => () => setIsSettingsOpen(true))
    return () => setOnOpenGameSettings(null)
  }, [setOnOpenGameSettings])

  useEffect(() => {
    setExitGame(() => async () => { await endGame() })
    return () => setExitGame(null)
  }, [setExitGame, endGame])

  useEffect(() => {
    isUnmountingRef.current = false
    return () => { isUnmountingRef.current = true }
  }, [])

  // ----- Render -----

  return (
    <div className="relative h-screen overflow-auto">
      <GameDisplay
        gameType={gameType}
        currentItem={currentItem ?? null}
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
              onOpenGameSettings: () => setIsSettingsOpen(true),
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

      {gameState !== 'initial' && <FloatingBubble word={lastHeardWord} />}

      <UserPreferences
        isOpen={isUserPreferencesOpen}
        onClose={() => setIsUserPreferencesOpen(false)}
        userName={userName}
        voiceSpeed={voiceSpeed}
        voiceName={voiceName}
        onUpdatePreferences={onUpdateUserPreferences}
      />
    </div>
  )
}
