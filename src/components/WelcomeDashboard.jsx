import { useState, useEffect } from 'react'
import { Sparkles, Home, Database, Users, ArrowRight } from 'lucide-react'

const motivacionePoruke = [
  {
    sr: "Svaki dan je nova prilika da postignete nešto veliko. Vaša agencija za nekretnine je na pravom putu!",
    en: "Every day is a new opportunity to achieve something great. Your real estate agency is on the right track!"
  },
  {
    sr: "Uspeh nije slučajnost - to je rezultat rada, upornosti, učenja i ljubavi prema onome što radite.",
    en: "Success is not a coincidence - it's the result of work, perseverance, learning and love for what you do."
  },
  {
    sr: "Vaša strast za nekretninama je ono što vas čini posebnim. Nastavite da gradite svoj san!",
    en: "Your passion for real estate is what makes you special. Keep building your dream!"
  },
  {
    sr: "Svaka prodaja je nova priča. Svaki klijent je nova prilika. Nastavite da stvarate vrednost!",
    en: "Every sale is a new story. Every client is a new opportunity. Keep creating value!"
  },
  {
    sr: "Vaša agencija je više od posla - to je vaša vizija. Držite se nje i nastavite napred!",
    en: "Your agency is more than a business - it's your vision. Stick to it and keep moving forward!"
  },
  {
    sr: "U svetu nekretnina, znanje je moć. Nastavite da učite, rastete i postižete izvanredne rezultate!",
    en: "In the world of real estate, knowledge is power. Keep learning, growing and achieving exceptional results!"
  },
  {
    sr: "Svaki uspešan posao počinje jednim korakom. Vi ste već na putu - nastavite hrabro!",
    en: "Every successful business starts with one step. You're already on the path - keep going bravely!"
  },
  {
    sr: "Vaša posvećenost klijentima i kvalitetu je ono što vas izdvaja. Nastavite da sjajite!",
    en: "Your dedication to clients and quality is what sets you apart. Keep shining!"
  },
  {
    sr: "U nekretninama, kao i u životu, važno je verovati u sebe. Vi imate sve što vam je potrebno!",
    en: "In real estate, as in life, it's important to believe in yourself. You have everything you need!"
  },
  {
    sr: "Svaki dan donosi nove mogućnosti. Vaša agencija je spremna da ih iskoristi - nastavite napred!",
    en: "Every day brings new opportunities. Your agency is ready to seize them - keep moving forward!"
  },
  {
    sr: "Uspeh u nekretninama dolazi kroz strpljenje, znanje i odličnu komunikaciju. Vi imate sve to!",
    en: "Success in real estate comes through patience, knowledge and excellent communication. You have it all!"
  },
  {
    sr: "Vaša agencija gradi nešto posebno. Svaki dan je korak bliže vašim ciljevima!",
    en: "Your agency is building something special. Every day is a step closer to your goals!"
  },
  {
    sr: "U poslu nekretnina, poverenje je sve. Nastavite da gradite poverenje i postižete rezultate!",
    en: "In the real estate business, trust is everything. Keep building trust and achieving results!"
  },
  {
    sr: "Vaša posvećenost kvalitetu i profesionalizmu je ono što vas čini liderom u industriji!",
    en: "Your commitment to quality and professionalism is what makes you a leader in the industry!"
  },
  {
    sr: "Svaki uspešan posao počinje vizijom. Vi imate viziju - sada je vreme da je ostvarite!",
    en: "Every successful business starts with a vision. You have the vision - now it's time to make it happen!"
  },
  {
    sr: "U svetu nekretnina, detalji su ključni. Vaša pažnja prema detaljima je vaša snaga!",
    en: "In the world of real estate, details are key. Your attention to detail is your strength!"
  },
  {
    sr: "Vaša agencija je više od posla - to je vaša strast. Nastavite da je negujete!",
    en: "Your agency is more than a business - it's your passion. Keep nurturing it!"
  },
  {
    sr: "Svaki klijent zaslužuje najbolje. Vi pružate najbolje - nastavite tako!",
    en: "Every client deserves the best. You provide the best - keep it up!"
  },
  {
    sr: "Uspeh u nekretninama dolazi kroz konstantno učenje i prilagođavanje. Vi ste na pravom putu!",
    en: "Success in real estate comes through constant learning and adaptation. You're on the right path!"
  },
  {
    sr: "Vaša agencija gradi mostove između ljudi i njihovih snova. Nastavite da gradite!",
    en: "Your agency builds bridges between people and their dreams. Keep building!"
  },
  {
    sr: "U poslu nekretnina, komunikacija je kralj. Vaša sposobnost komunikacije je vaša supermoć!",
    en: "In the real estate business, communication is king. Your communication skills are your superpower!"
  },
  {
    sr: "Svaki dan je nova prilika da napravite razliku. Vaša agencija pravi razliku - nastavite!",
    en: "Every day is a new opportunity to make a difference. Your agency makes a difference - keep going!"
  },
  {
    sr: "Vaša posvećenost izvrsnosti je ono što vas izdvaja. Nastavite da budete najbolji!",
    en: "Your dedication to excellence is what sets you apart. Keep being the best!"
  },
  {
    sr: "U svetu nekretnina, povratak investicije dolazi kroz kvalitet. Vi pružate kvalitet!",
    en: "In the world of real estate, return on investment comes through quality. You provide quality!"
  },
  {
    sr: "Vaša agencija je sinonim za profesionalizam i pouzdanost. Nastavite da održavate taj standard!",
    en: "Your agency is synonymous with professionalism and reliability. Keep maintaining that standard!"
  },
  {
    sr: "Svaki uspešan posao počinje jednom idejom. Vi imate ideju - sada je vreme da je ostvarite!",
    en: "Every successful business starts with an idea. You have the idea - now it's time to make it happen!"
  },
  {
    sr: "U nekretninama, kao i u životu, važno je verovati u sebe. Vi imate sve što vam je potrebno!",
    en: "In real estate, as in life, it's important to believe in yourself. You have everything you need!"
  },
  {
    sr: "Vaša agencija gradi nešto trajno. Svaki dan je korak bliže vašim ciljevima!",
    en: "Your agency is building something lasting. Every day is a step closer to your goals!"
  },
  {
    sr: "Uspeh u nekretninama dolazi kroz strpljenje i upornost. Vi imate oba - nastavite napred!",
    en: "Success in real estate comes through patience and perseverance. You have both - keep moving forward!"
  },
  {
    sr: "Vaša posvećenost klijentima je ono što vas čini posebnim. Nastavite da sjajite!",
    en: "Your dedication to clients is what makes you special. Keep shining!"
  },
]

export default function WelcomeDashboard() {
  const [motivacionaPoruka, setMotivacionaPoruka] = useState({ sr: '', en: '' })

  useEffect(() => {
    // Proveri timestamp logina iz localStorage (postavlja se pri svakom loginu)
    const loginTimestamp = localStorage.getItem('login_timestamp')
    const savedPorukaIndex = sessionStorage.getItem('dashboard_motivacija_index')
    const savedTimestamp = sessionStorage.getItem('dashboard_motivacija_timestamp')
    
    // Ako nema poruke u sessionStorage ili ako je timestamp različit (novi login), generiši novu poruku
    if (savedPorukaIndex === null || !savedTimestamp || savedTimestamp !== loginTimestamp) {
      // Generiši novu random poruku
      const randomIndex = Math.floor(Math.random() * motivacionePoruke.length)
      const novaPoruka = motivacionePoruke[randomIndex]
      setMotivacionaPoruka(novaPoruka)
      
      // Sačuvaj index poruke i timestamp u sessionStorage
      sessionStorage.setItem('dashboard_motivacija_index', randomIndex.toString())
      sessionStorage.setItem('dashboard_motivacija_timestamp', loginTimestamp || Date.now().toString())
    } else {
      // Koristi postojeću poruku iz ove sesije
      const index = parseInt(savedPorukaIndex)
      setMotivacionaPoruka(motivacionePoruke[index])
    }
  }, [])

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 lg:p-16 text-center">
          {/* Ikonica */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-6 sm:p-8 rotate-gold">
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

          {/* Motivaciona poruka - srpska verzija */}
          {motivacionaPoruka.sr && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 sm:p-8 mb-6 border-l-4 border-indigo-500">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
                <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed text-left">
                  "{motivacionaPoruka.sr}"
                </p>
              </div>
            </div>
          )}

          {/* Motivaciona poruka - engleska verzija */}
          {motivacionaPoruka.en && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 sm:p-8 mb-8 border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <Sparkles className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <p className="text-base sm:text-lg text-gray-700 italic leading-relaxed text-left">
                  "{motivacionaPoruka.en}"
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
