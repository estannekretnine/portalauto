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

const generateCars = (count = 500) => {
  const cars = []
  const currentYear = new Date().getFullYear()
  
  // Koristimo Picsum Photos - pouzdan servis za placeholder slike
  const imageUrls = []
  for (let i = 1; i <= 20; i++) {
    imageUrls.push(`https://picsum.photos/400/400?random=${i}`)
  }

  for (let i = 1; i <= count; i++) {
    const manufacturer = getRandomElement(manufacturers)
    const manufacturerModels = models[manufacturer] || ['Model']
    const model = getRandomElement(manufacturerModels)
    const godiste = getRandomInt(currentYear - 10, currentYear)
    const presao_km = getRandomInt(0, 200000)
    
    // Generiši 3-5 slika
    const numImages = getRandomInt(3, 5)
    const slike = []
    for (let j = 0; j < numImages; j++) {
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

