import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useLiveQuery } from '@tanstack/react-db'
import {
  Search,
  Plus,
  ArrowRight,
  Package,
  Users,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useCommandMenuStore } from '@/stores/command-menu.store'
import { getSearchableResources, type ResourceEntry } from '@/lib/registry'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  Package,
  Users,
  FileText,
}

export function CommandMenu() {
  const { isOpen, close } = useCommandMenuStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        useCommandMenuStore.getState().toggle()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Get searchable resources from registry
  const searchableResources = useMemo(() => getSearchableResources(), [])

  const handleSelect = (callback: () => void) => {
    close()
    callback()
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput
        placeholder="Search everything..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          {searchableResources.map((resource) => (
            <CommandItem
              key={`new-${resource.config.name}`}
              onSelect={() =>
                handleSelect(() => navigate({ to: resource.routes.new }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New {resource.config.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Go to">
          {searchableResources.map((resource) => {
            const Icon = iconMap[resource.config.icon ?? 'Package'] ?? Package
            return (
              <CommandItem
                key={`goto-${resource.config.name}`}
                onSelect={() =>
                  handleSelect(() => navigate({ to: resource.routes.list }))
                }
              >
                <Icon className="mr-2 h-4 w-4" />
                {resource.config.pluralName.charAt(0).toUpperCase() +
                  resource.config.pluralName.slice(1)}
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </CommandItem>
            )
          })}
        </CommandGroup>

        {/* Search Results (only when searching) */}
        {search.length >= 2 && (
          <>
            <CommandSeparator />
            {searchableResources.map((resource) => (
              <SearchResultsGroup
                key={`results-${resource.config.name}`}
                resource={resource}
                search={search}
                onSelect={(id) =>
                  handleSelect(() =>
                    navigate({ to: resource.routes.edit(id) })
                  )
                }
              />
            ))}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Search results for a single resource
function SearchResultsGroup({
  resource,
  search,
  onSelect,
}: {
  resource: ResourceEntry
  search: string
  onSelect: (id: string) => void
}) {
  const searchConfig = resource.config.search
  if (!searchConfig) return null

  // Query this resource's collection with search
  const { data: results } = useLiveQuery((q) => {
    if (!resource.collection) return []

    const searchFields = searchConfig.searchableFields
    const searchLower = search.toLowerCase()

    return q
      .from({ item: resource.collection as Parameters<typeof q.from>[0] })
      .where(({ item }) =>
        searchFields.some((field) =>
          String((item as Record<string, unknown>)[field] ?? '')
            .toLowerCase()
            .includes(searchLower)
        )
      )
      .limit(5)
  })

  if (!results?.length) return null

  const Icon = iconMap[resource.config.icon ?? 'Package'] ?? Package

  return (
    <CommandGroup
      heading={
        resource.config.pluralName.charAt(0).toUpperCase() +
        resource.config.pluralName.slice(1)
      }
    >
      {results.map((item) => {
        const id = (item as Record<string, unknown>).id as string
        const label = String(
          (item as Record<string, unknown>)[searchConfig.resultLabelField]
        )
        const description = searchConfig.resultDescriptionField
          ? String(
              (item as Record<string, unknown>)[
                searchConfig.resultDescriptionField
              ]
            )
          : undefined

        return (
          <CommandItem key={id} onSelect={() => onSelect(id)}>
            <Icon className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>{label}</span>
              {description && (
                <span className="text-xs text-muted-foreground">
                  {description}
                </span>
              )}
            </div>
          </CommandItem>
        )
      })}
    </CommandGroup>
  )
}
