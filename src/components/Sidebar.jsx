import { Building2, Menu, X, Users, MapPin, ChevronDown, ChevronRight, Flame, Briefcase } from 'lucide-react'
import { useState } from 'react'

const Sidebar = ({ activeModule, setActiveModule, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLokalitetOpen, setIsLokalitetOpen] = useState(false)

  const isAdmin = user?.email === 'admin@example.com'

  const lokalitetSubItems = [
    { id: 'lokalitet-drzava', label: 'Država' },
    { id: 'lokalitet-grad', label: 'Grad' },
    { id: 'lokalitet-opstina', label: 'Opština' },
    { id: 'lokalitet-lokacija', label: 'Lokacija' },
    { id: 'lokalitet-ulica', label: 'Ulica' },
  ]

  const menuItems = [
    {
      id: 'vrstaobjekta',
      label: 'Vrsta objekta',
      icon: Building2,
    },
    {
      id: 'lokalitet',
      label: 'Lokalitet',
      icon: MapPin,
      hasSubmenu: true,
      subItems: lokalitetSubItems,
    },
    {
      id: 'grejanje',
      label: 'Grejanje',
      icon: Flame,
    },
    {
      id: 'investitor',
      label: 'Investitor',
      icon: Briefcase,
    },
    ...(isAdmin ? [{
      id: 'korisnici',
      label: 'Korisnici',
      icon: Users,
    }] : []),
  ]

  const handleMenuItemClick = (itemId) => {
    if (itemId === 'lokalitet') {
      setIsLokalitetOpen(!isLokalitetOpen)
    } else {
      setActiveModule(itemId)
      setIsMobileMenuOpen(false)
    }
  }

  const handleSubItemClick = (subItemId) => {
    setActiveModule(subItemId)
    setIsMobileMenuOpen(false)
  }

  // Proveri da li je neki od lokalitet sub-itema aktivan
  const isLokalitetActive = lokalitetSubItems.some(item => activeModule === item.id)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-md shadow-md hover:bg-gray-50 transition-colors"
        aria-label={isMobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
        aria-expanded={isMobileMenuOpen}
        type="button"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-200 ease-in-out h-screen`}
        aria-label="Glavna navigacija"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-bold text-gray-800">Navigacija</h2>
            {user && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{user.naziv || user.email}</p>
            )}
          </div>
          <nav className="flex-1 p-3 sm:p-4 overflow-y-auto" aria-label="Glavni meni">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeModule === item.id || (item.hasSubmenu && isLokalitetActive)
                const isExpanded = item.hasSubmenu && isLokalitetOpen

                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`w-full flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition duration-150 text-sm sm:text-base ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={`Navigiraj na ${item.label}`}
                      aria-expanded={item.hasSubmenu ? isExpanded : undefined}
                      type="button"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.hasSubmenu && (
                        isExpanded ? (
                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="w-4 h-4" aria-hidden="true" />
                        )
                      )}
                    </button>
                    {item.hasSubmenu && isExpanded && (
                      <ul className="ml-6 sm:ml-8 mt-2 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleSubItemClick(subItem.id)}
                              className={`w-full text-left px-3 sm:px-4 py-2 rounded-lg transition duration-150 text-sm sm:text-base ${
                                activeModule === subItem.id
                                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                              aria-current={activeModule === subItem.id ? 'page' : undefined}
                              type="button"
                            >
                              {subItem.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar

