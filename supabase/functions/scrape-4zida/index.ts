// Supabase Edge Function za scraping 4zida.rs
// Deploy: supabase functions deploy scrape-4zida

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
  return Math.floor(Math.random() * 2000) + 1000
}

// Parsiranje liste oglasa sa 4zida.rs
function parseListaOglasa(html: string): { id: string, link: string }[] {
  const oglasi: { id: string, link: string }[] = []
  
  const urlPattern = /https:\/\/www\.4zida\.rs\/(prodaja|izdavanje)-stanova\/[^"'\s]+\/([a-f0-9]{24})/gi
  
  let match
  while ((match = urlPattern.exec(html)) !== null) {
    const fullUrl = match[0]
    const id = match[2]
    
    if (fullUrl.includes('/vlasnik') || 
        fullUrl.includes('/agencija') || 
        fullUrl.includes('?') ||
        fullUrl.includes('#')) {
      continue
    }
    
    if (!oglasi.some(o => o.id === id)) {
      oglasi.push({ id, link: fullUrl })
      console.log(`Pronađen oglas: ${id} -> ${fullUrl}`)
    }
  }
  
  if (oglasi.length === 0) {
    const urlPattern2 = /https:\/\/www\.4zida\.rs\/(prodaja|izdavanje)-(kuca|poslovnih-prostora|garaza|placeva|zemljista)\/[^"'\s]+\/([a-f0-9]{24})/gi
    
    while ((match = urlPattern2.exec(html)) !== null) {
      const fullUrl = match[0]
      const id = match[3]
      
      if (fullUrl.includes('/vlasnik') || 
          fullUrl.includes('/agencija') || 
          fullUrl.includes('?')) {
        continue
      }
      
      if (!oglasi.some(o => o.id === id)) {
        oglasi.push({ id, link: fullUrl })
        console.log(`Pronađen oglas (tip2): ${id} -> ${fullUrl}`)
      }
    }
  }
  
  if (oglasi.length === 0) {
    console.log('URL pattern nije dao rezultate, tražim u JSON strukturama...')
    
    const jsonUrlPattern = /"url"\s*:\s*"(https:\/\/www\.4zida\.rs\/(prodaja|izdavanje)-[^"]+\/([a-f0-9]{24}))"/gi
    
    while ((match = jsonUrlPattern.exec(html)) !== null) {
      const fullUrl = match[1]
      const id = match[3]
      
      if (fullUrl.includes('/vlasnik') || fullUrl.includes('/agencija')) {
        continue
      }
      
      if (!oglasi.some(o => o.id === id)) {
        oglasi.push({ id, link: fullUrl })
        console.log(`Pronađen oglas (JSON): ${id} -> ${fullUrl}`)
      }
    }
  }
  
  console.log(`Pronađeno ukupno ${oglasi.length} oglasa`)
  return oglasi
}

// Parsiranje pojedinačnog oglasa za sve podatke
async function parseOglasDetalji(url: string): Promise<{
  naslov: string | null,
  cena: number | null,
  kvadratura: number | null,
  brojSoba: string | null,
  grad: string | null,
  opstina: string | null,
  lokacija: string | null,
  opis: string | null,
  telefon1: string | null,
  telefon2: string | null,
  email: string | null,
  imevlasnika: string | null,
  rentaProdaja: string,
  hasViber: boolean,
  isAgencija: boolean,
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
        'Referer': 'https://www.4zida.rs/',
        'Cache-Control': 'no-cache',
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // ========== PROVERA DA LI JE AGENCIJA ==========
    const isAgencija = html.includes('Svi oglasi') || 
                       html.includes('godina na 4zida') || 
                       html.includes('godine na 4zida')
    
    if (isAgencija) {
      console.log(`Preskačem oglas - agencija/profesionalac: ${url}`)
      return {
        naslov: null, cena: null, kvadratura: null, brojSoba: null,
        grad: null, opstina: null, lokacija: null, opis: null,
        telefon1: null, telefon2: null, email: null, imevlasnika: null,
        rentaProdaja: 'prodaja', hasViber: false, isAgencija: true,
      }
    }
    
    // ========== NASLOV ==========
    let naslov: string | null = null
    const naslovMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                        html.match(/<title>([^<]+)<\/title>/i)
    if (naslovMatch) {
      naslov = naslovMatch[1].trim()
        .replace(/ \| 4zida\.rs$/i, '')
        .replace(/&nbsp;/g, ' ')
    }
    
    // ========== CENA ==========
    let cena: number | null = null
    const cenaRegex = /(\d{1,3}(?:[.,]\d{3})*)\s*(?:EUR|€)/gi
    const ceneLista: number[] = []
    let cenaMatch
    while ((cenaMatch = cenaRegex.exec(html)) !== null) {
      const cenaStr = cenaMatch[1].replace(/\./g, '').replace(',', '')
      const cenaNum = parseInt(cenaStr)
      if (cenaNum > 100 && cenaNum < 50000000) {
        ceneLista.push(cenaNum)
      }
    }
    if (ceneLista.length > 0) {
      cena = ceneLista[0]
      console.log(`Cena: ${cena} EUR`)
    }
    
    // ========== KVADRATURA ==========
    let kvadratura: number | null = null
    const kvMatch = html.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/i)
    if (kvMatch) {
      kvadratura = parseFloat(kvMatch[1].replace(',', '.'))
      console.log(`Kvadratura: ${kvadratura} m²`)
    }
    
    // ========== BROJ SOBA ==========
    let brojSoba: string | null = null
    const sobaMatch = html.match(/(jednosoban|jednoiposoban|dvosoban|dvoiposoban|trosoban|troiposoban|četvorosoban|četvoroiposoban|petosoban|garsonjera)/i)
    if (sobaMatch) {
      brojSoba = sobaMatch[1].toLowerCase()
      console.log(`Broj soba: ${brojSoba}`)
    }
    
    // ========== LOKACIJA ==========
    let grad: string | null = null
    let opstina: string | null = null
    let lokacija: string | null = null
    
    const urlParts = url.split('/')
    if (urlParts.length >= 5) {
      const gradSlug = urlParts[4]
      if (gradSlug && !gradSlug.match(/^\d+$/)) {
        grad = gradSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        console.log(`Grad iz URL-a: ${grad}`)
      }
      
      if (urlParts.length >= 6) {
        const opstinaSlug = urlParts[5]
        if (opstinaSlug && !opstinaSlug.match(/^\d+$/)) {
          opstina = opstinaSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          console.log(`Opština iz URL-a: ${opstina}`)
        }
      }
    }
    
    if (!grad) {
      const breadcrumbMatch = html.match(/Beograd|Novi Sad|Niš|Kragujevac|Subotica|Zrenjanin|Pančevo|Čačak|Kruševac|Kraljevo|Leskovac|Smederevo|Valjevo|Vranje|Šabac|Užice|Sombor|Požarevac|Pirot|Zaječar/gi)
      if (breadcrumbMatch) {
        grad = breadcrumbMatch[0].charAt(0).toUpperCase() + breadcrumbMatch[0].slice(1).toLowerCase()
        console.log(`Grad iz HTML-a: ${grad}`)
      }
    }
    
    if (naslov) {
      const naslovParts = naslov.split(',')
      if (naslovParts.length > 1) {
        lokacija = naslovParts[naslovParts.length - 1].trim()
        console.log(`Lokacija iz naslova: ${lokacija}`)
      }
    }
    
    // ========== OPIS ==========
    let opis: string | null = null
    const opisMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                      html.match(/<section[^>]*>\s*<h[23][^>]*>Opis[^<]*<\/h[23]>\s*([\s\S]*?)<\/section>/i)
    if (opisMatch) {
      opis = opisMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
      if (opis.length > 2000) {
        opis = opis.substring(0, 2000) + '...'
      }
      console.log(`Opis: ${opis.substring(0, 100)}...`)
    }
    
    // ========== TELEFON IZ JSON OBJEKTA ==========
    const telefoni: string[] = []
    let hasViber = false
    
    const ignoredPhones = [
      '061056335', '0610563350', '+381610563350',
      '0483308770', '+381483308770',
      '0221800122', '+381221800122',
      '+381244155869', '0244155869', '244155869',
      '0800100200',
    ]
    
    // 4zida čuva telefone u JSON objektu
    const phonesPatterns = [
      /"phones"\s*:\s*\[([\s\S]*?)\]/,
      /"publicPhones"\s*:\s*\[([\s\S]*?)\]/,
      /"publicPhones2"\s*:\s*\[([\s\S]*?)\]/
    ]
    
    for (const pattern of phonesPatterns) {
      const phonesMatch = html.match(pattern)
      if (phonesMatch && telefoni.length < 2) {
        const phonesJson = phonesMatch[1]
        
        // PRIORITET: Izvuci "full" vrednosti
        const fullRegex = /"full"\s*:\s*"([^"]+)"/g
        let fullMatch
        while ((fullMatch = fullRegex.exec(phonesJson)) !== null && telefoni.length < 2) {
          const tel = fullMatch[1].replace(/\s/g, '')
          const isIgnored = ignoredPhones.some(p => tel.includes(p) || p.includes(tel))
          if (!telefoni.includes(tel) && !isIgnored) {
            telefoni.push(tel)
            console.log(`Telefon iz JSON (full): ${tel}`)
          }
        }
        
        // FALLBACK: Ako nema "full", koristi "national"
        if (telefoni.length === 0) {
          const nationalRegex = /"national"\s*:\s*"([^"]+)"/g
          let nationalMatch
          while ((nationalMatch = nationalRegex.exec(phonesJson)) !== null && telefoni.length < 2) {
            let tel = nationalMatch[1].replace(/\s/g, '')
            if (tel.startsWith('0')) {
              tel = '+381' + tel.substring(1)
            }
            const isIgnored = ignoredPhones.some(p => tel.includes(p) || p.includes(tel))
            if (!telefoni.includes(tel) && !isIgnored) {
              telefoni.push(tel)
              console.log(`Telefon iz JSON (national->full): ${tel}`)
            }
          }
        }
        
        if (phonesJson.includes('"isViber":true')) {
          hasViber = true
          console.log('Ima Viber kontakt')
        }
      }
    }
    
    // Fallback regex
    if (telefoni.length === 0) {
      const telefonRegex = /(?:\+\d{1,4}[\s.-]?\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4})|(?:0[1-9][0-9][\s.-]?\d{3}[\s.-]?\d{3,4})/g
      const telefonMatches = html.match(telefonRegex)
      if (telefonMatches) {
        for (const tel of telefonMatches) {
          let cleaned = tel.replace(/[\s.-]/g, '')
          if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
            cleaned = '+381' + cleaned.substring(1)
          }
          const isIgnored = ignoredPhones.some(p => cleaned.includes(p) || p.includes(cleaned))
          if (!telefoni.includes(cleaned) && telefoni.length < 2 && !isIgnored) {
            telefoni.push(cleaned)
            console.log(`Telefon (fallback regex): ${cleaned}`)
          }
        }
      }
    }
    
    // ========== EMAIL ==========
    let email: string | null = null
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/gi
    const ignoredDomains = ['4zida.rs', 'google.com', 'facebook.com', 'twitter.com', 'instagram.com']
    const ignoredEmails = ['info@inspiragrupa.com', 'info@4zida.rs', 'podrska@4zida.rs']
    const emailMatches = html.match(emailRegex)
    if (emailMatches) {
      for (const e of emailMatches) {
        const emailLower = e.toLowerCase()
        const isIgnoredDomain = ignoredDomains.some(d => emailLower.includes(d))
        const isIgnoredEmail = ignoredEmails.includes(emailLower)
        if (!isIgnoredDomain && !isIgnoredEmail) {
          email = emailLower
          console.log(`Email: ${email}`)
          break
        }
      }
    }
    
    // ========== IME VLASNIKA ==========
    let imevlasnika: string | null = null
    const fullNameMatch = html.match(/"author"\s*:\s*\{[^}]*"fullName"\s*:\s*"([^"]+)"/i)
    if (fullNameMatch && fullNameMatch[1].trim()) {
      const potencijalnoIme = fullNameMatch[1].trim()
      // Proveri da nije telefon (ne počinje sa + i nije samo brojevi)
      if (!potencijalnoIme.startsWith('+') && !/^\d+$/.test(potencijalnoIme) && !/^\+?\d[\d\s-]+$/.test(potencijalnoIme)) {
        imevlasnika = potencijalnoIme
        console.log(`Ime vlasnika iz JSON: ${imevlasnika}`)
      } else {
        console.log(`Preskočeno ime (izgleda kao telefon): ${potencijalnoIme}`)
      }
    }
    
    if (!imevlasnika) {
      const imeMatch = html.match(/(?:oglašivač|vlasnik|kontakt)[:\s]*<[^>]*>([^<]+)/i) ||
                       html.match(/<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i)
      if (imeMatch) {
        const potencijalnoIme = imeMatch[1].trim()
        if (!potencijalnoIme.startsWith('+') && !/^\d+$/.test(potencijalnoIme) && !/^\+?\d[\d\s-]+$/.test(potencijalnoIme)) {
          imevlasnika = potencijalnoIme
          console.log(`Ime vlasnika iz HTML: ${imevlasnika}`)
        } else {
          console.log(`Preskočeno ime iz HTML (izgleda kao telefon): ${potencijalnoIme}`)
        }
      }
    }
    
    const rentaProdaja = url.includes('izdavanje') ? 'renta' : 'prodaja'
    
    return {
      naslov,
      cena,
      kvadratura,
      brojSoba,
      grad,
      opstina,
      lokacija,
      opis,
      telefon1: telefoni[0] || null,
      telefon2: telefoni[1] || null,
      email,
      imevlasnika,
      rentaProdaja,
      hasViber,
      isAgencija: false,
    }
  } catch (e) {
    console.error('Greška pri učitavanju detalja oglasa:', e)
    return {
      naslov: null, cena: null, kvadratura: null, brojSoba: null,
      grad: null, opstina: null, lokacija: null, opis: null,
      telefon1: null, telefon2: null, email: null, imevlasnika: null,
      rentaProdaja: 'prodaja', hasViber: false, isAgencija: false,
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, limit = 20 } = await req.json()
    
    if (!url) {
      throw new Error('URL je obavezan')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const startTime = new Date()
    
    const { data: vremeData, error: vremeError } = await supabase
      .from('vremetrajanja')
      .insert({
        datumpocetak: startTime.toISOString(),
        linkportala: url,
        opis: '4zida - Scraping vlasnika (Edge Function)'
      })
      .select()
      .single()

    if (vremeError) throw vremeError
    const vremeTrajanjaId = vremeData.id

    console.log('Učitavam stranicu:', url)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
        'Referer': 'https://www.4zida.rs/',
        'Cache-Control': 'no-cache',
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP greška: ${response.status}`)
    }

    const html = await response.text()
    console.log('HTML dužina:', html.length)
    
    let oglasi = parseListaOglasa(html)
    console.log(`Pronađeno ${oglasi.length} oglasa na listi`)
    
    oglasi = oglasi.slice(0, limit)
    console.log(`Obrađujem ${oglasi.length} oglasa (limit: ${limit})`)

    const oglasiIds = oglasi.map(o => o.id)
    const { data: postojeciOglasi } = await supabase
      .from('vlasnici')
      .select('oglas_id')
      .in('oglas_id', oglasiIds)
    
    const postojeciIdsSet = new Set(postojeciOglasi?.map(o => o.oglas_id) || [])
    console.log(`${postojeciIdsSet.size} oglasa već postoji u bazi`)
    
    const noviOglasiZaObradu = oglasi.filter(o => !postojeciIdsSet.has(o.id))
    console.log(`${noviOglasiZaObradu.length} novih oglasa za obradu`)

    let noviOglasi = 0
    let preskoceniOglasi = oglasi.length - noviOglasiZaObradu.length
    const rezultati: any[] = []
    let preskoceneAgencije = 0

    for (let i = 0; i < noviOglasiZaObradu.length; i++) {
      const oglas = noviOglasiZaObradu[i]
      
      console.log(`Obrađujem oglas ${i + 1}/${noviOglasiZaObradu.length}: ${oglas.id}`)

      await sleep(randomDelay())
      
      const detalji = await parseOglasDetalji(oglas.link)

      if (detalji.isAgencija) {
        preskoceneAgencije++
        rezultati.push({ id: oglas.id, link: oglas.link, status: 'preskocen', reason: 'Agencija/profesionalac' })
        console.log(`Preskočen oglas ${oglas.id} - agencija/profesionalac`)
        continue
      }

      let dodatniOpis = detalji.opis || ''
      if (detalji.hasViber && detalji.telefon1) {
        dodatniOpis = `[VIBER: ${detalji.telefon1}] ${dodatniOpis}`.trim()
      }

      const { error: insertError } = await supabase
        .from('vlasnici')
        .insert({
          datumkreiranja: new Date().toISOString(),
          rentaprodaja: detalji.rentaProdaja,
          grad: detalji.grad || 'Beograd',
          opstina: detalji.opstina || null,
          lokacija: detalji.lokacija || null,
          cena: detalji.cena || null,
          kvadratura: detalji.kvadratura || null,
          imevlasnika: detalji.imevlasnika || null,
          kontakttelefon1: detalji.telefon1 || null,
          kontakttelefon2: detalji.telefon2 || null,
          email: detalji.email || null,
          stsarhiviran: false,
          linkoglasa: oglas.link,
          oglasnik: '4zida',
          opisoglasa: detalji.naslov || null,
          dodatniopis: dodatniOpis || null,
          oglas_id: oglas.id,
          idoglasa: oglas.id
        })

      if (insertError) {
        rezultati.push({ id: oglas.id, link: oglas.link, status: 'greska', reason: insertError.message })
        console.error(`Greška pri insertu oglasa ${oglas.id}:`, insertError)
      } else {
        noviOglasi++
        rezultati.push({ id: oglas.id, link: oglas.link, status: 'dodat', ...detalji })
        console.log(`Dodat novi oglas: ${oglas.id}`)
      }
    }

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
      agencije: preskoceneAgencije,
      trajanje: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`,
      detalji: rezultati
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
