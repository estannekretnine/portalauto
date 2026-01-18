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
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .info-left { text-align: left; }
          .info-right { text-align: right; }
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

  // Funkcija za određivanje tipa lica i vraćanje podataka za kolone 4, 5, 6
  const getLiceData = (nalogodavac, isPonudaFormat) => {
    const stsLice = isPonudaFormat ? nalogodavac?.sts_lice : nalogodavac?.stslice
    const jmbg = isPonudaFormat ? nalogodavac?.jmbg : nalogodavac?.matbrojjmbg
    const pib = nalogodavac?.pib
    
    // Kolona 4: Fizičko lice (ime, prezime, JMBG)
    // Kolona 5: Pravno lice (naziv, PIB)
    // Kolona 6: Preduzetnik (ime, prezime, PIB)
    
    let fizickoLice = ''
    let pravnoLice = ''
    let preduzetnik = ''
    
    const imePrezime = (nalogodavac?.ime || nalogodavac?.prezime) 
      ? `${nalogodavac?.ime || ''} ${nalogodavac?.prezime || ''}`.trim() 
      : ''
    
    if (stsLice === 'fizicko' || stsLice === 'fizičko' || stsLice === 'Fizičko lice' || (!stsLice && jmbg && !pib)) {
      // Fizičko lice
      fizickoLice = imePrezime
      if (jmbg) fizickoLice += `, JMBG: ${jmbg}`
      if (nalogodavac?.adresa) fizickoLice += `, ${nalogodavac.adresa}`
    } else if (stsLice === 'pravno' || stsLice === 'Pravno lice' || (!stsLice && pib && !imePrezime)) {
      // Pravno lice
      pravnoLice = imePrezime || nalogodavac?.naziv || ''
      if (pib) pravnoLice += `, PIB: ${pib}`
      if (nalogodavac?.adresa) pravnoLice += `, ${nalogodavac.adresa}`
    } else if (stsLice === 'preduzetnik' || stsLice === 'Preduzetnik' || (!stsLice && pib && imePrezime)) {
      // Preduzetnik
      preduzetnik = imePrezime
      if (pib) preduzetnik += `, PIB: ${pib}`
      if (nalogodavac?.adresa) preduzetnik += `, ${nalogodavac.adresa}`
    } else {
      // Default - fizičko lice
      fizickoLice = imePrezime
      if (jmbg) fizickoLice += `, JMBG: ${jmbg}`
      if (nalogodavac?.adresa) fizickoLice += `, ${nalogodavac.adresa}`
    }
    
    return { fizickoLice, pravnoLice, preduzetnik }
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
            <p className="text-gray-500">Evidencija o kupcima/zakupcima nepokretnosti</p>
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
                    <h1 className="text-xl font-bold">EVIDENCIJA O KUPCIMA</h1>
                    <h2 className="text-lg font-semibold">ODNOSNO ZAKUPCIMA NEPOKRETNOSTI</h2>
                    <p className="text-sm mt-2">
                      {firmaInfo?.maticnibroj && <>matični broj: {firmaInfo.maticnibroj} &nbsp;&nbsp;&nbsp;</>}
                      {firmaInfo?.pib && <>PIB: {firmaInfo.pib} &nbsp;&nbsp;&nbsp;</>}
                      za <strong>{godina}</strong>. godinu
                    </p>
                  </div>
                  <div className="info-right text-right">
                    <p className="text-sm text-gray-600">Obrazac EOK</p>
                    <p className="text-sm mt-4">Upisan u Registar posrednika pod brojem:</p>
                    <p className="text-sm">{firmaInfo?.brojuregistru || '_______________________'}</p>
                  </div>
                </div>
                <div className="text-right mt-4">
                  <p className="text-sm">Potpis odgovornog lica</p>
                </div>
              </div>

              {/* Tabela */}
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">R.<br/>br</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Datum<br/>unošenja u<br/>evidenciju</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Broj<br/>ugovora</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Fizičko lice<br/>(ime, prezime,<br/>JMBG, adresa)</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Pravno lice<br/>(naziv, PIB,<br/>adresa)</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Preduzetnik<br/>(ime, prezime,<br/>PIB, adresa)</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Vrsta<br/>nepo-<br/>kretnosti</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Površina<br/>nepo-<br/>kretnosti<br/>m²</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Kupo-<br/>prodajna<br/>cena ili<br/>zakupnina<br/>EURO</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Fakturisani<br/>iznos<br/>posredničke<br/>provizije<br/>RSD</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Namena<br/>transakcije</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Primedba</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 text-center text-[10px]">
                    <td className="border border-gray-300 px-1 py-1">1</td>
                    <td className="border border-gray-300 px-1 py-1">2</td>
                    <td className="border border-gray-300 px-1 py-1">3</td>
                    <td className="border border-gray-300 px-1 py-1">4</td>
                    <td className="border border-gray-300 px-1 py-1">5</td>
                    <td className="border border-gray-300 px-1 py-1">6</td>
                    <td className="border border-gray-300 px-1 py-1">7</td>
                    <td className="border border-gray-300 px-1 py-1">8</td>
                    <td className="border border-gray-300 px-1 py-1">9</td>
                    <td className="border border-gray-300 px-1 py-1">10</td>
                    <td className="border border-gray-300 px-1 py-1">11</td>
                    <td className="border border-gray-300 px-1 py-1">12</td>
                  </tr>
                  {podaci.map((item, index) => {
                    const isPonuda = item.tip === 'ponuda'
                    const eop = item.metapodaci?.eop || {}
                    const realizacija = item.metapodaci?.realizacija || {}
                    
                    // Datum ugovora
                    const datumUgovora = isPonuda ? eop.datum_ugovora : eop.datumugovora
                    
                    // Kolona 2: Datum unošenja = datum ugovora
                    const datumUnosenja = datumUgovora

                    // Uzmi nalogodavce
                    const nalogodavci = isPonuda 
                      ? (item.metapodaci?.vlasnici || [])
                      : (item.metapodaci?.nalogodavci || [])
                    
                    // Agregiraj podatke za kolone 4, 5, 6
                    let allFizicko = []
                    let allPravno = []
                    let allPreduzetnik = []
                    
                    nalogodavci.forEach((n, i) => {
                      const { fizickoLice, pravnoLice, preduzetnik } = getLiceData(n, isPonuda)
                      if (fizickoLice) allFizicko.push(`${i + 1}. ${fizickoLice}`)
                      if (pravnoLice) allPravno.push(`${i + 1}. ${pravnoLice}`)
                      if (preduzetnik) allPreduzetnik.push(`${i + 1}. ${preduzetnik}`)
                    })

                    // Vrsta nepokretnosti
                    const vrstaObjekta = isPonuda 
                      ? item.vrstaobjekta?.opis 
                      : realizacija.vrstaobjekta || ''

                    // Površina
                    const povrsina = isPonuda ? item.kvadratura : (realizacija.povrsina || item.kvadraturado)

                    // Cena
                    const cena = isPonuda 
                      ? (realizacija.kupoprodajna_cena || item.cena)
                      : (realizacija.kupoprodajnacena || item.cenado)

                    // Kolona 11: Namena transakcije iz realizacije
                    const namenaTransakcije = isPonuda 
                      ? realizacija.namena_transakcije 
                      : realizacija.namenatransakcije

                    return (
                      <tr key={`${item.tip}-${item.id}`} className={`hover:bg-gray-50 ${!isPonuda ? 'bg-purple-50/30' : ''}`}>
                        <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-2 py-2">{formatDate(datumUnosenja)}</td>
                        <td className="border border-gray-300 px-2 py-2">{item.id}</td>
                        {/* Kolona 4: Fizičko lice */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          {allFizicko.map((f, i) => (
                            <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}>
                              {f}
                            </div>
                          ))}
                        </td>
                        {/* Kolona 5: Pravno lice */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          {allPravno.map((p, i) => (
                            <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}>
                              {p}
                            </div>
                          ))}
                        </td>
                        {/* Kolona 6: Preduzetnik */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          {allPreduzetnik.map((pr, i) => (
                            <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}>
                              {pr}
                            </div>
                          ))}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">{vrstaObjekta}</td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {povrsina ? `${formatNumber(povrsina)}` : ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {cena ? formatNumber(cena) : ''}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {realizacija.provizija ? formatNumber(realizacija.provizija) : ''}
                        </td>
                        {/* Kolona 11: Namena transakcije */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">{namenaTransakcije || ''}</td>
                        <td className="border border-gray-300 px-2 py-2 text-xs">{realizacija.primedba || ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Potpis */}
              <div className="signature mt-8 text-right">
                <div className="signature-line inline-block w-48 border-t border-gray-400 pt-2 text-sm">
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
