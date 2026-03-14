import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Home, PenSquare, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useImage } from '../context/ImageContext'

const SIDEBAR_LINKS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/data-entry', label: 'Data entry', Icon: PenSquare },
  { to: '/stock', label: 'Stock', Icon: Package },
]

function Navbar() {
  const { isLoggedIn, email, authLoading } = useAuth()
  const { logo } = useImage()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('fc-token')
    window.location.reload()
  }

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/' || location.pathname === '/home'
    return location.pathname.startsWith(to)
  }

  // Close mobile drawer on route change
  useEffect(() => {
    const id = requestAnimationFrame(() => setMobileOpen(false))
    return () => cancelAnimationFrame(id)
  }, [location.pathname])

  // Close on escape
  useEffect(() => {
    const onEscape = (e) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  const sidebarContent = (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between md:block">
        <Link to="/" className="inline-block font-semibold text-gray-900" onClick={closeMobile}>
          <img src={logo} alt="Logo" className="w-10" />
        </Link>
        <button
          type="button"
          onClick={closeMobile}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {(isLoggedIn ? SIDEBAR_LINKS : [{ to: '/', label: 'Home', Icon: Home }]).map((link) => {
          const Icon = link.Icon
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMobile}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-200 p-3 space-y-1">
        {isLoggedIn ? (
          <>
            <p className="px-3 py-1.5 text-xs text-gray-500 truncate" title={email}>
              {email}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              onClick={closeMobile}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-amber-600"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMobile}
              className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-amber-600"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  )

  if (authLoading) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 md:hidden">
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
        <aside className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-gray-200 bg-white md:flex">
          <div className="flex flex-col gap-2 p-4">
            <span className="text-gray-500 text-sm">Loading...</span>
          </div>
        </aside>
      </>
    )
  }

  return (
    <>
      {/* Mobile: top bar with hamburger — no sidebar space when closed */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link to="/" className="ml-2 font-semibold text-gray-900">
          <img src={logo} alt="Logo" className="h-8" />
        </Link>
      </header>

      {/* Mobile: backdrop when drawer is open */}
      <div
        role="button"
        tabIndex={0}
        onClick={closeMobile}
        onKeyDown={(e) => e.key === 'Enter' && closeMobile()}
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden
      />

      {/* Sidebar: drawer on mobile (off-screen when closed), always visible on desktop */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:translate-x-0 md:z-30 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export default Navbar
