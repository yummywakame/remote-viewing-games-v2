'use client'

import React, { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const GameDisplay = React.memo(function GameDisplay({
  gameType,
  currentItem,
  itemTable,
  onClick,
  gameState,
  isIntroComplete,
  lightMode = false,
}) {
  useEffect(() => {
    if (gameType === 'Color' && currentItem && itemTable?.[currentItem]) {
      console.log(`[GameDisplay] Color updated: ${currentItem} (${itemTable[currentItem]})`);
    }
  }, [gameType, currentItem, itemTable]);

  const backgroundColor = useMemo(() => {
    if (gameType === 'Color' && currentItem && itemTable?.[currentItem]) {
      return itemTable[currentItem];
    }
    if (gameState === 'initial' || gameState === 'intro') {
      return 'transparent';
    }
    if (isIntroComplete && gameState === 'playing') {
      return lightMode ? 'white' : 'black';
    }
    return 'transparent';
  }, [gameType, currentItem, itemTable, gameState, isIntroComplete, lightMode]);

  // Stable key — does NOT include currentItem so the container persists across
  // item changes and transition-colors can actually animate.
  const displayKey = `${gameType}-${gameState}`;

  return (
    <div
      key={displayKey}
      className="game-display fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor, transition: 'background-color 700ms ease' }}
      onClick={onClick}
      data-current-item={currentItem}
      data-game-state={gameState}
    >
      {gameType === 'Shape' && (
        <AnimatePresence mode="sync">
          {currentItem && (
            <motion.div
              key={currentItem}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <Image
                src={itemTable[currentItem]}
                alt={`${currentItem.split('-')[0]} shape`}
                width={450}
                height={450}
                style={{ filter: isIntroComplete ? (lightMode ? 'none' : 'invert(1)') : 'none' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {gameType === 'Number' && (
        <AnimatePresence mode="sync">
          {currentItem && (
            <motion.div
              key={currentItem}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              style={{ fontSize: '15rem', fontWeight: 'bold', color: 'white' }}
            >
              {currentItem}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

GameDisplay.displayName = 'GameDisplay';

export default GameDisplay;
