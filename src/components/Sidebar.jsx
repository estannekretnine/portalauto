import { Building2, Menu, X, Users, MapPin, ChevronDown, ChevronRight, Flame, Briefcase, Database, Home, LogOut, Sparkles, FileSearch, Phone, Map, BarChart3, PhoneCall, PieChart } from 'lucide-react'
import { useState, useEffect } from 'react'

const Sidebar = ({ activeModule, setActiveModule, onLogout, user, collapsed = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMaticniPodaciOpen, setIsMaticniPodaciOpen] = useState(false)
  const [isLokalitetOpen, setIsLokalitetOpen] = useState(false)
  const [isIzvestajiOpen, setIsIzvestajiOpen] = useState(false)
  const [isIzvestajiAnalizeOpen, setIsIzvestajiAnalizeOpen] = useState(false)

  const isAdmin = user?.email === 'admin@example.com'

  const lokalitetSubItems = [
    { id: 'lokalitet-drzava', label: 'Država' },
    { id: 'lokalitet-grad', label: 'Grad' },
    { id: 'lokalitet-opstina', label: 'Opština' },
    { id: 'lokalitet-lokacija', label: 'Lokacija' },
    { id: 'lokalitet-ulica', label: 'Ulica' },
  ]

  const izvestajiSubItems = [
    { id: 'izvestaj-eop', label: 'EOP' },
    { id: 'izvestaj-eok', label: 'EOK' },
    { id: 'izvestaj-transakcije', label: 'Izvršene transakcije' },
  ]

  const izvestajiAnalizeSubItems = [
    { id: 'izvestaj-mesecni', label: 'Mesečni pregled' },
    { id: 'izvestaj-pozivi', label: 'Analiza poziva' },
    { id: 'izvestaj-tereni', label: 'Statistika terena' },
    { id: 'izvestaj-prodaja-renta', label: 'Prodaja vs Renta' },
    { id: 'izvestaj-arhivirani', label: 'Arhivirani oglasi' },
  ]

  const maticniPodaciSubItems = [
    { id: 'vrstaobjekta', label: 'Vrsta objekta', icon: Building2 },
    { 
      id: 'lokalitet', 
      label: 'Lokalitet', 
      icon: MapPin, 
      hasSubmenu: true, 
      subItems: lokalitetSubItems 
    },
    { id: 'grejanje', label: 'Grejanje', icon: Flame },
    { id: 'investitor', label: 'Investitor', icon: Briefcase },
  ]

  useEffect(() => {
    const isMaticniPodaciActive = maticniPodaciSubItems.some(item => 
      item.id === activeModule || (item.hasSubmenu && item.subItems.some(subItem => subItem.id === activeModule))
    )
    if (isMaticniPodaciActive) {
      setIsMaticniPodaciOpen(true)
    }
    
    const isLokalitetActive = lokalitetSubItems.some(item => activeModule === item.id)
    if (isLokalitetActive) {
      setIsLokalitetOpen(true)
    }

    const isIzvestajiActive = izvestajiSubItems.some(item => activeModule === item.id)
    if (isIzvestajiActive) {
      setIsIzvestajiOpen(true)
    }

    const isIzvestajiAnalizeActive = izvestajiAnalizeSubItems.some(item => activeModule === item.id)
    if (isIzvestajiAnalizeActive) {
      setIsIzvestajiAnalizeOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule])

  const menuItems = [
    {
      id: 'ponude',
      label: 'Ponude',
      icon: Home,
    },
    {
      id: 'traznja',
      label: 'Tražnja',
      icon: FileSearch,
    },
    {
      id: 'pozivi',
      label: 'Pozivi',
      icon: Phone,
    },
    {
      id: 'tereni',
      label: 'Tereni',
      icon: Map,
    },
    {
      id: 'provera',
      label: 'Provera',
      icon: PhoneCall,
    },
    {
      id: 'izvestaji',
      label: 'Izveštaji',
      icon: BarChart3,
      hasSubmenu: true,
      subItems: izvestajiSubItems,
    },
    {
      id: 'izvestaji-analize',
      label: 'Izveštaji - Analize',
      icon: PieChart,
      hasSubmenu: true,
      subItems: izvestajiAnalizeSubItems,
    },
    {
      id: 'maticni-podaci',
      label: 'Matični podaci',
      icon: Database,
      hasSubmenu: true,
      subItems: maticniPodaciSubItems,
    },
    ...(isAdmin ? [{
      id: 'korisnici',
      label: 'Korisnici',
      icon: Users,
    }] : []),
  ]

  const handleMenuItemClick = (itemId) => {
    if (itemId === 'maticni-podaci') {
      setIsMaticniPodaciOpen(!isMaticniPodaciOpen)
    } else if (itemId === 'izvestaji') {
      setIsIzvestajiOpen(!isIzvestajiOpen)
    } else if (itemId === 'izvestaji-analize') {
      setIsIzvestajiAnalizeOpen(!isIzvestajiAnalizeOpen)
    } else {
      setActiveModule(itemId)
      setIsMobileMenuOpen(false)
    }
  }

  const handleSubItemClick = (subItemId, hasSubmenu) => {
    if (hasSubmenu && subItemId === 'lokalitet') {
      setIsLokalitetOpen(!isLokalitetOpen)
    } else {
      setActiveModule(subItemId)
      setIsMobileMenuOpen(false)
    }
  }

  const handleLokalitetSubItemClick = (subItemId) => {
    setActiveModule(subItemId)
    setIsMobileMenuOpen(false)
  }

  const isMaticniPodaciActive = maticniPodaciSubItems.some(item => 
    item.id === activeModule || (item.hasSubmenu && item.subItems.some(subItem => subItem.id === activeModule))
  )
  
  const isLokalitetActive = lokalitetSubItems.some(item => activeModule === item.id)
  
  const isIzvestajiActive = izvestajiSubItems.some(item => activeModule === item.id)
  
  const isIzvestajiAnalizeActive = izvestajiAnalizeSubItems.some(item => activeModule === item.id)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all border border-white/10"
        aria-label={isMobileMenuOpen ? 'Zatvori meni' : 'Otvori meni'}
        aria-expanded={isMobileMenuOpen}
        type="button"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-72'} bg-gradient-to-b from-gray-900 via-gray-900 to-black transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-all duration-300 ease-in-out min-h-screen lg:min-h-full flex flex-col border-r border-white/5`}
        aria-label="Glavna navigacija"
      >
        {/* Header */}
        <div className={`p-6 ${collapsed ? 'px-3 flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl tracking-tight">EstateFlow</h2>
                <p className="text-amber-400/80 text-xs font-medium">Premium Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-5 pb-5">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">{(user.naziv || user.email || 'K')[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{user.naziv || 'Korisnik'}</p>
                  <p className="text-gray-400 text-xs truncate">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="px-5 mb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto" aria-label="Glavni meni">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id || 
                (item.id === 'maticni-podaci' && isMaticniPodaciActive) ||
                (item.id === 'izvestaji' && isIzvestajiActive) ||
                (item.id === 'izvestaji-analize' && isIzvestajiAnalizeActive)
              const isExpanded = (item.id === 'maticni-podaci' && isMaticniPodaciOpen) ||
                (item.id === 'izvestaji' && isIzvestajiOpen) ||
                (item.id === 'izvestaji-analize' && isIzvestajiAnalizeOpen)

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-white border border-amber-500/30 shadow-lg shadow-amber-500/10'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={item.hasSubmenu ? isExpanded : undefined}
                    type="button"
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/30' : 'bg-white/5'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} aria-hidden="true" />
                      </div>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!collapsed && item.hasSubmenu && (
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {!collapsed && item.hasSubmenu && isExpanded && (
                    <ul className="mt-2 ml-5 pl-4 border-l-2 border-amber-500/20 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const hasSubmenu = subItem.hasSubmenu || false
                        const isLokalitetItem = subItem.id === 'lokalitet'
                        const isSubItemActive = hasSubmenu ? isLokalitetActive : activeModule === subItem.id
                        const isSubItemExpanded = hasSubmenu && isLokalitetItem && isLokalitetOpen
                        
                        // Za stavke bez ikone (npr. izveštaji)
                        if (!SubIcon) {
                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => {
                                  setActiveModule(subItem.id)
                                  setIsMobileMenuOpen(false)
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                                  activeModule === subItem.id
                                    ? 'bg-white/10 text-amber-400'
                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }`}
                                aria-current={activeModule === subItem.id ? 'page' : undefined}
                                type="button"
                              >
                                <span className="font-medium">{subItem.label}</span>
                              </button>
                            </li>
                          )
                        }
                        
                        return (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleSubItemClick(subItem.id, hasSubmenu)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                                isSubItemActive
                                  ? 'bg-white/10 text-amber-400'
                                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                              }`}
                              aria-current={isSubItemActive ? 'page' : undefined}
                              aria-expanded={hasSubmenu ? isSubItemExpanded : undefined}
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                <SubIcon className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm font-medium">{subItem.label}</span>
                              </div>
                              {hasSubmenu && (
                                <div className={`transition-transform duration-200 ${isSubItemExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                                </div>
                              )}
                            </button>
                            
                            {/* Lokalitet submenu */}
                            {hasSubmenu && isSubItemExpanded && subItem.subItems && (
                              <ul className="mt-1 ml-4 pl-3 border-l border-white/10 space-y-1">
                                {subItem.subItems.map((lokalitetSubItem) => (
                                  <li key={lokalitetSubItem.id}>
                                    <button
                                      onClick={() => handleLokalitetSubItemClick(lokalitetSubItem.id)}
                                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                        activeModule === lokalitetSubItem.id
                                          ? 'text-amber-400 bg-white/5'
                                          : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                      }`}
                                      aria-current={activeModule === lokalitetSubItem.id ? 'page' : undefined}
                                      type="button"
                                    >
                                      {lokalitetSubItem.label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout button */}
        {onLogout && (
          <div className="p-6 border-t border-white/5">
            <button
              onClick={onLogout}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-4 rounded-2xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-300`}
              title={collapsed ? 'Odjavi se' : undefined}
              type="button"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {!collapsed && <span className="font-medium">Odjavi se</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
