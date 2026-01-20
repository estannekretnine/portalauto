import { useState, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { TrendingUp, Loader2, Calendar, Filter, Printer, Home, Users } from 'lucide-react'
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

export default function ProdajaRentaModule() {
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
      // Dohvati ponude i tražnje paralelno
      const [ponudeRes, traznjaRes] = await Promise.all([
        supabase
          .from('ponuda')
          .select('id, datumkreiranja, stsrentaprodaja, cena, kvadratura')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59'),
        supabase
          .from('traznja')
          .select('id, datumkreiranja, stskupaczakupac, cenado, kvadraturado')
          .gte('datumkreiranja', datumOd)
          .lte('datumkreiranja', datumDo + 'T23:59:59')
      ])

      if (ponudeRes.error) throw ponudeRes.error
      if (traznjaRes.error) throw traznjaRes.error

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
          ponudeProdaja: 0,
          ponudeRenta: 0,
          traznjaProdaja: 0, // kupci
          traznjaRenta: 0,   // zakupci
          ukupnoProdaja: 0,
          ukupnoRenta: 0
        }
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Brojanje ponuda po mesecima i tipu
      (ponudeRes.data || []).forEach(ponuda => {
        const date = new Date(ponuda.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          if (ponuda.stsrentaprodaja === 'prodaja') {
            mesecniPodaci[key].ponudeProdaja++
          } else {
            mesecniPodaci[key].ponudeRenta++
          }
        }
      })

      // Brojanje tražnji po mesecima i tipu
      (traznjaRes.data || []).forEach(traznja => {
        const date = new Date(traznja.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          if (traznja.stskupaczakupac === 'kupac') {
            mesecniPodaci[key].traznjaProdaja++
          } else {
            mesecniPodaci[key].traznjaRenta++
          }
        }
      })

      // Izračunaj ukupne vrednosti po tipu
      Object.keys(mesecniPodaci).forEach(key => {
        const item = mesecniPodaci[key]
        item.ukupnoProdaja = item.ponudeProdaja + item.traznjaProdaja
        item.ukupnoRenta = item.ponudeRenta + item.traznjaRenta
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
        <title>Prodaja vs Renta</title>
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
          .section-header { background-color: #333; color: white; }
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
    ponudeProdaja: acc.ponudeProdaja + item.ponudeProdaja,
    ponudeRenta: acc.ponudeRenta + item.ponudeRenta,
    traznjaProdaja: acc.traznjaProdaja + item.traznjaProdaja,
    traznjaRenta: acc.traznjaRenta + item.traznjaRenta,
    ukupnoProdaja: acc.ukupnoProdaja + item.ukupnoProdaja,
    ukupnoRenta: acc.ukupnoRenta + item.ukupnoRenta
  }), { 
    ponudeProdaja: 0, ponudeRenta: 0, 
    traznjaProdaja: 0, traznjaRenta: 0,
    ukupnoProdaja: 0, ukupnoRenta: 0 
  })

  // Bar chart konfiguracija - Ukupno prodaja vs renta
  const mainChartData = {
    labels: podaci.map(p => `${p.mesec} ${p.godina}`),
    datasets: [
      {
        label: 'Prodaja (ukupno)',
        data: podaci.map(p => p.ukupnoProdaja),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Renta (ukupno)',
        data: podaci.map(p => p.ukupnoRenta),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      }
    ]
  }

  const mainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Prodaja vs Renta - Ukupna aktivnost po mesecima',
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

  // Bar chart za ponude
  const ponudeChartData = {
    labels: podaci.map(p => `${p.mesec.substring(0, 3)} ${p.godina}`),
    datasets: [
      {
        label: 'Ponude za prodaju',
        data: podaci.map(p => p.ponudeProdaja),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Ponude za rentu',
        data: podaci.map(p => p.ponudeRenta),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      }
    ]
  }

  const ponudeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ponude - Prodaja vs Renta',
        font: {
          size: 14,
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

  // Bar chart za tražnje
  const traznjaChartData = {
    labels: podaci.map(p => `${p.mesec.substring(0, 3)} ${p.godina}`),
    datasets: [
      {
        label: 'Kupci',
        data: podaci.map(p => p.traznjaProdaja),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Zakupci',
        data: podaci.map(p => p.traznjaRenta),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1,
      }
    ]
  }

  const traznjaChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tražnja - Kupci vs Zakupci',
        font: {
          size: 14,
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
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prodaja vs Renta</h2>
            <p className="text-gray-500">Poređenje aktivnosti prodaje i iznajmljivanja po mesecima</p>
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent min-w-[180px]"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-rose-500 focus:border-transparent min-w-[180px]"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-500/25"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ponude za prodaju</p>
                    <p className="text-3xl font-bold text-blue-600">{ukupno.ponudeProdaja}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Home className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ponude za rentu</p>
                    <p className="text-3xl font-bold text-amber-600">{ukupno.ponudeRenta}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kupci (tražnja)</p>
                    <p className="text-3xl font-bold text-emerald-600">{ukupno.traznjaProdaja}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zakupci (tražnja)</p>
                    <p className="text-3xl font-bold text-purple-600">{ukupno.traznjaRenta}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Glavni grafikon */}
          {podaci.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="h-[400px]">
                <Bar data={mainChartData} options={mainChartOptions} />
              </div>
            </div>
          )}

          {/* Grafikoni za ponude i tražnje */}
          {podaci.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[300px]">
                  <Bar data={ponudeChartData} options={ponudeChartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[300px]">
                  <Bar data={traznjaChartData} options={traznjaChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Sintetička tabela */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
            {podaci.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema aktivnosti u izabranom periodu</p>
              </div>
            ) : (
              <div ref={printRef}>
                {/* Zaglavlje izveštaja */}
                <div className="header mb-6 text-center">
                  <h1 className="text-xl font-bold">PRODAJA VS RENTA - PREGLED AKTIVNOSTI</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {formatDate(datumOd)} - {formatDate(datumDo)}
                  </p>
                </div>

                {/* Tabela */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left" rowSpan="2">Mesec</th>
                      <th className="border border-gray-300 px-4 py-3 text-center bg-blue-800" colSpan="2">PRODAJA</th>
                      <th className="border border-gray-300 px-4 py-3 text-center bg-amber-700" colSpan="2">RENTA</th>
                      <th className="border border-gray-300 px-4 py-3 text-center" colSpan="2">UKUPNO</th>
                    </tr>
                    <tr className="bg-gray-800 text-white">
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Ponude</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Kupci</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Ponude</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Zakupci</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Prodaja</th>
                      <th className="border border-gray-300 px-3 py-2 text-center text-xs">Renta</th>
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
                            {item.ponudeProdaja}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                            {item.traznjaProdaja}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-amber-100 text-amber-800 font-bold rounded-lg">
                            {item.ponudeRenta}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-purple-100 text-purple-800 font-bold rounded-lg">
                            {item.traznjaRenta}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-700">
                          {item.ukupnoProdaja}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-amber-700">
                          {item.ukupnoRenta}
                        </td>
                      </tr>
                    ))}
                    {/* Ukupno red */}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 px-4 py-3">UKUPNO</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-700">{ukupno.ponudeProdaja}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-emerald-700">{ukupno.traznjaProdaja}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-amber-700">{ukupno.ponudeRenta}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-purple-700">{ukupno.traznjaRenta}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-900">{ukupno.ukupnoProdaja}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-amber-900">{ukupno.ukupnoRenta}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Legenda */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-semibold text-gray-700 mb-3">Legenda:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-blue-500 rounded"></span>
                      <span>Ponude za prodaju - nekretnine na prodaju</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-emerald-500 rounded"></span>
                      <span>Kupci - tražnja za kupovinu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-amber-500 rounded"></span>
                      <span>Ponude za rentu - nekretnine za izdavanje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 bg-purple-500 rounded"></span>
                      <span>Zakupci - tražnja za iznajmljivanje</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
