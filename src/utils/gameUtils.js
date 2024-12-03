import DOMPurify from 'isomorphic-dompurify'

export const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input)
}

export const getArticle = (word) => {
  const vowels = ['a', 'e', 'i', 'o', 'u']
  return vowels.includes(word.toLowerCase()[0]) ? 'an' : 'a'
}

export const formatTime = (time) => {
  const minutes = Math.floor(time / 60000)
  const seconds = Math.floor((time % 60000) / 1000)
  const milliseconds = Math.floor((time % 1000) / 10)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

export const selectNewItem = (selectedItems, currentItem, updateCurrentItem) => {
  console.log('Selecting new item. Current item:', currentItem)
  console.log('Available items:', selectedItems)
  
  const newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
  
  console.log('New item selected:', newItem)
  updateCurrentItem(newItem)
  return newItem
}

export const handleCommonVoiceCommands = (command, speak, selectNewItem, endGame, gameType) => {
  const lowerCommand = command.toLowerCase()

  if (/\b(next|skip|forward)\b/.test(lowerCommand)) {
    console.log('Next command detected')
    const newItem = selectNewItem()
    console.log(`New ${gameType} after next command:`, newItem)
    speak(`What ${gameType.toLowerCase()} is this?`)
    return { action: 'next', newItem }
  } else if (/\b(stop|end|quit|exit)\b/.test(lowerCommand)) {
    console.log('Stop command detected')
    endGame()
    return { action: 'stop' }
  } else if (/\b(help|instructions)\b/.test(lowerCommand)) {
    console.log('Help requested')
    speak(`To proceed to the next ${gameType.toLowerCase()} say 'next', or click anywhere on the screen. To end the game say 'stop'. For a hint you can ask 'what ${gameType.toLowerCase()} is it?'. To display any ${gameType.toLowerCase()} say 'show me', followed by the ${gameType.toLowerCase()} you want to see.`)
    return { action: 'help' }
  } else if (/\b(thanks|thank\s*you)\b/i.test(lowerCommand)) {
    const responses = ["You're welcome!", "Any time!", "I'm here for you!"]
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    speak(randomResponse)
    return { action: 'thanks' }
  }

  return { action: 'none' }
}

