'use client'

import React, { useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// Fits within available screen: constrained by width, height minus header+button, and a max cap.
// Header: 64px (h-16), stop button area: ~80px (bottom-8 + button), breathing room: 16px.
const ITEM_SIZE = 'min(85vw, calc(100vh - 160px), 900px)'

const GameDisplay = React.memo(function GameDisplay({
  gameType,
  currentItem,
  itemTable,
  onClick,
  gameState,
  isIntroComplete,
  lightMode = false,
  cardDisplay = null,
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
                width={600}
                height={600}
                style={{
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  filter: isIntroComplete ? (lightMode ? 'none' : 'invert(1)') : 'none',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {gameType === 'Card' && cardDisplay && (
        <div className="absolute inset-0 flex items-center justify-center">
          {cardDisplay}
        </div>
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
            >
              <svg
                viewBox="0 0 200 200"
                style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                aria-label={currentItem}
              >
                <text
                  x="100"
                  y="100"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="175"
                  fontWeight="bold"
                  fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  fill={lightMode ? 'black' : 'white'}
                >
                  {currentItem}
                </text>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
});

GameDisplay.displayName = 'GameDisplay';

export default GameDisplay;
