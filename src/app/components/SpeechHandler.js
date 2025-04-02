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
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize refs at the top level
  const speechSynthesis = useRef(null)
  const recognition = useRef(null)

  // Initialize speech synthesis only when needed
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      // Initialize speech synthesis silently
      speechSynthesis.current = window.speechSynthesis
      
      // Force load voices silently
      window.speechSynthesis.getVoices()

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        recognition.current = new SpeechRecognition()
        recognition.current.continuous = false
        recognition.current.interimResults = false
        recognition.current.lang = 'en-US'
        
        recognition.current.onstart = () => {
          if (gameState === 'playing') {
            console.log('Speech recognition started')
          }
          setIsListeningLocal(true)
          setParentListeningLocal(true)
          setParentIsListening(true)
          setGlobalIsListening(true)
        }
        
        recognition.current.onend = () => {
          if (gameState === 'playing') {
            console.log('Speech recognition ended')
          }
          setIsListeningLocal(false)
          setParentListeningLocal(false)
          setParentIsListening(false)
          setGlobalIsListening(false)
          
          // Restart listening if we're still in playing state
          if (gameState === 'playing' && !isSpeakingLocal) {
            startListening()
          }
        }
        
        recognition.current.onresult = (event) => {
          const last = event.results.length - 1
          const command = event.results[last][0].transcript.trim().toLowerCase()
          if (gameState === 'playing') {
            console.log('Voice command received:', command)
          }
          setLastHeardWord(command)
          handleVoiceCommand(command)
        }

        recognition.current.onerror = (event) => {
          if (gameState === 'playing') {
            console.error('Speech recognition error:', event.error)
            if (event.error === 'no-speech') {
              console.log('No speech detected')
            }
          }
        }
      }
      
      setIsInitialized(true)
    }

    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
      if (recognition.current) {
        try {
          recognition.current.stop()
        } catch (error) {
          // Ignore errors when stopping recognition
        }
      }
    }
  }, [gameState, isInitialized, isSpeakingLocal, setGlobalIsListening, setParentIsListening, setParentListeningLocal, handleVoiceCommand])

  // Reset state when game returns to initial
  useEffect(() => {
    if (gameState === 'initial') {
      setIsListeningLocal(false)
      setIsSpeakingLocal(false)
      setParentListeningLocal(false)
      setParentIsSpeaking(false)
      setGlobalIsListening(false)
      setGlobalIsSpeaking(false)
      if (recognition.current) {
        try {
          recognition.current.stop()
        } catch (error) {
          console.log('Recognition already stopped')
        }
      }
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel()
      }
    }
  }, [gameState, setGlobalIsListening, setGlobalIsSpeaking, setParentListeningLocal, setParentIsSpeaking])

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
      return
    }

    try {
      recognition.current.start()
      setIsListeningLocal(true)
      setParentListeningLocal(true)
      setParentIsListening(true)
      setGlobalIsListening(true)
    } catch (error) {
      if (error.name === 'InvalidStateError') {
        // Silently handle already started state
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
      
      // Set voice properties
      utterance.rate = Math.max(0.1, Math.min(10, voiceSpeed || 1))
      utterance.volume = 1
      utterance.pitch = 1
      
      // Get available voices and select one
      const voices = speechSynthesis.current.getVoices()
      console.log('Available voices:', voices.length)
      
      // Try to find the selected voice, fallback to the first English voice
      if (voices.length > 0) {
        utterance.voice = selectedVoice || 
          voices.find(voice => voice.lang.startsWith('en-')) || 
          voices[0]
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
          setTimeout(startListening, 500) // Increased delay to prevent overlap
        }
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event)
        setIsSpeakingLocal(false)
        setParentIsSpeaking(false)
        setGlobalIsSpeaking(false)
        resolve()
      }

      try {
        speechSynthesis.current.speak(utterance)
      } catch (error) {
        console.error('Error speaking:', error)
        setIsSpeakingLocal(false)
        setParentIsSpeaking(false)
        setGlobalIsSpeaking(false)
        resolve()
      }
    })
  }, [gameState, voiceSpeed, selectedVoice, stopListeningInternal, setGlobalIsSpeaking, setParentIsSpeaking, startListening])

  // Auto-start listening when in playing state
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (gameState === 'playing' && !isSpeakingLocal) {
        startListening()
      }
    }, 500) // Increased delay to prevent overlap
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

