import { Outlet, NavLink, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const isPlayer = location.pathname.startsWith('/player/')

  return (
    <div className="flex flex-col h-screen bg-surface text-white">

      {/* Desktop top nav — hidden on mobile */}
      <header className="hidden md:flex items-center gap-6 px-6 py-3 bg-surface-raised border-b border-surface-overlay shrink-0">
        <span className="text-accent font-semibold tracking-tight">MultiInstrumental</span>
        <nav className="flex gap-4 text-sm">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              isActive ? 'text-white font-medium' : 'text-white/50 hover:text-white transition-colors'
            }
          >
            Library
          </NavLink>
          <NavLink
            to="/player"
            className={({ isActive }) =>
              isActive ? 'text-white font-medium' : 'text-white/50 hover:text-white transition-colors'
            }
          >
            Player
          </NavLink>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Mobile bottom nav — hidden on desktop, hidden on player screen */}
      {!isPlayer && (
        <nav
          className="flex md:hidden justify-around bg-surface-raised border-t border-surface-overlay shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-6 py-2 text-[10px] font-medium transition-colors ${isActive ? 'text-accent' : 'text-white/40'}`
            }
          >
            <span className="text-xl leading-none">🎵</span>
            Library
          </NavLink>
          <NavLink
            to="/player"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-6 py-2 text-[10px] font-medium transition-colors ${isActive ? 'text-accent' : 'text-white/40'}`
            }
          >
            <span className="text-xl leading-none">▶</span>
            Player
          </NavLink>
        </nav>
      )}
    </div>
  )
}
