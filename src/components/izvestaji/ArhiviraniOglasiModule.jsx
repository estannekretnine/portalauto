import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { FileText, Loader2, Calendar, Filter, Printer, Archive, TrendingUp, TrendingDown, Award, X } from 'lucide-react'

export default function ArhiviraniOglasiModule() {
  const [loading, setLoading] = useState(false)
  const [podaci, setPodaci] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [firmaInfo, setFirmaInfo] = useState(null)
  const printRef = useRef()

  // Period od-do
  const [datumOd, setDatumOd] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [datumDo, setDatumDo] = useState(() => new Date().toISOString().split('T')[0])

  // Razlozi arhiviranja - isti kao u PonudeModule
  const razloziArhiviranja = [
    { id: 'prodat', label: 'Prodat', description: 'Samostalno ili preko druge agencije', icon: '🏠', color: 'blue' },
    { id: 'prodat-agencija', label: 'Prodat - Agencija', description: 'Prodat preko naše agencije', icon: '🏆', color: 'green' },
    { id: 'povucen', label: 'Povučen', description: 'Vlasnik povukao ponudu', icon: '↩️', color: 'orange' },
    { id: 'odustali', label: 'Odustali', description: 'Kupac/vlasnik odustao', icon: '🚫', color: 'red' },
    { id: 'nisu dobri papiri', label: 'Nisu dobri papiri', description: 'Problem sa dokumentacijom', icon: '📄', color: 'amber' },
    { id: 'legalizacija', label: 'Legalizacija', description: 'Potrebna legalizacija objekta', icon: '🏗️', color: 'gray' },
    { id: 'pogresan broj', label: 'Pogrešan broj', description: 'Neispravan kontakt telefon', icon: '📱', color: 'gray' },
    { id: 'nepostojeci broj', label: 'Nepostojeći broj', description: 'Broj telefona ne postoji', icon: '❌', color: 'gray' },
    { id: 'nedostupan', label: 'Nedostupan', description: 'Vlasnik nedostupan', icon: '🔇', color: 'gray' },
    { id: 'drugo', label: 'Drugo', description: 'Ostali razlozi', icon: '📝', color: 'gray' }
  ]

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
      // Dohvati arhivirane ponude u periodu
      const { data: ponudeData, error: ponudeError } = await supabase
        .from('ponuda')
        .select(`
          id,
          datumkreiranja,
          datumbrisanja,
          razlogbrisanja,
          kvadratura,
          cena,
          stsrentaprodaja,
          idvrstaobjekta,
          vrstaobjekta:idvrstaobjekta(opis),
          opstina:idopstina(opis),
          lokacija:idlokacija(opis),
          ulica:idulica(opis),
          grad:idgrada(opis)
        `)
        .eq('stsaktivan', false)
        .gte('datumbrisanja', datumOd)
        .lte('datumbrisanja', datumDo)
        .order('datumbrisanja', { ascending: false })

      if (ponudeError) throw ponudeError

      setPodaci(ponudeData || [])
      setShowReport(true)
    } catch (error) {
      console.error('Greška pri učitavanju:', error)
      alert('Greška pri učitavanju podataka: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Grupiši podatke po razlogu arhiviranja
  const grupiraniPodaci = razloziArhiviranja.map(razlog => {
    const oglasi = podaci.filter(p => p.razlogbrisanja === razlog.id)
    return {
      ...razlog,
      oglasi,
      broj: oglasi.length
    }
  })

  // Dodaj grupu za one bez razloga
  const bezRazloga = podaci.filter(p => !p.razlogbrisanja || !razloziArhiviranja.find(r => r.id === p.razlogbrisanja))
  if (bezRazloga.length > 0) {
    grupiraniPodaci.push({
      id: 'bez-razloga',
      label: 'Bez razloga',
      description: 'Arhivirano bez navedenog razloga',
      icon: '❓',
      color: 'gray',
      oglasi: bezRazloga,
      broj: bezRazloga.length
    })
  }

  // Statistika
  const ukupnoArhivirano = podaci.length
  const prodatoAgencija = podaci.filter(p => p.razlogbrisanja === 'prodat-agencija').length
  const prodato = podaci.filter(p => p.razlogbrisanja === 'prodat').length
  const ukupnoProdato = prodatoAgencija + prodato

  const handlePrint = () => {
    const printContent = printRef.current
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analiza arhiviranih oglasa ${datumOd} - ${datumDo}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 16px; margin: 0; }
          .header h2 { font-size: 14px; margin: 5px 0; }
          .header p { margin: 3px 0; font-size: 11px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          .summary-item .number { font-size: 24px; font-weight: bold; }
          .summary-item .label { font-size: 10px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #f0f0f0; font-size: 10px; }
          td { font-size: 10px; }
          .section { margin-top: 20px; page-break-inside: avoid; }
          .section-title { font-size: 13px; font-weight: bold; margin-bottom: 10px; padding: 8px; background: #e5e5e5; border-radius: 4px; }
          .no-print { display: none; }
          @media print {
            .no-print { display: none !important; }
          }
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

  const getColorClass = (color) => {
    const colors = {
      green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      amber: 'bg-amber-100 text-amber-800 border-amber-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[color] || colors.gray
  }

  const getBgColorClass = (color) => {
    const colors = {
      green: 'from-emerald-500 to-emerald-600',
      blue: 'from-blue-500 to-blue-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      amber: 'from-amber-500 to-amber-600',
      gray: 'from-gray-500 to-gray-600'
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Archive className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analiza arhiviranih oglasa</h2>
            <p className="text-gray-500">Pregled arhiviranih oglasa po razlogu arhiviranja</p>
          </div>
        </div>

        {/* Izbor perioda */}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Datum od
            </label>
            <input
              type="date"
              value={datumOd}
              onChange={(e) => setDatumOd(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Datum do
            </label>
            <input
              type="date"
              value={datumDo}
              onChange={(e) => setDatumDo(e.target.value)}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
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
        <div className="space-y-6">
          {podaci.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema arhiviranih oglasa u periodu od {formatDate(datumOd)} do {formatDate(datumDo)}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistička kartica - prikazuje se samo na ekranu */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Archive className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{ukupnoArhivirano}</p>
                      <p className="text-sm text-gray-500">Ukupno arhivirano</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-emerald-600">{prodatoAgencija}</p>
                      <p className="text-sm text-gray-500">Prodato - Agencija</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{prodato}</p>
                      <p className="text-sm text-gray-500">Prodato - Ostalo</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-600">{ukupnoArhivirano - ukupnoProdato}</p>
                      <p className="text-sm text-gray-500">Ostali razlozi</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prikaz po razlozima */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Razlozi arhiviranja</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {grupiraniPodaci.filter(g => g.broj > 0).map((grupa) => (
                    <div
                      key={grupa.id}
                      className={`p-4 rounded-xl border-2 ${getColorClass(grupa.color)}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{grupa.icon}</span>
                        <span className="font-semibold text-sm">{grupa.label}</span>
                      </div>
                      <p className="text-3xl font-bold">{grupa.broj}</p>
                      <p className="text-xs opacity-75">
                        {ukupnoArhivirano > 0 ? ((grupa.broj / ukupnoArhivirano) * 100).toFixed(1) : 0}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Print verzija */}
              <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
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
                        <h1 className="text-xl font-bold">ANALIZA ARHIVIRANIH OGLASA</h1>
                        <p className="text-sm mt-2">Period: <strong>{formatDate(datumOd)}</strong> - <strong>{formatDate(datumDo)}</strong></p>
                      </div>
                      <div className="info-right text-right">
                        <p className="text-sm text-gray-600">Datum izveštaja:</p>
                        <p className="text-sm"><strong>{formatDate(new Date().toISOString())}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Sumarni podaci */}
                  <div className="summary mb-6 p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3">Sumarni podaci</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-purple-600">{ukupnoArhivirano}</p>
                        <p className="text-xs text-gray-500">Ukupno arhivirano</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-emerald-600">{prodatoAgencija}</p>
                        <p className="text-xs text-gray-500">Prodato - Agencija</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-blue-600">{prodato}</p>
                        <p className="text-xs text-gray-500">Prodato - Ostalo</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        <p className="text-2xl font-bold text-amber-600">{ukupnoArhivirano - ukupnoProdato}</p>
                        <p className="text-xs text-gray-500">Ostali razlozi</p>
                      </div>
                    </div>
                  </div>

                  {/* Tabela po razlozima */}
                  <table className="w-full border-collapse text-xs mb-6">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left">Razlog arhiviranja</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Broj oglasa</th>
                        <th className="border border-gray-300 px-3 py-2 text-center">Procenat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupiraniPodaci.filter(g => g.broj > 0).sort((a, b) => b.broj - a.broj).map((grupa) => (
                        <tr key={grupa.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span>{grupa.icon}</span>
                              <span className="font-medium">{grupa.label}</span>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-center font-bold">{grupa.broj}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center">
                            {ukupnoArhivirano > 0 ? ((grupa.broj / ukupnoArhivirano) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-bold">
                        <td className="border border-gray-300 px-3 py-2">UKUPNO</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">{ukupnoArhivirano}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center">100%</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Detaljna tabela svih oglasa */}
                  <div className="section">
                    <h3 className="section-title font-bold text-gray-900 mb-3 p-2 bg-gray-100 rounded">
                      Detaljan pregled arhiviranih oglasa
                    </h3>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-2 text-center">R.br</th>
                          <th className="border border-gray-300 px-2 py-2 text-center">ID</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">Vrsta objekta</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">Lokacija</th>
                          <th className="border border-gray-300 px-2 py-2 text-center">m²</th>
                          <th className="border border-gray-300 px-2 py-2 text-right">Cena</th>
                          <th className="border border-gray-300 px-2 py-2 text-center">Tip</th>
                          <th className="border border-gray-300 px-2 py-2 text-center">Datum arhiv.</th>
                          <th className="border border-gray-300 px-2 py-2 text-left">Razlog</th>
                        </tr>
                      </thead>
                      <tbody>
                        {podaci.map((oglas, index) => {
                          const razlog = razloziArhiviranja.find(r => r.id === oglas.razlogbrisanja)
                          const lokacija = [
                            oglas.grad?.opis,
                            oglas.opstina?.opis,
                            oglas.lokacija?.opis,
                            oglas.ulica?.opis
                          ].filter(Boolean).join(', ')

                          return (
                            <tr key={oglas.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{oglas.id}</td>
                              <td className="border border-gray-300 px-2 py-1">{oglas.vrstaobjekta?.opis || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-xs">{lokacija || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{oglas.kvadratura || '-'}</td>
                              <td className="border border-gray-300 px-2 py-1 text-right">
                                {oglas.cena ? `${formatNumber(oglas.cena)} €` : '-'}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-center">
                                {oglas.stsrentaprodaja === 'prodaja' ? 'P' : 'R'}
                              </td>
                              <td className="border border-gray-300 px-2 py-1 text-center">{formatDate(oglas.datumbrisanja)}</td>
                              <td className="border border-gray-300 px-2 py-1">
                                {razlog ? `${razlog.icon} ${razlog.label}` : (oglas.razlogbrisanja || 'Nije navedeno')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Potpis */}
                  <div className="mt-8 text-right">
                    <div className="inline-block w-48 border-t border-gray-400 pt-2 text-sm">
                      Potpis odgovornog lica
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
