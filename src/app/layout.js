'use client'

import './globals.css'
import { Andika } from 'next/font/google'
import { useState } from 'react'
import UserPreferences from './components/UserPreferences'
import Header from './components/Header'

const andika = Andika({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-andika',
  adjustFontFallback: false
})

export default function RootLayout({ children }) {
  const [isUserPreferencesOpen, setIsUserPreferencesOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  return (
    <html lang="en" className={andika.variable}>
      <body className={`font-sans h-screen overflow-hidden bg-gray-900 relative`}>
        <Header
          isListening={isListening}
          isSpeaking={isSpeaking}
          onOpenUserPreferences={() => setIsUserPreferencesOpen(true)}
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
          onClose={() => setIsUserPreferencesOpen(false)}
        />
        <div className="fixed bottom-2 right-2 text-white text-xs opacity-50 z-[200]">
          v0.04
        </div>
      </body>
    </html>
  )
}

