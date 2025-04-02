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
  speak = () => {},
  endGame = () => {},
}) {
  const [selectedItems, setSelectedItems] = useState(['yellow', 'green', 'blue', 'purple', 'pink', 'red', 'orange'])
  const [currentItem, setCurrentItem] = useState(null)
  const [longIntroEnabled, setLongIntroEnabled] = useState(true)
  const [isIntroComplete, setIsIntroComplete] = useState(false)
  const [userName, setUserName] = useState('')
  const [voiceSpeed, setVoiceSpeed] = useState(1)
  const [selectedVoice, setSelectedVoice] = useState(null)

  // Initialize currentItem when the game starts
  useEffect(() => {
    if (!currentItem && selectedItems.length > 0) {
      const initialItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
      setCurrentItem(initialItem)
      console.log('Initial color selected:', initialItem)
    }
  }, [currentItem, selectedItems])

  const updateCurrentItem = useCallback((newItem) => {
    console.log('Updating current item to:', newItem)
    setCurrentItem(newItem)
  }, [])

  useEffect(() => {
    const savedItems = localStorage.getItem('colorGameSelectedItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems);
        if (Array.isArray(parsedItems) && parsedItems.length >= 2) {
          setSelectedItems(parsedItems);
          console.log("Loaded selected items:", parsedItems);
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

  useEffect(() => {
    if (currentItem) {
      console.log('Setting background color to:', itemTable[currentItem] || currentItem)
      document.body.style.backgroundColor = itemTable[currentItem] || currentItem
    } else {
      console.log('Resetting background color')
      document.body.style.backgroundColor = ''
    }

    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [currentItem])

  const selectNewItem = useCallback((selectedItems, currentItem, setCurrentItem) => {
    console.log('Selecting new item. Current item:', currentItem)
    console.log('Available items:', selectedItems)
    
    let newItem
    do {
      newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
    } while (newItem === currentItem && selectedItems.length > 1)
    
    console.log('New item selected:', newItem)
    setCurrentItem(newItem)
    return newItem
  }, [])

  const handleNextItem = useCallback(() => {
    selectNewItem(selectedItems, currentItem, setCurrentItem)
  }, [selectNewItem, selectedItems, currentItem])

  const handleVoiceCommand = useCallback((command) => {
    const gameType = 'Color'
    console.log('Processing voice command:', command, 'Current color:', currentItem)

    // Handle common commands first
    const commonResult = handleCommonVoiceCommands(command, speak, selectNewItem, endGame, gameType)
    if (commonResult.action !== 'none') {
      return
    }

    // Check for "show me" commands
    const showMatch = command.match(/show\s+(?:me\s+)?(?:the\s+)?(?:color\s+)?(\w+)/)
    if (showMatch) {
      const requestedColor = showMatch[1].toLowerCase()
      const matchedColor = selectedItems.find(color => 
        color.toLowerCase() === requestedColor
      )
      
      if (matchedColor) {
        updateCurrentItem(matchedColor)
        speak(`Showing you ${matchedColor}`)
      } else {
        speak(`Sorry, ${requestedColor} is not a valid color. Available colors are: ${selectedItems.join(', ')}`)
      }
    } else {
      // Check if the command matches any color in our list
      const matchedColor = selectedItems.find(color => 
        command.includes(color.toLowerCase())
      )
      
      if (matchedColor) {
        console.log('Color guess:', matchedColor, 'Current color:', currentItem)
        if (!currentItem) {
          speak('Please wait a moment while I select a color.')
          const newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
          updateCurrentItem(newItem)
          speak(`What color is this?`)
        } else if (matchedColor.toLowerCase() === currentItem.toLowerCase()) {
          speak('Correct!')
          selectNewItem(selectedItems, currentItem, setCurrentItem)
        } else {
          speak('Try again')
        }
      } else {
        speak(`I didn't understand that. Please say a ${gameType} or say 'help' for instructions.`)
      }
    }
  }, [currentItem, selectedItems, endGame, updateCurrentItem, speak, selectNewItem])

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

  return (
    <BaseGame
      GameSettings={(props) => (
        <ColorGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
          longIntroEnabled={longIntroEnabled}
          setLongIntroEnabled={setLongIntroEnabled}
        />
      )}
      gameType="Color"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      selectNewItem={selectNewItem}  
      itemTable={itemTable}
      longIntroEnabled={longIntroEnabled}
      selectedItems={selectedItems}
      onSaveSettings={handleSaveSettings}
      isIntroComplete={isIntroComplete}
      setIsIntroComplete={setIsIntroComplete}
      backgroundMode="light"
      userName={userName}
      voiceSpeed={voiceSpeed}
      selectedVoice={selectedVoice}
      onUpdateUserPreferences={handleUpdateUserPreferences}
      speak={speak}
      updateCurrentItem={updateCurrentItem}
    />
  )
});

export default ColorGame;

