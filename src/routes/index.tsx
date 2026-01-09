import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">🦈 Zeshark</h1>
        <p className="text-muted-foreground max-w-md">
          Schema-first, codegen-powered SPA framework built on TanStack libraries.
        </p>
        <div className="text-sm text-muted-foreground">
          Press <kbd className="px-2 py-1 bg-muted rounded">⌘K</kbd> to open command menu
        </div>
      </div>
    </div>
  )
}
