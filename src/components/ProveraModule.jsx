import { useState } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Phone, Home, FileSearch, Loader2, AlertCircle, CheckCircle, Archive, X } from 'lucide-react'

export default function ProveraModule() {
  const [telefon, setTelefon] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [ponudeResults, setPonudeResults] = useState([])
  const [traznjeResults, setTraznjeResults] = useState([])

  // Normalizacija telefona za pretragu (ukloni razmake, crtice, +, zagrade)
  const normalizePhone = (phone) => {
    if (!phone) return ''
    return phone.replace(/[^\d]/g, '')
  }

  // Pretraga po telefonu
  const handleSearch = async () => {
    if (!telefon || telefon.length < 3) {
      alert('Unesite najmanje 3 karaktera za pretragu')
      return
    }

    setSearching(true)
    setSearched(false)
    setPonudeResults([])
    setTraznjeResults([])

    try {
      const normalizedPhone = normalizePhone(telefon)
      
      // Generiši različite varijante telefona za pretragu
      const variants = []
      variants.push(`%${normalizedPhone}%`)
      variants.push(`%${telefon}%`)
      
      // Ako počinje sa 381, probaj i bez toga
      if (normalizedPhone.startsWith('381') && normalizedPhone.length > 3) {
        const without381 = normalizedPhone.slice(3)
        variants.push(`%${without381}%`)
        variants.push(`%0${without381}%`)
      }
      
      // Ako počinje sa 0, probaj i sa 381
      if (normalizedPhone.startsWith('0') && normalizedPhone.length > 1) {
        const without0 = normalizedPhone.slice(1)
        variants.push(`%381${without0}%`)
      }

      // ========== PRETRAGA PONUDA ==========
      const ponudePromises = []
      
      // Pretraga po brojtelefona_linija
      for (const pattern of variants) {
        ponudePromises.push(
          supabase
            .from('ponuda')
            .select(`
              id, 
              cena, 
              kvadratura, 
              stsrentaprodaja, 
              stsaktivan, 
              stsstorno,
              brojtelefona_linija,
              kontaktosoba,
              metapodaci,
              vrstaobjekta:idvrstaobjekta(opis),
              opstina:idopstina(opis)
            `)
            .ilike('brojtelefona_linija', pattern)
        )
      }
      
      // Pretraga po metapodaci->vlasnici->tel (JSONB)
      for (const pattern of variants) {
        ponudePromises.push(
          supabase
            .from('ponuda')
            .select(`
              id, 
              cena, 
              kvadratura, 
              stsrentaprodaja, 
              stsaktivan, 
              stsstorno,
              brojtelefona_linija,
              kontaktosoba,
              metapodaci,
              vrstaobjekta:idvrstaobjekta(opis),
              opstina:idopstina(opis)
            `)
            .ilike('metapodaci->>vlasnici', pattern)
        )
      }

      const ponudeResultsArray = await Promise.all(ponudePromises)
      
      // Spoji sve rezultate i ukloni duplikate
      const allPonude = []
      const ponudeIds = new Set()
      
      for (const result of ponudeResultsArray) {
        if (result.data && result.data.length > 0) {
          for (const ponuda of result.data) {
            if (!ponudeIds.has(ponuda.id)) {
              ponudeIds.add(ponuda.id)
              allPonude.push(ponuda)
            }
          }
        }
      }

      setPonudeResults(allPonude)

      // ========== PRETRAGA TRAZNJI ==========
      const traznjePromises = []
      
      // Pretraga po kontakttelefon
      for (const pattern of variants) {
        traznjePromises.push(
          supabase
            .from('traznja')
            .select(`
              id,
              kontaktosoba,
              kontakttelefon,
              stskupaczakupac,
              stsaktivan,
              metapodaci
            `)
            .ilike('kontakttelefon', pattern)
        )
      }
      
      // Pretraga po metapodaci->nalogodavci->brojtel (JSONB)
      for (const pattern of variants) {
        traznjePromises.push(
          supabase
            .from('traznja')
            .select(`
              id,
              kontaktosoba,
              kontakttelefon,
              stskupaczakupac,
              stsaktivan,
              metapodaci
            `)
            .ilike('metapodaci->>nalogodavci', pattern)
        )
      }

      const traznjeResultsArray = await Promise.all(traznjePromises)
      
      // Spoji sve rezultate i ukloni duplikate
      const allTraznje = []
      const traznjeIds = new Set()
      
      for (const result of traznjeResultsArray) {
        if (result.data && result.data.length > 0) {
          for (const traznja of result.data) {
            if (!traznjeIds.has(traznja.id)) {
              traznjeIds.add(traznja.id)
              allTraznje.push(traznja)
            }
          }
        }
      }

      setTraznjeResults(allTraznje)
      setSearched(true)

    } catch (error) {
      console.error('Greška pri pretrazi:', error)
      alert('Greška pri pretrazi: ' + error.message)
    } finally {
      setSearching(false)
    }
  }

  // Dobij ime vlasnika iz ponude
  const getVlasnikInfo = (ponuda) => {
    if (ponuda.kontaktosoba) return ponuda.kontaktosoba
    const vlasnici = ponuda.metapodaci?.vlasnici || []
    if (vlasnici.length > 0) {
      const vlasnik = vlasnici[0]
      const ime = `${vlasnik.ime || ''} ${vlasnik.prezime || ''}`.trim()
      return ime || null
    }
    return null
  }

  // Dobij telefone iz ponude
  const getPonudaTelefoni = (ponuda) => {
    const telefoni = []
    if (ponuda.brojtelefona_linija) {
      telefoni.push(ponuda.brojtelefona_linija)
    }
    const vlasnici = ponuda.metapodaci?.vlasnici || []
    for (const vlasnik of vlasnici) {
      if (vlasnik.tel && !telefoni.includes(vlasnik.tel)) {
        telefoni.push(vlasnik.tel)
      }
    }
    return telefoni
  }

  // Dobij telefone iz traznje
  const getTraznjaTelefoni = (traznja) => {
    const telefoni = []
    if (traznja.kontakttelefon) {
      telefoni.push(traznja.kontakttelefon)
    }
    const nalogodavci = traznja.metapodaci?.nalogodavci || []
    for (const nalogodavac of nalogodavci) {
      if (nalogodavac.brojtel && !telefoni.includes(nalogodavac.brojtel)) {
        telefoni.push(nalogodavac.brojtel)
      }
    }
    return telefoni
  }

  // Dobij ime iz traznje
  const getTraznjaIme = (traznja) => {
    if (traznja.kontaktosoba) return traznja.kontaktosoba
    const nalogodavci = traznja.metapodaci?.nalogodavci || []
    if (nalogodavci.length > 0) {
      const nalogodavac = nalogodavci[0]
      const ime = `${nalogodavac.ime || ''} ${nalogodavac.prezime || ''}`.trim()
      return ime || null
    }
    return null
  }

  // Format cene
  const formatCena = (cena) => {
    if (!cena) return '-'
    return new Intl.NumberFormat('sr-RS').format(cena) + ' €'
  }

  // Reset pretrage
  const handleReset = () => {
    setTelefon('')
    setSearched(false)
    setPonudeResults([])
    setTraznjeResults([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Provera telefona</h2>
          <p className="text-gray-500 text-sm mt-1">Pronađite ponude i tražnje po broju telefona</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Unesite broj telefona za pretragu..."
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 text-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={searching || !telefon}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Pretražujem...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Pretraži
                </>
              )}
            </button>
            {searched && (
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all font-medium"
              >
                <X className="w-5 h-5" />
                Resetuj
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ponude Results */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <Home className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Ponude</h3>
                <span className="ml-auto bg-white/20 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {ponudeResults.length} rezultata
                </span>
              </div>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {ponudeResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Nema podataka u Ponudi</p>
                  <p className="text-gray-400 text-sm mt-1">Telefon nije pronađen u ponudama</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ponudeResults.map((ponuda) => (
                    <div 
                      key={ponuda.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        ponuda.stsaktivan === false || ponuda.stsstorno === true
                          ? 'bg-gray-50 border-gray-200 opacity-70'
                          : 'bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center min-w-[36px] h-6 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                              #{ponuda.id}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              ponuda.stsrentaprodaja === 'prodaja' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {ponuda.stsrentaprodaja === 'prodaja' ? 'Prodaja' : 'Renta'}
                            </span>
                            {(ponuda.stsaktivan === false || ponuda.stsstorno === true) && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-gray-200 text-gray-600">
                                <Archive className="w-3 h-3" />
                                Arhivirano
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-900 font-semibold">
                            {ponuda.vrstaobjekta?.opis || 'Nekretnina'} 
                            {ponuda.kvadratura && ` • ${ponuda.kvadratura}m²`}
                          </p>
                          
                          {ponuda.opstina?.opis && (
                            <p className="text-gray-600 text-sm mt-1">
                              📍 {ponuda.opstina.opis}
                            </p>
                          )}
                          
                          <p className="text-emerald-600 font-bold text-lg mt-2">
                            {formatCena(ponuda.cena)}
                          </p>
                          
                          {getVlasnikInfo(ponuda) && (
                            <p className="text-gray-500 text-sm mt-2">
                              👤 {getVlasnikInfo(ponuda)}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {getPonudaTelefoni(ponuda).map((tel, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                📞 {tel}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {ponuda.stsaktivan !== false && ponuda.stsstorno !== true && (
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Traznje Results */}
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileSearch className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Tražnje</h3>
                <span className="ml-auto bg-white/20 text-white text-sm px-3 py-1 rounded-full font-medium">
                  {traznjeResults.length} rezultata
                </span>
              </div>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {traznjeResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">Nema podataka u Tražnji</p>
                  <p className="text-gray-400 text-sm mt-1">Telefon nije pronađen u tražnjama</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {traznjeResults.map((traznja) => (
                    <div 
                      key={traznja.id} 
                      className={`p-4 rounded-2xl border transition-all ${
                        traznja.stsaktivan === false
                          ? 'bg-gray-50 border-gray-200 opacity-70'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center justify-center min-w-[36px] h-6 bg-gradient-to-r from-gray-900 to-black text-white text-xs font-bold rounded-lg px-2">
                              #{traznja.id}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              traznja.stskupaczakupac === 'kupac' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {traznja.stskupaczakupac === 'kupac' ? 'Kupac' : 'Zakupac'}
                            </span>
                            {traznja.stsaktivan === false && (
                              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-gray-200 text-gray-600">
                                <Archive className="w-3 h-3" />
                                Arhivirano
                              </span>
                            )}
                          </div>
                          
                          {getTraznjaIme(traznja) && (
                            <p className="text-gray-900 font-semibold">
                              👤 {getTraznjaIme(traznja)}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {getTraznjaTelefoni(traznja).map((tel, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                📞 {tel}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {traznja.stsaktivan !== false && (
                          <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!searched && !searching && (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Phone className="w-12 h-12 text-emerald-500" />
          </div>
          <p className="text-gray-900 text-2xl font-bold mb-2">Pretraga po telefonu</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Unesite broj telefona u polje iznad da biste pronašli sve ponude i tražnje povezane sa tim brojem.
          </p>
        </div>
      )}
    </div>
  )
}
