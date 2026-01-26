import { useMatches } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export function SiteHeader() {
  // Get current route for dynamic title
  const matches = useMatches()
  const currentMatch = matches[matches.length - 1]
  
  // Extract page title from route context or path
  const getPageTitle = () => {
    const path = currentMatch?.pathname || '/'
    if (path === '/' || path === '/_app') return 'Dashboard'
    // Convert path like /orders to "Orders"
    const segment = path.split('/').filter(Boolean).pop() || 'Dashboard'
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-base font-medium">
                {getPageTitle()}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
