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
  // Random pauza između 3 i 7 sekundi
  return Math.floor(Math.random() * 4000) + 3000
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
      
      // Izvuci cenu - HaloOglasi koristi data-value ili prikazuje cenu u EUR
      const cenaDataMatch = oglasHtml.match(/data-value="(\d+)"/i)
      const cenaTextMatch = oglasHtml.match(/(\d{1,3}(?:[.,]\d{3})*)\s*(?:EUR|€)/i)
      let cena: number | null = null
      if (cenaDataMatch) {
        cena = parseInt(cenaDataMatch[1])
      } else if (cenaTextMatch) {
        cena = parseInt(cenaTextMatch[1].replace(/[.,]/g, ''))
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
      
      // Za sada prihvatamo sve oglase (bez filtriranja po datumu)
      // jer datum može biti u različitim formatima
      // Kasnije možemo dodati filter ako treba
      
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
async function parseOglasDetalji(url: string): Promise<{ imevlasnika: string | null, kontakttelefon1: string | null, kontakttelefon2: string | null }> {
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
    
    // Izvuci ime vlasnika
    const imeMatch = html.match(/class="[^"]*advertiser-name[^"]*"[^>]*>([^<]+)/i)
    const imevlasnika = imeMatch ? imeMatch[1].trim() : null
    
    // Izvuci telefon
    const telefonMatches = html.match(/href="tel:([^"]+)"/gi) || []
    const telefoni = telefonMatches.map(t => {
      const m = t.match(/tel:([^"]+)/)
      return m ? m[1] : null
    }).filter(Boolean)
    
    return {
      imevlasnika,
      kontakttelefon1: telefoni[0] || null,
      kontakttelefon2: telefoni[1] || null,
    }
  } catch (e) {
    console.error('Greška pri učitavanju detalja oglasa:', e)
    return { imevlasnika: null, kontakttelefon1: null, kontakttelefon2: null }
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
        // Učitaj detalje oglasa (ime, telefon)
        if (oglas.linkoglasa) {
          await sleep(randomDelay()) // Pauza pre učitavanja detalja
          const detalji = await parseOglasDetalji(oglas.linkoglasa)
          oglas.imevlasnika = detalji.imevlasnika
          oglas.kontakttelefon1 = detalji.kontakttelefon1
          oglas.kontakttelefon2 = detalji.kontakttelefon2
        }

        // Insert novog vlasnika
        const { error: insertError } = await supabase
          .from('vlasnici')
          .insert({
            datumkreiranja: new Date().toISOString(),
            rentaprodaja: 'prodaja',
            grad: 'Beograd',
            opstina: oglas.opstina || null,
            lokacija: oglas.lokacija || null,
            cena: oglas.cena || null,
            kvadratura: oglas.kvadratura || null,
            imevlasnika: oglas.imevlasnika || null,
            kontakttelefon1: oglas.kontakttelefon1 || null,
            kontakttelefon2: oglas.kontakttelefon2 || null,
            stsarhiviran: false,
            linkoglasa: oglas.linkoglasa || null,
            oglasnik: 'HaloOglasi',
            opisoglasa: oglas.opisoglasa || null,
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
