import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { Clock, Calendar, BarChart3, TrendingUp, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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

export default function VremeTrajanjModule() {
  const [sesije, setSesije] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    ukupnoSesija: 0,
    ukupnoNovihOglasa: 0,
    prosecnoTrajanje: '-',
    uspesneSesije: 0
  })
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    loadSesije()
  }, [])

  const loadSesije = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('vremetrajanja')
        .select('*')
        .order('datumpocetak', { ascending: false })

      if (error) throw error

      setSesije(data || [])
      calculateStats(data || [])
      prepareChartData(data || [])

    } catch (error) {
      console.error('Greška pri učitavanju sesija:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data) => {
    const ukupnoSesija = data.length
    const ukupnoNovihOglasa = data.reduce((sum, s) => sum + (s.brojnovihoglasa || 0), 0)
    const uspesneSesije = data.filter(s => s.datuzavrsetka && !s.opis?.includes('GREŠKA')).length

    // Prosečno trajanje
    const sesijeSTrajanjem = data.filter(s => s.vremetrajanja)
    let prosecnoTrajanje = '-'
    
    if (sesijeSTrajanjem.length > 0) {
      const ukupnoSekundi = sesijeSTrajanjem.reduce((sum, s) => {
        const match = s.vremetrajanja.match(/(\d+)m\s*(\d+)s/)
        if (match) {
          return sum + parseInt(match[1]) * 60 + parseInt(match[2])
        }
        return sum
      }, 0)
      
      const prosek = Math.round(ukupnoSekundi / sesijeSTrajanjem.length)
      prosecnoTrajanje = `${Math.floor(prosek / 60)}m ${prosek % 60}s`
    }

    setStats({
      ukupnoSesija,
      ukupnoNovihOglasa,
      prosecnoTrajanje,
      uspesneSesije
    })
  }

  const prepareChartData = (data) => {
    // Grupiši po danima (poslednjih 14 dana)
    const last14Days = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      last14Days.push(date.toISOString().split('T')[0])
    }

    const dailyStats = {}
    last14Days.forEach(day => {
      dailyStats[day] = { novi: 0, preskoceni: 0 }
    })

    data.forEach(sesija => {
      const day = sesija.datumpocetak?.split('T')[0]
      if (dailyStats[day]) {
        dailyStats[day].novi += sesija.brojnovihoglasa || 0
        dailyStats[day].preskoceni += sesija.brojarhiviranih || 0
      }
    })

    setChartData({
      labels: last14Days.map(d => {
        const date = new Date(d)
        return `${date.getDate()}.${date.getMonth() + 1}.`
      }),
      datasets: [
        {
          label: 'Novi oglasi',
          data: last14Days.map(d => dailyStats[d].novi),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderRadius: 6,
        },
        {
          label: 'Preskočeni',
          data: last14Days.map(d => dailyStats[d].preskoceni),
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderRadius: 6,
        }
      ]
    })
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
        text: 'Broj oglasa po danima (poslednjih 14 dana)',
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('sr-RS')
  }

  const getStatusBadge = (sesija) => {
    if (!sesija.datuzavrsetka) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
          <Loader2 className="w-3 h-3 animate-spin" />
          U toku
        </span>
      )
    }
    if (sesija.opis?.includes('GREŠKA')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          <XCircle className="w-3 h-3" />
          Greška
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        <CheckCircle className="w-3 h-3" />
        Uspešno
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Clock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vreme Trajanja</h2>
            <p className="text-gray-500">Pregled svih scraping sesija i statistika</p>
          </div>
        </div>

        {/* Statistika */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
              <BarChart3 className="w-4 h-4" />
              Ukupno sesija
            </div>
            <div className="text-3xl font-bold text-purple-700">{stats.ukupnoSesija}</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              Ukupno novih oglasa
            </div>
            <div className="text-3xl font-bold text-green-700">{stats.ukupnoNovihOglasa}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
              <Clock className="w-4 h-4" />
              Prosečno trajanje
            </div>
            <div className="text-3xl font-bold text-blue-700">{stats.prosecnoTrajanje}</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 text-sm text-emerald-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              Uspešne sesije
            </div>
            <div className="text-3xl font-bold text-emerald-700">{stats.uspesneSesije}</div>
          </div>
        </div>
      </div>

      {/* Grafikon */}
      {chartData && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-[300px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Lista sesija */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            Istorija sesija ({sesije.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Učitavam sesije...</p>
          </div>
        ) : sesije.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nema sesija</h3>
            <p className="text-gray-500">Pokrenite scraping da biste videli istoriju</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sesije.map((sesija) => (
              <div key={sesija.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(sesija)}
                      <span className="text-sm text-gray-500">
                        {formatDate(sesija.datumpocetak)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {sesija.opis || 'Bez opisa'}
                    </p>
                    {sesija.linkportala && (
                      <a 
                        href={sesija.linkportala}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {sesija.linkportala.substring(0, 50)}...
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{sesija.brojnovihoglasa || 0}</div>
                      <div className="text-xs text-gray-500">Novih</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{sesija.brojarhiviranih || 0}</div>
                      <div className="text-xs text-gray-500">Preskočeno</div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <div className="text-lg font-bold text-purple-600">{sesija.vremetrajanja || '-'}</div>
                      <div className="text-xs text-gray-500">Trajanje</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
