import React from 'react'
import { X } from 'lucide-react'

export default function ColorGameSettings({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-5">
      <div className="bg-gray-800 rounded-lg p-6 max-w-[600px] w-full mx-auto relative min-h-[300px] flex flex-col">
        <button 
          className="absolute top-4 right-4 text-white hover:text-gray-300"
          onClick={onClose}
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Color Game Settings</h2>
        <div className="flex-grow">
          <p>Content goes here</p>
        </div>
        <button 
          className="neon-button mt-4 self-end"
          onClick={onClose}
        >
          <span className="neon-button-background"></span>
          <span className="neon-button-gradient"></span>
          <span className="neon-button-text">Save</span>
        </button>
      </div>
    </div>
  )
}