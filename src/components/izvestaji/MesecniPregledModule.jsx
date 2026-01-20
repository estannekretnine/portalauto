import { useState, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { BarChart3, Loader2, Calendar, Filter, Printer } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export default function MesecniPregledModule() {
  const [loading, setLoading] = useState(false)
  const [datumOd, setDatumOd] = useState('')
  const [datumDo, setDatumDo] = useState('')
  const [podaci, setPodaci] = useState([])
  const [showReport, setShowReport] = useState(false)
  const printRef = useRef()

  // Nazivi meseci na srpskom
  const meseci = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ]

  const fetchData = async () => {
    if (!datumOd || !datumDo) {
      alert('Molimo izaberite period (datum od i datum do)')
      return
    }

    setLoading(true)
    try {
      // Dohvati sve podatke paralelno
      const [ponudeRes, traznjaRes, poziviRes, tereniRes] = await Promise.all([
        supabase
          .from('ponuda')
          .select('id, datumkreiranja')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59'),
        supabase
          .from('traznja')
          .select('id, datumkreiranja')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59'),
        supabase
          .from('pozivi')
          .select('id, datumkreiranja')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59'),
        supabase
          .from('tereni')
          .select('id, datumkreiranja')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59')
      ])

      if (ponudeRes.error) throw ponudeRes.error
      if (traznjaRes.error) throw traznjaRes.error
      if (poziviRes.error) throw poziviRes.error
      if (tereniRes.error) throw tereniRes.error

      // Grupiši po mesecima
      const mesecniPodaci = {}

      // Inicijalizuj mesece u periodu
      const startDate = new Date(datumOd)
      const endDate = new Date(datumDo)
      
      let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      while (currentDate <= endDate) {
        const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
        mesecniPodaci[key] = {
          mesec: meseci[currentDate.getMonth()],
          godina: currentDate.getFullYear(),
          ponude: 0,
          traznja: 0,
          pozivi: 0,
          tereni: 0
        }
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Brojanje ponuda po mesecima
      (ponudeRes.data || []).forEach(item => {
        const date = new Date(item.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          mesecniPodaci[key].ponude++
        }
      })

      // Brojanje tražnji po mesecima
      (traznjaRes.data || []).forEach(item => {
        const date = new Date(item.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          mesecniPodaci[key].traznja++
        }
      })

      // Brojanje poziva po mesecima
      (poziviRes.data || []).forEach(item => {
        const date = new Date(item.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          mesecniPodaci[key].pozivi++
        }
      })

      // Brojanje terena po mesecima
      (tereniRes.data || []).forEach(item => {
        const date = new Date(item.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          mesecniPodaci[key].tereni++
        }
      })

      // Konvertuj u niz i sortiraj
      const rezultat = Object.entries(mesecniPodaci)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ key, ...value }))

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
        <title>Mesečni pregled aktivnosti</title>
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
    ponude: acc.ponude + item.ponude,
    traznja: acc.traznja + item.traznja,
    pozivi: acc.pozivi + item.pozivi,
    tereni: acc.tereni + item.tereni
  }), { ponude: 0, traznja: 0, pozivi: 0, tereni: 0 })

  // Chart.js konfiguracija
  const chartData = {
    labels: podaci.map(p => `${p.mesec} ${p.godina}`),
    datasets: [
      {
        label: 'Ponude',
        data: podaci.map(p => p.ponude),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Tražnja',
        data: podaci.map(p => p.traznja),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Pozivi',
        data: podaci.map(p => p.pozivi),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      },
      {
        label: 'Tereni',
        data: podaci.map(p => p.tereni),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mesečni pregled aktivnosti',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mesečni Pregled Aktivnosti</h2>
            <p className="text-gray-500">Sintetički pregled ponuda, tražnji, poziva i terena po mesecima</p>
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[180px]"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[180px]"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/25"
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
          {/* Grafikon */}
          {podaci.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="h-[400px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
            {podaci.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema aktivnosti u izabranom periodu</p>
              </div>
            ) : (
              <div ref={printRef}>
                {/* Zaglavlje izveštaja */}
                <div className="header mb-6 text-center">
                  <h1 className="text-xl font-bold">MESEČNI PREGLED AKTIVNOSTI</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {formatDate(datumOd)} - {formatDate(datumDo)}
                  </p>
                </div>

                {/* Tabela */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left">Mesec</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Nove Ponude</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Nova Tražnja</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Pozivi</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Tereni</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Ukupno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {podaci.map((item, index) => (
                      <tr key={item.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {item.mesec} {item.godina}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-blue-100 text-blue-800 font-bold rounded-lg">
                            {item.ponude}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                            {item.traznja}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-amber-100 text-amber-800 font-bold rounded-lg">
                            {item.pozivi}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-purple-100 text-purple-800 font-bold rounded-lg">
                            {item.tereni}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                          {item.ponude + item.traznja + item.pozivi + item.tereni}
                        </td>
                      </tr>
                    ))}
                    {/* Ukupno red */}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 px-4 py-3">UKUPNO</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-700">{ukupno.ponude}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-emerald-700">{ukupno.traznja}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-amber-700">{ukupno.pozivi}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-purple-700">{ukupno.tereni}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">
                        {ukupno.ponude + ukupno.traznja + ukupno.pozivi + ukupno.tereni}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
