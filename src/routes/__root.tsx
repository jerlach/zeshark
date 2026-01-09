import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { CommandMenu } from '@/components/shared/command-menu'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <CommandMenu />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  )
}
