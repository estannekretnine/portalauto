import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { FileText, Loader2, Calendar, Filter, Printer } from 'lucide-react'

export default function TransakcijeModule() {
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
      // Dohvati ponude
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

      // Dohvati traznja
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

      // Filtriraj ponude gde je datum transakcije (realizacija.datum_zakljucenja) u izabranoj godini
      const filtriraniPonude = (ponudeData || []).filter(ponuda => {
        const realizacija = ponuda.metapodaci?.realizacija
        if (!realizacija?.zakljucen) return false
        
        if (realizacija.datum_zakljucenja) {
          const godinaTransakcije = new Date(realizacija.datum_zakljucenja).getFullYear()
          return godinaTransakcije === godina
        }
        return false
      }).map(p => ({ ...p, tip: 'ponuda', tipOsobe: p.stsrentaprodaja === 'prodaja' ? 'prodavac' : 'zakupodavac' }))

      // Filtriraj traznja gde je datum transakcije (realizacija.datumzakljucenja) u izabranoj godini
      const filtriraniTraznja = (traznjaData || []).filter(traznja => {
        const realizacija = traznja.metapodaci?.realizacija
        if (!realizacija?.zakljucen) return false
        
        if (realizacija.datumzakljucenja) {
          const godinaTransakcije = new Date(realizacija.datumzakljucenja).getFullYear()
          return godinaTransakcije === godina
        }
        return false
      }).map(t => ({ ...t, tip: 'traznja', tipOsobe: t.stskupaczakupac === 'kupac' ? 'kupac' : 'zakupac' }))

      // Spoji sve podatke
      const sviPodaci = [...filtriraniPonude, ...filtriraniTraznja]

      // Sortiraj po datumu transakcije
      sviPodaci.sort((a, b) => {
        const datumA = a.tip === 'ponuda' 
          ? a.metapodaci?.realizacija?.datum_zakljucenja
          : a.metapodaci?.realizacija?.datumzakljucenja
        const datumB = b.tip === 'ponuda'
          ? b.metapodaci?.realizacija?.datum_zakljucenja
          : b.metapodaci?.realizacija?.datumzakljucenja
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
        <title>Izvršene transakcije ${godina}</title>
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

  // Funkcija za formatiranje nalogodavca sa svim podacima
  const formatNalogodavac = (n, isPonudaFormat) => {
    const podaci = []
    
    // Ime i prezime
    const imePrezime = (n?.ime || n?.prezime) 
      ? `${n?.ime || ''} ${n?.prezime || ''}`.trim() 
      : ''
    if (imePrezime) podaci.push(imePrezime)
    
    // Adresa
    if (n?.adresa) podaci.push(n.adresa)
    
    // JMBG/Matični broj
    const jmbg = isPonudaFormat ? n?.jmbg : n?.matbrojjmbg
    if (jmbg) podaci.push(jmbg)
    
    // Datum rođenja i mesto
    const datumRodjenja = isPonudaFormat ? n?.datum_rodjenja : n?.datumrodjenja
    const mestoRodjenja = isPonudaFormat ? n?.mesto_rodjenja : n?.mestorodjenja
    if (datumRodjenja) podaci.push(formatDate(datumRodjenja))
    if (mestoRodjenja) podaci.push(`ps ${mestoRodjenja}`)
    
    return podaci.join(', ')
  }

  // Funkcija za formatiranje zastupnika
  const formatZastupnik = (z, isPonudaFormat) => {
    if (!z?.ime && !z?.prezime) return ''
    
    const podaci = []
    const imePrezime = `${z?.ime || ''} ${z?.prezime || ''}`.trim()
    if (imePrezime) podaci.push(imePrezime)
    if (z?.adresa) podaci.push(z.adresa)
    
    // JMBG ili LK
    const jmbg = isPonudaFormat ? z?.jmbg : z?.matbrojjmbg
    if (jmbg) podaci.push(jmbg)
    
    const lk = z?.lk || z?.brojlicnekarte
    if (lk) podaci.push(`${lk}, mup rs`)
    
    const datumRodjenja = isPonudaFormat ? z?.datum_rodjenja : z?.datumrodjenja
    const mestoRodjenja = isPonudaFormat ? z?.mesto_rodjenja : z?.mestorodjenja
    if (datumRodjenja) podaci.push(formatDate(datumRodjenja))
    if (mestoRodjenja) podaci.push(`ps ${mestoRodjenja}`)
    
    return podaci.join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Izvršene Transakcije</h2>
            <p className="text-gray-500">Evidencija o izvršenim transakcijama - ako ne postoji sumnja da se radi o pranju novca i finansiranju terorizma</p>
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent min-w-[150px]"
            >
              {godine.map(g => (
                <option key={g} value={g}>{g}. godina</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/25"
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
              <p className="text-gray-500">Nema izvršenih transakcija za {godina}. godinu</p>
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
                    {firmaInfo?.maticnibroj && <p className="text-sm">matični broj: {firmaInfo.maticnibroj}</p>}
                  </div>
                  <div className="text-center flex-1">
                    <h1 className="text-xl font-bold">EVIDENCIJA O IZVRŠENIM TRANSAKCIJAMA</h1>
                    <p className="text-sm mt-2">za <strong>{godina}</strong>. godinu</p>
                    <p className="text-sm mt-1">ako ne postoji sumnja da se radi o pranju novca i finansiranju terorizma</p>
                  </div>
                  <div className="info-right text-right">
                    <p className="text-sm text-gray-600">Upisan u Registar posrednika pod brojem:</p>
                    <p className="text-sm"><strong>{firmaInfo?.brojuregistru || '044'}</strong></p>
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
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Broj<br/>ug.<br/>o posr.</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" colSpan="2">Ime i prezime odnosno poslovno ime i<br/>adresa nalogodavca JMBG PIB<br/>podaci zakonskog zastupnika</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Naziv<br/>opštine na<br/>kojoj se<br/>nepokr.<br/>nalazi</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Adresa<br/>nepokretnosti<br/>(mesto, ul i broj,<br/>katastarska parcela<br/>katastarska opština)</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Vrsta<br/>nepo-<br/>kretnosti<br/>čiji je pro-<br/>met<br/>odnosno<br/>zakup<br/>predmet<br/>posre-<br/>dovanja</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Povr-<br/>šina<br/>nepo-<br/>kretno-<br/>sti čiji<br/>je pro-<br/>met<br/>odnosno<br/>zakup<br/>predmet<br/>posre-<br/>dovanja</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Datum<br/>zaklju-<br/>čenja<br/>pravnog<br/>posla</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Datum<br/>transa-<br/>kcije</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Iznos<br/>transakcije</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Način<br/>izvršenja<br/>transakcije</th>
                    <th className="border border-gray-300 px-2 py-2 text-center" rowSpan="2">Banka<br/>u kojoj je<br/>izvršena<br/>transakcija</th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-center">Nalogodavac:</th>
                    <th className="border border-gray-300 px-2 py-2 text-center">Zakonski zastupnik:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 text-center text-[10px]">
                    <td className="border border-gray-300 px-1 py-1">1</td>
                    <td className="border border-gray-300 px-1 py-1">2</td>
                    <td className="border border-gray-300 px-1 py-1" colSpan="2">3</td>
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
                    const zastupnik = item.metapodaci?.zastupnik || {}
                    
                    // Uzmi nalogodavce
                    const nalogodavci = isPonuda 
                      ? (item.metapodaci?.vlasnici || [])
                      : (item.metapodaci?.nalogodavci || [])
                    
                    // Formatiraj nalogodavce
                    const nalogodavciText = nalogodavci.map((n, i) => {
                      const text = formatNalogodavac(n, isPonuda)
                      return text ? `${i > 0 ? '' : '0:'}vlasnik:${text}` : null
                    }).filter(Boolean).join('\n')

                    // Formatiraj zastupnika
                    const zastupnikText = formatZastupnik(zastupnik, isPonuda)
                    const zastupnikFormatted = zastupnikText ? `0:${zastupnikText}` : ''

                    // Naziv opštine
                    const opstina = isPonuda 
                      ? (realizacija.opstinanekretnisti || item.opstina?.opis || item.lokacija?.opis || '')
                      : (realizacija.opstinanekretnisti || item.opstina?.opis || '')

                    // Adresa nepokretnosti
                    const adresaParts = []
                    if (item.grad?.opis) adresaParts.push(item.grad.opis)
                    if (item.ulica?.opis) adresaParts.push(item.ulica.opis)
                    if (isPonuda) {
                      if (eop.katastarska_parceka) adresaParts.push(`${eop.katastarska_parceka}`)
                      if (eop.kat_opstina) adresaParts.push(`ko ${eop.kat_opstina}`)
                    } else {
                      if (eop.katastarskaparcela) adresaParts.push(`${eop.katastarskaparcela}`)
                      if (eop.katopstina) adresaParts.push(`ko ${eop.katopstina}`)
                    }
                    const adresaNepokretnosti = realizacija.adresanekretnosti || adresaParts.join(', ')

                    // Vrsta nepokretnosti
                    const vrstaObjekta = isPonuda 
                      ? (item.vrstaobjekta?.opis || '')
                      : (realizacija.vrstaobjekta || '')

                    // Površina
                    const povrsina = isPonuda 
                      ? item.kvadratura 
                      : (realizacija.povrsina || item.kvadraturado)

                    // Datum zaključenja pravnog posla
                    const datumUgovora = isPonuda ? eop.datum_ugovora : eop.datumugovora

                    // Datum transakcije
                    const datumTransakcije = isPonuda 
                      ? realizacija.datum_zakljucenja 
                      : realizacija.datumzakljucenja

                    // Iznos transakcije
                    const cena = isPonuda 
                      ? (realizacija.kupoprodajna_cena || item.cena)
                      : (realizacija.kupoprodajnacena || item.cenado)

                    // Način izvršenja - iz realizacije
                    const nacinIzvrsenja = 'preko racuna-keš\nsred.k.nbs'

                    // Banka
                    const banka = realizacija.banka || 'erste banka'

                    return (
                      <tr key={`${item.tip}-${item.id}`} className={`hover:bg-gray-50 ${!isPonuda ? 'bg-amber-50/30' : ''}`}>
                        {/* Kolona 1: R.br */}
                        <td className="border border-gray-300 px-2 py-2 text-center">{index + 1}</td>
                        {/* Kolona 2: Broj ugovora */}
                        <td className="border border-gray-300 px-2 py-2">{item.id}</td>
                        {/* Kolona 3a: Nalogodavac */}
                        <td className="border border-gray-300 px-2 py-2 text-xs whitespace-pre-line">
                          {nalogodavci.map((n, i) => {
                            const text = formatNalogodavac(n, isPonuda)
                            return text ? (
                              <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-gray-200' : ''}>
                                0:vlasnik:{text}
                              </div>
                            ) : null
                          })}
                        </td>
                        {/* Kolona 3b: Zakonski zastupnik */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">
                          {zastupnikFormatted}
                        </td>
                        {/* Kolona 4: Naziv opštine */}
                        <td className="border border-gray-300 px-2 py-2">{opstina}</td>
                        {/* Kolona 5: Adresa nepokretnosti */}
                        <td className="border border-gray-300 px-2 py-2 text-xs">{adresaNepokretnosti}</td>
                        {/* Kolona 6: Vrsta nepokretnosti */}
                        <td className="border border-gray-300 px-2 py-2">{vrstaObjekta}</td>
                        {/* Kolona 7: Površina */}
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {povrsina ? formatNumber(povrsina) : ''}
                        </td>
                        {/* Kolona 8: Datum zaključenja pravnog posla */}
                        <td className="border border-gray-300 px-2 py-2">{formatDate(datumUgovora)}</td>
                        {/* Kolona 9: Datum transakcije */}
                        <td className="border border-gray-300 px-2 py-2">{formatDate(datumTransakcije)}</td>
                        {/* Kolona 10: Iznos transakcije */}
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          {cena ? `${formatNumber(cena)}\neur` : ''}
                        </td>
                        {/* Kolona 11: Način izvršenja */}
                        <td className="border border-gray-300 px-2 py-2 text-xs whitespace-pre-line">{nacinIzvrsenja}</td>
                        {/* Kolona 12: Banka */}
                        <td className="border border-gray-300 px-2 py-2">{banka}</td>
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
