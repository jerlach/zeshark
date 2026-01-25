import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import {
  LayoutGrid,
  FormInput,
  Table2,
  BarChart3,
  Component,
  Palette,
} from 'lucide-react'

export const Route = createFileRoute('/_showcase')({
  component: ShowcaseLayout,
})

const showcaseNav = [
  { title: 'Overview', href: '/showcase', icon: LayoutGrid },
  { title: 'Primitives', href: '/showcase/primitives', icon: Component },
  { title: 'Forms', href: '/showcase/forms', icon: FormInput },
  { title: 'Tables', href: '/showcase/tables', icon: Table2 },
  { title: 'Charts', href: '/showcase/charts', icon: BarChart3 },
  { title: 'Colors', href: '/showcase/colors', icon: Palette },
]

function ShowcaseLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link to="/" className="text-xl font-bold">
              🦈 Zeshark
            </Link>
            <p className="text-xs text-muted-foreground mt-1">Component Showcase</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {showcaseNav.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      '[&.active]:bg-accent [&.active]:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8 max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
