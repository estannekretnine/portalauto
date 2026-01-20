import { useState, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { Map, Loader2, Calendar, Filter, Printer, ChevronDown, ChevronUp, Star, TrendingUp } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

export default function StatistikaTerenModule() {
  const [loading, setLoading] = useState(false)
  const [datumOd, setDatumOd] = useState('')
  const [datumDo, setDatumDo] = useState('')
  const [podaci, setPodaci] = useState([])
  const [topPonude, setTopPonude] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [showAnaliticki, setShowAnaliticki] = useState(false)
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
      const { data, error } = await supabase
        .from('tereni')
        .select(`
          id,
          datumkreiranja,
          utisakkupca,
          idponude,
          idtraznja,
          komentar,
          spremnostnacenu,
          ponuda:idponude(
            id, 
            cena, 
            kvadratura, 
            stsrentaprodaja,
            metapodaci,
            vrstaobjekta:idvrstaobjekta(opis),
            opstina:idopstina(opis)
          ),
          traznja:idtraznja(id, kontaktosoba)
        `)
        .gte('datumkreiranja', datumOd)
        .lte('datumkreiranja', datumDo + 'T23:59:59')
        .order('datumkreiranja', { ascending: false })

      if (error) throw error

      // Osiguraj da su podaci niz
      const tereni = Array.isArray(data) ? data : []

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
          brojTerena: 0,
          ukupanUtisak: 0,
          spremniNaCenu: 0
        }
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Brojanje terena po mesecima
      tereni.forEach(teren => {
        const date = new Date(teren.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          mesecniPodaci[key].brojTerena++
          mesecniPodaci[key].ukupanUtisak += teren.utisakkupca || 0
          if (teren.spremnostnacenu) {
            mesecniPodaci[key].spremniNaCenu++
          }
        }
      })

      // Izračunaj prosečan utisak
      Object.keys(mesecniPodaci).forEach(key => {
        const item = mesecniPodaci[key]
        item.prosecniUtisak = item.brojTerena > 0 
          ? (item.ukupanUtisak / item.brojTerena).toFixed(2) 
          : 0
      })

      // Konvertuj u niz i sortiraj
      const rezultat = Object.entries(mesecniPodaci)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ key, ...value }))

      setPodaci(rezultat)

      // Top 10 ponuda sa najviše terena
      const ponudaBrojTerena = {}
      tereni.forEach(teren => {
        if (teren.idponude && teren.ponuda) {
          if (!ponudaBrojTerena[teren.idponude]) {
            ponudaBrojTerena[teren.idponude] = {
              ponuda: teren.ponuda,
              brojTerena: 0,
              ukupanUtisak: 0,
              spremniNaCenu: 0
            }
          }
          ponudaBrojTerena[teren.idponude].brojTerena++
          ponudaBrojTerena[teren.idponude].ukupanUtisak += teren.utisakkupca || 0
          if (teren.spremnostnacenu) {
            ponudaBrojTerena[teren.idponude].spremniNaCenu++
          }
        }
      })

      // Sortiraj po broju terena i uzmi top 10
      const topPonudeArray = Object.values(ponudaBrojTerena)
        .map(item => ({
          ...item,
          prosecniUtisak: item.brojTerena > 0 
            ? (item.ukupanUtisak / item.brojTerena).toFixed(2)
            : 0,
          konverzija: item.brojTerena > 0 
            ? ((item.spremniNaCenu / item.brojTerena) * 100).toFixed(1)
            : 0
        }))
        .sort((a, b) => b.brojTerena - a.brojTerena)
        .slice(0, 10)

      setTopPonude(topPonudeArray)
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
        <title>Statistika terena</title>
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

  const formatNumber = (num) => {
    if (!num) return '-'
    return new Intl.NumberFormat('sr-RS').format(num)
  }

  // Dobij ime prodavca iz ponude
  const getProdavacIme = (ponuda) => {
    if (!ponuda) return '-'
    const vlasnici = ponuda.metapodaci?.vlasnici || []
    if (vlasnici.length > 0 && (vlasnici[0].ime || vlasnici[0].prezime)) {
      return `${vlasnici[0].ime || ''} ${vlasnici[0].prezime || ''}`.trim()
    }
    return `Ponuda #${ponuda.id}`
  }

  // Izračunaj ukupne vrednosti
  const ukupno = podaci.reduce((acc, item) => ({
    brojTerena: acc.brojTerena + item.brojTerena,
    ukupanUtisak: acc.ukupanUtisak + item.ukupanUtisak,
    spremniNaCenu: acc.spremniNaCenu + item.spremniNaCenu
  }), { brojTerena: 0, ukupanUtisak: 0, spremniNaCenu: 0 })

  const prosecniUtisakUkupno = ukupno.brojTerena > 0 
    ? (ukupno.ukupanUtisak / ukupno.brojTerena).toFixed(2)
    : 0

  // Bar chart za broj terena
  const barChartData = {
    labels: podaci.map(p => `${p.mesec} ${p.godina}`),
    datasets: [
      {
        label: 'Broj terena',
        data: podaci.map(p => p.brojTerena),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
      {
        label: 'Spremni na cenu',
        data: podaci.map(p => p.spremniNaCenu),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
      }
    ]
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Broj terena i spremnost na cenu po mesecima',
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

  // Line chart za prosečan utisak
  const lineChartData = {
    labels: podaci.map(p => `${p.mesec} ${p.godina}`),
    datasets: [
      {
        label: 'Prosečan utisak kupca',
        data: podaci.map(p => parseFloat(p.prosecniUtisak) || 0),
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Prosečan utisak kupca po mesecima (1-5)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  // Render zvezdica za utisak
  const renderStars = (rating) => {
    const numRating = parseFloat(rating) || 0
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= Math.round(numRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({numRating})</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Map className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Statistika Terena</h2>
            <p className="text-gray-500">Analiza obilazaka nekretnina, utisak kupaca i konverzija</p>
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[180px]"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-w-[180px]"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25"
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ukupno terena</p>
                    <p className="text-3xl font-bold text-gray-900">{ukupno.brojTerena}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prosečan utisak</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold text-gray-900">{prosecniUtisakUkupno}</p>
                      <span className="text-yellow-400">★</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Spremni na cenu</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {ukupno.spremniNaCenu}
                      <span className="text-sm font-normal text-gray-500 ml-1">
                        ({ukupno.brojTerena > 0 ? ((ukupno.spremniNaCenu / ukupno.brojTerena) * 100).toFixed(1) : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grafikoni */}
          {podaci.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[350px]">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="h-[350px]">
                  <Line data={lineChartData} options={lineChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Sintetička tabela */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
            {podaci.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Map className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema terena u izabranom periodu</p>
              </div>
            ) : (
              <div ref={printRef}>
                {/* Zaglavlje izveštaja */}
                <div className="header mb-6 text-center">
                  <h1 className="text-xl font-bold">STATISTIKA TERENA</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {formatDate(datumOd)} - {formatDate(datumDo)}
                  </p>
                </div>

                {/* Tabela */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left">Mesec</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Broj terena</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Prosečan utisak</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Spremni na cenu</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Konverzija</th>
                    </tr>
                  </thead>
                  <tbody>
                    {podaci.map((item, index) => (
                      <tr key={item.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-4 py-3 font-medium">
                          {item.mesec} {item.godina}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                            {item.brojTerena}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {renderStars(item.prosecniUtisak)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[40px] h-8 bg-amber-100 text-amber-800 font-bold rounded-lg">
                            {item.spremniNaCenu}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                          {item.brojTerena > 0 
                            ? ((item.spremniNaCenu / item.brojTerena) * 100).toFixed(1) 
                            : 0}%
                        </td>
                      </tr>
                    ))}
                    {/* Ukupno red */}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 px-4 py-3">UKUPNO</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-emerald-700">{ukupno.brojTerena}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">{renderStars(prosecniUtisakUkupno)}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-amber-700">{ukupno.spremniNaCenu}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {ukupno.brojTerena > 0 
                          ? ((ukupno.spremniNaCenu / ukupno.brojTerena) * 100).toFixed(1) 
                          : 0}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top 10 ponuda */}
          {topPonude.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Toggle header */}
              <button
                onClick={() => setShowAnaliticki(!showAnaliticki)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-gray-900">Top 10 ponuda sa najviše terena</span>
                </div>
                {showAnaliticki ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {showAnaliticki && (
                <div className="p-6">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-200 px-3 py-2 text-center">#</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Ponuda</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Prodavac</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Cena</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Broj terena</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Prosečan utisak</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Konverzija</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPonude.map((item, index) => (
                        <tr key={item.ponuda.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-200 px-3 py-2 text-center font-bold">{index + 1}</td>
                          <td className="border border-gray-200 px-3 py-2">
                            <div>
                              <span className="font-medium">#{item.ponuda.id}</span>
                              <span className="text-gray-500 ml-2">
                                {item.ponuda.vrstaobjekta?.opis || ''} {item.ponuda.kvadratura}m²
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{item.ponuda.opstina?.opis || ''}</div>
                          </td>
                          <td className="border border-gray-200 px-3 py-2">{getProdavacIme(item.ponuda)}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center font-medium">
                            {formatNumber(item.ponuda.cena)} €
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center">
                            <span className="inline-flex items-center justify-center min-w-[40px] h-7 bg-emerald-100 text-emerald-800 font-bold rounded-lg">
                              {item.brojTerena}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center">
                            {renderStars(item.prosecniUtisak)}
                          </td>
                          <td className="border border-gray-200 px-3 py-2 text-center">
                            <span className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-xs font-bold ${
                              parseFloat(item.konverzija) >= 50 
                                ? 'bg-green-100 text-green-800' 
                                : parseFloat(item.konverzija) >= 25 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {item.konverzija}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
