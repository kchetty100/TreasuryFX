import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowRightLeft,
  LineChart,
  BriefcaseBusiness,
  ShieldAlert,
  Star,
  Bell,
  Settings,
  Moon,
  Sun,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Treasury Dashboard' },
  { to: '/exposures', icon: BriefcaseBusiness, label: 'Exposures' },
  { to: '/risk', icon: ShieldAlert, label: 'Risk Summary' },
  { to: '/converter', icon: ArrowRightLeft, label: 'FX Converter' },
  { to: '/trends', icon: LineChart, label: 'Rate Trends' },
  { to: '/watchlist', icon: Star, label: 'Watchlist' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { darkMode, toggleDarkMode } = useTheme()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">FX</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">TreasuryFX</h1>
          <p className="text-[10px] text-muted-foreground">Exposure Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="w-full justify-start gap-3">
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
    </aside>
  )
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="sticky top-0 z-30 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">TFX</span>
          </div>
          <div>
            <h1 className="text-sm font-bold">TreasuryFX</h1>
            <p className="text-[10px] text-muted-foreground">Exposure Intelligence</p>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <main className="min-h-screen lg:ml-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
