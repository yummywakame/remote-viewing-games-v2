import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Remote Viewing Games v2',
  description: 'Practice remote viewing while blindfolded',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-gray-800 text-white p-4 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">Remote Viewing Games v2</h1>
              <nav>
                <ul className="flex space-x-6">
                  <li>
                    <Link 
                      href="/color-game" 
                      className="hover:text-gray-300 transition-colors"
                    >
                      Color Game
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/shape-game" 
                      className="hover:text-gray-300 transition-colors"
                    >
                      Shape Game
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/number-game" 
                      className="hover:text-gray-300 transition-colors"
                    >
                      Number Game
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/preferences" 
                      className="hover:text-gray-300 transition-colors"
                    >
                      Preferences
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}