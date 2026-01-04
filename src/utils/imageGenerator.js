// Generiši base64 data URI slike - uvek rade bez interneta
const generatePlaceholderImage = (width, height, color, textColor = '#FFFFFF') => {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }
    
    // Pozadina
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    
    // Tekst
    ctx.fillStyle = textColor
    ctx.font = 'bold ' + Math.floor(width / 6) + 'px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('AUTO', width / 2, height / 2 - 15)
    ctx.font = Math.floor(width / 10) + 'px Arial'
    ctx.fillText('IMAGE', width / 2, height / 2 + 15)
    
    return canvas.toDataURL('image/png')
  } catch (error) {
    console.error('Error generating placeholder image:', error)
    // Fallback na placeholder URL
    return `https://via.placeholder.com/${width}x${height}/${color.replace('#', '')}/FFFFFF`
  }
}

// Generiši listu data URI slika sa različitim bojama
export const getPlaceholderImageUrls = () => {
  if (typeof document === 'undefined') {
    // Fallback ako nismo u browser kontekstu
    return [
      'https://via.placeholder.com/400x400/4F46E5/FFFFFF',
      'https://via.placeholder.com/400x400/10B981/FFFFFF',
      'https://via.placeholder.com/400x400/F59E0B/FFFFFF',
      'https://via.placeholder.com/400x400/EF4444/FFFFFF',
      'https://via.placeholder.com/400x400/8B5CF6/FFFFFF'
    ]
  }

  const colors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
    '#3B82F6', '#8B5A2B', '#059669', '#DC2626', '#7C3AED'
  ]
  
  return colors.map(color => generatePlaceholderImage(400, 400, color, '#FFFFFF'))
}

export default getPlaceholderImageUrls

