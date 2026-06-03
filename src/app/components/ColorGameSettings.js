'use client'

import DOMPurify from 'isomorphic-dompurify'
import GameSettings from './GameSettings'

const renderItem = (item, color) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: DOMPurify.sanitize(color) }} />
    <span className="capitalize font-medium">{DOMPurify.sanitize(item)}</span>
  </div>
)

export default function ColorGameSettings(props) {
  return (
    <GameSettings
      {...props}
      accentColor="from-purple-600 to-blue-600"
      minItemsLabel="colors"
      renderItem={renderItem}
    />
  )
}
