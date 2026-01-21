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
  // Random pauza između 1 i 3 sekundi
  return Math.floor(Math.random() * 2000) + 1000
}

// Parsiranje liste oglasa sa 4zida.rs
// Izvlači linkove i ID-eve oglasa
function parseListaOglasa(html: string): { id: string, link: string }[] {
  const oglasi: { id: string, link: string }[] = []
  
  // 4zida koristi Next.js, oglasi su u <a> tagovima sa href="/prodaja-stanova/..."
  // ID je poslednji deo URL-a (npr. /prodaja-stanova/beograd/centar/123456)
  
  // Regex za linkove oglasa
  const linkRegex = /href="(\/(?:prodaja|izdavanje)-(?:stanova|kuca|poslovnih-prostora|garaza|placeva|zemljista)[^"]+)"/gi
  
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const link = match[1]
    
    // Izvuci ID iz URL-a (poslednji segment koji je broj)
    const idMatch = link.match(/(\d+)(?:\?|$|\/?)/)
    if (idMatch) {
      const id = idMatch[1]
      
      // Proveri da nije duplikat
      if (!oglasi.some(o => o.id === id)) {
        oglasi.push({
          id,
          link: `https://www.4zida.rs${link}`
        })
      }
    }
  }
  
  console.log(`Pronađeno ${oglasi.length} oglasa na listi`)
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
    // Traži cenu u EUR formatu: 110.000 €, 110,000 EUR, 110000€
    const cenaRegex = /(\d{1,3}(?:[.,]\d{3})*)\s*(?:EUR|€)/gi
    const ceneLista: number[] = []
    let cenaMatch
    while ((cenaMatch = cenaRegex.exec(html)) !== null) {
      const cenaStr = cenaMatch[1].replace(/\./g, '').replace(',', '')
      const cenaNum = parseInt(cenaStr)
      if (cenaNum > 100 && cenaNum < 50000000) { // Razumna cena
        ceneLista.push(cenaNum)
      }
    }
    if (ceneLista.length > 0) {
      // Uzmi najčešću cenu ili prvu ako su sve različite
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
    
    // ========== LOKACIJA (GRAD, OPŠTINA, ULICA) ==========
    let grad: string | null = null
    let opstina: string | null = null
    let lokacija: string | null = null
    
    // Traži breadcrumb ili adresu
    // 4zida struktura: Beograd > Stari Grad > Gundulićev Venac
    const breadcrumbMatch = html.match(/Beograd|Novi Sad|Niš|Kragujevac|Subotica|Zrenjanin|Pančevo|Čačak|Kruševac|Kraljevo|Leskovac|Smederevo|Valjevo|Vranje|Šabac|Užice|Sombor|Požarevac|Pirot|Zaječar/gi)
    if (breadcrumbMatch) {
      grad = breadcrumbMatch[0].charAt(0).toUpperCase() + breadcrumbMatch[0].slice(1).toLowerCase()
      console.log(`Grad: ${grad}`)
    }
    
    // Opština - traži u naslovu ili meta podacima
    const opstinaMatch = html.match(/(?:opština|opstina|MO|mesna zajednica)[:\s]*([^,<]+)/i) ||
                         html.match(/(?:Stari Grad|Novi Beograd|Vračar|Zvezdara|Palilula|Voždovac|Čukarica|Savski Venac|Rakovica|Zemun|Surčin|Grocka|Barajevo|Lazarevac|Mladenovac|Obrenovac|Sopot)/i)
    if (opstinaMatch) {
      opstina = opstinaMatch[1] ? opstinaMatch[1].trim() : opstinaMatch[0].trim()
      console.log(`Opština: ${opstina}`)
    }
    
    // Lokacija/ulica
    const ulicaMatch = html.match(/(?:ulica|adresa)[:\s]*([^,<]+)/i) ||
                       naslov?.match(/,\s*([^,]+)$/i)
    if (ulicaMatch) {
      lokacija = ulicaMatch[1]?.trim() || null
      console.log(`Lokacija: ${lokacija}`)
    }
    
    // ========== OPIS ==========
    let opis: string | null = null
    // Traži opis u različitim formatima
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
    
    // ========== TELEFON ==========
    const telefoni: string[] = []
    // Srpski formati: 063 331 702, 063/331-702, +381 63 331702, 063331702
    const telefonRegex = /(?:\+381|0)[\s.-]?[1-9][0-9][\s.-]?\d{3}[\s.-]?\d{3,4}/g
    const telefonMatches = html.match(telefonRegex)
    if (telefonMatches) {
      for (const tel of telefonMatches) {
        const cleaned = tel.replace(/[\s.-]/g, '')
        if (!telefoni.includes(cleaned) && telefoni.length < 2) {
          telefoni.push(cleaned)
          console.log(`Telefon: ${cleaned}`)
        }
      }
    }
    
    // ========== EMAIL ==========
    let email: string | null = null
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/gi
    const ignoredDomains = ['4zida.rs', 'google.com', 'facebook.com', 'twitter.com', 'instagram.com']
    const emailMatches = html.match(emailRegex)
    if (emailMatches) {
      for (const e of emailMatches) {
        const emailLower = e.toLowerCase()
        const isIgnored = ignoredDomains.some(d => emailLower.includes(d))
        if (!isIgnored) {
          email = emailLower
          console.log(`Email: ${email}`)
          break
        }
      }
    }
    
    // ========== IME VLASNIKA ==========
    let imevlasnika: string | null = null
    const imeMatch = html.match(/(?:oglašivač|vlasnik|kontakt)[:\s]*<[^>]*>([^<]+)/i) ||
                     html.match(/<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)/i)
    if (imeMatch) {
      imevlasnika = imeMatch[1].trim()
      console.log(`Ime vlasnika: ${imevlasnika}`)
    }
    
    // ========== TIP OGLASA (PRODAJA/RENTA) ==========
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
    }
  } catch (e) {
    console.error('Greška pri učitavanju detalja oglasa:', e)
    return {
      naslov: null,
      cena: null,
      kvadratura: null,
      brojSoba: null,
      grad: null,
      opstina: null,
      lokacija: null,
      opis: null,
      telefon1: null,
      telefon2: null,
      email: null,
      imevlasnika: null,
      rentaProdaja: 'prodaja',
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, limit = 20 } = await req.json()
    
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
        opis: '4zida - Scraping vlasnika (Edge Function)'
      })
      .select()
      .single()

    if (vremeError) throw vremeError
    const vremeTrajanjaId = vremeData.id

    // 2. Fetch HTML sa 4zida liste oglasa
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
    
    // 3. Parsiraj listu oglasa
    let oglasi = parseListaOglasa(html)
    console.log(`Pronađeno ${oglasi.length} oglasa na listi`)
    
    // Limitiraj broj oglasa
    oglasi = oglasi.slice(0, limit)
    console.log(`Obrađujem ${oglasi.length} oglasa (limit: ${limit})`)

    // 4. Proveri koji oglasi već postoje u bazi
    const oglasiIds = oglasi.map(o => o.id)
    const { data: postojeciOglasi } = await supabase
      .from('vlasnici')
      .select('oglas_id')
      .in('oglas_id', oglasiIds)
    
    const postojeciIdsSet = new Set(postojeciOglasi?.map(o => o.oglas_id) || [])
    console.log(`${postojeciIdsSet.size} oglasa već postoji u bazi`)
    
    // Filtriraj samo nove oglase
    const noviOglasiZaObradu = oglasi.filter(o => !postojeciIdsSet.has(o.id))
    console.log(`${noviOglasiZaObradu.length} novih oglasa za obradu`)

    let noviOglasi = 0
    let preskoceniOglasi = oglasi.length - noviOglasiZaObradu.length
    const rezultati: any[] = []

    // 5. Za svaki novi oglas - učitaj detalje i sačuvaj
    for (let i = 0; i < noviOglasiZaObradu.length; i++) {
      const oglas = noviOglasiZaObradu[i]
      
      console.log(`Obrađujem oglas ${i + 1}/${noviOglasiZaObradu.length}: ${oglas.id}`)

      // Pauza pre učitavanja detalja
      await sleep(randomDelay())
      
      // Učitaj detalje oglasa
      const detalji = await parseOglasDetalji(oglas.link)

      // Insert novog vlasnika
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
          dodatniopis: detalji.opis || null,
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

    // 6. Update vremetrajanja sa završetkom
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
