'use client'

import { useState, useCallback, useEffect } from 'react'
import DOMPurify from 'isomorphic-dompurify'
import GameSettings from './GameSettings'
import { Switch } from '@/components/ui/switch'

const renderItem = (item) => (
  <div className="flex items-center justify-center w-full py-1">
    <span className="text-2xl font-bold font-mono">{DOMPurify.sanitize(item)}</span>
  </div>
)

export default function NumberGameSettings({ lightMode: committedLightMode = false, onSave: onSaveItems, ...props }) {
  const [localLightMode, setLocalLightMode] = useState(committedLightMode)

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
      accentColor="from-green-600 to-orange-600"
      minItemsLabel="numbers"
      renderItem={renderItem}
      gridCols={3}
      extraItems={['0']}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-gray-300">Background</span>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${localLightMode ? 'text-white' : 'text-gray-500'}`}>Light</span>
          <Switch
            checked={!localLightMode}
            onCheckedChange={(v) => setLocalLightMode(!v)}
            aria-label="Toggle background light/dark"
            className="bg-white/20 data-[state=checked]:bg-indigo-500"
          />
          <span className={`text-sm ${!localLightMode ? 'text-white' : 'text-gray-500'}`}>Dark</span>
        </div>
      </div>
    </GameSettings>
  )
}
