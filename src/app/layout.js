'use client'

import './globals.css'
import { Andika } from 'next/font/google'
import { useState, createContext, useCallback } from 'react'
import UserPreferences from './components/UserPreferences'
import Header from './components/Header'
import { useRouter } from 'next/navigation'

const andika = Andika({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-andika',
  adjustFontFallback: false
})

export const GameStateContext = createContext()

export default function RootLayout({ children }) {
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [isListeningState, setIsListeningState] = useState(false)
  const [isSpeakingState, setIsSpeakingState] = useState(false)
  const [onOpenGameSettingsState, setOnOpenGameSettingsState] = useState(null)
  const [isGamePlayingState, setIsGamePlayingState] = useState(false)
  const [exitGameState, setExitGameState] = useState(null)
  const router = useRouter()

  const handleExitGame = useCallback(() => {
    if (exitGameState) {
      // endGame() speaks a goodbye message and navigates home itself once it
      // finishes — pushing here too would unmount the page mid-speech and let
      // the in-flight endGame() keep running, causing it to speak (and
      // navigate) again on top of itself.
      exitGameState();
    } else {
      router.push('/', { scroll: false });
    }
  }, [exitGameState, router]);

  const handleOpenUserPreferences = useCallback(() => {
    setIsUserPreferencesOpen(true)
  }, [])

  const handleCloseUserPreferences = useCallback(() => {
    setIsUserPreferencesOpen(false)
  }, [])

  const setIsListening = useCallback((value) => {
    setIsListeningState(value);
  }, []);

  const setIsSpeaking = useCallback((value) => {
    setIsSpeakingState(value);
  }, []);

  const setOnOpenGameSettings = useCallback((value) => {
    setOnOpenGameSettingsState(value);
  }, []);

  const setIsGamePlaying = useCallback((value) => {
    setIsGamePlayingState(value);
  }, []);

  const setExitGame = useCallback((value) => {
    setExitGameState(value);
  }, []);

  return (
    <html lang="en" className={andika.variable}>
      <body className={`font-sans h-dvh overflow-hidden bg-[#0a0a1a] relative`}>
        <GameStateContext.Provider value={{ 
          isListening: isListeningState, 
          setIsListening, 
          isSpeaking: isSpeakingState, 
          setIsSpeaking,
          onOpenGameSettings: onOpenGameSettingsState,
          setOnOpenGameSettings,
          isGamePlaying: isGamePlayingState,
          setIsGamePlaying,
          exitGame: exitGameState,
          setExitGame
        }}>
          <Header
            isListening={isListeningState}
            isSpeaking={isSpeakingState}
            onOpenUserPreferences={handleOpenUserPreferences}
            onOpenGameSettings={onOpenGameSettingsState}
            isGamePlaying={isGamePlayingState}
            onExitGame={handleExitGame}
          />
<main className="h-dvh relative z-10 pt-16">
            {children}
          </main>
          <UserPreferences
            isOpen={isUserPreferencesOpen}
            onClose={handleCloseUserPreferences}
            userName=""
            voiceSpeed={1.1}
            selectedVoice={null}
            onUpdatePreferences={() => {
              window.dispatchEvent(new Event('preferencesUpdated'))
            }}
          />
        </GameStateContext.Provider>
      </body>
    </html>
  )
}

