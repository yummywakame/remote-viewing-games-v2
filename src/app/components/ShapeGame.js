'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ShapeGameSettings from './ShapeGameSettings'
import { Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import DOMPurify from 'isomorphic-dompurify'

const itemTable = {
  'triangle': '/shapes/triangle.svg',
  'triangle-outline': '/shapes/triangle-outline.svg',
  'square': '/shapes/square.svg',
  'square-outline': '/shapes/square-outline.svg',
  'circle': '/shapes/circle.svg',
  'circle-outline': '/shapes/circle-outline.svg',
  'oval': '/shapes/oval.svg',
  'oval-outline': '/shapes/oval-outline.svg',
  'diamond': '/shapes/diamond.svg',
  'diamond-outline': '/shapes/diamond-outline.svg',
  'star': '/shapes/star.svg',
  'star-outline': '/shapes/star-outline.svg',
};

const ShapeGame = memo(function ShapeGame({ onGameStateChange = () => {} }) {
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable));
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [longIntroEnabled, setLongIntroEnabled] = useState(false);
  const [userName, setUserName] = useState('');
  const [voiceSpeed, setVoiceSpeed] = useState(1.2);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    const savedItems = localStorage.getItem('shapeGameSelectedItems');
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
    
    setUserName(DOMPurify.sanitize(savedName));
    setVoiceSpeed(savedVoiceSpeed);

    if (savedVoiceName && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === DOMPurify.sanitize(savedVoiceName));
      setSelectedVoice(voice || null);
    }
  }, []);

  const handleVoiceCommand = useCallback((command, currentItem, speak, selectNewItem, endGame, gameType) => {
    console.log(`Voice command received for ${gameType} game:`, command, 'Current item:', currentItem)
    const lowerCommand = command.toLowerCase()
    
    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      const newItem = selectNewItem()
      console.log(`New ${gameType} after next command:`, newItem)
      speak(`What ${DOMPurify.sanitize(gameType.toLowerCase())} is this?`)
      return newItem
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
    } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
      console.log('Help requested')
      speak(`To proceed to the next ${gameType} say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what ${gameType} is it?'. To display any ${gameType} say 'show me', followed by the ${gameType} you want to see.`)
    } else if (new RegExp(`\\b(what|which)(?:\\s+(?:${gameType}|is|it))?\\b`).test(lowerCommand)) {
      console.log(`${gameType} hint requested for:`, currentItem)
      speak(`The current ${gameType} is ${currentItem}.`)
    } else if (/\b(show(?:\s+me)?)\s+(\w+)\b/.test(lowerCommand)) {
      const match = lowerCommand.match(/\b(show(?:\s+me)?)\s+(\w+)\b/)
      const requestedItem = match[2]
      console.log(`Show ${gameType} requested:`, requestedItem)
      if (Object.prototype.hasOwnProperty.call(itemTable, requestedItem)) {
        speak(`Showing ${requestedItem}.`)
        return requestedItem
      } else {
        speak(`Sorry, ${requestedItem} is not in my ${gameType} list.`)
      }
    } else {
      const itemGuess = Object.keys(itemTable).find(item => lowerCommand.includes(item))
      if (itemGuess) {
        console.log(`${gameType} guess:`, itemGuess, `Current ${gameType}:`, currentItem)
        if (itemGuess === currentItem) {
          speak(`Well done! The ${gameType} is ${currentItem}.`)
        } else {
          speak("Try again!")
        }
      } else {
        console.log('No valid command or item guess detected')
      }
    }
    return null
  }, [])

  const selectNewItem = useCallback((selectedItems, currentItem, setCurrentItem) => {
    console.log('Selecting new item. Current item:', currentItem)
    console.log('Available items:', selectedItems)
    
    const newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
    
    console.log('New item selected:', newItem)
    setCurrentItem(newItem)
    return newItem
  }, [])

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
            {DOMPurify.sanitize(gameType)} Game
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
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-lg hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-lg hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
    localStorage.setItem('shapeGameSelectedItems', JSON.stringify(newSelectedItems));
    
    localStorage.setItem('gameLongIntro', DOMPurify.sanitize(String(longIntroEnabled)));
  }, [longIntroEnabled]);

  const handleUpdateUserPreferences = useCallback((newName, newVoiceSpeed, newVoice) => {
    setUserName(newName);
    setVoiceSpeed(newVoiceSpeed);
    setSelectedVoice(newVoice);
    localStorage.setItem('userPreferencesName', DOMPurify.sanitize(newName));
    localStorage.setItem('userPreferencesVoiceSpeed', DOMPurify.sanitize(newVoiceSpeed.toString()));
    localStorage.setItem('userPreferencesVoiceName', DOMPurify.sanitize(newVoice?.name || ''));
  }, []);

  return (
    <BaseGame
      GameSettings={(props) => (
        <ShapeGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
          longIntroEnabled={longIntroEnabled}
          setLongIntroEnabled={setLongIntroEnabled}
        />
      )}
      gameType={DOMPurify.sanitize("Shape")}
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
      backgroundMode="dark"
      userName={userName}
      voiceSpeed={voiceSpeed}
      selectedVoice={selectedVoice}
      onUpdateUserPreferences={handleUpdateUserPreferences}
    />
  )
});

export default ShapeGame;

