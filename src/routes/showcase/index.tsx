import { createFileRoute, Link } from '@tanstack/react-router'
import { Component, FormInput, Table2, BarChart3, Palette } from 'lucide-react'

export const Route = createFileRoute('/showcase/')({
  component: ShowcaseOverview,
})

const sections = [
  {
    title: 'Primitives',
    description: 'Basic UI building blocks - buttons, inputs, cards, dialogs',
    href: '/showcase/primitives',
    icon: Component,
  },
  {
    title: 'Forms',
    description: 'Form layouts, validation states, field types',
    href: '/showcase/forms',
    icon: FormInput,
  },
  {
    title: 'Tables',
    description: 'Data tables with sorting, filtering, pagination',
    href: '/showcase/tables',
    icon: Table2,
  },
  {
    title: 'Charts',
    description: 'Bar charts, line charts, pie charts, KPI cards',
    href: '/showcase/charts',
    icon: BarChart3,
  },
  {
    title: 'Colors',
    description: 'Color palette and theme tokens',
    href: '/showcase/colors',
    icon: Palette,
  },
]

function ShowcaseOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Component Showcase</h1>
        <p className="text-muted-foreground mt-2">
          Visual reference for all Zeshark UI components. Use this to design and iterate
          on the look and feel without needing real data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            to={section.href}
            className="group block p-6 border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-md bg-primary/10 text-primary">
                <section.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold group-hover:text-primary transition-colors">
                  {section.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {section.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-medium">Quick Setup</h3>
        <p className="text-sm text-muted-foreground mt-1">
          If components are missing, run:
        </p>
        <pre className="mt-2 p-2 bg-background rounded text-sm font-mono">
          pnpm setup-ui
        </pre>
      </div>
    </div>
  )
}
