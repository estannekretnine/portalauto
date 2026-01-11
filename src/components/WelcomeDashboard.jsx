import { useState, useEffect } from 'react'
import { Sparkles, Home, Database, Users, ArrowRight } from 'lucide-react'

const motivacionePoruke = [
  "Svaki dan je nova prilika da postignete nešto veliko. Vaša agencija za nekretnine je na pravom putu!",
  "Uspeh nije slučajnost - to je rezultat rada, upornosti, učenja i ljubavi prema onome što radite.",
  "Vaša strast za nekretninama je ono što vas čini posebnim. Nastavite da gradite svoj san!",
  "Svaka prodaja je nova priča. Svaki klijent je nova prilika. Nastavite da stvarate vrednost!",
  "Vaša agencija je više od posla - to je vaša vizija. Držite se nje i nastavite napred!",
  "U svetu nekretnina, znanje je moć. Nastavite da učite, rastete i postižete izvanredne rezultate!",
  "Svaki uspešan posao počinje jednim korakom. Vi ste već na putu - nastavite hrabro!",
  "Vaša posvećenost klijentima i kvalitetu je ono što vas izdvaja. Nastavite da sjajite!",
  "U nekretninama, kao i u životu, važno je verovati u sebe. Vi imate sve što vam je potrebno!",
  "Svaki dan donosi nove mogućnosti. Vaša agencija je spremna da ih iskoristi - nastavite napred!",
  "Uspeh u nekretninama dolazi kroz strpljenje, znanje i odličnu komunikaciju. Vi imate sve to!",
  "Vaša agencija gradi nešto posebno. Svaki dan je korak bliže vašim ciljevima!",
  "U poslu nekretnina, poverenje je sve. Nastavite da gradite poverenje i postižete rezultate!",
  "Vaša posvećenost kvalitetu i profesionalizmu je ono što vas čini liderom u industriji!",
  "Svaki uspešan posao počinje vizijom. Vi imate viziju - sada je vreme da je ostvarite!",
  "U svetu nekretnina, detalji su ključni. Vaša pažnja prema detaljima je vaša snaga!",
  "Vaša agencija je više od posla - to je vaša strast. Nastavite da je negujete!",
  "Svaki klijent zaslužuje najbolje. Vi pružate najbolje - nastavite tako!",
  "Uspeh u nekretninama dolazi kroz konstantno učenje i prilagođavanje. Vi ste na pravom putu!",
  "Vaša agencija gradi mostove između ljudi i njihovih snova. Nastavite da gradite!",
  "U poslu nekretnina, komunikacija je kralj. Vaša sposobnost komunikacije je vaša supermoć!",
  "Svaki dan je nova prilika da napravite razliku. Vaša agencija pravi razliku - nastavite!",
  "Vaša posvećenost izvrsnosti je ono što vas izdvaja. Nastavite da budete najbolji!",
  "U svetu nekretnina, povratak investicije dolazi kroz kvalitet. Vi pružate kvalitet!",
  "Vaša agencija je sinonim za profesionalizam i pouzdanost. Nastavite da održavate taj standard!",
  "Svaki uspešan posao počinje jednom idejom. Vi imate ideju - sada je vreme da je ostvarite!",
  "U nekretninama, kao i u životu, važno je verovati u sebe. Vi imate sve što vam je potrebno!",
  "Vaša agencija gradi nešto trajno. Svaki dan je korak bliže vašim ciljevima!",
  "Uspeh u nekretninama dolazi kroz strpljenje i upornost. Vi imate oba - nastavite napred!",
  "Vaša posvećenost klijentima je ono što vas čini posebnim. Nastavite da sjajite!",
]

export default function WelcomeDashboard() {
  const [motivacionaPoruka, setMotivacionaPoruka] = useState('')

  useEffect(() => {
    // Proveri da li već postoji poruka u sessionStorage
    const savedPoruka = sessionStorage.getItem('dashboard_motivacija')
    
    if (savedPoruka) {
      setMotivacionaPoruka(savedPoruka)
    } else {
      // Generiši novu random poruku
      const randomIndex = Math.floor(Math.random() * motivacionePoruke.length)
      const novaPoruka = motivacionePoruke[randomIndex]
      setMotivacionaPoruka(novaPoruka)
      // Sačuvaj u sessionStorage
      sessionStorage.setItem('dashboard_motivacija', novaPoruka)
    }
  }, [])

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 lg:p-16 text-center">
          {/* Ikonica */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full p-6 sm:p-8">
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Naslov */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Dobrodošli u Dashboard
          </h2>
          
          {/* Podnaslov */}
          <p className="text-lg sm:text-xl text-gray-600 mb-8">
            Izaberite modul iz menija da počnete sa radom
          </p>

          {/* Motivaciona poruka */}
          {motivacionaPoruka && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 sm:p-8 mb-8 border-l-4 border-indigo-500">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed text-left">
                  "{motivacionaPoruka}"
                </p>
              </div>
            </div>
          )}

          {/* Brzi pristup modulima */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <Home className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Ponude</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <Database className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Matični podaci</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Korisnici</p>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-8 flex items-center justify-center gap-2 text-indigo-600">
            <ArrowRight className="w-5 h-5" />
            <span className="text-sm font-medium">Kliknite na bilo koji modul u meniju da počnete</span>
          </div>
        </div>
      </div>
    </div>
  )
}
