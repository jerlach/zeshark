import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/showcase/colors')({
  component: ColorsShowcase,
})

function ColorSwatch({ 
  name, 
  variable, 
  className 
}: { 
  name: string
  variable: string
  className: string 
}) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-lg border ${className}`} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground font-mono">{variable}</p>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { 
  title: string
  description?: string
  children: React.ReactNode 
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function ColorsShowcase() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Colors</h1>
        <p className="text-muted-foreground mt-2">
          Theme colors and design tokens used throughout the application
        </p>
      </div>

      {/* Base Colors */}
      <Section title="Base Colors" description="Primary background and foreground colors">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <ColorSwatch
            name="Background"
            variable="--background"
            className="bg-background"
          />
          <ColorSwatch
            name="Foreground"
            variable="--foreground"
            className="bg-foreground"
          />
          <ColorSwatch
            name="Card"
            variable="--card"
            className="bg-card"
          />
          <ColorSwatch
            name="Card Foreground"
            variable="--card-foreground"
            className="bg-card-foreground"
          />
        </div>
      </Section>

      {/* Primary Colors */}
      <Section title="Primary Colors" description="Main brand and accent colors">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <ColorSwatch
            name="Primary"
            variable="--primary"
            className="bg-primary"
          />
          <ColorSwatch
            name="Primary Foreground"
            variable="--primary-foreground"
            className="bg-primary-foreground border-2"
          />
          <ColorSwatch
            name="Secondary"
            variable="--secondary"
            className="bg-secondary"
          />
          <ColorSwatch
            name="Secondary Foreground"
            variable="--secondary-foreground"
            className="bg-secondary-foreground"
          />
        </div>
      </Section>

      {/* Semantic Colors */}
      <Section title="Semantic Colors" description="Colors with specific meaning">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <ColorSwatch
            name="Destructive"
            variable="--destructive"
            className="bg-destructive"
          />
          <ColorSwatch
            name="Destructive Foreground"
            variable="--destructive-foreground"
            className="bg-destructive-foreground border-2"
          />
          <ColorSwatch
            name="Muted"
            variable="--muted"
            className="bg-muted"
          />
          <ColorSwatch
            name="Muted Foreground"
            variable="--muted-foreground"
            className="bg-muted-foreground"
          />
        </div>
      </Section>

      {/* UI Colors */}
      <Section title="UI Colors" description="Colors for interactive elements">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <ColorSwatch
            name="Accent"
            variable="--accent"
            className="bg-accent"
          />
          <ColorSwatch
            name="Accent Foreground"
            variable="--accent-foreground"
            className="bg-accent-foreground"
          />
          <ColorSwatch
            name="Border"
            variable="--border"
            className="bg-border"
          />
          <ColorSwatch
            name="Ring"
            variable="--ring"
            className="bg-ring"
          />
        </div>
      </Section>

      {/* Status Colors */}
      <Section title="Status Colors" description="Colors for indicating status (custom additions)">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-green-500" />
            <div>
              <p className="text-sm font-medium">Success</p>
              <p className="text-xs text-muted-foreground font-mono">green-500</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-yellow-500" />
            <div>
              <p className="text-sm font-medium">Warning</p>
              <p className="text-xs text-muted-foreground font-mono">yellow-500</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-red-500" />
            <div>
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs text-muted-foreground font-mono">red-500</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-blue-500" />
            <div>
              <p className="text-sm font-medium">Info</p>
              <p className="text-xs text-muted-foreground font-mono">blue-500</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-orange-500" />
            <div>
              <p className="text-sm font-medium">Pending</p>
              <p className="text-xs text-muted-foreground font-mono">orange-500</p>
            </div>
          </div>
        </div>
      </Section>

      {/* Color in Context */}
      <Section title="Colors in Context" description="How colors look when applied">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Text Examples */}
          <div className="p-6 border rounded-lg space-y-3">
            <h3 className="font-medium mb-4">Text Colors</h3>
            <p className="text-foreground">Default text (foreground)</p>
            <p className="text-muted-foreground">Muted text (muted-foreground)</p>
            <p className="text-primary">Primary text (primary)</p>
            <p className="text-destructive">Destructive text (destructive)</p>
            <p className="text-green-600">Success text (green-600)</p>
            <p className="text-yellow-600">Warning text (yellow-600)</p>
          </div>

          {/* Background Examples */}
          <div className="p-6 border rounded-lg space-y-3">
            <h3 className="font-medium mb-4">Backgrounds</h3>
            <div className="p-3 rounded bg-background border">Background</div>
            <div className="p-3 rounded bg-muted">Muted</div>
            <div className="p-3 rounded bg-accent">Accent</div>
            <div className="p-3 rounded bg-primary text-primary-foreground">Primary</div>
            <div className="p-3 rounded bg-secondary text-secondary-foreground">Secondary</div>
            <div className="p-3 rounded bg-destructive text-destructive-foreground">Destructive</div>
          </div>
        </div>
      </Section>

      {/* Gradients */}
      <Section title="Gradients" description="Example gradient combinations">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500" />
            <p className="text-sm text-muted-foreground">Blue to Purple</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-green-500 to-teal-500" />
            <p className="text-sm text-muted-foreground">Green to Teal</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-orange-500 to-red-500" />
            <p className="text-sm text-muted-foreground">Orange to Red</p>
          </div>
        </div>
      </Section>

      {/* Opacity Scale */}
      <Section title="Opacity Scale" description="Primary color at different opacities">
        <div className="flex gap-2">
          {[100, 80, 60, 40, 20, 10, 5].map((opacity) => (
            <div key={opacity} className="flex-1 space-y-2">
              <div 
                className="h-16 rounded-lg bg-primary" 
                style={{ opacity: opacity / 100 }}
              />
              <p className="text-xs text-center text-muted-foreground">{opacity}%</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Usage Guide */}
      <Section title="Usage Guide" description="When to use each color">
        <div className="p-6 border rounded-lg bg-muted/50 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm mb-2">Primary</h4>
              <p className="text-sm text-muted-foreground">
                Use for main CTAs, links, and primary actions. Should draw attention.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Secondary</h4>
              <p className="text-sm text-muted-foreground">
                Use for secondary buttons, less important actions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Destructive</h4>
              <p className="text-sm text-muted-foreground">
                Use for delete actions, errors, and warnings that need attention.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Muted</h4>
              <p className="text-sm text-muted-foreground">
                Use for disabled states, placeholder text, and de-emphasized content.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Accent</h4>
              <p className="text-sm text-muted-foreground">
                Use for hover states, selected items, and subtle highlights.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2">Border</h4>
              <p className="text-sm text-muted-foreground">
                Use for dividers, card borders, and input outlines.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}
