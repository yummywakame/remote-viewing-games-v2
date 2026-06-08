'use client'

import React, { useState, useEffect, useCallback, useRef, useContext } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FloatingBubble from './FloatingBubble'
import LoadingIndicator from './LoadingIndicator'
import CosmicBackground from './CosmicBackground'
import UserPreferences from './UserPreferences'
import GameDisplay from './GameDisplay'
import { GameStateContext } from '../layout'
import DOMPurify from 'isomorphic-dompurify'
import { selectNewItem, sanitizeInput } from '@/utils/gameUtils'
import {
  CORRECT_RESPONSES, CONFIRM_ONLY_RESPONSES, TRY_AGAIN_RESPONSES, OUTRO_RESPONSES, TIMEOUT_MESSAGE,
  getHelpText, getTipText, getAdvanceHint, getFirstQuestion, getBriefIntro, getLongIntroNoName,
} from '@/lib/gameConstants'
import useSpeech from './SpeechHandler'

export default function BaseGame({
  GameSettings,
  gameType,
  onGameStateChange = () => {},
  accentColor = 'from-purple-600 to-blue-600',
  matchItem,
  itemTable,
  selectedItems,
  onSaveSettings,
  questionVariants,
  selectNewItemProp,
  onCurrentItemUpdate,
  currentItem,           // reactive state from game component — used for display
  onScreenTap,           // optional: overrides click-to-advance (receives { goNext, speak })
  keepBackground = false, // keep CosmicBackground visible during playing state
  gameDisplayProps = {},
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
  const outroIndexRef = useRef(parseInt(typeof window !== 'undefined' ? localStorage.getItem('outroIndex') || '0' : '0'))
  const correctIndexRef = useRef(0)
  const updateCurrentItemRef = useRef(null)
  const gameStateRef = useRef('initial')
  const lockStateChangeRef = useRef(false)
  const isUnmountingRef = useRef(false)
  const speakRef = useRef(null)

  const [gameState, setGameState] = useState('initial')
  const [lastHeardWord, setLastHeardWord] = useState('')
  const [lastInteraction, setLastInteraction] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [namesCorrectAnswer, setNamesCorrectAnswer] = useState(true)
  const [inactivityTimeout, setInactivityTimeout] = useState(2)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1.1)
  const [voiceName, setVoiceName] = useState('echo')

  const autoAdvanceRef = useRef(true)
  const namesCorrectAnswerRef = useRef(true)
  const hintShownRef = useRef(false)
  const tipShownRef = useRef(false)

  useEffect(() => { autoAdvanceRef.current = autoAdvance }, [autoAdvance])
  useEffect(() => { namesCorrectAnswerRef.current = namesCorrectAnswer }, [namesCorrectAnswer])

  // Load preferences from localStorage on mount
  useEffect(() => {
    setLongIntroEnabled(localStorage.getItem('gameLongIntro') !== 'false')
    setAutoAdvance(localStorage.getItem('gameAutoAdvance') !== 'false')
    setNamesCorrectAnswer(localStorage.getItem('gameNamesCorrectAnswer') !== 'false')
    setInactivityTimeout(parseInt(localStorage.getItem('gameInactivityTimeout') || '2'))
    setUserName(sanitizeInput(localStorage.getItem('userPreferencesName') || ''))
    setVoiceSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.1)
    setVoiceName(localStorage.getItem('userPreferencesVoiceName') || 'echo')
  }, [])

  // Sync preferences when updated from the header while on the game page
  useEffect(() => {
    const sync = () => {
      setLongIntroEnabled(localStorage.getItem('gameLongIntro') !== 'false')
      setAutoAdvance(localStorage.getItem('gameAutoAdvance') !== 'false')
      setNamesCorrectAnswer(localStorage.getItem('gameNamesCorrectAnswer') !== 'false')
      setInactivityTimeout(parseInt(localStorage.getItem('gameInactivityTimeout') || '2'))
      setUserName(sanitizeInput(localStorage.getItem('userPreferencesName') || ''))
      setVoiceSpeed(parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.1)
      setVoiceName(localStorage.getItem('userPreferencesVoiceName') || 'echo')
    }
    window.addEventListener('preferencesUpdated', sync)
    return () => window.removeEventListener('preferencesUpdated', sync)
  }, [])

  const handleUpdateUserPreferences = useCallback((newName, newVoiceSpeed, newVoiceName) => {
    setUserName(newName)
    setVoiceSpeed(newVoiceSpeed)
    setVoiceName(newVoiceName)
    setAutoAdvance(localStorage.getItem('gameAutoAdvance') !== 'false')
    setNamesCorrectAnswer(localStorage.getItem('gameNamesCorrectAnswer') !== 'false')
    setInactivityTimeout(parseInt(localStorage.getItem('gameInactivityTimeout') || '2'))
    localStorage.setItem('userPreferencesName', sanitizeInput(newName))
    localStorage.setItem('userPreferencesVoiceSpeed', sanitizeInput(newVoiceSpeed.toString()))
    localStorage.setItem('userPreferencesVoiceName', sanitizeInput(newVoiceName))
  }, [])

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
      speakRef.current?.(getHelpText(gameType))
      return
    }

    const matched = matchItem?.(transcript, speakRef.current)
    if (matched?.isCorrect === true) {
      setLastHeardWord(matched.item)
      setLastInteraction(Date.now())
      // "Correct-answer feedback" preference: speak the item's name, or just confirm
      // the guess without naming it (keeps players in visual/intuitive sensing mode)
      const namesAnswer = namesCorrectAnswerRef.current
      const correctResponses = namesAnswer ? CORRECT_RESPONSES : CONFIRM_ONLY_RESPONSES
      const responseIdx = correctIndexRef.current % correctResponses.length
      const correctText = namesAnswer
        ? correctResponses[responseIdx](matched.item, matched.displayItem)
        : correctResponses[responseIdx]
      correctIndexRef.current = responseIdx + 1
      const selectItemFunc = selectNewItemProp || selectNewItem

      if (autoAdvanceRef.current) {
        speakRef.current?.(correctText).then(async () => {
          const next = selectItemFunc(selectedItems, currentItemRef.current)
          if (next) {
            updateCurrentItemRef.current?.(next)
            const variants = questionVariants?.length ? questionVariants : [`What ${gameType.toLowerCase()} is this?`]
            await speakRef.current?.(variants[Math.floor(Math.random() * variants.length)])
          }
        })
      } else {
        const needsHint = !hintShownRef.current
        hintShownRef.current = true
        const hint = getAdvanceHint(gameType)
        speakRef.current?.(needsHint ? `${correctText} ${hint}` : correctText)
      }
    } else if (matched?.isCorrect === false) {
      setLastHeardWord(matched.item)
      setLastInteraction(Date.now())
      const tryAgainMsg = matched.tryAgainText ??
        TRY_AGAIN_RESPONSES[Math.floor(Math.random() * TRY_AGAIN_RESPONSES.length)]
      speakRef.current?.(tryAgainMsg)
    } else if (matched?.isCorrect === 'partial') {
      setLastHeardWord(matched.item)
      setLastInteraction(Date.now())
      if (matched.revealText) {
        speakRef.current?.(matched.revealText)
      }
    } else if (matched?.item) {
      setLastHeardWord(typeof matched.item === 'string' ? matched.item : '')
      setLastInteraction(Date.now())
      if (matched.revealText) {
        if (autoAdvanceRef.current) {
          const selectItemFunc = selectNewItemProp || selectNewItem
          speakRef.current?.(matched.revealText).then(async () => {
            const next = selectItemFunc(selectedItems, currentItemRef.current)
            if (next) {
              updateCurrentItemRef.current?.(next)
              const variants = questionVariants?.length ? questionVariants : [`What ${gameType.toLowerCase()} is this?`]
              await speakRef.current?.(variants[Math.floor(Math.random() * variants.length)])
            }
          })
        } else {
          const needsHint = !hintShownRef.current
          if (needsHint) hintShownRef.current = true
          const hint = needsHint ? ` ${getAdvanceHint(gameType)}` : ''
          speakRef.current?.(`${matched.revealText}${hint}`)
        }
      }
    }
  }, [gameType, matchItem, selectedItems, questionVariants, selectNewItemProp])

  const onTranscriptionError = useCallback(() => {
    endGameRef.current?.(true)
  }, [])

  const { speak, stopListening, cancelSpeech, isPreparingSpeech } = useSpeech({
    gameState,
    voiceName,
    voiceSpeed,
    onTranscript: handleTranscript,
    onListeningChange: (val) => { setGlobalIsListening(val) },
    onSpeakingChange: (val) => { setGlobalIsSpeaking(val) },
    onTranscriptionError,
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
    if (newItem) console.log(`[Game:${gameType}] New item: ${newItem}`)

    if (newItem && itemTable?.[newItem]) {
      document.body.style.backgroundColor = itemTable[newItem]
    }
  }, [gameType, itemTable, onCurrentItemUpdate])

  // Stable ref so handleTranscript can call updateCurrentItem without it being in the dep array
  useEffect(() => { updateCurrentItemRef.current = updateCurrentItem }, [updateCurrentItem])

  // ----- Game flow -----

  const endGame = useCallback(async (isTimeout = false) => {
    const didPlay = gameStateRef.current === 'playing'
    cancelSpeech()
    stopListening()
    setAndLogGameState('ending', 'end game')
    updateCurrentItem(null)
    setLastHeardWord('')

    // Only speak a goodbye if the player actually got into the game — exiting
    // from the start screen or mid-intro has nothing to say goodbye to yet.
    if (didPlay) {
      if (isTimeout) {
        await speak(TIMEOUT_MESSAGE)
      } else {
        const idx = outroIndexRef.current
        outroIndexRef.current = (idx + 1) % OUTRO_RESPONSES.length
        if (typeof window !== 'undefined') localStorage.setItem('outroIndex', String(outroIndexRef.current))
        const outroOk = await speak(OUTRO_RESPONSES[idx](userName))
        if (!outroOk && userName) {
          await speak(OUTRO_RESPONSES[idx](null))
        }
      }
    }

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
    hintShownRef.current = false
    tipShownRef.current = false
    setLastInteraction(Date.now())
    setAndLogGameState('intro', 'start game')
    cancelSpeech()
    stopListening()

    await new Promise((r) => setTimeout(r, 500))

    const introText = longIntroEnabled
      ? (userName
          ? `Let's practice MindSight with ${gameType.toLowerCase()}s, ${userName}! I'll show you different ${gameType.toLowerCase()}s, and you tell me what you sense. Say "Help" at any time for controls. Are you ready?`
          : getLongIntroNoName(gameType))
      : getBriefIntro(gameType)

    const introOk = await speak(introText)
    if (!introOk && longIntroEnabled && userName) {
      await speak(getLongIntroNoName(gameType))
    }

    // If game was exited during intro, bail out
    if (gameStateRef.current !== 'intro') {
      lockStateChangeRef.current = false
      return
    }

    setAndLogGameState('playing', 'intro complete')
    setIsIntroComplete(true)

    const selectItemFunc = selectNewItemProp || selectNewItem
    const newItem = selectItemFunc(selectedItems, null)
    if (newItem) {
      updateCurrentItem(newItem)
      await speak(getFirstQuestion(gameType))
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
      if (onScreenTap) {
        onScreenTap({ goNext: handleNextItem, speak: speakRef.current })
      } else {
        handleNextItem()
      }
    }
  }, [gameState, handleNextItem, onScreenTap])

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

  // End game after configured inactivity period (no voice or tap)
  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setTimeout(() => {
      endGameRef.current?.(true)
    }, inactivityTimeout * 60 * 1000)
    return () => clearTimeout(timer)
  }, [gameState, lastInteraction, inactivityTimeout])

  // Prompt tip after 30s of no recognised interaction — once per session
  useEffect(() => {
    if (gameState !== 'playing' || tipShownRef.current) return
    const timer = setTimeout(() => {
      if (!tipShownRef.current) {
        tipShownRef.current = true
        speakRef.current?.(getTipText(gameType))
      }
    }, 30 * 1000)
    return () => clearTimeout(timer)
  }, [gameState, lastInteraction, gameType])

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
    <div className="relative h-screen overflow-hidden">
      {(gameState === 'initial' || keepBackground) && (
        <div className="fixed-full">
          <CosmicBackground />
        </div>
      )}
      <GameDisplay
        gameType={gameType}
        currentItem={currentItem ?? null}
        itemTable={itemTable}
        onClick={handleBackgroundClick}
        gameState={gameState}
        isIntroComplete={isIntroComplete}
        {...gameDisplayProps}
      />
      {gameState === 'initial' && (
        <div className="fixed inset-0 pt-16 pointer-events-none flex items-center justify-center">
          <motion.div
            className="text-center pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.h2
              className="game-title text-white text-5xl md:text-6xl font-bold mb-6"
              initial={{ y: -20 }} animate={{ y: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
            >
              {typeof window !== 'undefined' ? DOMPurify.sanitize(gameType) : gameType} Game
            </motion.h2>
            <motion.p
              className="game-description text-white mb-8"
              initial={{ y: 20 }} animate={{ y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 120 }}
            >
              Get your blindfold ready and let&apos;s begin!
            </motion.p>
            <motion.button
              onClick={startGame}
              className={`pointer-events-auto inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${accentColor} text-white font-medium text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              <Eye className="mr-2" size={20} />
              Start Game
            </motion.button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {gameState === 'intro' && isPreparingSpeech && (
          <LoadingIndicator key="loading" label="Tune into your senses…" />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(gameState === 'intro' || gameState === 'playing') && (
          <motion.div
            key="stop-button"
            className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={() => endGame()}
              className={`pointer-events-auto inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${accentColor} text-white font-medium text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            >
              Stop Game
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <GameSettings
            key="settings"
            title={`${gameType} Game Settings`}
            onClose={() => setIsSettingsOpen(false)}
            onSave={handleSaveSettings}
            itemTable={itemTable}
            selectedItems={selectedItems}
            accentColor={accentColor}
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
        onUpdatePreferences={handleUpdateUserPreferences}
      />
    </div>
  )
}
