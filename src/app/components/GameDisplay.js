'use client'

import React, { useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// Wrap the entire component in React.memo to reduce re-renders
const GameDisplay = React.memo(function GameDisplay({ 
  gameType, 
  currentItem, 
  itemTable, 
  onClick, 
  gameState, 
  isIntroComplete 
}) {
  // Only log color changes once when they happen, not on every render
  useEffect(() => {
    if (gameType === 'Color' && currentItem && itemTable?.[currentItem]) {
      console.log(`[GameDisplay] Color updated: ${currentItem} (${itemTable[currentItem]})`);
    }
  }, [gameType, currentItem, itemTable]);

  // Memoize the renderItem function to prevent unnecessary recalculations
  const renderedItem = useMemo(() => {
    if (gameType === 'Color') {
      return null;
    }

    const style = {
      fontSize: '15rem',
      fontWeight: 'bold',
      color: gameType === 'Number' ? 'white' : 'currentColor',
      maxWidth: '750px',
      maxHeight: '750px',
      margin: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (gameType === 'Shape' && currentItem) {
      return (
        <div className="flex items-center justify-center">
          <Image
            src={itemTable[currentItem]}
            alt={`${currentItem.split('-')[0]} shape`}
            width={450}
            height={450}
            style={{ filter: isIntroComplete ? 'invert(1)' : 'none' }}
          />
        </div>
      );
    }

    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {currentItem}
      </motion.div>
    );
  }, [gameType, currentItem, itemTable, isIntroComplete]);

  // Simplify the background color logic - BaseGame is now handling this directly
  // We'll just provide a className that the stylesheet can target
  const backgroundColor = useMemo(() => {
    if (gameType === 'Color' && currentItem && itemTable?.[currentItem]) {
      return itemTable[currentItem];
    }
    
    if (gameState === 'initial' || gameState === 'intro') {
      return 'transparent';
    }
    
    if (isIntroComplete && gameState === 'playing') {
      return 'black';
    }
    
    return 'transparent';
  }, [gameType, currentItem, itemTable, gameState, isIntroComplete]);

  // Add a key to force re-creation when color changes for better updates
  const displayKey = `${gameType}-${currentItem}-${gameState}`;

  return (
    <div 
      key={displayKey}
      className="game-display fixed inset-0 flex items-center justify-center transition-colors duration-500"
      style={{ backgroundColor }}
      onClick={onClick}
      data-current-item={currentItem}
      data-game-state={gameState}
    >
      {renderedItem}
    </div>
  );
});

// Add a display name for debugging
GameDisplay.displayName = 'GameDisplay';

export default GameDisplay;

