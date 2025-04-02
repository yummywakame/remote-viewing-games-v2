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

// Singleton for speech functions
const globalSpeechFunctions = {
  initialized: false,
  speak: null,
  startListening: null,
  stopListening: null,
  cancelSpeech: null,
  recognition: null,
  setupInProgress: false
}

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
  speak,
  onCurrentItemUpdate
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
  const isInitializedRef = useRef(false)
  const gameStateRef = useRef('initial')

  // State
  const [gameState, setGameState] = useState('initial')
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
    // Update speech functions ref with the new speak function
    if (speechFunctionsRef.current) {
      speechFunctionsRef.current.speak = speak
    }
  }, [speak])

  // Add a state lock ref to prevent race conditions
  const lockStateChangeRef = useRef(false)

  // Add a ref to track component mounting state
  const isUnmountingRef = useRef(false);

  // Replace the testBrowserAudio function with a simpler version
  const testBrowserAudio = async () => {
    try {
      console.log('[Audio] Testing if browser audio is likely to work...');
      
      // Simple check if Audio API exists and isn't blocked
      if (typeof window === 'undefined' || !window.AudioContext) {
        console.warn('[Audio] AudioContext API not available');
        return false;
      }
      
      // Just check if the AudioContext can be created, don't try to play sounds
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'running' || audioCtx.state === 'suspended') {
          console.log('[Audio] AudioContext created successfully');
          // Close it to free resources
          audioCtx.close();
          return true;
        } else {
          console.warn('[Audio] AudioContext created but in unexpected state:', audioCtx.state);
          audioCtx.close();
          return false;
        }
      } catch (e) {
        console.error('[Audio] Error creating AudioContext:', e);
        return false;
      }
    } catch (error) {
      console.error('[Audio] Browser audio test error:', error);
      return false;
    }
  };

  // Fix the recognition onend handler to prevent constant restarts
  const testSpeechSynthesis = async () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('[Speech] Speech synthesis not available in this browser');
      return false;
    }

    try {
      console.log('[Speech] Testing speech synthesis availability...');

      // Just check if the API exists and is accessible
      const voices = window.speechSynthesis.getVoices();
      console.log(`[Speech] Found ${voices.length} voices`);
      
      // Don't actually speak a test message, just check if the API is available
      return true;
    } catch (error) {
      console.error('[Speech] Error testing speech synthesis:', error);
      return false;
    }
  };

  // Modify the updateCurrentItem function to ensure color is applied directly
  const updateCurrentItem = useCallback((newItem) => {
    // Always log what we're trying to do
    console.log(`[UpdateItem] Called with: ${newItem}`);
    
    // Store in ref regardless of state to avoid inconsistencies
    currentItemRef.current = newItem;
    
    // Notify parent component of the update
    if (onCurrentItemUpdate) {
      onCurrentItemUpdate(newItem);
    }
    
    // Apply background color directly
    if (newItem && itemTable && itemTable[newItem]) {
      const colorValue = itemTable[newItem];
      console.log(`[UpdateItem] Setting background color to: ${colorValue}`);
      
      // Direct DOM manipulation for immediate effect
      if (typeof document !== 'undefined') {
        document.body.style.backgroundColor = colorValue;
        
        // Log success
        setTimeout(() => {
          const computedColor = window.getComputedStyle(document.body).backgroundColor;
          console.log(`[UpdateItem] Computed background color: ${computedColor}`);
        }, 50);
      }
    } else if (newItem) {
      console.warn(`[UpdateItem] No color found for ${newItem} in itemTable:`, itemTable);
    }
  }, [itemTable, onCurrentItemUpdate]);

  // Core utility functions
  const setAndLogGameState = useCallback((newState, action) => {
    // Only block state changes during unmounting if we're not trying to start the game
    if (isUnmountingRef.current && !(newState === 'intro' && action === 'start game')) {
      console.log(`[GameState] Blocked change to ${newState} during cleanup`);
      return;
    }

    // Don't allow changing from 'playing' to 'initial' during critical operations
    if (lockStateChangeRef.current && gameState === 'playing' && newState === 'initial') {
      console.log(`[GameState] BLOCKED change to ${newState} (${action}) - lock active`);
      return;
    }
    
    // Only log state changes if we're not in initial state or explicitly going to initial
    if (gameState !== 'initial' || newState === 'initial') {
      console.log(`[GameState] ${action}: ${gameState} -> ${newState}`);
    }
    
    setGameState(newState);
    // Update the ref immediately
    gameStateRef.current = newState;
    
    onGameStateChange(newState);
    setIsButtonAnimated(newState === 'intro' || newState === 'playing');
    setIsGamePlaying(newState === 'intro' || newState === 'playing');
    
    // Reset state when returning to initial or when not playing
    if (newState !== 'playing') {
      currentItemRef.current = null;
      if (onCurrentItemUpdate) {
        onCurrentItemUpdate(null);
      }
      setIsListeningLocal(false);
      setIsSpeakingLocal(false);
      setGlobalIsListening(false);
      setGlobalIsSpeaking(false);
    }
  }, [onGameStateChange, setIsGamePlaying, setGlobalIsListening, setGlobalIsSpeaking, onCurrentItemUpdate]);

  // Initialize speech functions once globally
  useEffect(() => {
    // Skip if we're cleaning up
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      const initializeSpeechFunctions = () => {
        try {
          // Skip if already initialized
          if (globalSpeechFunctions.initialized || globalSpeechFunctions.setupInProgress) {
            speechFunctionsRef.current = {
              speak: globalSpeechFunctions.speak,
              startListening: globalSpeechFunctions.startListening,
              stopListening: globalSpeechFunctions.stopListening,
              cancelSpeech: globalSpeechFunctions.cancelSpeech
            }
            return;
          }
          
          // Mark initialization as in progress
          globalSpeechFunctions.setupInProgress = true;
          console.log('[SpeechInit] Setting up speech functions...');
          
          // Create the speak function
          const createSpeakFunction = () => async (text) => {
            if (!text) {
              console.warn('[Speak] Attempted to speak empty text.');
              return Promise.resolve();
            }
            
            console.log(`[Speak] Attempting to speak: "${text}"`);
            
            // Update speaking state first
            setIsSpeakingLocal(true);
            setGlobalIsSpeaking(true);
            
            // Stop listening while speaking
            if (globalSpeechFunctions.stopListening) {
              globalSpeechFunctions.stopListening();
            }
            
            if (typeof window === 'undefined' || !window.speechSynthesis) {
              console.error('[Speak] Speech synthesis not available.');
              setIsSpeakingLocal(false);
              setGlobalIsSpeaking(false);
              return Promise.resolve();
            }
            
            try {
              // Cancel any ongoing speech and wait a moment
              window.speechSynthesis.cancel();
              await new Promise(resolve => setTimeout(resolve, 250));
              
              // Create utterance
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.rate = voiceSpeed || 1;
              utterance.volume = 1.0;
              utterance.pitch = 1.0;
              
              // Load voices synchronously first
              let voices = window.speechSynthesis.getVoices();
              console.log(`[Speak] Initial voices: ${voices.length}`);
              
              // If no voices, try to wait for them
              if (voices.length === 0) {
                console.log('[Speak] No voices available, waiting...');
                await new Promise((resolve) => {
                  const maxAttempts = 10;
                  let attempts = 0;
                  
                  const checkVoices = () => {
                    voices = window.speechSynthesis.getVoices();
                    if (voices.length > 0 || attempts >= maxAttempts) {
                      resolve();
                    } else {
                      attempts++;
                      setTimeout(checkVoices, 100);
                    }
                  };
                  
                  window.speechSynthesis.onvoiceschanged = () => {
                    voices = window.speechSynthesis.getVoices();
                    resolve();
                  };
                  
                  checkVoices();
                });
                
                voices = window.speechSynthesis.getVoices();
                console.log(`[Speak] After waiting, voices: ${voices.length}`);
              }
              
              // Set voice preference
              if (voices.length > 0) {
                let selectedVoiceObj = null;
                
                // Try to find the exact selected voice
                if (selectedVoice?.name) {
                  selectedVoiceObj = voices.find(v => v.name === selectedVoice.name);
                }
                
                // If not found, try to find an English voice
                if (!selectedVoiceObj) {
                  selectedVoiceObj = voices.find(v => v.lang.startsWith('en-'));
                }
                
                // Fallback to first voice
                if (!selectedVoiceObj && voices.length > 0) {
                  selectedVoiceObj = voices[0];
                }
                
                if (selectedVoiceObj) {
                  utterance.voice = selectedVoiceObj;
                  console.log(`[Speak] Using voice: ${selectedVoiceObj.name} (${selectedVoiceObj.lang})`);
                }
              }
              
              // Create and return promise
              return new Promise((resolve) => {
                let resolved = false;
                let speaking = false;
                
                const cleanup = () => {
                  if (!resolved) {
                    resolved = true;
                    // Wait a moment before updating state
                    setTimeout(() => {
                      setIsSpeakingLocal(false);
                      setGlobalIsSpeaking(false);
                      resolve();
                    }, 500);
                  }
                };

                utterance.onstart = () => {
                  console.log(`[Speak] Speech started: "${text}"`);
                  speaking = true;
                };
                
                utterance.onend = () => {
                  console.log(`[Speak] Speech ended: "${text}"`);
                  speaking = false;
                  cleanup();
                };
                
                utterance.onerror = (error) => {
                  console.error(`[Speak] Speech error for "${text}":`, error);
                  speaking = false;
                  cleanup();
                };
                
                // Safety timeout based on text length
                const timeoutDuration = Math.max(5000, text.length * 200);
                const timeout = setTimeout(() => {
                  console.warn(`[Speak] Safety timeout for "${text}" after ${timeoutDuration}ms`);
                  cleanup();
                }, timeoutDuration);
                
                // Start speaking
                console.log('[Speak] Starting speech synthesis...');
                window.speechSynthesis.speak(utterance);
                
                // Check if speech actually started
                setTimeout(() => {
                  if (!resolved) {
                    const isSpeaking = window.speechSynthesis.speaking;
                    console.log(`[Speak] Speaking state after delay: ${isSpeaking}`);
                    if (!isSpeaking && !speaking) {
                      console.log('[Speak] Speech failed to start, retrying...');
                      window.speechSynthesis.cancel();
                      // Wait a moment before retrying
                      setTimeout(() => {
                        if (!resolved) {
                          window.speechSynthesis.speak(utterance);
                        }
                      }, 250);
                    }
                  }
                }, 500);
              });
            } catch (error) {
              console.error('[Speak] General error in speak function:', error);
              setIsSpeakingLocal(false);
              setGlobalIsSpeaking(false);
              return Promise.reject(error);
            }
          };
          
          // Create startListening function with error handling
          const startListeningFunction = () => {
            try {
              if (!globalSpeechFunctions.recognition) {
                console.error('[Listen] Speech recognition not available');
                return;
              }
              
              // Use the ref value for current game state
              if (gameStateRef.current !== 'playing') {
                console.warn(`[Listen] Cannot start: game not in playing state (${gameStateRef.current})`);
                return;
              }
              
              if (isSpeakingLocal) {
                console.warn('[Listen] Cannot start: currently speaking');
                return;
              }
              
              if (isListeningLocal) {
                console.warn('[Listen] Already listening');
                return;
              }
              
              try {
                console.log('[Listen] Starting speech recognition');
                globalSpeechFunctions.recognition.start();
              } catch (error) {
                if (error.name === 'InvalidStateError') {
                  console.warn('[Listen] Recognition already started');
                } else {
                  console.error('[Listen] Error starting:', error);
                }
              }
            } catch (error) {
              console.error('[Listen] Error in startListening function:', error);
            }
          };
          
          // Create stopListening function with error handling
          const stopListeningFunction = () => {
            try {
              if (!globalSpeechFunctions.recognition) {
                return;
              }
              
              try {
                console.log('[Listen] Stopping speech recognition');
                globalSpeechFunctions.recognition.stop();
                setIsListeningLocal(false);
                setGlobalIsListening(false);
              } catch (error) {
                // Handle case where recognition was already stopped
                if (error.name === 'InvalidStateError') {
                  console.log('[Listen] Recognition was already stopped');
                  // Still update state to be safe
                  setIsListeningLocal(false);
                  setGlobalIsListening(false);
                } else {
                  console.error('[Listen] Error stopping speech recognition:', error);
                }
              }
            } catch (error) {
              console.error('[Listen] Error in stopListening function:', error);
            }
          };
          
          // Initialize speech recognition
          let recognition = null;
          try {
            if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
              recognition = new SpeechRecognition();
              recognition.continuous = false;
              recognition.interimResults = false;
              recognition.lang = 'en-US';
              
              recognition.onstart = () => {
                console.log('[Listen] Speech recognition started');
                setIsListeningLocal(true);
                setGlobalIsListening(true);
              };
              
              recognition.onend = () => {
                console.log('[Listen] Speech recognition ended');
                setIsListeningLocal(false);
                setGlobalIsListening(false);
                
                // Only auto-restart if we're in playing state and not speaking
                if (gameStateRef.current === 'playing' && !isSpeakingLocal && !isUnmountingRef.current) {
                  // Add a reference to track restart attempts to prevent loops
                  if (!recognition.restartAttempts) {
                    recognition.restartAttempts = 0;
                  }
                  
                  recognition.restartAttempts++;
                  
                  // Limit restart attempts to prevent infinite loops
                  if (recognition.restartAttempts <= 5) {
                    console.log(`[Listen] Auto-restart attempt ${recognition.restartAttempts}/5`);
                    
                    // Use increasing timeouts for successive attempts
                    const delay = 2000 + (recognition.restartAttempts * 1000); // Increased delays
                    
                    setTimeout(() => {
                      // Double check conditions again before restart
                      if (gameStateRef.current === 'playing' && !isSpeakingLocal && !isUnmountingRef.current) {
                        // Reset restart count after sufficient delay
                        if (Date.now() - (recognition.lastRestartTime || 0) > 15000) { // Increased delay
                          recognition.restartAttempts = 0;
                        }
                        
                        recognition.lastRestartTime = Date.now();
                        
                        if (globalSpeechFunctions.startListening) {
                          console.log('[Listen] Auto-restarting listening');
                          globalSpeechFunctions.startListening();
                        }
                      } else {
                        console.log(`[Listen] Skipped auto-restart: conditions changed`);
                        recognition.restartAttempts = 0;
                      }
                    }, delay);
                  } else {
                    console.log('[Listen] Maximum restart attempts reached, pausing auto-restart');
                    
                    // Reset after a longer delay
                    setTimeout(() => {
                      recognition.restartAttempts = 0;
                    }, 20000); // Increased reset delay
                  }
                } else {
                  // Reset restart attempts if we're not trying to restart
                  if (recognition.restartAttempts) {
                    recognition.restartAttempts = 0;
                  }
                }
              };
              
              recognition.onresult = (event) => {
                const last = event.results.length - 1;
                const command = event.results[last][0].transcript.trim().toLowerCase();
                console.log('[Listen] Voice command received:', command);
                
                // Stop listening while processing the command
                stopListeningFunction();
                
                // Process the command after a short delay to allow any ongoing speech to finish
                setTimeout(() => {
                  if (handleVoiceCommand) {
                    handleVoiceCommand(command);
                  }
                }, 500);
              };
              
              recognition.onerror = (event) => {
                console.error('[Listen] Speech recognition error:', event.error);
                
                // Reset listening state
                setIsListeningLocal(false);
                setGlobalIsListening(false);
                
                // Wait longer before retrying after an error
                setTimeout(() => {
                  if (gameStateRef.current === 'playing' && !isSpeakingLocal) {
                    startListeningFunction();
                  }
                }, 3000);
              };
              
              globalSpeechFunctions.recognition = recognition;
            } else {
              console.error('[SpeechInit] Speech recognition not available in this browser');
            }
          } catch (recognitionError) {
            console.error('[SpeechInit] Error initializing speech recognition:', recognitionError);
          }
          
          // Create cancelSpeech function with error handling
          const cancelSpeechFunction = () => {
            try {
              if (typeof window === 'undefined' || !window.speechSynthesis) {
                return;
              }
              
              console.log('[Speak] Cancelling speech')
              window.speechSynthesis.cancel()
              setIsSpeakingLocal(false)
              setGlobalIsSpeaking(false)
            } catch (error) {
              console.error('[Speak] Error in cancelSpeech function:', error);
            }
          };
          
          // Create speak function with error handling
          const speakFunction = createSpeakFunction();
          
          // Set global functions
          globalSpeechFunctions.speak = speakFunction;
          globalSpeechFunctions.startListening = startListeningFunction;
          globalSpeechFunctions.stopListening = stopListeningFunction;
          globalSpeechFunctions.cancelSpeech = cancelSpeechFunction;
          globalSpeechFunctions.initialized = true;
          globalSpeechFunctions.setupInProgress = false;
          
          // Set local functions
          speechFunctionsRef.current = {
            speak: speakFunction,
            startListening: startListeningFunction,
            stopListening: stopListeningFunction,
            cancelSpeech: cancelSpeechFunction
          };
          
          console.log('[SpeechInit] Speech functions setup complete');
        } catch (initError) {
          console.error('[SpeechInit] Fatal error in speech initialization:', initError);
          globalSpeechFunctions.setupInProgress = false;
          
          // Create fallback functions that just log errors
          const fallbackSpeak = async (text) => {
            console.error('[Speak-Fallback] Speech synthesis unavailable:', text);
            return Promise.resolve();
          };
          
          const fallbackFunction = () => {
            console.error('[Speech-Fallback] Speech function unavailable');
          };
          
          // Set fallback functions
          globalSpeechFunctions.speak = fallbackSpeak;
          globalSpeechFunctions.startListening = fallbackFunction;
          globalSpeechFunctions.stopListening = fallbackFunction;
          globalSpeechFunctions.cancelSpeech = fallbackFunction;
          globalSpeechFunctions.initialized = true;
          
          speechFunctionsRef.current = {
            speak: fallbackSpeak,
            startListening: fallbackFunction,
            stopListening: fallbackFunction,
            cancelSpeech: fallbackFunction
          };
        }
      };
      
      initializeSpeechFunctions();
    }
    
    // Reset unmounting flag on mount
    isUnmountingRef.current = false;

    // Upon mounting
    return () => {
      // Upon unmounting
      isUnmountingRef.current = true;
      console.log('[Cleanup] Component unmounting, cleanup in progress');
      
      // Perform cleanup
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      // Clear any pending timeouts
      if (window) {
        const highestTimeoutId = window.setTimeout(() => {}, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
          window.clearTimeout(i);
        }
      }

      // Reset flag after 100ms to allow for potential remounting
      setTimeout(() => {
        isUnmountingRef.current = false;
      }, 100);
    };
  }, []);

  // Add back the endGame function
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

  // Add a function to manually check if microphone permission is granted
  const checkMicrophonePermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('MediaDevices API not supported in this browser');
      return false;
    }
    
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      
      // Stop all tracks to release the microphone
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }, []);

  // Define verifyGameState before startGame to avoid reference error
  const verifyGameState = useCallback(async () => {
    // First check without delay
    if (gameStateRef.current === 'playing' && gameState === 'playing') {
      console.log('[Verify] Game state is valid for listening: playing');
      return true;
    }
    
    // If there's a mismatch, wait a moment and check again
    // This helps with transitions and React's batched state updates
    console.log(`[Verify] Checking state consistency: Ref: ${gameStateRef.current}, State: ${gameState}`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        if (gameStateRef.current === 'playing' && gameState === 'playing') {
          console.log('[Verify] Game state is now valid after delay');
          resolve(true);
        } else if (gameStateRef.current === 'playing') {
          // If ref is playing but state isn't, force sync the state
          console.log('[Verify] Forcing state sync to match ref (playing)');
          setGameState('playing');
          resolve(true);
        } else {
          console.warn(`[Verify] Game state inconsistency! Ref: ${gameStateRef.current}, State: ${gameState}`);
          resolve(false);
        }
      }, 200);
    });
  }, [gameState, setGameState]);

  // Now define startGame after verifyGameState
  const startGame = useCallback(async () => {
    console.log('[StartGame] Initializing...');
    if (!speechFunctionsRef.current.speak) {
      console.error('[StartGame] Speech functions not ready.');
      return;
    }
    
    try {
      // Test browser audio first
      const audioWorks = await testBrowserAudio();
      if (!audioWorks) {
        console.warn('[StartGame] Browser audio test failed');
      }
      
      // Test speech synthesis
      const speechWorks = await testSpeechSynthesis();
      if (!speechWorks) {
        console.warn('[StartGame] Speech synthesis may not be working');
      }
      
      // Lock state changes during critical startup phase
      lockStateChangeRef.current = true;
      
      await checkMicrophonePermission();
      
      // Set state to intro
      setAndLogGameState('intro', 'start game');
      
      // Stop any existing speech/listening
      if (speechFunctionsRef.current.cancelSpeech) speechFunctionsRef.current.cancelSpeech();
      if (speechFunctionsRef.current.stopListening) speechFunctionsRef.current.stopListening();
      
      // Wait longer for state updates and cancellations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Speak intro with longer wait
      const introText = longIntroEnabled ? 
        `Welcome${userName ? ` ${userName}` : ''} to the ${gameType} Game! I will show you different ${gameType.toLowerCase()}s, and you need to tell me what they are. Are you ready?` :
        `Let's play the ${gameType} Game!`;
      
      console.log('[StartGame] Speaking intro:', introText);
      await speechFunctionsRef.current.speak(introText);
      
      // Wait longer after intro speech
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set state to playing
      setAndLogGameState('playing', 'intro complete');
      setIsIntroComplete(true);
      
      // Wait longer for state to stabilize
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      // Select initial item
      const selectItemFunc = selectNewItemProp || selectNewItem;
      const newItem = await selectItemFunc(selectedItems, null);
      
      if (newItem) {
        console.log(`[StartGame] Selected initial item: ${newItem}`);
        updateCurrentItem(newItem);
        
        // Direct DOM manipulation for immediate effect
        if (itemTable && itemTable[newItem]) {
          document.body.style.backgroundColor = itemTable[newItem];
        }
        
        // Wait longer for UI to update
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        // Ask the question and wait for it to complete
        console.log('[StartGame] Asking first question');
        await speechFunctionsRef.current.speak(`What ${gameType.toLowerCase()} is this?`);
        
        // Wait after question before starting listening
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Safe to unlock state changes now
        lockStateChangeRef.current = false;
        
        if (speechFunctionsRef.current.startListening) {
          const stateIsValid = await verifyGameState();
          if (stateIsValid) {
            console.log('[StartGame] Starting listening after intro sequence');
            speechFunctionsRef.current.startListening();
          } else {
            console.warn('[StartGame] Game state verification failed');
            
            // Last resort attempt if gameStateRef is correct
            if (gameStateRef.current === 'playing') {
              await new Promise(resolve => setTimeout(resolve, 1000));
              setGameState('playing');
              
              setTimeout(() => {
                if (gameStateRef.current === 'playing') {
                  console.log('[StartGame] Starting listening after state recovery');
                  speechFunctionsRef.current.startListening();
                }
              }, 1000);
            }
          }
        }
    } else {
        lockStateChangeRef.current = false;
        console.error('[StartGame] Failed to select initial item');
      }
    } catch (error) {
      lockStateChangeRef.current = false;
      console.error('[StartGame] Error during game start:', error);
    }
  }, [
    setAndLogGameState, gameType, userName, longIntroEnabled, setIsIntroComplete, 
    selectedItems, selectNewItemProp, updateCurrentItem, checkMicrophonePermission, 
    itemTable, verifyGameState, setGameState
  ]);

  // Explicitly verify the game display works
  useEffect(() => {
    if (gameState === 'playing' && currentItemRef.current && itemTable) {
      const color = currentItemRef.current;
      const colorValue = itemTable[color];
      
      if (colorValue) {
        console.log(`Verifying UI: Current item is ${color}, color value is ${colorValue}`);
        
        // Force background color update
        document.body.style.backgroundColor = colorValue;
      }
    }
  }, [gameState, currentItemRef, itemTable]);

  // Add back the handleNextItem function
  const handleNextItem = useCallback(async () => {
    if (gameState === 'playing') {
      // Stop any ongoing speech or listening
      if (speechFunctionsRef.current.cancelSpeech) speechFunctionsRef.current.cancelSpeech()
      if (speechFunctionsRef.current.stopListening) speechFunctionsRef.current.stopListening()
      
      // Select a new item
      const selectItemFunc = selectNewItemProp || selectNewItem
      const newItem = await selectItemFunc(selectedItems, currentItemRef.current)
      if (newItem) {
        console.log('Selected next item:', newItem)
    updateCurrentItem(newItem)
        
        // Force immediate background color update
        if (newItem && itemTable && itemTable[newItem]) {
          console.log(`Directly setting background color to: ${itemTable[newItem]} for ${newItem}`)
          document.body.style.backgroundColor = itemTable[newItem]
        }
        
        // Allow a moment for the UI to update
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Ask about the color
        await speechFunctionsRef.current.speak(`What ${gameType.toLowerCase()} is this?`)
        
        // Wait until speech is definitely complete
        await new Promise(resolve => setTimeout(resolve, 700))
        
        // Now it's safe to start listening
        if (speechFunctionsRef.current.startListening && gameState === 'playing') {
          console.log('Starting listening after prompt')
          speechFunctionsRef.current.startListening()
        }
      }
    }
  }, [gameState, selectNewItemProp, selectedItems, currentItemRef, updateCurrentItem, gameType, itemTable]);

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

  // Update the ref whenever gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Simplify the background color effect
  useEffect(() => {
    if (gameType === 'Color' && gameState === 'playing' && currentItemRef.current) {
      const colorValue = itemTable?.[currentItemRef.current];
      if (colorValue) {
        document.body.style.backgroundColor = colorValue;
        document.documentElement.style.backgroundColor = colorValue;
        
        // Apply !important style via stylesheet
        const styleElement = document.getElementById('color-game-style') || document.createElement('style');
        styleElement.id = 'color-game-style';
        styleElement.textContent = `
          body, html, .game-display {
            background-color: ${colorValue} !important;
            background: ${colorValue} !important;
          }
        `;
        
        if (!document.getElementById('color-game-style')) {
          document.head.appendChild(styleElement);
        }
      }
    }
  }, [gameType, gameState, itemTable]);

  // Render
  return (
    <div className="relative h-screen overflow-auto">
      <GameDisplay
        gameType={gameType}
        currentItem={currentItemRef.current}
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

