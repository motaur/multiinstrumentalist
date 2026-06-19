import { Outlet, NavLink, useLocation } from 'react-router-dom'

function NavIcon({ label, icon, to }: { label: string; icon: string; to: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-0.5 px-6 py-2 text-[10px] font-medium transition-colors ${
          isActive ? 'text-accent' : 'text-white/40'
        }`
      }
    >
      <span className="text-xl leading-none">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function Layout() {
  const location = useLocation()
  const isPlayer = location.pathname.startsWith('/player/')

  return (
    <div className="flex flex-col h-screen bg-surface text-white">
      {/* Page content fills all space above the bottom nav */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Bottom navigation — hidden on player screen (player has its own back button) */}
      {!isPlayer && (
        <nav
          className="flex justify-around bg-surface-raised border-t border-surface-overlay shrink-0"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <NavIcon to="/library" icon="🎵" label="Library" />
          <NavIcon to="/player" icon="▶" label="Player" />
        </nav>
      )}
    </div>
  )
}
