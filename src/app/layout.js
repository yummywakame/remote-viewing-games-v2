import './globals.css'
import { Andika } from 'next/font/google'

const andika = Andika({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-andika',
  adjustFontFallback: false // Add this line to prevent font manifest issues
})

export const metadata = {
  title: 'MindSight Games',
  description: 'Practice remote viewing while blindfolded',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={andika.variable}>
      <body className={`font-sans h-screen overflow-hidden bg-gray-900 relative`}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
        </div>
        <main className="h-[calc(100vh-4rem)] mt-16 relative z-10">
          <div className="max-w-[600px] px-5 mx-auto h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}