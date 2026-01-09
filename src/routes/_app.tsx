import { Outlet, createFileRoute, Link } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommandMenuStore } from '@/stores/command-menu.store'
import { mainNavigation } from '@/lib/navigation'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  const { open } = useCommandMenuStore()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b">
            <Link to="/" className="text-xl font-bold">
              🦈 Zeshark
            </Link>
          </div>

          {/* Search button */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={open}
            >
              <Search className="mr-2 h-4 w-4" />
              Search...
              <kbd className="ml-auto text-xs">⌘K</kbd>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-6">
            {mainNavigation.map((section) => (
              <div key={section.title}>
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors',
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
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-6 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
