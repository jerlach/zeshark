import { Outlet, createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import {
  IconLayoutGrid,
  IconForms,
  IconTable,
  IconChartBar,
  IconPalette,
  IconArrowLeft,
} from '@tabler/icons-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/showcase')({
  component: ShowcaseLayout,
})

const showcaseNav = [
  { title: 'Overview', href: '/showcase', icon: IconLayoutGrid },
  { title: 'Tables', href: '/showcase/tables', icon: IconTable },
  { title: 'Forms', href: '/showcase/forms', icon: IconForms },
  { title: 'Charts', href: '/showcase/charts', icon: IconChartBar },
  { title: 'Colors', href: '/showcase/colors', icon: IconPalette },
]

function ShowcaseSidebar() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link to="/showcase">
                <span className="text-xl">🎨</span>
                <div className="flex flex-col">
                  <span className="text-base font-semibold">Showcase</span>
                  <span className="text-xs text-muted-foreground">Component Library</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Components</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {showcaseNav.map((item) => {
                const isActive = currentPath === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Back to App">
              <Link to="/">
                <IconArrowLeft />
                <span>Back to App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function ShowcaseHeader() {
  const router = useRouterState()
  const currentPath = router.location.pathname
  
  const getPageTitle = () => {
    const item = showcaseNav.find(n => n.href === currentPath)
    return item?.title || 'Showcase'
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{getPageTitle()}</h1>
      </div>
    </header>
  )
}

function ShowcaseLayout() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <ShowcaseSidebar />
      <SidebarInset>
        <ShowcaseHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
