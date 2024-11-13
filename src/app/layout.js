import './globals.css'
import { Inter } from 'next/font/google'
import NavMenu from './components/NavMenu'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'MindSight Games',
  description: 'Practice remote viewing while blindfolded',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} h-screen overflow-hidden`}>
        <NavMenu />
        <main className="h-[calc(100vh-4rem)] mt-16">
          <div className="max-w-[600px] px-5 mx-auto h-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}