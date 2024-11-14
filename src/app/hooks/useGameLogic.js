'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function useGameLogic(gameType, handleSpecificCommand, getNextItem, checkGuess) {
  const [gameState, setGameState] = useState('initial')
  const [currentItem, setCurrentItem] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')
  const speechSynthesis = useRef(null)
  const speechUtterance = useRef(null)
  const recognition = useRef(null)
  const lastCommandTime = useRef(0)
  const restartTimeout = useRef(null)
  const router = useRouter()

  const stopListening = useCallback(() => {
    if (restartTimeout.current) {
      clearTimeout(restartTimeout.current)
      restartTimeout.current = null
    }
    
    if (recognition.current) {
      recognition.current.onend = null
      recognition.current.onstart = null
      recognition.current.onerror = null
      recognition.current.onresult = null
      try {
        recognition.current.abort()
      } catch (error) {
        console.error('Error aborting recognition:', error)
      }
    }
    setIsListening(false)
    console.log('Stopped listening')
  }, [])

  const startListening = useCallback(
    debounce(() => {
      if (recognition.current?.state === 'running') {
        console.log('Recognition is already running, skipping start')
        return
      }

      if (gameState !== 'playing') {
        console.log('Cannot start listening: game state is not playing', { gameState })
        return
      }

      if (isListening) {
        console.log('Already listening flag is set, skipping start')
        return
      }

      if (isSpeaking) {
        console.log('Currently speaking, cannot start listening')
        return
      }

      if (restartTimeout.current) {
        clearTimeout(restartTimeout.current)
        restartTimeout.current = null
      }

      if (Date.now() - lastCommandTime.current < 1000) {
        console.log('Too soon after last command, delaying start')
        setTimeout(startListening, 1000)
        return
      }

      try {
        stopListening()
        recognition.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
        recognition.current.continuous = false
        recognition.current.interimResults = false
        recognition.current.lang = 'en-US'

        recognition.current.onresult = (event) => {
          const last = event.results.length - 1
          const transcript = event.results[last][0].transcript.trim()
          console.log('Recognized words:', transcript)
          setLastHeardWord(transcript)
          handleVoiceCommand(transcript.toLowerCase())
        }

        recognition.current.onstart = () => {
          console.log('Recognition started')
          setIsListening(true)
        }

        recognition.current.onend = () => {
          console.log('Recognition ended')
          setIsListening(false)

          if (restartTimeout.current) {
            clearTimeout(restartTimeout.current)
          }

          if (gameState === 'playing' && !isSpeaking) {
            restartTimeout.current = setTimeout(() => {
              if (gameState === 'playing' && !isListening && !isSpeaking) {
                startListening()
              }
            }, 5000)
          }
        }

        recognition.current.onerror = (event) => {
          if (event.error === 'no-speech') {
            console.log('No speech detected, continuing to listen')
            if (recognition.current) {
              recognition.current.stop()
            }
            return
          }
          
          if (event.error === 'aborted') {
            console.log('Recognition aborted')
            return
          }
          
          console.error('Recognition error:', event.error)
          setIsListening(false)
          
          if (gameState === 'playing') {
            restartTimeout.current = setTimeout(() => {
              if (gameState === 'playing' && !isListening && !isSpeaking) {
                startListening()
              }
            }, 5000)
          }
        }

        recognition.current.start()
        console.log('Started listening')
      } catch (error) {
        console.error('Recognition start error:', error)
        setIsListening(false)
        
        if (gameState === 'playing') {
          restartTimeout.current = setTimeout(() => {
            if (gameState === 'playing' && !isListening && !isSpeaking) {
              startListening()
            }
          }, 5000)
        }
      }
    }, 300),
    [gameState, isListening, isSpeaking, stopListening]
  )

  const speak = useCallback((text) => {
    return new Promise((resolve, reject) => {
      if (!speechSynthesis.current || !speechUtterance.current) {
        reject(new Error('Speech synthesis not initialized'))
        return
      }

      if (speechSynthesis.current.speaking) {
        speechSynthesis.current.cancel()
        setTimeout(() => {
          setupAndSpeak()
        }, 100)
      } else {
        setupAndSpeak()
      }

      function setupAndSpeak() {
        stopListening()
        setIsSpeaking(true)

        const utterance = new SpeechSynthesisUtterance('... ' + text)
        utterance.voice = speechUtterance.current.voice
        utterance.rate = 0.9
        utterance.pitch = 1.0

        utterance.onend = () => {
          console.log('Speech ended:', text)
          setIsSpeaking(false)
          resolve()

          if (text === `What ${gameType} is this?`) {
            setGameState('playing')
            setTimeout(() => startListening(), 500)
          } else if (gameState === 'playing' && text !== "Thank you for playing!") {
            setTimeout(() => startListening(), 500)
          }
        }

        utterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') {
            console.log('Speech interrupted, continuing with game')
            setIsSpeaking(false)
            resolve()
            return
          }
          console.error('Speech synthesis error:', event)
          setIsSpeaking(false)
          reject(event)
        }

        setTimeout(() => {
          speechSynthesis.current.speak(utterance)
        }, 100)
      }
    })
  }, [stopListening, startListening, gameState, gameType])

  const askForItem = useCallback(async () => {
    try {
      console.log('Speaking item prompt')
      await speak(`What ${gameType} is this?`)
      console.log('Item prompt completed')
    } catch (error) {
      console.error('Error in askForItem:', error)
    }
  }, [speak, gameType])

  const handleNextItem = useCallback(async () => {
    const now = Date.now()
    if (now - lastCommandTime.current < 1000) {
      return
    }
    lastCommandTime.current = now
    setCurrentItem(getNextItem())
    await askForItem()
  }, [getNextItem, askForItem])

  const endGame = useCallback(async () => {
    const cleanup = () => {
      stopListening()
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      setGameState('initial')
      setCurrentItem(null)
      setLastHeardWord('')
      setIsListening(false)
      setIsSpeaking(false)
      console.log('Game ended')
    }

    cleanup()
    await speak("Thank you for playing!")
    router.push('/')
  }, [stopListening, speak, router])

  const handleVoiceCommand = useCallback((command) => {
    console.log('Voice command received:', command)
    console.log('Current game state:', gameState)
    console.log('Current item:', currentItem)
    console.log('Processing command:', command)
    const lowerCommand = command.toLowerCase()

    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      handleNextItem()
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
    } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
      console.log('Help requested')
      speak(`To proceed to the next ${gameType} say, 'next', or click anywhere on the screen. To end the game say, 'stop'. For a hint you can ask, 'what ${gameType} is it?' . To display any ${gameType} say, 'show me', followed by the ${gameType} you want to see.`)
    } else if (/\b(what|which)(?:\s+(?:is|it))?\b/.test(lowerCommand)) {
      console.log('Item hint requested')
      speak(`The current ${gameType} is ${currentItem}.`)
    } else {
      const result = handleSpecificCommand(lowerCommand, currentItem)
      if (result) {
        speak(result)
      } else {
        const guess = checkGuess(lowerCommand, currentItem)
        if (guess.correct) {
          speak(`Well done! The ${gameType} is ${currentItem}.`)
        } else if (guess.message) {
          speak(guess.message)
        } else {
          speak("Try again!")
        }
      }
    }
  }, [currentItem, handleNextItem, endGame, speak, gameState, handleSpecificCommand, checkGuess, gameType])

  const startGame = useCallback(async () => {
    try {
      setGameState('intro')
      await speak(`Welcome to the ${gameType} Game! When prompted, say the ${gameType} you think it is, or say 'help' at any time for further instructions. Good luck!`)
      await handleNextItem()
    } catch (error) {
      console.error('Error starting game:', error)
      endGame()
    }
  }, [speak, handleNextItem, endGame, gameType])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.current = window.speechSynthesis
      const loadVoices = () => {
        const voices = speechSynthesis.current.getVoices()
        if (voices.length > 0) {
          speechUtterance.current = new SpeechSynthesisUtterance()
          speechUtterance.current.voice = voices[0]
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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = true
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'
    }

    return () => {
      stopListening()
    }
  }, [stopListening])

  useEffect(() => {
    if (gameState === 'playing' && !isListening && !isSpeaking) {
      console.log('Starting listening due to game state change to playing')
      const timeoutId = setTimeout(() => {
        if (!isListening && !isSpeaking) {
          startListening()
        }
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [gameState, isListening, isSpeaking, startListening])

  return {
    gameState,
    setGameState,
    currentItem,
    setCurrentItem,
    isListening,
    isSpeaking,
    lastHeardWord,
    startGame,
    endGame,
    handleVoiceCommand,
    speak,
    startListening,
    stopListening
  }
}

// Utility function for debouncing
const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}