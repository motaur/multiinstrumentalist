import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-surface text-white">
      <header className="flex items-center gap-6 px-6 py-3 bg-surface-raised border-b border-surface-overlay shrink-0">
        <span className="text-accent font-semibold text-lg tracking-tight">
          MultiInstrumental
        </span>
        <nav className="flex gap-4 text-sm">
          <NavLink
            to="/library"
            className={({ isActive }) =>
              isActive ? 'text-white font-medium' : 'text-white/50 hover:text-white'
            }
          >
            Library
          </NavLink>
          <NavLink
            to="/player"
            className={({ isActive }) =>
              isActive ? 'text-white font-medium' : 'text-white/50 hover:text-white'
            }
          >
            Player
          </NavLink>
        </nav>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
