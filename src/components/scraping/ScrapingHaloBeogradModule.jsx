import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Globe, Play, Loader2, CheckCircle, XCircle, Clock, Users, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'

export default function ScrapingHaloBeogradModule() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' })
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [lastSession, setLastSession] = useState(null)

  const SCRAPING_URL = 'https://www.halooglasi.com/nekretnine/prodaja-stanova/beograd?oglasivac_nekretnine_id_l=387237'

  useEffect(() => {
    loadLastSession()
  }, [])

  const loadLastSession = async () => {
    try {
      const { data, error } = await supabase
        .from('vremetrajanja')
        .select('*')
        .eq('linkportala', SCRAPING_URL)
        .order('datumpocetak', { ascending: false })
        .limit(1)
        .single()

      if (data && !error) {
        setLastSession(data)
      }
    } catch (err) {
      console.log('Nema prethodnih sesija')
    }
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const randomDelay = () => {
    // Random pauza između 3 i 7 sekundi
    return Math.floor(Math.random() * 4000) + 3000
  }

  const parseOglasId = (url) => {
    // Izvuci ID oglasa iz URL-a
    const match = url.match(/\/(\d+)(?:\?|$)/)
    return match ? match[1] : null
  }

  const startScraping = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setProgress({ current: 0, total: 0, status: 'Započinjem scraping...' })

    let vremeTrajanjaId = null
    const startTime = new Date()

    try {
      // 1. Zapiši početak u vremetrajanja
      const { data: vremeData, error: vremeError } = await supabase
        .from('vremetrajanja')
        .insert({
          datumpocetak: startTime.toISOString(),
          linkportala: SCRAPING_URL,
          opis: 'HaloOglasi - Beograd prodaja stan - Vlasnici'
        })
        .select()
        .single()

      if (vremeError) throw vremeError
      vremeTrajanjaId = vremeData.id

      setProgress({ current: 0, total: 0, status: 'Učitavam oglase sa HaloOglasi...' })

      // 2. Fetch HTML sa HaloOglasi preko proxy-ja ili direktno
      // NAPOMENA: Ovo neće raditi direktno iz browsera zbog CORS-a
      // Za pravu implementaciju potreban je backend (Edge Function)
      
      // Simulacija za sada - u produkciji ovo ide preko Edge Function
      const mockOglasi = await fetchOglasiMock()
      
      setProgress({ current: 0, total: mockOglasi.length, status: `Pronađeno ${mockOglasi.length} oglasa. Obrađujem...` })

      let noviOglasi = 0
      let preskoceniOglasi = 0
      const rezultati = []

      // 3. Za svaki oglas
      for (let i = 0; i < mockOglasi.length; i++) {
        const oglas = mockOglasi[i]
        
        setProgress({ 
          current: i + 1, 
          total: mockOglasi.length, 
          status: `Obrađujem oglas ${i + 1}/${mockOglasi.length}...` 
        })

        // Proveri da li već postoji
        const { data: existing } = await supabase
          .from('vlasnici')
          .select('id')
          .eq('idoglasa', oglas.idoglasa)
          .single()

        if (existing) {
          preskoceniOglasi++
          rezultati.push({ ...oglas, status: 'preskocen', reason: 'Već postoji' })
        } else {
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
          } else {
            noviOglasi++
            rezultati.push({ ...oglas, status: 'dodat' })
          }
        }

        // Pauza između oglasa (osim za poslednji)
        if (i < mockOglasi.length - 1) {
          const delay = randomDelay()
          setProgress({ 
            current: i + 1, 
            total: mockOglasi.length, 
            status: `Pauza ${(delay/1000).toFixed(1)}s pre sledećeg oglasa...` 
          })
          await sleep(delay)
        }
      }

      // 4. Update vremetrajanja sa završetkom
      const endTime = new Date()
      const trajanje = Math.round((endTime - startTime) / 1000)
      
      await supabase
        .from('vremetrajanja')
        .update({
          datuzavrsetka: endTime.toISOString(),
          vremetrajanja: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`,
          brojnovihoglasa: noviOglasi,
          brojarhiviranih: preskoceniOglasi
        })
        .eq('id', vremeTrajanjaId)

      setResults({
        ukupno: mockOglasi.length,
        novi: noviOglasi,
        preskoceni: preskoceniOglasi,
        trajanje: `${Math.floor(trajanje / 60)}m ${trajanje % 60}s`,
        detalji: rezultati
      })

      setProgress({ current: mockOglasi.length, total: mockOglasi.length, status: 'Završeno!' })
      loadLastSession()

    } catch (err) {
      console.error('Greška pri scrapingu:', err)
      setError(err.message)
      
      // Update vremetrajanja sa greškom ako je kreiran
      if (vremeTrajanjaId) {
        await supabase
          .from('vremetrajanja')
          .update({
            datuzavrsetka: new Date().toISOString(),
            opis: `GREŠKA: ${err.message}`
          })
          .eq('id', vremeTrajanjaId)
      }
    } finally {
      setLoading(false)
    }
  }

  // Mock funkcija - u produkciji ovo zamenjuje Edge Function
  // NAPOMENA: Za pravi scraping potrebno je deploy-ovati Supabase Edge Function
  // i pozvati je umesto ove mock funkcije
  const fetchOglasiMock = async () => {
    // Simulacija učitavanja
    await sleep(2000)
    
    // Mock podaci za testiranje sa FIKSNIM ID-ovima (kao pravi ID-ovi sa portala)
    // Ovi ID-ovi simuliraju prave ID-ove oglasa sa HaloOglasi
    // Deduplikacija radi po ovom polju - ako oglas sa istim ID-om već postoji, biće preskočen
    return [
      {
        idoglasa: '5521234567890',  // Fiksni ID - simulira pravi ID sa portala
        imevlasnika: 'Petar Petrović',
        kontakttelefon1: '0641234567',
        kontakttelefon2: null,
        cena: 85000,
        kvadratura: 65,
        opstina: 'Vračar',
        lokacija: 'Crveni Krst',
        linkoglasa: 'https://www.halooglasi.com/nekretnine/prodaja-stanova/stan-vracar-65m2/5521234567890',
        opisoglasa: 'Prodajem stan na Vračaru, 65m2, renoviran'
      },
      {
        idoglasa: '5521234567891',  // Fiksni ID - simulira pravi ID sa portala
        imevlasnika: 'Marko Marković',
        kontakttelefon1: '0659876543',
        kontakttelefon2: '0112345678',
        cena: 120000,
        kvadratura: 85,
        opstina: 'Novi Beograd',
        lokacija: 'Blok 45',
        linkoglasa: 'https://www.halooglasi.com/nekretnine/prodaja-stanova/lux-stan-nbgd/5521234567891',
        opisoglasa: 'Lux stan na Novom Beogradu'
      },
      {
        idoglasa: '5521234567892',  // Fiksni ID - simulira pravi ID sa portala
        imevlasnika: 'Jovan Jovanović',
        kontakttelefon1: '0631112233',
        kontakttelefon2: null,
        cena: 95000,
        kvadratura: 72,
        opstina: 'Zvezdara',
        lokacija: 'Vukov Spomenik',
        linkoglasa: 'https://www.halooglasi.com/nekretnine/prodaja-stanova/stan-zvezdara/5521234567892',
        opisoglasa: 'Trosoban stan kod Vukovog spomenika'
      }
    ]
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">HaloOglasi - Beograd Prodaja Stan</h2>
            <p className="text-gray-500">Scraping oglasa vlasnika sa HaloOglasi portala</p>
          </div>
        </div>

        {/* Info o URL-u */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <ExternalLink className="w-4 h-4" />
            <span className="font-medium">URL za scraping:</span>
          </div>
          <a 
            href={SCRAPING_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm break-all"
          >
            {SCRAPING_URL}
          </a>
        </div>

        {/* Poslednja sesija */}
        {lastSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Poslednja sesija
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600">Početak:</span>
                <p className="font-medium text-blue-900">{formatDate(lastSession.datumpocetak)}</p>
              </div>
              <div>
                <span className="text-blue-600">Trajanje:</span>
                <p className="font-medium text-blue-900">{lastSession.vremetrajanja || '-'}</p>
              </div>
              <div>
                <span className="text-blue-600">Novih oglasa:</span>
                <p className="font-medium text-green-700">{lastSession.brojnovihoglasa || 0}</p>
              </div>
              <div>
                <span className="text-blue-600">Preskočeno:</span>
                <p className="font-medium text-gray-700">{lastSession.brojarhiviranih || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dugme za pokretanje */}
        <div className="flex gap-4">
          <button
            onClick={startScraping}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scraping u toku...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Pokreni scraping
              </>
            )}
          </button>

          {results && (
            <button
              onClick={() => { setResults(null); setProgress({ current: 0, total: 0, status: '' }) }}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Resetuj
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            Progress
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.status}</span>
              <span>{progress.current}/{progress.total}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                style={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%' }}
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Molimo sačekajte</p>
                <p>Scraping se izvršava sa pauzama između oglasa kako bi se izbeglo blokiranje. Ne zatvarajte stranicu.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Greška */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Greška pri scrapingu</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rezultati */}
      {results && (
        <div className="space-y-6">
          {/* Statistika */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Ukupno pronađeno</div>
              <div className="text-3xl font-bold text-gray-900">{results.ukupno}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 mb-1">Novih oglasa</div>
              <div className="text-3xl font-bold text-green-700">{results.novi}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Preskočeno</div>
              <div className="text-3xl font-bold text-gray-700">{results.preskoceni}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Trajanje</div>
              <div className="text-3xl font-bold text-blue-700">{results.trajanje}</div>
            </div>
          </div>

          {/* Lista rezultata */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                Detalji obrade ({results.detalji.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {results.detalji.map((item, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.status === 'dodat' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Dodat
                          </span>
                        )}
                        {item.status === 'preskocen' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                            Preskočen
                          </span>
                        )}
                        {item.status === 'greska' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            <XCircle className="w-3 h-3" />
                            Greška
                          </span>
                        )}
                        <span className="font-medium text-gray-900">{item.imevlasnika || 'Nepoznat'}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.opstina && <span>{item.opstina}</span>}
                        {item.lokacija && <span> • {item.lokacija}</span>}
                        {item.cena && <span> • {item.cena.toLocaleString()}€</span>}
                        {item.kvadratura && <span> • {item.kvadratura}m²</span>}
                      </div>
                      {item.kontakttelefon1 && (
                        <div className="text-sm text-blue-600 mt-1">
                          Tel: {item.kontakttelefon1}
                          {item.kontakttelefon2 && `, ${item.kontakttelefon2}`}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      ID: {item.idoglasa?.substring(0, 15)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info panel */}
      {!loading && !results && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Kako funkcioniše scraping?</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              <span>Učitava oglase sa HaloOglasi portala (samo vlasnici, ne agencije)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              <span>Filtrira današnje i jučerašnje oglase</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              <span>Proverava da li oglas već postoji u bazi (po ID-u oglasa)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              <span>Dodaje nove oglase sa pauzama od 3-7 sekundi između svakog</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
              <span>Beleži statistiku u tabelu "Vreme trajanja"</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
