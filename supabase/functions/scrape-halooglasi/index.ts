// Supabase Edge Function za scraping HaloOglasi
// Deploy: supabase functions deploy scrape-halooglasi

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// User-Agent rotacija
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
]

function getRandomUserAgent(): string {
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function randomDelay(): number {
  // Random pauza između 1 i 3 sekundi (smanjeno za brži scraping)
  return Math.floor(Math.random() * 2000) + 1000
}

// Parsiranje HTML-a za izvlačenje oglasa
function parseOglasi(html: string): any[] {
  const oglasi: any[] = []
  
  // HaloOglasi koristi <div class="product-item"> za oglase
  // Probamo više varijanti regex-a
  const regexPatterns = [
    /<div[^>]*class="[^"]*product-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*product-item[^"]*"[^>]*data-id="(\d+)"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*product-item|$)/gi,
  ]
  
  // Prvo probaj da nađemo sve oglase korišćenjem data-id atributa
  const dataIdRegex = /data-id="(\d+)"/g
  const allDataIds: string[] = []
  let dataIdMatch
  while ((dataIdMatch = dataIdRegex.exec(html)) !== null) {
    if (!allDataIds.includes(dataIdMatch[1])) {
      allDataIds.push(dataIdMatch[1])
    }
  }
  console.log(`Pronađeno ${allDataIds.length} data-id atributa`)
  
  // Pronađi svaki oglas po data-id
  for (const dataId of allDataIds) {
    try {
      // Nađi deo HTML-a koji sadrži ovaj oglas
      const oglasStartRegex = new RegExp(`<div[^>]*class="[^"]*product-item[^"]*"[^>]*data-id="${dataId}"`, 'i')
      const startMatch = oglasStartRegex.exec(html)
      
      if (!startMatch) continue
      
      const startIndex = startMatch.index
      // Uzmi sledećih 3000 karaktera kao kontekst oglasa
      const oglasHtml = html.substring(startIndex, startIndex + 3000)
      
      // Izvuci link i ID oglasa
      const linkMatch = oglasHtml.match(/href="([^"]*\/nekretnine\/[^"]+)"/i)
      const link = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : 'https://www.halooglasi.com' + linkMatch[1]) : null
      const idoglasa = dataId
      
      // Izvuci cenu - tražimo najveću cenu jer je to ukupna cena (ne cena po m²)
      // Format: "275.000 €" ili "275,000 EUR"
      const cenaRegex = /(\d{1,3}(?:[.,]\d{3})*)\s*(?:EUR|€)/gi
      const ceneLista: number[] = []
      let cenaTextMatch
      while ((cenaTextMatch = cenaRegex.exec(oglasHtml)) !== null) {
        const cenaStr = cenaTextMatch[1].replace(/\./g, '').replace(',', '')
        const cenaNum = parseInt(cenaStr)
        if (cenaNum > 0) {
          ceneLista.push(cenaNum)
        }
      }
      // Uzmi najveću cenu (to je ukupna cena, ne cena po m²)
      let cena: number | null = null
      if (ceneLista.length > 0) {
        cena = Math.max(...ceneLista)
        console.log(`Pronađene cene na listi: ${ceneLista.join(', ')} -> max: ${cena}`)
      }
      
      // Izvuci kvadraturu
      const kvadraturaMatch = oglasHtml.match(/(\d+(?:[.,]\d+)?)\s*m²/i)
      const kvadratura = kvadraturaMatch ? parseFloat(kvadraturaMatch[1].replace(',', '.')) : null
      
      // Izvuci lokaciju iz subtitle ili geo-info
      const lokacijaMatch = oglasHtml.match(/class="[^"]*subtitle[^"]*"[^>]*>([^<]+)/i) ||
                           oglasHtml.match(/class="[^"]*product-info[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i)
      const lokacijaText = lokacijaMatch ? lokacijaMatch[1].trim() : ''
      const lokacijaParts = lokacijaText.split(',').map((s: string) => s.trim())
      
      // Izvuci naslov/opis
      const naslovMatch = oglasHtml.match(/class="[^"]*product-title[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)/i) ||
                         oglasHtml.match(/class="[^"]*product-title[^"]*"[^>]*>([^<]+)/i)
      const opisoglasa = naslovMatch ? naslovMatch[1].trim() : ''
      
      // Proveri datum objave - "publish-date" ili "posted" ili slično
      const datumMatch = oglasHtml.match(/class="[^"]*publish-date[^"]*"[^>]*>([^<]+)/i) ||
                        oglasHtml.match(/class="[^"]*date[^"]*"[^>]*>([^<]+)/i) ||
                        oglasHtml.match(/class="[^"]*time[^"]*"[^>]*>([^<]+)/i)
      const datumText = datumMatch ? datumMatch[1].trim().toLowerCase() : ''
      
      // Filtriraj samo današnje oglase
      const danas = new Date()
      const isDanas = datumText.includes('danas') || 
                      datumText.includes('today') ||
                      datumText.includes(danas.getDate().toString().padStart(2, '0') + '.' + (danas.getMonth() + 1).toString().padStart(2, '0'))
      
      // Preskoči ako nije današnji oglas
      if (!isDanas) {
        console.log(`Oglas ${dataId} nije današnji (${datumText}), preskačem`)
        continue
      }
      
      // Preskoči ako nemamo osnovne podatke
      if (!idoglasa) continue
      
      oglasi.push({
        idoglasa,
        linkoglasa: link,
        cena,
        kvadratura,
        opstina: lokacijaParts[0] || null,
        lokacija: lokacijaParts[1] || null,
        opisoglasa,
        datumObjave: datumText,
        imevlasnika: null,
        kontakttelefon1: null,
        kontakttelefon2: null,
      })
      
      console.log(`Parsiran oglas: ${idoglasa}, cena: ${cena}, m2: ${kvadratura}`)
      
    } catch (e) {
      console.error('Greška pri parsiranju oglasa:', e)
    }
  }
  
  console.log(`Ukupno parsirano ${oglasi.length} oglasa`)
  return oglasi
}

// Parsiranje pojedinačnog oglasa za kontakt podatke
// Koristi JSON-LD strukturu i QuidditaEnvironment.CurrentClassified JavaScript objekat
async function parseOglasDetalji(url: string): Promise<{ 
  imevlasnika: string | null, 
  kontakttelefon1: string | null, 
  kontakttelefon2: string | null, 
  cenaUkupna: number | null,
  dodatniOpis: string | null,
  email: string | null,
  kvadratura: number | null,
  lokacija: string | null,
  opstina: string | null,
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
        'Referer': 'https://www.halooglasi.com/',
        'Cache-Control': 'no-cache',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // ========== 1. IZVUCI CENU IZ JSON-LD (najpouzdanije) ==========
    let cenaUkupna: number | null = null
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1])
        if (jsonLd.offers && jsonLd.offers.price) {
          cenaUkupna = Math.round(parseFloat(jsonLd.offers.price))
          console.log(`Cena iz JSON-LD: ${cenaUkupna}`)
        }
      } catch (e) {
        console.log('Greška pri parsiranju JSON-LD:', e)
      }
    }
    
    // ========== 2. IZVUCI PODATKE IZ QuidditaEnvironment.CurrentClassified ==========
    let dodatniOpis: string | null = null
    let kvadratura: number | null = null
    let lokacija: string | null = null
    let opstina: string | null = null
    let imevlasnika: string | null = null
    
    // Regex za CurrentClassified JavaScript objekat
    const classifiedMatch = html.match(/QuidditaEnvironment\.CurrentClassified\s*=\s*(\{[\s\S]*?\});/i)
    if (classifiedMatch) {
      try {
        // Parsiramo JSON iz JavaScript objekta
        const classifiedStr = classifiedMatch[1]
        
        // Izvuci TextHtml (dodatni opis)
        const textHtmlMatch = classifiedStr.match(/"TextHtml"\s*:\s*"((?:[^"\\]|\\.)*)"/i)
        if (textHtmlMatch) {
          dodatniOpis = textHtmlMatch[1]
            .replace(/\\u003c/gi, '<')
            .replace(/\\u003e/gi, '>')
            .replace(/\\n/g, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p>/gi, '\n')
            .replace(/<\/p>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim()
          if (dodatniOpis.length > 2000) {
            dodatniOpis = dodatniOpis.substring(0, 2000) + '...'
          }
          console.log(`Dodatni opis: ${dodatniOpis.substring(0, 100)}...`)
        }
        
        // Izvuci cenu ako nije već pronađena
        if (!cenaUkupna) {
          const cenaMatch = classifiedStr.match(/"cena_d"\s*:\s*(\d+(?:\.\d+)?)/i)
          if (cenaMatch) {
            cenaUkupna = Math.round(parseFloat(cenaMatch[1]))
            console.log(`Cena iz CurrentClassified: ${cenaUkupna}`)
          }
        }
        
        // Izvuci kvadraturu
        const kvMatch = classifiedStr.match(/"kvadratura_d"\s*:\s*(\d+(?:\.\d+)?)/i)
        if (kvMatch) {
          kvadratura = parseFloat(kvMatch[1])
          console.log(`Kvadratura: ${kvadratura}`)
        }
        
        // Izvuci lokaciju (mikrolokacija_s)
        const lokMatch = classifiedStr.match(/"mikrolokacija_s"\s*:\s*"([^"]+)"/i)
        if (lokMatch) {
          lokacija = lokMatch[1]
          console.log(`Lokacija: ${lokacija}`)
        }
        
        // Izvuci opštinu (lokacija_s)
        const opstMatch = classifiedStr.match(/"lokacija_s"\s*:\s*"([^"]+)"/i)
        if (opstMatch) {
          opstina = opstMatch[1]
          console.log(`Opština: ${opstina}`)
        }
        
      } catch (e) {
        console.log('Greška pri parsiranju CurrentClassified:', e)
      }
    }
    
    // ========== 3. IZVUCI PODATKE IZ CurrentContactData ==========
    const contactMatch = html.match(/QuidditaEnvironment\.CurrentContactData\s*=\s*(\{[\s\S]*?\});/i)
    if (contactMatch) {
      try {
        const contactStr = contactMatch[1]
        
        // Izvuci ime oglašivača
        const displayNameMatch = contactStr.match(/"DisplayName"\s*:\s*"([^"]+)"/i)
        if (displayNameMatch) {
          imevlasnika = displayNameMatch[1]
          console.log(`Ime vlasnika: ${imevlasnika}`)
        }
      } catch (e) {
        console.log('Greška pri parsiranju CurrentContactData:', e)
      }
    }
    
    // Fallback: Izvuci ime iz HTML klase "contact-name"
    if (!imevlasnika) {
      const imeMatch = html.match(/class="[^"]*contact-name[^"]*"[^>]*>([^<]+)/i)
      if (imeMatch) {
        imevlasnika = imeMatch[1].trim()
        console.log(`Ime vlasnika (HTML): ${imevlasnika}`)
      }
    }
    
    // ========== 4. IZVUCI TELEFON IZ API-JA (DODATNI POZIV) ==========
    const telefoni: string[] = []
    let email: string | null = null
    
    // Lista brojeva koje treba ignorisati
    const ignoredPhones = ['234300679986119', '0800']
    
    // Helper za validaciju telefona
    const isValidPhone = (phone: string): boolean => {
      const cleaned = phone.replace(/[\s.\-\/]/g, '')
      if (cleaned.length > 13 || cleaned.length < 9) return false
      if (ignoredPhones.some(ip => cleaned.includes(ip))) return false
      if (!cleaned.match(/^(\+381|0)(6[0-9]|1[1-9]|2[0-9]|3[0-9])/)) return false
      return true
    }

    // ========== NOVI API ZA TELEFONE (POST /AdAdvertiserInfoWidget/AdvertiserPhones) ==========
    // Izvuci potrebne parametre iz HTML-a: adId, partyId, adKindId
    
    // adId - numerički ID oglasa (iz URL-a ili iz HTML-a)
    let adId: string | null = null
    // Probaj iz URL-a (poslednji segment pre query stringa)
    const urlAdIdMatch = url.match(/\/(\d{10,})(?:\?|$)/)
    if (urlAdIdMatch) {
      adId = urlAdIdMatch[1]
      console.log(`adId iz URL-a: ${adId}`)
    }
    // Fallback: traži u HTML-u
    if (!adId) {
      const htmlAdIdMatch = html.match(/"adId"\s*:\s*"?(\d+)"?/i) || 
                            html.match(/data-id="(\d+)"/i) ||
                            html.match(/"Id"\s*:\s*"(\d+)"/i)
      if (htmlAdIdMatch) {
        adId = htmlAdIdMatch[1]
        console.log(`adId iz HTML-a: ${adId}`)
      }
    }
    
    // partyId - ID oglašivača (iz QuidditaEnvironment ili HTML-a)
    let partyId: string | null = null
    const partyIdMatch = html.match(/"partyId"\s*:\s*"?(\d+)"?/i) ||
                         html.match(/"PartyId"\s*:\s*"?(\d+)"?/i) ||
                         html.match(/data-party-id="(\d+)"/i) ||
                         html.match(/"advertiserId"\s*:\s*"?(\d+)"?/i)
    if (partyIdMatch) {
      partyId = partyIdMatch[1]
      console.log(`partyId: ${partyId}`)
    }
    
    // adKindId - tip oglasa (obično 4 za nekretnine)
    let adKindId: string | null = null
    const adKindIdMatch = html.match(/"adKindId"\s*:\s*"?(\d+)"?/i) ||
                          html.match(/"AdKindId"\s*:\s*"?(\d+)"?/i) ||
                          html.match(/"categoryId"\s*:\s*"?(\d+)"?/i)
    if (adKindIdMatch) {
      adKindId = adKindIdMatch[1]
      console.log(`adKindId: ${adKindId}`)
    } else {
      // Default za nekretnine
      adKindId = "4"
      console.log(`adKindId (default): ${adKindId}`)
    }
    
    // Ako imamo sve parametre, pozovi API za telefone
    if (adId && partyId) {
      try {
        console.log(`Pozivam AdvertiserPhones API: adId=${adId}, partyId=${partyId}, adKindId=${adKindId}`)
        
        const apiUrl = 'https://www.halooglasi.com/AdAdvertiserInfoWidget/AdvertiserPhones'
        const requestBody = JSON.stringify({
          adId: adId,
          partyId: partyId,
          adKindId: adKindId || "4"
        })
        
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/json; charset=UTF-8',
            'Referer': url,
            'Origin': 'https://www.halooglasi.com',
            'X-Requested-With': 'XMLHttpRequest',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
          },
          body: requestBody
        })
        
        console.log(`API status: ${apiResponse.status}`)
        
        if (apiResponse.ok) {
          // Prvo pročitaj kao text da vidimo šta vraća
          const rawText = await apiResponse.text()
          console.log(`API RAW response: ${rawText.substring(0, 500)}`)
          
          // Parsiraj JSON
          let apiData: any
          try {
            apiData = JSON.parse(rawText)
            console.log(`API parsed:`, JSON.stringify(apiData))
          } catch (parseErr) {
            console.error(`API JSON parse error:`, parseErr)
            // Ako nije JSON, možda je HTML sa telefonima
            const phoneLinkMatch = rawText.match(/href="tel:([^"]+)"/gi)
            if (phoneLinkMatch) {
              for (const match of phoneLinkMatch) {
                const telMatch = match.match(/tel:([^"]+)/)
                if (telMatch) {
                  let tel = telMatch[1].replace(/[\s.\-\/]/g, '')
                  if (isValidPhone(tel) && !telefoni.includes(tel)) {
                    telefoni.push(tel)
                    console.log(`TELEFON IZ HTML: ${tel}`)
                  }
                }
              }
            }
            apiData = null
          }
          
          if (apiData) {
            // API vraća JSON u formatu: { phone1: "<a href='tel:063/846-1684'>063/846-1684</a>", phone2: null }
            // Potrebno je izvući broj iz HTML stringa
            
            const extractPhoneFromHtml = (htmlStr: string | null): string | null => {
              if (!htmlStr) return null
              // Izvuci broj iz href='tel:XXX' ili href="tel:XXX"
              const telMatch = htmlStr.match(/href=['"]?tel:([^'">\s]+)['"]?/i)
              if (telMatch) {
                return telMatch[1]
              }
              // Fallback: izvuci bilo koji broj koji liči na telefon
              const numMatch = htmlStr.match(/(\d[\d\s\-\/]{7,})/);
              return numMatch ? numMatch[1] : null
            }
            
            // Proveri phone1 i phone2 (HaloOglasi format)
            const phone1Raw = apiData.phone1 || apiData.Phone1
            const phone2Raw = apiData.phone2 || apiData.Phone2
            
            const phone1 = extractPhoneFromHtml(phone1Raw)
            const phone2 = extractPhoneFromHtml(phone2Raw)
            
            console.log(`Izvučeni telefoni: phone1=${phone1}, phone2=${phone2}`)
            
            // Obradi phone1
            if (phone1) {
              let tel = phone1.replace(/[\s.\-\/]/g, '')
              if (tel.startsWith('00381')) tel = '+381' + tel.substring(5)
              else if (tel.startsWith('381') && !tel.startsWith('+')) tel = '+' + tel
              else if (tel.startsWith('0') && tel.length >= 9) tel = '+381' + tel.substring(1)
              
              if (isValidPhone(tel) && !telefoni.includes(tel)) {
                telefoni.push(tel)
                console.log(`API TELEFON 1 PRONAĐEN: ${tel}`)
              }
            }
            
            // Obradi phone2
            if (phone2) {
              let tel = phone2.replace(/[\s.\-\/]/g, '')
              if (tel.startsWith('00381')) tel = '+381' + tel.substring(5)
              else if (tel.startsWith('381') && !tel.startsWith('+')) tel = '+' + tel
              else if (tel.startsWith('0') && tel.length >= 9) tel = '+381' + tel.substring(1)
              
              if (isValidPhone(tel) && !telefoni.includes(tel)) {
                telefoni.push(tel)
                console.log(`API TELEFON 2 PRONAĐEN: ${tel}`)
              }
            }
          }
        } else {
          console.log(`API error: ${apiResponse.status} ${apiResponse.statusText}`)
        }
      } catch (apiErr) {
        console.error('Greška pri API pozivu za telefone:', apiErr)
      }
    } else {
      console.log(`Nedostaju parametri za API: adId=${adId}, partyId=${partyId}`)
    }

    // FALLBACK 1: Ako API nije vratio ništa, probaj contact-info iz glavnog HTML-a
    if (telefoni.length === 0) {
        // ... (stari kod za contact-info)
        const contactInfoMatch = html.match(/<div[^>]*class="[^"]*contact-info[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
        if (contactInfoMatch) {
          const contactHtml = contactInfoMatch[1]
          const phoneLinkRegex = /class="phone-number-link"[^>]*href="tel:([^"]+)"/gi
          let phoneLinkMatch
          while ((phoneLinkMatch = phoneLinkRegex.exec(contactHtml)) !== null) {
            const tel = phoneLinkMatch[1].replace(/[\s.\-\/]/g, '')
            if (isValidPhone(tel) && !telefoni.includes(tel)) {
              telefoni.push(tel)
              console.log(`HTML telefon (link): ${tel}`)
            }
          }
        }
    }
    
    // UKLONJEN FALLBACK za telefone iz opisa - proizvodi pogrešne rezultate
    // Telefoni se izvlače SAMO iz API-ja ili phone-number-link elemenata
    
    // Izvuci email adresu - prvo iz opisa, pa iz HTML-a
    // Ignoriši sistemske email adrese (halooglasi, google, facebook, itd)
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/gi
    const ignoredDomains = ['halooglasi.com', 'google.com', 'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com']
    
    // Prvo pretraži opis
    if (dodatniOpis) {
      const opisEmailMatch = dodatniOpis.match(emailRegex)
      if (opisEmailMatch) {
        for (const e of opisEmailMatch) {
          const emailLower = e.toLowerCase()
          const isIgnored = ignoredDomains.some(d => emailLower.includes(d))
          if (!isIgnored) {
            email = emailLower
            console.log(`Email iz opisa: ${email}`)
            break
          }
        }
      }
    }
    
    // Ako nije pronađen u opisu, pretraži ceo HTML
    if (!email) {
      const htmlEmailMatches = html.match(emailRegex)
      if (htmlEmailMatches) {
        for (const e of htmlEmailMatches) {
          const emailLower = e.toLowerCase()
          const isIgnored = ignoredDomains.some(d => emailLower.includes(d))
          if (!isIgnored) {
            email = emailLower
            console.log(`Email iz HTML: ${email}`)
            break
          }
        }
      }
    }
    
    console.log(`Detalji oglasa: ime=${imevlasnika}, tel1=${telefoni[0]}, tel2=${telefoni[1]}, cena=${cenaUkupna}, email=${email}`)
    
    return {
      imevlasnika,
      kontakttelefon1: telefoni[0] || null,
      kontakttelefon2: telefoni[1] || null,
      cenaUkupna,
      dodatniOpis,
      email,
      kvadratura,
      lokacija,
      opstina,
    }
  } catch (e) {
    console.error('Greška pri učitavanju detalja oglasa:', e)
    return { 
      imevlasnika: null, 
      kontakttelefon1: null, 
      kontakttelefon2: null, 
      cenaUkupna: null, 
      dodatniOpis: null, 
      email: null,
      kvadratura: null,
      lokacija: null,
      opstina: null,
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, limit = 10 } = await req.json()
    
    if (!url) {
      throw new Error('URL je obavezan')
    }

    // Inicijalizuj Supabase klijent
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const startTime = new Date()
    
    // 1. Zapiši početak u vremetrajanja
    const { data: vremeData, error: vremeError } = await supabase
      .from('vremetrajanja')
      .insert({
        datumpocetak: startTime.toISOString(),
        linkportala: url,
        opis: 'HaloOglasi - Beograd prodaja stan - Vlasnici (Edge Function)'
      })
      .select()
      .single()

    if (vremeError) throw vremeError
    const vremeTrajanjaId = vremeData.id

    // 2. Fetch HTML sa HaloOglasi
    console.log('Učitavam stranicu:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
        'Referer': 'https://www.halooglasi.com/',
        'Cache-Control': 'no-cache',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP greška: ${response.status}`)
    }

    const html = await response.text()
    
    // DEBUG: Logirati HTML strukturu
    console.log('HTML duzina:', html.length)
    console.log('HTML preview (prvih 5000 karaktera):', html.substring(0, 5000))
    
    // Proveri da li ima bilo kakvih oglasa u HTML-u
    const hasProductItem = html.includes('product-item')
    const hasListingCard = html.includes('listing-card')
    const hasAdCard = html.includes('ad-card')
    const hasOglasItem = html.includes('oglas-item')
    const hasClassAd = html.includes('classad')
    console.log('Pronadjene klase:', { hasProductItem, hasListingCard, hasAdCard, hasOglasItem, hasClassAd })
    
    // 3. Parsiraj oglase
    let oglasi = parseOglasi(html)
    console.log(`Pronađeno ${oglasi.length} današnjih oglasa`)
    
    // Limitiraj broj oglasa
    oglasi = oglasi.slice(0, limit)

    let noviOglasi = 0
    let preskoceniOglasi = 0
    const rezultati: any[] = []

    // 4. Za svaki oglas
    for (let i = 0; i < oglasi.length; i++) {
      const oglas = oglasi[i]
      
      console.log(`Obrađujem oglas ${i + 1}/${oglasi.length}: ${oglas.idoglasa}`)

      // Proveri da li već postoji
      const { data: existing } = await supabase
        .from('vlasnici')
        .select('id')
        .eq('idoglasa', oglas.idoglasa)
        .single()

      if (existing) {
        preskoceniOglasi++
        rezultati.push({ ...oglas, status: 'preskocen', reason: 'Već postoji' })
        console.log(`Oglas ${oglas.idoglasa} već postoji, preskačem`)
      } else {
        // Učitaj detalje oglasa (ime, telefon, cena, opis, email, kvadratura, lokacija)
        let dodatniOpis: string | null = null
        let email: string | null = null
        if (oglas.linkoglasa) {
          await sleep(randomDelay()) // Pauza pre učitavanja detalja
          const detalji = await parseOglasDetalji(oglas.linkoglasa)
          oglas.imevlasnika = detalji.imevlasnika
          oglas.kontakttelefon1 = detalji.kontakttelefon1
          oglas.kontakttelefon2 = detalji.kontakttelefon2
          dodatniOpis = detalji.dodatniOpis
          email = detalji.email
          // Koristi podatke sa stranice oglasa ako su bolji od onih sa liste
          if (detalji.cenaUkupna) {
            oglas.cena = detalji.cenaUkupna
          }
          if (detalji.kvadratura) {
            oglas.kvadratura = detalji.kvadratura
          }
          if (detalji.lokacija) {
            oglas.lokacija = detalji.lokacija
          }
          if (detalji.opstina) {
            oglas.opstina = detalji.opstina
          }
        }

        // Odredi tip oglasa iz URL-a (prodaja ili izdavanje/renta)
        const rentaProdaja = url.includes('izdavanje') ? 'renta' : 'prodaja'
        
        // Odredi grad iz URL-a
        const gradMatch = url.match(/\/([^\/]+)\?/) || url.match(/\/([^\/]+)$/)
        const gradIzUrla = gradMatch ? gradMatch[1].charAt(0).toUpperCase() + gradMatch[1].slice(1) : 'Beograd'

        // Insert novog vlasnika
        const { error: insertError } = await supabase
          .from('vlasnici')
          .insert({
            datumkreiranja: new Date().toISOString(),
            rentaprodaja: rentaProdaja,
            grad: gradIzUrla,
            opstina: oglas.opstina || null,
            lokacija: oglas.lokacija || null,
            cena: oglas.cena || null,
            kvadratura: oglas.kvadratura || null,
            imevlasnika: oglas.imevlasnika || null,
            kontakttelefon1: oglas.kontakttelefon1 || null,
            kontakttelefon2: oglas.kontakttelefon2 || null,
            email: email || null,
            stsarhiviran: false,
            linkoglasa: oglas.linkoglasa || null,
            oglasnik: 'HaloOglasi',
            opisoglasa: oglas.opisoglasa || null,
            dodatniopis: dodatniOpis || null,
            idoglasa: oglas.idoglasa
          })

        if (insertError) {
          rezultati.push({ ...oglas, status: 'greska', reason: insertError.message })
          console.error(`Greška pri insertu oglasa ${oglas.idoglasa}:`, insertError)
        } else {
          noviOglasi++
          rezultati.push({ ...oglas, status: 'dodat' })
          console.log(`Dodat novi oglas: ${oglas.idoglasa}`)
        }
      }

      // Pauza između oglasa (osim za poslednji)
      if (i < oglasi.length - 1) {
        const delay = randomDelay()
        console.log(`Pauza ${delay}ms...`)
        await sleep(delay)
      }
    }

    // 5. Update vremetrajanja sa završetkom
    const endTime = new Date()
    const trajanje = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    
    await supabase
      .from('vremetrajanja')
      .update({
        datuzavrsetka: endTime.toISOString(),
        vremetrajanja: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`,
        brojnovihoglasa: noviOglasi,
        brojarhiviranih: preskoceniOglasi
      })
      .eq('id', vremeTrajanjaId)

    const result = {
      success: true,
      ukupno: oglasi.length,
      novi: noviOglasi,
      preskoceni: preskoceniOglasi,
      trajanje: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`,
      detalji: rezultati,
      // DEBUG info
      debug: {
        htmlLength: html.length,
        htmlPreview: html.substring(0, 3000),
        foundClasses: {
          productItem: html.includes('product-item'),
          listingCard: html.includes('listing-card'),
          adCard: html.includes('ad-card'),
          oglasItem: html.includes('oglas-item'),
          classad: html.includes('classad'),
        }
      }
    }

    console.log('Scraping završen:', result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Greška:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
