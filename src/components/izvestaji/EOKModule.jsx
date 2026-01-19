import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { FileText, Loader2, Calendar, Filter, Printer } from 'lucide-react'

export default function EOKModule() {
  const [loading, setLoading] = useState(false)
  const [godina, setGodina] = useState(new Date().getFullYear())
  const [podaci, setPodaci] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [firmaInfo, setFirmaInfo] = useState(null)
  const printRef = useRef()

  // Generiši listu godina (zadnjih 10)
  const godine = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  // Učitaj info o firmi pri mount-u
  useEffect(() => {
    const fetchInfo = async () => {
      const { data, error } = await supabase
        .from('info')
        .select('*')
        .limit(1)
        .single()
      
      if (!error && data) {
        setFirmaInfo(data)
      }
    }
    fetchInfo()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Dohvati ponude sa potpisanim ugovorom
      const { data: ponudeData, error: ponudeError } = await supabase
        .from('ponuda')
        .select(`
          id,
          datumkreiranja,
          kvadratura,
          cena,
          stsrentaprodaja,
          metapodaci,
          idvrstaobjekta,
          vrstaobjekta:idvrstaobjekta(opis),
          opstina:idopstina(opis),
          lokacija:idlokacija(opis),
          ulica:idulica(opis),
          grad:idgrada(opis)
        `)
        .eq('stsaktivan', true)

      if (ponudeError) throw ponudeError

      // Dohvati traznja sa potpisanim ugovorom
      const { data: traznjaData, error: traznjaError } = await supabase
        .from('traznja')
        .select(`
          id,
          datumkreiranja,
          kvadraturado,
          cenado,
          stskupaczakupac,
          kontaktosoba,
          kontakttelefon,
          metapodaci,
          opstina:idopstina(opis),
          lokacija:idlokacija(opis),
          ulica:idulica(opis),
          grad:idgrada(opis)
        `)
        .eq('stsaktivan', true)

      if (traznjaError) throw traznjaError

      // Filtriraj ponude sa potpisanim ugovorom u izabranoj godini
      const filtriraniPonude = (ponudeData || []).filter(ponuda => {
        const eop = ponuda.metapodaci?.eop
        if (!eop?.sts_ugovor_potpisan) return false
        
        if (eop.datum_ugovora) {
          const godinaUgovora = new Date(eop.datum_ugovora).getFullYear()
          return godinaUgovora === godina
        }
        
        const godinaKreiranja = new Date(ponuda.datumkreiranja).getFullYear()
        return godinaKreiranja === godina
      }).map(p => ({ ...p, tip: 'ponuda', tipOsobe: p.stsrentaprodaja === 'prodaja' ? 'prodavac' : 'zakupodavac' }))

      // Filtriraj traznja sa potpisanim ugovorom u izabranoj godini
      const filtriraniTraznja = (traznjaData || []).filter(traznja => {
        const eop = traznja.metapodaci?.eop
        if (!eop?.stsugovorpotpisan) return false
        
        if (eop.datumugovora) {
          const godinaUgovora = new Date(eop.datumugovora).getFullYear()
          return godinaUgovora === godina
        }
        
        const godinaKreiranja = new Date(traznja.datumkreiranja).getFullYear()
        return godinaKreiranja === godina
      }).map(t => ({ ...t, tip: 'traznja', tipOsobe: t.stskupaczakupac === 'kupac' ? 'kupac' : 'zakupac' }))

      // Spoji sve podatke
      const sviPodaci = [...filtriraniPonude, ...filtriraniTraznja]

      // Sortiraj po datumu ugovora
      sviPodaci.sort((a, b) => {
        const datumA = a.tip === 'ponuda' 
          ? (a.metapodaci?.eop?.datum_ugovora || a.datumkreiranja)
          : (a.metapodaci?.eop?.datumugovora || a.datumkreiranja)
        const datumB = b.tip === 'ponuda'
          ? (b.metapodaci?.eop?.datum_ugovora || b.datumkreiranja)
          : (b.metapodaci?.eop?.datumugovora || b.datumkreiranja)
        return new Date(datumA) - new Date(datumB)
      })

      setPodaci(sviPodaci)
      setShowReport(true)
    } catch (error) {
      console.error('Greška pri učitavanju:', error)
      alert('Greška pri učitavanju podataka: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EOK Izveštaj ${godina}</title>
        <style>
          @page { size: landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 9px; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h1 { font-size: 14px; margin: 0; }
          .header h2 { font-size: 12px; margin: 5px 0; }
          .header p { margin: 3px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: top; }
          th { background-color: #f0f0f0; font-size: 8px; }
          td { font-size: 8px; }
          .signature { margin-top: 30px; text-align: right; }
          .signature-line { width: 200px; border-top: 1px solid #000; margin-left: auto; padding-top: 5px; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('sr-RS')
  }

  const formatNumber = (num) => {
    if (!num) return ''
    return new Intl.NumberFormat('sr-RS').format(num)
  }

  // Funkcija za formatiranje podataka o licu sa svim detaljima
  const formatLiceData = (n, isPonudaFormat) => {
    const podaci = []
    
    // Ime i prezime / Naziv
    const imePrezime = (n?.ime || n?.prezime) 
      ? `${n?.ime || ''} ${n?.prezime || ''}`.trim() 
      : ''
    if (imePrezime) podaci.push(imePrezime)
    
    // Adresa
    if (n?.adresa) podaci.push(n.adresa)
    
    // JMBG/Matični broj
    const jmbg = isPonudaFormat ? n?.jmbg : n?.matbrojjmbg
    if (jmbg) podaci.push(`JMBG: ${jmbg}`)
    
    // PIB
    if (n?.pib) podaci.push(`PIB: ${n.pib}`)
    
    // LK
    const lk = isPonudaFormat ? n?.lk : n?.lk
    if (lk) podaci.push(`LK: ${lk}, mup rs`)
    
    // Identifikaciona isprava
    const identIsprava = isPonudaFormat ? n?.ident_isprava : n?.identisprava
    if (identIsprava) podaci.push(`ID: ${identIsprava}`)
    
    // Datum rođenja
    const datumRodjenja = isPonudaFormat ? n?.datum_rodjenja : n?.datumrodjenja
    if (datumRodjenja) podaci.push(formatDate(datumRodjenja))
    
    // Mesto rođenja
    const mestoRodjenja = isPonudaFormat ? n?.mesto_rodjenja : n?.mestorodjenja
    if (mestoRodjenja) podaci.push(`ps ${mestoRodjenja}`)
    
    return podaci.join(', ')
  }

  // Funkcija za određivanje tipa lica
  const getLiceType = (n, isPonudaFormat) => {
    const stsLice = isPonudaFormat ? n?.sts_lice : n?.stslice
    const jmbg = isPonudaFormat ? n?.jmbg : n?.matbrojjmbg
    const pib = n?.pib
    const imePrezime = (n?.ime || n?.prezime) ? `${n?.ime || ''} ${n?.prezime || ''}`.trim() : ''
    
    // Određivanje tipa na osnovu sts_lice ili podataka
    if (stsLice === 'pravno' || stsLice === 'Pravno lice' || (!stsLice && pib && !imePrezime)) {
      return 'pravno'
    } else if (stsLice === 'preduzetnik' || stsLice === 'Preduzetnik') {
      return 'preduzetnik'
    } else {
      // Default - fizičko lice
      return 'fizicko'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">EOK Izveštaj</h2>
            <p className="text-gray-500">Evidencija u skladu sa zakonom o SPN/FT o strankama, poslovnim odnosima i transakcijama</p>
          </div>
        </div>

        {/* Izbor godine */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Izaberi godinu
            </label>
            <select
              value={godina}
              onChange={(e) => setGodina(parseInt(e.target.value))}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[150px]"
            >
              {godine.map(g => (
                <option key={g} value={g}>{g}. godina</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Učitavam...
              </>
            ) : (
              <>
                <Filter className="w-5 h-5" />
                Generiši izveštaj
              </>
            )}
          </button>

          {showReport && podaci.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Printer className="w-5 h-5" />
              Štampaj
            </button>
          )}
        </div>
      </div>

      {/* Izveštaj */}
      {showReport && (
        <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
          {podaci.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
              <p className="text-gray-500">Nema ugovora za {godina}. godinu</p>
            </div>
          ) : (
            <div ref={printRef}>
              {/* Zaglavlje izveštaja */}
              <div className="header mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="info-left text-left">
                    <p className="text-sm text-gray-600"><strong>Podaci o posredniku:</strong></p>
                    <p className="text-sm">{firmaInfo?.Nazivfirme || ''}</p>
                    <p className="text-sm">{firmaInfo?.adresa || ''}</p>
                    {firmaInfo?.pib && <p className="text-sm">PIB: {firmaInfo.pib}</p>}
                  </div>
                  <div className="text-center flex-1">
                    <h1 className="text-xl font-bold">EVIDENCIJA U SKLADU SA ZAKONOM O SPN/FT</h1>
                    <h2 className="text-lg font-semibold">O STRANKAMA, POSLOVNIM ODNOSIMA I TRANSAKCIJAMA</h2>
                    <p className="text-sm mt-2">
                      {firmaInfo?.maticnibroj && <>matični broj: {firmaInfo.maticnibroj} &nbsp;&nbsp;&nbsp;</>}
                      za <strong>{godina}</strong>. godinu
                    </p>
                  </div>
                  <div className="info-right text-right">
                    <p className="text-sm text-gray-600">Upisan u Registar posrednika pod brojem:</p>
                    <p className="text-sm">{firmaInfo?.brojuregistru || '_______________________'}</p>
                  </div>
                </div>
                <div className="text-right mt-4">
                  <p className="text-sm">Potpis odgovornog lica</p>
                </div>
              </div>

              {/* Tabela */}
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">R.<br/>br</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Datum<br/>uspostavljanja<br/>posl. odnosa</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Broj<br/>ug.<br/>o posr.</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci o<br/>pravnom licu<br/>koje vrši<br/>transakciju<br/>(ime, adresa,<br/>MB, PIB)</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci o<br/>zastupniku<br/>ili punomoćniku<br/>PL ili drugog<br/>lica gradj.prava</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci o<br/>fizičkom licu<br/>ili punomoćniku<br/>koje vrši<br/>transakciju</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci o<br/>preduzetniku<br/>(poslovno ime,<br/>sedište,<br/>MB,PIB)</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Svrha<br/>i namena<br/>poslovnog<br/>odnosa</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Datum<br/>izvršenja<br/>transakcije</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Iznos<br/>transakcije<br/>i valuta</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Namena transakcije<br/>ime i prezime i prebivalište<br/>odnosno poslovno ime<br/>i sedište lica kome je<br/>namenjena</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Način<br/>vršenja<br/>transakcije</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci<br/>info. o<br/>poreklu<br/>imovine</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Razlozi za<br/>sumnju da<br/>se radi o<br/>pranju novca</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Podaci<br/>o stvarnom<br/>vlasniku<br/>stranke</th>
                    <th className="border border-gray-300 px-1 py-1 text-center text-[8px]">Naziv<br/>lica<br/>građanskog<br/>prava</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 text-center text-[8px]">
                    <td className="border border-gray-300 px-1 py-0.5">1</td>
                    <td className="border border-gray-300 px-1 py-0.5">2</td>
                    <td className="border border-gray-300 px-1 py-0.5">3</td>
                    <td className="border border-gray-300 px-1 py-0.5">4</td>
                    <td className="border border-gray-300 px-1 py-0.5">5</td>
                    <td className="border border-gray-300 px-1 py-0.5">6</td>
                    <td className="border border-gray-300 px-1 py-0.5">7</td>
                    <td className="border border-gray-300 px-1 py-0.5">8</td>
                    <td className="border border-gray-300 px-1 py-0.5">9</td>
                    <td className="border border-gray-300 px-1 py-0.5">10</td>
                    <td className="border border-gray-300 px-1 py-0.5">11</td>
                    <td className="border border-gray-300 px-1 py-0.5">12</td>
                    <td className="border border-gray-300 px-1 py-0.5">13</td>
                    <td className="border border-gray-300 px-1 py-0.5">14</td>
                    <td className="border border-gray-300 px-1 py-0.5">15</td>
                    <td className="border border-gray-300 px-1 py-0.5">16</td>
                  </tr>
                  {podaci.map((item, index) => {
                    const isPonuda = item.tip === 'ponuda'
                    const eop = item.metapodaci?.eop || {}
                    const realizacija = item.metapodaci?.realizacija || {}
                    const zastupnik = item.metapodaci?.zastupnik || {}
                    
                    // Datum ugovora
                    const datumUgovora = isPonuda ? eop.datum_ugovora : eop.datumugovora
                    
                    // Uzmi nalogodavce
                    const nalogodavci = isPonuda 
                      ? (item.metapodaci?.vlasnici || [])
                      : (item.metapodaci?.nalogodavci || [])
                    
                    // Kolone 4, 6, 7 - u zavisnosti od tipa lica
                    let pravnaLica = []
                    let fizickaLica = []
                    let preduzetnici = []
                    
                    nalogodavci.forEach((n, i) => {
                      const tipLica = getLiceType(n, isPonuda)
                      const podaciLica = formatLiceData(n, isPonuda)
                      
                      if (tipLica === 'pravno') {
                        pravnaLica.push(`${podaciLica}`)
                      } else if (tipLica === 'preduzetnik') {
                        preduzetnici.push(`${podaciLica}`)
                      } else {
                        fizickaLica.push(`Ovlasnik: ${podaciLica}`)
                      }
                    })

                    // Kolona 5 - Zastupnik
                    let zastupnikPodaci = ''
                    if (zastupnik?.ime || zastupnik?.prezime) {
                      zastupnikPodaci = formatLiceData(zastupnik, isPonuda)
                    }

                    // Svrha i namena poslovnog odnosa (kolona 8)
                    const svrha = isPonuda 
                      ? (item.stsrentaprodaja === 'prodaja' ? 'prodaja' : 'zakup')
                      : (item.stskupaczakupac === 'kupac' ? 'kupovina' : 'zakup')

                    // Datum izvršenja transakcije (kolona 9)
                    const datumIzvrsenja = isPonuda 
                      ? realizacija.datum_zakljucenja 
                      : realizacija.datumzakljucenja

                    // Iznos transakcije (kolona 10)
                    const cena = isPonuda 
                      ? (realizacija.kupoprodajna_cena || item.cena)
                      : (realizacija.kupoprodajnacena || item.cenado)

                    // Kolona 11: Namena transakcije iz realizacije
                    const namenaTransakcije = isPonuda 
                      ? realizacija.namena_transakcije 
                      : realizacija.namenatransakcije

                    // Kolona 12: Način vršenja transakcije
                    const nacinVrsenja = realizacija.zakljucen ? 'kupovina' : ''

                    // Kolona 13: Poreklo imovine
                    const porekloImovine = nalogodavci.length > 0 
                      ? (isPonuda ? nalogodavci[0]?.poreklo_imovine : nalogodavci[0]?.porekloimovine)
                      : ''

                    // Kolona 14: Sumnja na pranje novca
                    const sumnjaPranjeNovca = nalogodavci.some(n => 
                      isPonuda ? n?.sumnja_pranje_novca : n?.sumnjapranjenovca
                    ) ? 'postoji sumnja' : 'ne postoji sumnja'

                    // Kolona 15: Stvarni vlasnik stranke
                    const stvarniVlasnik = nalogodavci.some(n => n?.stvarnivlasnikstranke) 
                      ? 'nasledjivanje' 
                      : ''

                    return (
                      <tr key={`${item.tip}-${item.id}`} className={`hover:bg-gray-50 ${!isPonuda ? 'bg-purple-50/30' : ''}`}>
                        <td className="border border-gray-300 px-1 py-1 text-center text-[9px]">{index + 1}</td>
                        {/* Kolona 2: Datum uspostavljanja */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{formatDate(datumUgovora)}</td>
                        {/* Kolona 3: Broj ugovora */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{item.id}</td>
                        {/* Kolona 4: Pravno lice */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">
                          {pravnaLica.map((p, i) => (
                            <div key={i} className={i > 0 ? 'mt-1 pt-1 border-t border-gray-200' : ''}>
                              {p}
                            </div>
                          ))}
                        </td>
                        {/* Kolona 5: Zastupnik */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{zastupnikPodaci}</td>
                        {/* Kolona 6: Fizičko lice */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">
                          {fizickaLica.map((f, i) => (
                            <div key={i} className={i > 0 ? 'mt-1 pt-1 border-t border-gray-200' : ''}>
                              {f}
                            </div>
                          ))}
                        </td>
                        {/* Kolona 7: Preduzetnik */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">
                          {preduzetnici.map((pr, i) => (
                            <div key={i} className={i > 0 ? 'mt-1 pt-1 border-t border-gray-200' : ''}>
                              {pr}
                            </div>
                          ))}
                        </td>
                        {/* Kolona 8: Svrha i namena */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{svrha}</td>
                        {/* Kolona 9: Datum izvršenja */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{formatDate(datumIzvrsenja)}</td>
                        {/* Kolona 10: Iznos transakcije */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">
                          {cena ? `${formatNumber(cena)} E` : ''}
                        </td>
                        {/* Kolona 11: Namena transakcije */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{namenaTransakcije || ''}</td>
                        {/* Kolona 12: Način vršenja */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{nacinVrsenja}</td>
                        {/* Kolona 13: Poreklo imovine */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{porekloImovine || ''}</td>
                        {/* Kolona 14: Sumnja pranje novca */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{sumnjaPranjeNovca}</td>
                        {/* Kolona 15: Stvarni vlasnik */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]">{stvarniVlasnik}</td>
                        {/* Kolona 16: Naziv lica građanskog prava */}
                        <td className="border border-gray-300 px-1 py-1 text-[9px]"></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Potpis */}
              <div className="signature mt-6 text-right">
                <div className="signature-line inline-block w-40 border-t border-gray-400 pt-2 text-xs">
                  Potpis odgovornog lica
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
