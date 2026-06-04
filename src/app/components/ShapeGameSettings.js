'use client'

import { useState, useCallback, useEffect } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'
import GameSettings from './GameSettings'
import { Switch } from '@/components/ui/switch'

const renderItem = (item, src) => (
  <>
    <div className="w-8 h-8 flex items-center justify-center mr-3">
      <Image src={src} alt={item} width={32} height={32} className="invert" />
    </div>
    <span className="capitalize font-medium">{DOMPurify.sanitize(item)}</span>
  </>
)

export default function ShapeGameSettings({ lightMode: committedLightMode = false, onSave: onSaveItems, ...props }) {
  const [localLightMode, setLocalLightMode] = useState(committedLightMode)

  // Sync local state if the committed value changes (e.g. on open)
  useEffect(() => {
    setLocalLightMode(committedLightMode)
  }, [committedLightMode])

  const handleSave = useCallback((newSelectedItems) => {
    onSaveItems?.(newSelectedItems, localLightMode)
  }, [onSaveItems, localLightMode])

  const handleReset = useCallback(() => {
    setLocalLightMode(false)
  }, [])

  return (
    <GameSettings
      {...props}
      onSave={handleSave}
      onReset={handleReset}
      accentColor="from-blue-600 to-green-500"
      minItemsLabel="shapes"
      renderItem={renderItem}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-300">Background</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${localLightMode ? 'text-white' : 'text-gray-500'}`}>Light</span>
          <Switch
            checked={!localLightMode}
            onCheckedChange={(v) => setLocalLightMode(!v)}
            aria-label="Toggle background light/dark"
          />
          <span className={`text-sm ${!localLightMode ? 'text-white' : 'text-gray-500'}`}>Dark</span>
        </div>
      </div>
    </GameSettings>
  )
}
