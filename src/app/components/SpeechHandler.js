'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { sanitizeInput } from '@/utils/gameUtils'

const SpeechHandler = ({ 
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
}) => {
  // Add null checks at the start of the component
  if (!setGlobalIsListening || !setGlobalIsSpeaking || !setIsListeningLocal || !setIsSpeakingLocal) {
    console.warn('Required setter functions not provided to SpeechHandler')
    return { speak: () => {}, stopListening: () => {}, cancelSpeech: () => {}, startListening: () => {} }
  }
  
  const speechSynthesis = useRef(null)
  const recognition = useRef(null)

  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop()
    }
    console.log('Setting isListening to false')
    setGlobalIsListening(false)
    setIsListeningLocal(false)
  }, [setGlobalIsListening, setIsListeningLocal])

  const cancelSpeech = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel()
    }
    setGlobalIsSpeaking(false)
    setIsSpeakingLocal(false)
  }, [setGlobalIsSpeaking, setIsSpeakingLocal])

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
      const utterance = new SpeechSynthesisUtterance(sanitizeInput(text))
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
            startListening()
          }, 100) 
        }
        resolve()
      }
      speechSynthesis.current.speak(utterance)
    })
  }, [gameState, voiceSpeed, setGlobalIsSpeaking, setIsSpeakingLocal, stopListening])

  const startListening = useCallback(() => {
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
          startListening()
        }
      }

      recognition.current.onerror = (event) => {
        console.log('Speech recognition error:', event.error)
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
          setGlobalIsListening(false)
          setIsListeningLocal(false)
          if (gameState === 'playing' && !isSpeakingLocal) {
            startListening()
          }
        }
      }
    }

    if (!isSpeakingLocal && gameState === 'playing') {
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
  }, [gameState, isSpeakingLocal, setGlobalIsListening, setIsListeningLocal, handleVoiceCommand, currentItemRef, selectedItems, updateCurrentItem, endGame, gameType, selectNewItem])

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
  }, [selectedVoice])

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
    if (gameState === 'playing' && !isSpeakingLocal) {
      console.log('Starting listening')
      startListening()
    }
  }, [gameState, isSpeakingLocal, startListening])

  return { speak, stopListening, cancelSpeech, startListening }
}

export default SpeechHandler

