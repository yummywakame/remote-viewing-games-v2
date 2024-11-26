'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function GameDisplay({ gameType, currentItem, itemTable }) {
  const renderItem = () => {
    if (gameType === 'Color') {
      return null // Color game doesn't display an item
    }

    const style = {
      fontSize: '15rem',
      fontWeight: 'bold',
      color: gameType === 'Number' ? 'white' : itemTable[currentItem],
      maxWidth: '500px',
      maxHeight: '500px',
      margin: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
    )
  }

  const backgroundColor = gameType === 'Color' ? itemTable[currentItem] : (gameType === 'Number' ? 'black' : 'white')

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor, transition: 'background-color 0.5s ease' }}
    >
      {renderItem()}
    </div>
  )
}