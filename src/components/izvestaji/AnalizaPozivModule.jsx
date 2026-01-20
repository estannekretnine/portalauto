import { useState, useRef } from 'react'
import { supabase } from '../../utils/supabase'
import { Phone, Loader2, Calendar, Filter, Printer, ChevronDown, ChevronUp } from 'lucide-react'
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
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

export default function AnalizaPozivModule() {
  const [loading, setLoading] = useState(false)
  const [datumOd, setDatumOd] = useState('')
  const [datumDo, setDatumDo] = useState('')
  const [podaci, setPodaci] = useState([])
  const [sviPozivi, setSviPozivi] = useState([])
  const [showReport, setShowReport] = useState(false)
  const [showAnaliticki, setShowAnaliticki] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const printRef = useRef()

  // Nazivi meseci na srpskom
  const meseci = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ]

  // Status poziva opcije sa bojama
  const statusOptions = [
    { value: 'novikupac', label: 'Novi kupac', color: 'bg-emerald-100 text-emerald-800', chartColor: 'rgba(16, 185, 129, 0.8)' },
    { value: 'starikupac', label: 'Stari kupac', color: 'bg-blue-100 text-blue-800', chartColor: 'rgba(59, 130, 246, 0.8)' },
    { value: 'prodavac', label: 'Prodavac', color: 'bg-amber-100 text-amber-800', chartColor: 'rgba(245, 158, 11, 0.8)' },
    { value: 'agencija', label: 'Agencija', color: 'bg-purple-100 text-purple-800', chartColor: 'rgba(139, 92, 246, 0.8)' },
    { value: 'ostalo', label: 'Ostalo', color: 'bg-gray-100 text-gray-800', chartColor: 'rgba(107, 114, 128, 0.8)' }
  ]

  const getStatusLabel = (status) => {
    const option = statusOptions.find(o => o.value === status)
    return option?.label || status || 'Nepoznato'
  }

  const getStatusColor = (status) => {
    const option = statusOptions.find(o => o.value === status)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

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
          komentar,
          idponude,
          idtraznja
        `)
        .gte('datumkreiranja', datumOd)
        .lte('datumkreiranja', datumDo + 'T23:59:59')
        .order('datumkreiranja', { ascending: false })

      if (error) throw error

      // Osiguraj da su podaci niz
      const poziviData = Array.isArray(data) ? data : []
      setSviPozivi(poziviData)

      // Grupiši po mesecima i statusu
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
          novikupac: 0,
          starikupac: 0,
          prodavac: 0,
          agencija: 0,
          ostalo: 0,
          ukupno: 0
        }
        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      // Brojanje poziva po mesecima i statusu
      poziviData.forEach(poziv => {
        const date = new Date(poziv.datumkreiranja)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (mesecniPodaci[key]) {
          const status = poziv.stspoziv || 'ostalo'
          if (mesecniPodaci[key][status] !== undefined) {
            mesecniPodaci[key][status]++
          } else {
            mesecniPodaci[key].ostalo++
          }
          mesecniPodaci[key].ukupno++
        }
      })

      // Konvertuj u niz i sortiraj
      const rezultat = Object.entries(mesecniPodaci)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => ({ key, ...value }))

      setPodaci(rezultat)
      setShowReport(true)
      setCurrentPage(1)
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
        <title>Analiza poziva po statusu</title>
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

  const formatDatumVreme = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Bar chart konfiguracija
  const barChartData = {
    labels: podaci.map(p => `${p.mesec} ${p.godina}`),
    datasets: statusOptions.map(status => ({
      label: status.label,
      data: podaci.map(p => p[status.value] || 0),
      backgroundColor: status.chartColor,
      borderWidth: 1,
    }))
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
        text: 'Pozivi po statusu (mesečno)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  }

  // Pie chart konfiguracija
  const pieChartData = {
    labels: statusOptions.map(s => s.label),
    datasets: [{
      data: statusOptions.map(s => ukupno[s.value] || 0),
      backgroundColor: statusOptions.map(s => s.chartColor),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribucija poziva po statusu',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    }
  }

  // Paginacija za analitički prikaz
  const totalPages = Math.ceil(sviPozivi.length / itemsPerPage)
  const paginatedPozivi = sviPozivi.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Phone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analiza Poziva po Statusu</h2>
            <p className="text-gray-500">Pregled poziva grupisanih po statusu i mesecima</p>
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[180px]"
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
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:ring-2 focus:ring-cyan-500 focus:border-transparent min-w-[180px]"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/25"
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
                  <Pie data={pieChartData} options={pieChartOptions} />
                </div>
              </div>
            </div>
          )}

          {/* Sintetička tabela */}
          <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
            {podaci.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema podataka</h3>
                <p className="text-gray-500">Nema poziva u izabranom periodu</p>
              </div>
            ) : (
              <div ref={printRef}>
                {/* Zaglavlje izveštaja */}
                <div className="header mb-6 text-center">
                  <h1 className="text-xl font-bold">ANALIZA POZIVA PO STATUSU</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Period: {formatDate(datumOd)} - {formatDate(datumDo)}
                  </p>
                </div>

                {/* Tabela */}
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-900 to-black text-white">
                      <th className="border border-gray-300 px-4 py-3 text-left">Mesec</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Novi kupac</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Stari kupac</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Prodavac</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Agencija</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">Ostalo</th>
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
                        <td className="border border-gray-300 px-4 py-3 text-center font-bold">
                          {item.ukupno}
                        </td>
                      </tr>
                    ))}
                    {/* Ukupno red */}
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 px-4 py-3">UKUPNO</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-emerald-700">{ukupno.novikupac}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-blue-700">{ukupno.starikupac}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-amber-700">{ukupno.prodavac}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-purple-700">{ukupno.agencija}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-700">{ukupno.ostalo}</td>
                      <td className="border border-gray-300 px-4 py-3 text-center text-gray-900">{ukupno.ukupno}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Analitički prikaz - lista poziva */}
          {sviPozivi.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Toggle header */}
              <button
                onClick={() => setShowAnaliticki(!showAnaliticki)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-cyan-600" />
                  <span className="font-semibold text-gray-900">Analitički prikaz - Lista svih poziva</span>
                  <span className="text-sm text-gray-500">({sviPozivi.length} poziva)</span>
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
                        <th className="border border-gray-200 px-3 py-2 text-left">ID</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Datum</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Status</th>
                        <th className="border border-gray-200 px-3 py-2 text-left">Komentar</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Ponuda ID</th>
                        <th className="border border-gray-200 px-3 py-2 text-center">Tražnja ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPozivi.map((poziv, index) => (
                        <tr key={poziv.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-200 px-3 py-2 font-medium">{poziv.id}</td>
                          <td className="border border-gray-200 px-3 py-2">{formatDatumVreme(poziv.datumkreiranja)}</td>
                          <td className="border border-gray-200 px-3 py-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(poziv.stspoziv)}`}>
                              {getStatusLabel(poziv.stspoziv)}
                            </span>
                          </td>
                          <td className="border border-gray-200 px-3 py-2 max-w-xs truncate">{poziv.komentar || '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{poziv.idponude || '-'}</td>
                          <td className="border border-gray-200 px-3 py-2 text-center">{poziv.idtraznja || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Paginacija */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                      >
                        Prethodna
                      </button>
                      <span className="text-sm text-gray-600">
                        Strana {currentPage} od {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                      >
                        Sledeća
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
