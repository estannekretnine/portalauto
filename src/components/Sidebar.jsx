import { Building2, Menu, X, Users, MapPin, ChevronDown, ChevronRight, Flame, Briefcase, Database, Home, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'

const Sidebar = ({ activeModule, setActiveModule, onLogout, user, collapsed = false }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMaticniPodaciOpen, setIsMaticniPodaciOpen] = useState(false)
  const [isLokalitetOpen, setIsLokalitetOpen] = useState(false)

  const isAdmin = user?.email === 'admin@example.com'

  const lokalitetSubItems = [
    { id: 'lokalitet-drzava', label: 'Država' },
    { id: 'lokalitet-grad', label: 'Grad' },
    { id: 'lokalitet-opstina', label: 'Opština' },
    { id: 'lokalitet-lokacija', label: 'Lokacija' },
    { id: 'lokalitet-ulica', label: 'Ulica' },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule])

  const menuItems = [
    {
      id: 'ponude',
      label: 'Ponude',
      icon: Home,
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 bg-slate-800 text-white rounded-xl shadow-lg hover:bg-slate-700 transition-colors"
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
        className={`fixed lg:static inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-72'} bg-slate-900 transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-all duration-300 ease-in-out min-h-screen lg:min-h-full flex flex-col`}
        aria-label="Glavna navigacija"
      >
        {/* Header */}
        <div className={`p-5 ${collapsed ? 'px-3 flex justify-center' : ''}`}>
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Nekretnine</h2>
                <p className="text-slate-400 text-xs">Admin Panel</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* User info */}
        {!collapsed && user && (
          <div className="px-5 pb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-white text-sm font-medium truncate">{user.naziv || 'Korisnik'}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="px-5">
          <div className="h-px bg-slate-700/50"></div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto" aria-label="Glavni meni">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.id || (item.hasSubmenu && isMaticniPodaciActive)
              const isExpanded = item.hasSubmenu && isMaticniPodaciOpen

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleMenuItemClick(item.id)}
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-700 text-white shadow-md'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                    aria-expanded={item.hasSubmenu ? isExpanded : undefined}
                    type="button"
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-slate-600' : 'bg-slate-800'}`}>
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      {!collapsed && <span className="font-medium">{item.label}</span>}
                    </div>
                    {!collapsed && item.hasSubmenu && (
                      <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </div>
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {!collapsed && item.hasSubmenu && isExpanded && (
                    <ul className="mt-1 ml-4 pl-4 border-l border-slate-700 space-y-1">
                      {item.subItems.map((subItem) => {
                        const SubIcon = subItem.icon
                        const hasSubmenu = subItem.hasSubmenu || false
                        const isLokalitetItem = subItem.id === 'lokalitet'
                        const isSubItemActive = hasSubmenu ? isLokalitetActive : activeModule === subItem.id
                        const isSubItemExpanded = hasSubmenu && isLokalitetItem && isLokalitetOpen
                        
                        return (
                          <li key={subItem.id}>
                            <button
                              onClick={() => handleSubItemClick(subItem.id, hasSubmenu)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isSubItemActive
                                  ? 'bg-slate-700/50 text-white'
                                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                              }`}
                              aria-current={isSubItemActive ? 'page' : undefined}
                              aria-expanded={hasSubmenu ? isSubItemExpanded : undefined}
                              type="button"
                            >
                              <div className="flex items-center gap-3">
                                <SubIcon className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm">{subItem.label}</span>
                              </div>
                              {hasSubmenu && (
                                <div className={`transition-transform duration-200 ${isSubItemExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className="w-3 h-3" aria-hidden="true" />
                                </div>
                              )}
                            </button>
                            
                            {/* Lokalitet submenu */}
                            {hasSubmenu && isSubItemExpanded && subItem.subItems && (
                              <ul className="mt-1 ml-4 pl-3 border-l border-slate-700/50 space-y-1">
                                {subItem.subItems.map((lokalitetSubItem) => (
                                  <li key={lokalitetSubItem.id}>
                                    <button
                                      onClick={() => handleLokalitetSubItemClick(lokalitetSubItem.id)}
                                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                                        activeModule === lokalitetSubItem.id
                                          ? 'bg-slate-700/50 text-white'
                                          : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'
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
          <div className="p-4 border-t border-slate-700/50">
            <button
              onClick={onLogout}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200`}
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
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export default Sidebar
