import { useState, useEffect } from 'react'
import { Building2 } from 'lucide-react'
import '../index.css'

export default function Intro({ onComplete }) {
  const [currentAgency, setCurrentAgency] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [isRotating, setIsRotating] = useState(false)

  const agencyNames = [
    'TechAgency',
    'Premium Estates',
    'Luxury Properties',
    'Elite Realty',
    'Prime Homes'
  ]

  useEffect(() => {
    // Rotacija imena agencije
    const rotateInterval = setInterval(() => {
      setIsRotating(true)
      setTimeout(() => {
        setCurrentAgency((prev) => (prev + 1) % agencyNames.length)
        setIsRotating(false)
      }, 300)
    }, 2000)

    // Zatvori intro nakon 4 sekundi
    const timeout = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        if (onComplete) onComplete()
      }, 500)
    }, 4000)

    return () => {
      clearInterval(rotateInterval)
      clearTimeout(timeout)
    }
  }, [agencyNames.length, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        {/* Logo/Ikona */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-white opacity-20 blur-2xl animate-pulse"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 border border-white/20">
              <Building2 className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
            </div>
          </div>
        </div>

        {/* Naslov */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Agencija za
        </h1>

        {/* Rotirajuće ime agencije */}
        <div className="h-20 sm:h-24 md:h-28 flex items-center justify-center mb-6">
          <div className="relative overflow-hidden">
            <div
              className={`text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent transition-all duration-300 ${
                isRotating
                  ? 'opacity-0 transform translate-y-8 rotate-12'
                  : 'opacity-100 transform translate-y-0 rotate-0'
              }`}
              style={{
                backgroundSize: '200% auto'
              }}
              className={isRotating ? '' : 'animate-shimmer'}
            >
              {agencyNames[currentAgency]}
            </div>
          </div>
        </div>

        {/* Podnaslov */}
        <p className="text-white/80 text-lg sm:text-xl mb-8 font-light">
          Vaš partner u svetu nekretnina
        </p>

        {/* Loading animacija */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

    </div>
  )
}
