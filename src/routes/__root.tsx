import { Outlet, createRootRoute } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { DbProvider } from '@tanstack/react-db'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'
import { db } from '@/lib/db-client'
import { CommandMenu } from '@/components/shared/command-menu'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <DbProvider db={db}>
        <Outlet />
        <CommandMenu />
        <Toaster position="bottom-right" />
      </DbProvider>
    </QueryClientProvider>
  )
}
