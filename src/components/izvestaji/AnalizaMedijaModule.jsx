import { useState, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { Tv, Loader2, Calendar, Filter, Printer, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function AnalizaMedijaModule() {
  const [loading, setLoading] = useState(false)
  const [datumOd, setDatumOd] = useState('')
  const [datumDo, setDatumDo] = useState('')
  const [podaci, setPodaci] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [showAnaliticki, setShowAnaliticki] = useState(false)
  const printRef = useRef()

  // Status poziva opcije sa bojama
  const statusOptions = [
    { value: 'novikupac', label: 'Novi kupac', color: 'bg-emerald-100 text-emerald-800', chartColor: 'rgba(16, 185, 129, 0.8)' },
    { value: 'starikupac', label: 'Stari kupac', color: 'bg-blue-100 text-blue-800', chartColor: 'rgba(59, 130, 246, 0.8)' },
    { value: 'prodavac', label: 'Prodavac', color: 'bg-amber-100 text-amber-800', chartColor: 'rgba(245, 158, 11, 0.8)' },
    { value: 'agencija', label: 'Agencija', color: 'bg-purple-100 text-purple-800', chartColor: 'rgba(139, 92, 246, 0.8)' },
    { value: 'ostalo', label: 'Ostalo', color: 'bg-gray-100 text-gray-800', chartColor: 'rgba(107, 114, 128, 0.8)' }
  ]

  const fetchData = async () => {
    if (!datumOd || !datumDo) {
      alert('Molimo izaberite period (datum od i datum do)')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pozivi')
        .select(`
          id,
          datumkreiranja,
          stspoziv,
          idmedij,
          mediji:idmedij (id, opis)
        `)
        .gte('datumkreiranja', datumOd)
        .lte('datumkreiranja', datumDo + 'T23:59:59')
        .order('datumkreiranja', { ascending: false })

      if (error) throw error

      const poziviData = Array.isArray(data) ? data : []

      // Grupiši po medijima i statusu
      const medijStats = {}

      poziviData.forEach(poziv => {
        const medijNaziv = poziv.mediji?.opis || 'Nije navedeno'
        const status = poziv.stspoziv || 'ostalo'

        if (!medijStats[medijNaziv]) {
          medijStats[medijNaziv] = {
            naziv: medijNaziv,
            novikupac: 0,
            starikupac: 0,
            prodavac: 0,
            agencija: 0,
            ostalo: 0,
            ukupno: 0
          }
        }

        if (medijStats[medijNaziv][status] !== undefined) {
          medijStats[medijNaziv][status]++
        } else {
          medijStats[medijNaziv].ostalo++
        }
        medijStats[medijNaziv].ukupno++
      })

      // Sortiraj po ukupnom broju poziva (opadajuće)
      const rezultat = Object.values(medijStats).sort((a, b) => b.ukupno - a.ukupno)

      setPodaci(rezultat)
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
        <title>Analiza medija - pozivi</title>
        <style>
          @page { size: landscape; margin: 15mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; margin: 0; }
          .header p { margin: 5px 0; font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; }
          th { background-color: #f0f0f0; font-weight: bold; }
          .total-row { background-color: #e0e0e0; font-weight: bold; }
          .medij-name { text-align: left; }
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
    return new Date(dateStr).toLocaleDateString('sr-RS')
  }

  // Izračunaj ukupne vrednosti
  const ukupno = podaci.reduce((acc, item) => ({
    novikupac: acc.novikupac + item.novikupac,
    starikupac: acc.starikupac + item.starikupac,
    prodavac: acc.prodavac + item.prodavac,
    agencija: acc.agencija + item.agencija,
    ostalo: acc.ostalo + item.ostalo,
    ukupno: acc.ukupno + item.ukupno
  }), { novikupac: 0, starikupac: 0, prodavac: 0, agencija: 0, ostalo: 0, ukupno: 0 })

  // Bar chart - horizontalni za medije
  const barChartData = {
    labels: podaci.slice(0, 10).map(p => p.naziv.length > 20 ? p.naziv.substring(0, 20) + '...' : p.naziv),
    datasets: statusOptions.map(status => ({
      label: status.label,
      data: podaci.slice(0, 10).map(p => p[status.value] || 0),
      backgroundColor: status.chartColor,
      borderWidth: 1,
    }))
  }

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 10 medija po broju poziva',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      },
      y: {
        stacked: true,
      }
    }
  }

  // Doughnut chart za ukupnu distribuciju po statusu
  const doughnutChartData = {
    labels: statusOptions.map(s => s.label),
    datasets: [{
      data: statusOptions.map(s => ukupno[s.value] || 0),
      backgroundColor: statusOptions.map(s => s.chartColor),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribucija po statusu (svi mediji)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    }
  }

  // Medij boje za tabelu
  const medijColors = [
    'bg-blue-50', 'bg-emerald-50', 'bg-amber-50', 'bg-purple-50', 'bg-pink-50',
    'bg-teal-50', 'bg-orange-50', 'bg-indigo-50', 'bg-green-50', 'bg-gray-50'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Tv className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analiza Medija - Pozivi</h2>
            <p className="text-gray-500">Pregled poziva grupisanih po medijima i statusu kupca</p>
          </div>
        </div>

        {/* Filter period od-do */}
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[180px]"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[180px]"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/25"
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
        <>
          {/* Statistika kartice */}
          {podaci.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="text-sm text-gray-500 mb-1">Ukupno poziva</div>
                <div className="text-3xl font-bold text-gray-900">{ukupno.ukupno}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl shadow-lg p-4 border border-emerald-200">
                <div className="text-sm text-emerald-600 mb-1">Novi kupci</div>
                <div className="text-3xl font-bold text-emerald-700">{ukupno.novikupac}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">Stari kupci</div>
                <div className="text-3xl font-bold text-blue-700">{ukupno.starikupac}</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl shadow-lg p-4 border border-amber-200">
                <div className="text-sm text-amber-600 mb-1">Prodavci</div>
                <div className="text-3xl font-bold text-amber-700">{ukupno.prodavac}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">Agencije</div>
                <div className="text-3xl font-bold text-purple-700">{ukupno.agencija}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Ostalo</div>
                <div className="text-3xl font-bold text-gray-700">{ukupno.ostalo}</div>
              </div>
            </div>
          )}

          {/* Grafikoni */}
          {podaci.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[400px]">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[400px]">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
            {podaci.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tv className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema poziva u izabranom periodu</p>
              </div>
            ) : (
              <div ref={printRef}>
                {/* Zaglavlje izveštaja */}
                <div className="header mb-6 text-center">
                  <h1 className="text-xl font-bold">ANALIZA MEDIJA - POZIVI</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {formatDate(datumOd)} - {formatDate(datumDo)}
                  </p>
                </div>

                {/* Tabela */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                      <th className="border border-purple-400 px-4 py-3 text-left">R.br.</th>
                      <th className="border border-purple-400 px-4 py-3 text-left">Medij</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Novi kupac</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Stari kupac</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Prodavac</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Agencija</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Ostalo</th>
                      <th className="border border-purple-400 px-4 py-3 text-center">Ukupno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {podaci.map((item, index) => (
                      <tr key={item.naziv} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                        <td className="border border-gray-300 px-4 py-3 text-gray-500 font-medium">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-medium medij-name">
                          <div className="flex items-center gap-2">
                            <Tv className="w-4 h-4 text-purple-500" />
                            {item.naziv}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                            {item.novikupac}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-blue-100 text-blue-800 font-bold rounded-lg">
                            {item.starikupac}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-amber-100 text-amber-800 font-bold rounded-lg">
                            {item.prodavac}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-purple-100 text-purple-800 font-bold rounded-lg">
                            {item.agencija}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-gray-100 text-gray-800 font-bold rounded-lg">
                            {item.ostalo}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-lg">
                          {item.ukupno}
                        </td>
                      </tr>
                    ))}
                    {/* Ukupno red */}
                    <tr className="bg-gradient-to-r from-gray-200 to-gray-300 font-bold">
                      <td className="border border-gray-400 px-4 py-3" colSpan={2}>UKUPNO</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-emerald-700 text-lg">{ukupno.novikupac}</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-blue-700 text-lg">{ukupno.starikupac}</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-amber-700 text-lg">{ukupno.prodavac}</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-purple-700 text-lg">{ukupno.agencija}</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-gray-700 text-lg">{ukupno.ostalo}</td>
                      <td className="border border-gray-400 px-4 py-3 text-center text-gray-900 text-xl">{ukupno.ukupno}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Procentualni prikaz */}
          {podaci.length > 0 && ukupno.ukupno > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => setShowAnaliticki(!showAnaliticki)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Tv className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">Procentualni prikaz po medijima</span>
                </div>
                {showAnaliticki ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showAnaliticki && (
                <div className="p-6">
                  <div className="space-y-4">
                    {podaci.map((item, index) => {
                      const procenat = ((item.ukupno / ukupno.ukupno) * 100).toFixed(1)
                      return (
                        <div key={item.naziv} className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-500">{index + 1}.</span>
                              <Tv className="w-4 h-4 text-purple-500" />
                              <span className="font-semibold text-gray-900">{item.naziv}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-900">{item.ukupno}</span>
                              <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-lg">
                                {procenat}%
                              </span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
                            {item.novikupac > 0 && (
                              <div 
                                className="h-full bg-emerald-500 flex items-center justify-center text-xs text-white font-bold"
                                style={{ width: `${(item.novikupac / item.ukupno) * 100}%` }}
                                title={`Novi kupci: ${item.novikupac}`}
                              >
                                {item.novikupac > 0 && item.novikupac}
                              </div>
                            )}
                            {item.starikupac > 0 && (
                              <div 
                                className="h-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold"
                                style={{ width: `${(item.starikupac / item.ukupno) * 100}%` }}
                                title={`Stari kupci: ${item.starikupac}`}
                              >
                                {item.starikupac > 0 && item.starikupac}
                              </div>
                            )}
                            {item.prodavac > 0 && (
                              <div 
                                className="h-full bg-amber-500 flex items-center justify-center text-xs text-white font-bold"
                                style={{ width: `${(item.prodavac / item.ukupno) * 100}%` }}
                                title={`Prodavci: ${item.prodavac}`}
                              >
                                {item.prodavac > 0 && item.prodavac}
                              </div>
                            )}
                            {item.agencija > 0 && (
                              <div 
                                className="h-full bg-purple-500 flex items-center justify-center text-xs text-white font-bold"
                                style={{ width: `${(item.agencija / item.ukupno) * 100}%` }}
                                title={`Agencije: ${item.agencija}`}
                              >
                                {item.agencija > 0 && item.agencija}
                              </div>
                            )}
                            {item.ostalo > 0 && (
                              <div 
                                className="h-full bg-gray-500 flex items-center justify-center text-xs text-white font-bold"
                                style={{ width: `${(item.ostalo / item.ukupno) * 100}%` }}
                                title={`Ostalo: ${item.ostalo}`}
                              >
                                {item.ostalo > 0 && item.ostalo}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legenda */}
                  <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
                    {statusOptions.map(status => (
                      <div key={status.value} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${status.color.split(' ')[0]}`} style={{ backgroundColor: status.chartColor }}></div>
                        <span className="text-sm text-gray-600">{status.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
