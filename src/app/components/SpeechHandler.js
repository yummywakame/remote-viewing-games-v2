'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { sanitizeInput } from '@/utils/gameUtils'

export default function SpeechHandler({
  gameState = 'initial',
  gameType = '',
  currentItem = null,
  selectedItems = [],
  updateCurrentItem = () => {},
  setAndLogGameState = () => {},
  setIsIntroComplete = () => {},
  setGlobalIsListening = () => {},
  setGlobalIsSpeaking = () => {},
  setIsListeningLocal: setParentListeningLocal = () => {},
  isSpeakingLocal: parentIsSpeakingLocal = false,
  setParentIsSpeaking = () => {},
  setParentIsListening = () => {},
  handleVoiceCommand = () => {},
  currentItemRef = { current: null },
  endGame = () => {},
  router = null,
  userName = '',
  longIntroEnabled = true,
  setLongIntroEnabled = () => {},
  voiceSpeed = 1,
  selectedVoice = null,
  selectNewItem = () => {},
  speak: parentSpeak = null
}) {
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false)
  const [isListeningLocal, setIsListeningLocal] = useState(false)
  const [lastHeardWord, setLastHeardWord] = useState('')

  // Initialize refs at the top level
  const speechSynthesis = useRef(null)
  const recognition = useRef(null)

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis
      
      // Force load voices
      window.speechSynthesis.getVoices()

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        console.log('Available voices:', voices.length)
        if (voices.length > 0) {
          // If no voice is selected, use the first available voice
          if (!selectedVoice) {
            const defaultVoice = voices[0]
            console.log('Setting default voice:', defaultVoice.name)
            selectedVoice = defaultVoice
          }
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [])

  // Sync isSpeakingLocal with parent
  useEffect(() => {
    setIsSpeakingLocal(parentIsSpeakingLocal)
  }, [parentIsSpeakingLocal])

  // Basic speech control functions that don't depend on other functions
  const cancelSpeech = useCallback(() => {
    console.log('Cancelling speech...')
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
      setIsSpeakingLocal(false)
      setParentIsSpeaking(false)
      setGlobalIsSpeaking(false)
    }
  }, [setGlobalIsSpeaking, setParentIsSpeaking])

  const stopListeningInternal = useCallback(() => {
    console.log('Stopping listening...')
    if (recognition.current) {
      try {
        recognition.current.stop()
      } catch (error) {
        console.error('Error stopping recognition:', error)
      }
      setIsListeningLocal(false)
      setParentListeningLocal(false)
      setParentIsListening(false)
      setGlobalIsListening(false)
    }
  }, [setGlobalIsListening, setParentIsListening, setParentListeningLocal])

  // Define startListening before speak to avoid hoisting issues
  const startListening = useCallback(() => {
    if (!recognition.current) {
      console.error('Speech recognition not initialized')
      return
    }
    
    if (gameState !== 'playing' || isSpeakingLocal) {
      console.log('Not starting listening:', { gameState, isSpeakingLocal })
      return
    }

    console.log('Starting listening...')
    try {
      recognition.current.start()
      setIsListeningLocal(true)
      setParentListeningLocal(true)
      setParentIsListening(true)
      setGlobalIsListening(true)
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        console.log('Speech recognition is already started')
      } else {
        console.error('Error starting speech recognition:', error)
        setIsListeningLocal(false)
        setParentListeningLocal(false)
        setParentIsListening(false)
        setGlobalIsListening(false)
      }
    }
  }, [gameState, isSpeakingLocal, setGlobalIsListening, setParentIsListening, setParentListeningLocal])

  // Speech functions that may depend on other functions
  const speak = useCallback(async (text) => {
    if (!text) return
    if (!speechSynthesis.current) {
      console.error('Speech synthesis not initialized')
      return
    }

    console.log('Speaking:', text)
    setIsSpeakingLocal(true)
    setParentIsSpeaking(true)
    setGlobalIsSpeaking(true)
    stopListeningInternal()

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(sanitizeInput(text))
      
      // Set a safe default rate
      utterance.rate = 1.0
      
      // Only set custom rate if it's a valid number
      if (typeof voiceSpeed === 'number' && isFinite(voiceSpeed) && voiceSpeed > 0) {
        utterance.rate = Math.max(0.1, Math.min(10, voiceSpeed))
      }
      
      // Get available voices
      const voices = window.speechSynthesis.getVoices()
      console.log('Available voices for speaking:', voices.length)
      
      // Try to find the selected voice, fallback to the first available voice
      if (voices.length > 0) {
        utterance.voice = voices.find(voice => voice.name === selectedVoice?.name) || voices[0]
        console.log('Using voice:', utterance.voice?.name)
      }

      utterance.onend = () => {
        console.log('Speech ended')
        setIsSpeakingLocal(false)
        setParentIsSpeaking(false)
        setGlobalIsSpeaking(false)
        resolve()
        // Start listening after speech ends if we're in playing state
        if (gameState === 'playing') {
          setTimeout(() => {
            startListening()
          }, 100)
        }
      }

      utterance.onerror = (event) => {
        console.error('Speech error:', event)
        setIsSpeakingLocal(false)
        setParentIsSpeaking(false)
        setGlobalIsSpeaking(false)
        resolve()
      }

      try {
        console.log('Starting speech synthesis...')
        speechSynthesis.current.speak(utterance)
      } catch (error) {
        console.error('Error speaking:', error)
        setIsSpeakingLocal(false)
        setParentIsSpeaking(false)
        setGlobalIsSpeaking(false)
        resolve()
      }
    })
  }, [voiceSpeed, setGlobalIsSpeaking, setIsSpeakingLocal, setParentIsSpeaking, stopListeningInternal, sanitizeInput, selectedVoice, gameState, startListening])

  // Initialize speech recognition after all functions are defined
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser')
        return
      }
      
      recognition.current = new SpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'en-US'

      recognition.current.onresult = (event) => {
        const last = event.results.length - 1
        const transcript = event.results[last][0].transcript.trim().toLowerCase()
        console.log('Voice command received:', transcript)
        handleVoiceCommand(transcript)
      }

      recognition.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListeningLocal(true)
        setParentListeningLocal(true)
        setParentIsListening(true)
        setGlobalIsListening(true)
      }

      recognition.current.onend = () => {
        console.log('Speech recognition ended')
        setIsListeningLocal(false)
        setParentListeningLocal(false)
        setParentIsListening(false)
        setGlobalIsListening(false)
        // Only restart if we're still in playing state and not speaking
        if (gameState === 'playing' && !isSpeakingLocal) {
          setTimeout(startListening, 100)
        }
      }

      recognition.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error)
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error)
          setIsListeningLocal(false)
          setParentListeningLocal(false)
          setParentIsListening(false)
          setGlobalIsListening(false)
        }
      }
    }

    return () => {
      if (recognition.current) {
        stopListeningInternal()
      }
    }
  }, [gameState, isSpeakingLocal, setGlobalIsListening, setParentIsListening, setParentListeningLocal, handleVoiceCommand, stopListeningInternal])

  // Auto-start listening when in playing state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gameState === 'playing' && !isSpeakingLocal) {
        console.log('Auto-starting listening')
        startListening()
      }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [gameState, isSpeakingLocal, startListening])

  // Return both the local speak function and the parent speak function
  return {
    speak: parentSpeak || speak,
    stopListening: stopListeningInternal,
    cancelSpeech: cancelSpeech,
    startListening: startListening
  }
}

