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

export const selectNewItem = (selectedItems, currentItem) => {
  console.log('Selecting initial item from:', selectedItems)
  
  if (!selectedItems || selectedItems.length === 0) {
    console.error('No items available to select from')
    return null
  }

  let newItem
  do {
    newItem = selectedItems[Math.floor(Math.random() * selectedItems.length)]
  } while (newItem === currentItem && selectedItems.length > 1)
  
  console.log('Selected item:', newItem)
  return newItem
}


