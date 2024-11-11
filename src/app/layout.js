import './globals.css'
import { Inter } from 'next/font/google'
import NavMenu from './components/NavMenu'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Remote Viewing Games v2',
  description: 'Practice remote viewing while blindfolded',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <div className="min-h-screen">
          <NavMenu />
          <main className="max-w-7xl mx-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}