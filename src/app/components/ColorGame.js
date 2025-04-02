'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ColorGameSettings from './ColorGameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { sanitizeInput, handleCommonVoiceCommands } from '@/utils/gameUtils'

const itemTable = {
  yellow: '#FFD700',
  green: '#008000',
  blue: '#1E90FF',
  purple: '#6A5ACD',
  pink: '#FF00FF',
  red: '#DC143C',
  orange: '#FF7F50',
};

const ColorGame = memo(function ColorGame({ 
  onGameStateChange = () => {},
  speak: parentSpeak = () => {},
  endGame = () => {},
}) {
  const [selectedItems, setSelectedItems] = useState(['yellow', 'green', 'blue', 'purple', 'pink', 'red', 'orange'])
  const [currentItem, setCurrentItem] = useState(null)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [gameState, setGameState] = useState('initial')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const currentItemRef = React.useRef(null)

  // Create a wrapped speak function that ensures logging
  const speak = useCallback((text) => {
    if (!text) {
      console.warn('[ColorGame] Attempted to speak empty text');
      return Promise.resolve();
    }
    
    console.log('[ColorGame] Speaking:', text);
    setIsSpeaking(true);
    
    // Return a promise that ensures speech completes
    return new Promise((resolve, reject) => {
      try {
        // Call the parent speak function
        const result = parentSpeak(text);
        
        // If it's a Promise, handle it properly
        if (result && typeof result.then === 'function') {
          result.then((res) => {
            // Add a delay after speech completes before resolving
            setTimeout(() => {
              setIsSpeaking(false);
              resolve(res);
            }, 500); // Add delay to ensure speech completes
          }).catch((error) => {
            console.error('[ColorGame] Error in speak:', error);
            setIsSpeaking(false);
            reject(error);
          });
        } else {
          // If it's not a Promise, add delay before resolving
          setTimeout(() => {
            setIsSpeaking(false);
            resolve(result);
          }, 500); // Add delay to ensure speech completes
        }
      } catch (error) {
        console.error('[ColorGame] Error in speak:', error);
        setIsSpeaking(false);
        reject(error);
      }
    });
  }, [parentSpeak]);

  const updateCurrentItem = useCallback((newItem) => {
    if (gameState === 'playing' && newItem) {
      console.log('ColorGame updateCurrentItem called with:', newItem)
      setCurrentItem(newItem)
      currentItemRef.current = newItem // Update ref immediately
      // Update background color immediately
      if (itemTable[newItem]) {
        console.log('Setting background color to:', itemTable[newItem])
        document.body.style.backgroundColor = itemTable[newItem]
      }
      return newItem // Return the item that was set
    }
    return null
  }, [gameState, itemTable])

  // Only initialize currentItem when game starts
  useEffect(() => {
    if (gameState === 'playing' && selectedItems.length > 0 && isIntroComplete) {
      if (!currentItem) {
        const initialItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
        console.log('Setting initial color:', initialItem)
        currentItemRef.current = initialItem // Set ref immediately
        setCurrentItem(initialItem)
        updateCurrentItem(initialItem)
        console.log('Speaking: What color is this?')
        speak(`What color is this?`).catch(error => {
          console.error('[ColorGame] Error speaking:', error);
        });
      }
    } else if (gameState === 'initial') {
      currentItemRef.current = null // Reset ref
      setCurrentItem(null)
      document.body.style.backgroundColor = ''
    }
  }, [gameState, currentItem, selectedItems, isIntroComplete, updateCurrentItem, speak])

  // Reset background color when game is not playing
  useEffect(() => {
    if (gameState !== 'playing') {
      document.body.style.backgroundColor = ''
      return
    }

    if (currentItem && gameState === 'playing' && isIntroComplete) {
      document.body.style.backgroundColor = itemTable[currentItem] || currentItem
    }
  }, [currentItem, gameState, itemTable, isIntroComplete])

  useEffect(() => {
    const savedItems = localStorage.getItem('colorGameSelectedItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length >= 2) {
          setSelectedItems(parsedItems);
        }
      } catch (error) {
        console.error('Error parsing saved items:', error);
      }
    }
    const savedLongIntro = localStorage.getItem('gameLongIntro');
    setLongIntroEnabled(savedLongIntro !== 'false');

    const savedName = localStorage.getItem('userPreferencesName') || '';
    const savedVoiceSpeed = parseFloat(localStorage.getItem('userPreferencesVoiceSpeed')) || 1.2;
    const savedVoiceName = localStorage.getItem('userPreferencesVoiceName');
    
    setUserName(sanitizeInput(savedName));
    setVoiceSpeed(savedVoiceSpeed);

    if (savedVoiceName && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === sanitizeInput(savedVoiceName));
      setSelectedVoice(voice || null);
    }
  }, []);

  const selectNewItem = useCallback((selectedItems, currentItem) => {
    if (!selectedItems || selectedItems.length === 0) return null
    
    let newItem
    do {
      newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
    } while (newItem === currentItem && selectedItems.length > 1)
    
    if (newItem) {
      console.log('New item selected:', newItem)
    }
    return newItem
  }, [])

  const handleNextItem = useCallback(async () => {
    if (gameState === 'playing') {
      const newItem = selectNewItem(selectedItems, currentItem)
      if (newItem) {
        console.log('handleNextItem selected:', newItem)
        const updatedItem = updateCurrentItem(newItem)
        if (updatedItem) {
          await speak(`What color is this?`)
        }
      }
    }
  }, [gameState, selectNewItem, selectedItems, currentItem, updateCurrentItem, speak])

  const handleVoiceCommand = useCallback((command) => {
    const gameType = 'Color';
    console.log('Processing voice command:', command, 'Current color:', currentItemRef.current);

    // Check if the command matches any color in our list first
    const matchedColor = selectedItems.find(color => 
      command.toLowerCase().includes(color.toLowerCase())
    );

    // If we have a color match, handle it before other commands
    if (matchedColor) {
      console.log('Found matching color:', matchedColor);
      
      // Always use currentItemRef.current for current color state
      const currentColor = currentItemRef.current;
      console.log('Current color from ref:', currentColor);
      
      // Compare the guessed color with the current color
      const isCorrect = currentColor && matchedColor.toLowerCase() === currentColor.toLowerCase();
      console.log('Color comparison:', { matched: matchedColor, current: currentColor, isCorrect });
      
      if (isCorrect) {
        console.log('Speaking: Correct!');
        speak('Correct!').then(() => {
          // Increased delay before next prompt
          setTimeout(async () => {
            const newItem = selectNewItem(selectedItems, matchedColor);
            console.log('Selected new item after correct guess:', newItem);
            if (newItem) {
              updateCurrentItem(newItem);
              // Add delay before asking next question
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log('Speaking: What color is this?');
              await speak(`What color is this?`);
            }
          }, 1500); // Increased delay
        }).catch(error => {
          console.error('[ColorGame] Error speaking:', error);
        });
      } else {
        console.log('Speaking: Try again');
        speak('Try again').catch(error => {
          console.error('[ColorGame] Error speaking:', error);
        });
      }
      return;
    }

    // Handle common commands if no color match
    const commonResult = handleCommonVoiceCommands(command, speak, selectNewItem, endGame, gameType);
    if (commonResult.action !== 'none') {
      if (commonResult.action === 'next') {
        handleNextItem();
      }
      return;
    }

    // Check for "show me" commands
    const showMatch = command.match(/show\s+(?:me\s+)?(?:the\s+)?(?:color\s+)?(\w+)/);
    if (showMatch) {
      const requestedColor = showMatch[1].toLowerCase();
      const validColor = selectedItems.find(color => 
        color.toLowerCase() === requestedColor
      );
      
      if (validColor) {
        updateCurrentItem(validColor);
        console.log(`Speaking: Showing you ${validColor}`);
        speak(`Showing you ${validColor}`).catch(error => {
          console.error('[ColorGame] Error speaking:', error);
        });
      } else {
        const message = `Sorry, ${requestedColor} is not a valid color. Available colors are: ${selectedItems.join(', ')}`;
        console.log('Speaking:', message);
        speak(message).catch(error => {
          console.error('[ColorGame] Error speaking:', error);
        });
      }
      return;
    }

    // If no valid command was found
    const message = `I didn't understand that. Please say a ${gameType} or say 'help' for instructions.`;
    console.log('Speaking:', message);
    speak(message).catch(error => {
      console.error('[ColorGame] Error speaking:', error);
    });
  }, [currentItemRef, selectedItems, endGame, updateCurrentItem, speak, selectNewItem, handleNextItem]);

  // Add an effect to ensure currentItemRef stays in sync
  useEffect(() => {
    if (currentItem) {
      currentItemRef.current = currentItem;
      console.log('Updated currentItemRef to:', currentItem);
    }
  }, [currentItem]);

  const renderGameContent = useCallback(({ gameState, startGame, endGame, isButtonAnimated, gameType }) => {
    if (gameState === 'initial') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2 
            className="game-title text-white text-5xl md:text-6xl font-bold mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
          >
            {gameType} Game
          </motion.h2>
          <motion.p 
            className="game-description text-white mb-8"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 120 }}
          >
            Get your blindfold ready and let&apos;s begin!
          </motion.p>
          <motion.button
            onClick={startGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="mr-2" size={20} />
            Start Game
          </motion.button>
        </motion.div>
      )
    }

    if (gameState === 'intro' || gameState === 'playing') {
      return (
        <motion.div
          key="game-button"
          initial={{ opacity: 0, y: 0 }}
          animate={{ 
            opacity: 1, 
            y: isButtonAnimated ? '30vh' : 0
          }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        >
          <motion.button
            onClick={endGame}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Stop Game
          </motion.button>
        </motion.div>
      )
    }

    return null
  }, [])

  const handleSaveSettings = useCallback((newSelectedItems) => {
    console.log("Saving new selected items:", newSelectedItems);
    setSelectedItems(newSelectedItems);
    localStorage.setItem('colorGameSelectedItems', JSON.stringify(newSelectedItems));
    
    localStorage.setItem('gameLongIntro', sanitizeInput(String(longIntroEnabled)));
  }, [longIntroEnabled]);

  const handleUpdateUserPreferences = useCallback((newName, newVoiceSpeed, newVoice) => {
    setUserName(newName);
    setVoiceSpeed(newVoiceSpeed);
    setSelectedVoice(newVoice);
    localStorage.setItem('userPreferencesName', sanitizeInput(newName));
    localStorage.setItem('userPreferencesVoiceSpeed', sanitizeInput(newVoiceSpeed.toString()));
    localStorage.setItem('userPreferencesVoiceName', sanitizeInput(newVoice?.name || ''));
  }, []);

  // Add a useEffect to ensure speech functions are properly initialized
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Load voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const englishVoice = voices.find(v => v.lang.startsWith('en-'));
          setSelectedVoice(englishVoice || voices[0]);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  return (
    <BaseGame
      GameSettings={ColorGameSettings}
      gameType="Color"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      itemTable={itemTable}
      backgroundMode="color"
      isIntroComplete={isIntroComplete}
      setIsIntroComplete={setIsIntroComplete}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      userName={userName}
      voiceSpeed={voiceSpeed}
      selectedVoice={selectedVoice}
      onUpdateUserPreferences={handleUpdateUserPreferences}
      selectNewItemProp={selectNewItem}
      speak={speak}
      onCurrentItemUpdate={updateCurrentItem}
      currentItem={currentItem}
      isListening={isListening}
      setIsListening={setIsListening}
      isSpeaking={isSpeaking}
      setIsSpeaking={setIsSpeaking}
      longIntroEnabled={longIntroEnabled}
    />
  )
});

export default ColorGame;

