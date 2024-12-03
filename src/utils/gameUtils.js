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

