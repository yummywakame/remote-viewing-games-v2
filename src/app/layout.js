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
      exitGameState();
    }
    setIsGamePlayingState(false);
    router.push('/', { scroll: false });
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
      <body className={`font-sans h-screen overflow-hidden bg-gray-900 relative`}>
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
          <div className="fixed-full pointer-events-none">
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
          <main className="h-screen relative z-10 pt-16">
            <div className="max-w-[600px] px-5 mx-auto h-full">
              {children}
            </div>
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

