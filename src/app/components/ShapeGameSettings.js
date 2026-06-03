'use client'

import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'
import GameSettings from './GameSettings'

const renderItem = (item, src) => (
  <>
    <div className="w-8 h-8 flex items-center justify-center mr-3">
      <Image src={src} alt={item} width={32} height={32} className="invert" />
    </div>
    <span className="capitalize font-medium">{DOMPurify.sanitize(item)}</span>
  </>
)

export default function ShapeGameSettings(props) {
  return (
    <GameSettings
      {...props}
      accentColor="from-blue-600 to-green-500"
      minItemsLabel="shapes"
      renderItem={renderItem}
    />
  )
}
