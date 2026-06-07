'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { CARD_DECKS, DEFAULT_DECK, getDeckBackStyle } from './CardDisplay'

const DECK_IDS = Object.keys(CARD_DECKS)

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']

const RANK_LABELS = {
  ace: 'A', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': '10', jack: 'J', queen: 'Q', king: 'K',
}

const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const RED_SUITS = ['hearts', 'diamonds']

export default function CardGameSettings({
  title,
  onClose,
  onSave: onSaveExternal,
  selectedRanks: committedRanks,
  selectedSuits: committedSuits,
  jokersEnabled: committedJokers,
  selectedDeck: committedDeck,
}) {
  const [localRanks, setLocalRanks] = useState(committedRanks)
  const [localSuits, setLocalSuits] = useState(committedSuits)
  const [localJokers, setLocalJokers] = useState(committedJokers)
  const [localDeck, setLocalDeck] = useState(committedDeck)
  const modalRef = useRef(null)

  useEffect(() => { setLocalRanks(committedRanks) }, [committedRanks])
  useEffect(() => { setLocalSuits(committedSuits) }, [committedSuits])
  useEffect(() => { setLocalJokers(committedJokers) }, [committedJokers])
  useEffect(() => { setLocalDeck(committedDeck) }, [committedDeck])

  const toggleRank = useCallback((rank) => {
    setLocalRanks(prev => {
      if (prev.includes(rank)) {
        return prev.length > 2 ? prev.filter(r => r !== rank) : prev
      }
      return [...prev, rank]
    })
  }, [])

  const toggleSuit = useCallback((suit) => {
    setLocalSuits(prev => {
      if (prev.includes(suit)) {
        return prev.length > 1 ? prev.filter(s => s !== suit) : prev
      }
      return [...prev, suit]
    })
  }, [])

  const handleSave = useCallback(() => {
    onSaveExternal(localRanks, localSuits, localJokers, localDeck)
    onClose()
  }, [onSaveExternal, onClose, localRanks, localSuits, localJokers, localDeck])

  const handleReset = useCallback(() => {
    setLocalRanks(RANKS)
    setLocalSuits(SUITS)
    setLocalJokers(false)
    setLocalDeck(DEFAULT_DECK)
  }, [])

  const handleOutsideClick = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose()
    }
  }, [onClose])

  const canSave = localRanks.length >= 2 && localSuits.length >= 1

  // Row 1: A 2 3 4 5 6 7, Row 2: 8 9 10 J Q K
  const rankRow1 = ['ace', '2', '3', '4', '5', '6', '7']
  const rankRow2 = ['8', '9', '10', 'jack', 'queen', 'king']

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[150]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleOutsideClick}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        ref={modalRef}
        className="bg-[#12122e] text-white rounded-xl shadow-lg w-[420px] max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Deck section */}
          <div className="mb-5">
            <p className="text-sm text-gray-400 mb-3">Deck</p>
            <div className="grid grid-cols-2 gap-2">
              {DECK_IDS.map(deckId => (
                <button
                  key={deckId}
                  onClick={() => setLocalDeck(deckId)}
                  className={`
                    p-3 rounded-lg flex items-center gap-3 transition-all duration-200
                    ${localDeck === deckId
                      ? 'ring-2 ring-offset-1 ring-offset-[#12122e] ring-indigo-400 bg-white/10'
                      : 'ring-1 ring-white/20 hover:ring-white/40'}
                  `}
                  aria-label={`Select ${CARD_DECKS[deckId].label}`}
                >
                  <span
                    className="w-8 h-11 rounded-md shrink-0 shadow-inner"
                    style={getDeckBackStyle(deckId)}
                  />
                  <span className="text-sm font-medium text-gray-200">{CARD_DECKS[deckId].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* Ranks section */}
          <div className="mb-5">
            <p className="text-sm text-gray-400 mb-3">Ranks</p>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {rankRow1.map(rank => (
                <button
                  key={rank}
                  onClick={() => toggleRank(rank)}
                  className={`
                    p-2 rounded-lg text-sm font-bold transition-all duration-200
                    ${localRanks.includes(rank)
                      ? 'ring-2 ring-offset-1 ring-offset-[#12122e] ring-indigo-400 bg-white/10'
                      : 'ring-1 ring-white/20 hover:ring-white/40'}
                  `}
                  aria-label={`Toggle rank ${RANK_LABELS[rank]}`}
                  disabled={localRanks.length <= 2 && localRanks.includes(rank)}
                >
                  {RANK_LABELS[rank]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {rankRow2.map(rank => (
                <button
                  key={rank}
                  onClick={() => toggleRank(rank)}
                  className={`
                    p-2 rounded-lg text-sm font-bold transition-all duration-200
                    ${localRanks.includes(rank)
                      ? 'ring-2 ring-offset-1 ring-offset-[#12122e] ring-indigo-400 bg-white/10'
                      : 'ring-1 ring-white/20 hover:ring-white/40'}
                  `}
                  aria-label={`Toggle rank ${RANK_LABELS[rank]}`}
                  disabled={localRanks.length <= 2 && localRanks.includes(rank)}
                >
                  {RANK_LABELS[rank]}
                </button>
              ))}
              {/* Empty cell to fill the 7th column */}
              <div />
            </div>
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* Suits section */}
          <div className="mb-5">
            <p className="text-sm text-gray-400 mb-3">Suits</p>
            <div className="grid grid-cols-4 gap-2">
              {SUITS.map(suit => (
                <button
                  key={suit}
                  onClick={() => toggleSuit(suit)}
                  className={`
                    p-3 rounded-lg flex flex-col items-center gap-1 transition-all duration-200
                    ${localSuits.includes(suit)
                      ? 'ring-2 ring-offset-1 ring-offset-[#12122e] ring-indigo-400 bg-white/10'
                      : 'ring-1 ring-white/20 hover:ring-white/40'}
                  `}
                  aria-label={`Toggle suit ${suit}`}
                  disabled={localSuits.length <= 1 && localSuits.includes(suit)}
                >
                  <span className={`text-2xl ${RED_SUITS.includes(suit) ? 'text-red-400' : 'text-white'}`}>
                    {SUIT_SYMBOLS[suit]}
                  </span>
                  <span className="text-xs capitalize text-gray-300">{suit}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* Joker toggle */}
          <div className="mb-5">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-gray-300">Include Jokers</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${!localJokers ? 'text-white' : 'text-gray-500'}`}>Off</span>
                <Switch
                  checked={localJokers}
                  onCheckedChange={setLocalJokers}
                  aria-label="Toggle jokers"
                  className="bg-white/20 data-[state=checked]:bg-indigo-500"
                />
                <span className={`text-sm ${localJokers ? 'text-white' : 'text-gray-500'}`}>On</span>
              </div>
            </div>
          </div>

          {!canSave && (
            <p className="text-sm text-red-400 mb-4">
              You must select at least 2 ranks and 1 suit.
            </p>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-full text-gray-300 hover:bg-white/10 transition-all duration-300"
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-yellow-500 text-white hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
