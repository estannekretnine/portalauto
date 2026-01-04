const manufacturers = [
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Ford', 'Opel',
  'Peugeot', 'Renault', 'Toyota', 'Honda', 'Nissan', 'Hyundai',
  'Kia', 'Mazda', 'Subaru', 'Volvo', 'Skoda', 'Seat',
  'Fiat', 'Alfa Romeo', 'Citroen', 'Dacia', 'Suzuki', 'Mitsubishi'
]

const models = {
  'Audi': ['A3', 'A4', 'A5', 'A6', 'Q3', 'Q5', 'Q7'],
  'BMW': ['118', '320d', '520d', 'X3', 'X5', 'Series 1', 'Series 3'],
  'Mercedes-Benz': ['A180', 'C220', 'E220', 'GLC', 'GLE', 'CLA', 'GLA'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Arteon'],
  'Ford': ['Focus', 'Fiesta', 'Mondeo', 'Kuga', 'Escape', 'Mustang'],
  'Opel': ['Astra', 'Corsa', 'Insignia', 'Mokka', 'Crossland'],
  'Peugeot': ['208', '308', '508', '3008', '2008'],
  'Renault': ['Clio', 'Megane', 'Captur', 'Kadjar', 'Laguna'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'RAV4', 'Prius'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz'],
  'Nissan': ['Micra', 'Sentra', 'Altima', 'Qashqai', 'X-Trail'],
  'Hyundai': ['i20', 'i30', 'Elantra', 'Tucson', 'Santa Fe'],
  'Kia': ['Rio', 'Ceed', 'Optima', 'Sportage', 'Sorento'],
  'Mazda': ['2', '3', '6', 'CX-3', 'CX-5'],
  'Subaru': ['Impreza', 'Legacy', 'Forester', 'Outback'],
  'Volvo': ['V40', 'V60', 'XC60', 'XC90', 'S60'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kodiaq'],
  'Seat': ['Ibiza', 'Leon', 'Ateca', 'Tarraco'],
  'Fiat': ['500', 'Punto', 'Tipo', '500X'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Giulietta'],
  'Citroen': ['C3', 'C4', 'C5', 'C3 Aircross'],
  'Dacia': ['Sandero', 'Duster', 'Logan', 'Dokker'],
  'Suzuki': ['Swift', 'Vitara', 'SX4', 'S-Cross'],
  'Mitsubishi': ['Lancer', 'Outlander', 'ASX', 'Eclipse Cross']
}

const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)]

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Generiši data URI placeholder sliku - uvek radi jer je embedded u kod
// Proverava da li je document dostupan (radi samo u browseru)
const generatePlaceholderImage = (width, height, color) => {
  // Proveri da li je dostupan document (radi samo u browseru)
  if (typeof document === 'undefined') {
    // Fallback: koristi pre-generisan base64 string za placeholder
    // Ovo je minimalna 1x1 transparentna PNG
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    
    // Pozadinska boja
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
    
    // Tekst u sredini
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `${Math.floor(width / 8)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Car', width / 2, height / 2)
    
    return canvas.toDataURL('image/png')
  } catch (error) {
    // Fallback ako nešto ne radi
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  }
}

const generateCars = (count = 500) => {
  const cars = []
  const currentYear = new Date().getFullYear()
  
  // Generiši pool data URI slika - različite boje
  const colors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
    '#3B82F6', '#8B5A2B', '#059669', '#DC2626', '#7C3AED',
    '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'
  ]
  
  // Generiši data URI slike - samo ako je browser dostupan
  const imageUrls = colors.map(color => generatePlaceholderImage(400, 400, color))

  for (let i = 1; i <= count; i++) {
    const manufacturer = getRandomElement(manufacturers)
    const manufacturerModels = models[manufacturer] || ['Model']
    const model = getRandomElement(manufacturerModels)
    const godiste = getRandomInt(currentYear - 10, currentYear)
    const presao_km = getRandomInt(0, 200000)
    
    // Generiši 3-5 slika - koristi data URI slike koje uvek rade
    const numImages = getRandomInt(3, 5)
    const slike = []
    for (let j = 0; j < numImages; j++) {
      // Uzmi random sliku iz pool-a
      slike.push(getRandomElement(imageUrls))
    }

    cars.push({
      id: i,
      proizvodjac: manufacturer,
      model: model,
      godiste: godiste,
      presao_km: presao_km,
      slike: slike,
      azurirao: null, // Početno nema informacije o ko je ažurirao
    })
  }

  return cars
}

export default generateCars

