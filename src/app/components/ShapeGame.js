'use client'

import React, { useCallback, useState, useEffect, memo } from 'react'
import BaseGame from './BaseGame'
import ShapeGameSettings from './ShapeGameSettings'
import { Shapes } from 'lucide-react'
import { motion } from 'framer-motion'
import DOMPurify from 'dompurify'

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
  const [longIntroEnabled, setLongIntroEnabled] = useState(true);
  const [selectedItems, setSelectedItems] = useState(Object.keys(itemTable));

  useEffect(() => {
    const savedLongIntro = localStorage.getItem('shapeGameLongIntro');
    setLongIntroEnabled(savedLongIntro !== 'false');

    const savedItems = localStorage.getItem('shapeGameSelectedItems');
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(DOMPurify.sanitize(savedItems));
        if (Array.isArray(parsedItems) && parsedItems.length >= 2) {
          setSelectedItems(parsedItems);
        }
      } catch (error) {
        console.error('Error parsing saved items:', error);
      }
    }
  }, []);

  const handleVoiceCommand = useCallback((command, currentItem, speak, selectNewItem, endGame, gameType) => {
    console.log(`Voice command received for ${gameType} game:`, command, 'Current item:', currentItem)
    const lowerCommand = command.toLowerCase()
    
    if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
      console.log('Next command detected')
      const newItem = selectNewItem()
      console.log(`New ${gameType} after next command:`, newItem)
      speak(`What ${gameType.toLowerCase()} is this?`)
      return newItem
    } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
      console.log('Stop command detected')
      endGame()
    } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
      console.log('Help requested')
      speak(`To proceed to the next ${gameType} say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what ${gameType} is it?'. To display any ${gameType} say 'show me', followed by the ${gameType} you want to see.`)
    } else if (new RegExp(`\\b(what|which)(?:\\s+(?:${gameType}|is|it))?\\b`).test(lowerCommand)) {
      console.log(`${gameType} hint requested for:`, currentItem)
      speak(`It's a ${currentItem.split('-')[0]}.`)
    } else if (/\b(show(?:\s+me)?)\s+(\w+)\b/.test(lowerCommand)) {
      const match = lowerCommand.match(/\b(show(?:\s+me)?)\s+(\w+)\b/)
      const requestedItem = match[2]
      console.log(`Show ${gameType} requested:`, requestedItem)
      const matchingItems = Object.keys(itemTable).filter(item => item.startsWith(requestedItem))
      if (matchingItems.length > 0) {
        const randomItem = matchingItems[Math.floor(Math.random() * matchingItems.length)]
        speak(`Showing a ${randomItem.split('-')[0]}.`)
        return randomItem
      } else {
        speak(`Sorry, ${requestedItem} is not in my ${gameType} list.`)
      }
    } else {
      const itemGuess = Object.keys(itemTable).find(item => lowerCommand.includes(item.split('-')[0]))
      if (itemGuess) {
        console.log(`${gameType} guess:`, itemGuess, `Current ${gameType}:`, currentItem)
        if (itemGuess.split('-')[0] === currentItem.split('-')[0]) {
          speak(`Well done! It's a ${currentItem.split('-')[0]}.`)
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
    let newItem
    do {
      newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
    } while (newItem === currentItem && selectedItems.length > 1)
    
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
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-medium text-lg hover:from-blue-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shapes className="mr-2" size={20} />
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

  const handleSaveSettings = useCallback((newSelectedItems, newLongIntroEnabled) => {
    setSelectedItems(newSelectedItems);
    setLongIntroEnabled(newLongIntroEnabled);
    localStorage.setItem('shapeGameSelectedItems', DOMPurify.sanitize(JSON.stringify(newSelectedItems)));
    localStorage.setItem('shapeGameLongIntro', DOMPurify.sanitize(newLongIntroEnabled.toString()));
  }, []);

  return (
    <BaseGame
      GameSettings={(props) => (
        <ShapeGameSettings
          {...props}
          selectedItems={selectedItems}
          onSave={handleSaveSettings}
        />
      )}
      gameType="Shape"
      onGameStateChange={onGameStateChange}
      renderGameContent={renderGameContent}
      handleVoiceCommand={handleVoiceCommand}
      selectNewItem={selectNewItem}
      itemTable={itemTable}
      longIntroEnabled={longIntroEnabled}
      onSaveSettings={handleSaveSettings}
    />
  )
});

export default ShapeGame;
