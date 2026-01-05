// Utility za dinamičko upravljanje SEO meta tagovima

export const updateMetaTag = (name, content, attribute = 'name') => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`)
  
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  
  element.setAttribute('content', content)
}

export const updateTitle = (title) => {
  document.title = title
  updateMetaTag('title', title)
  updateMetaTag('og:title', title, 'property')
  updateMetaTag('twitter:title', title)
}

export const updateDescription = (description) => {
  updateMetaTag('description', description)
  updateMetaTag('og:description', description, 'property')
  updateMetaTag('twitter:description', description)
}

export const updateCanonical = (url) => {
  let element = document.querySelector('link[rel="canonical"]')
  
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  
  element.setAttribute('href', url)
}

export const updateOGUrl = (url) => {
  updateMetaTag('og:url', url, 'property')
  updateMetaTag('twitter:url', url)
}

// Inicijalizuj SEO za početnu stranicu
export const initSEO = () => {
  const baseUrl = 'https://portalauto.vercel.app'
  const title = 'Auto Dashboard - Upravljanje automobilima | CRUD Aplikacija'
  const description = 'Profesionalna web aplikacija za upravljanje automobilima. Dodajte, uredite i obrišite automobile sa pregledom fotografija. Kompletan CRUD sistem sa autentifikacijom i naprednim filterima.'
  
  updateTitle(title)
  updateDescription(description)
  updateCanonical(baseUrl)
  updateOGUrl(baseUrl)
}

