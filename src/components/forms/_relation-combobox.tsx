import { useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getResource } from '@/lib/registry'
import { useLiveQuery } from '@tanstack/react-db'

export type RelationComboboxProps = {
  resourceName: string
  labelField: string
  searchFields?: string[]
  value: string | null | undefined
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  error?: string
}

export function RelationCombobox({
  resourceName,
  labelField,
  searchFields = [labelField],
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  error,
}: RelationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Get collection from registry
  const resource = getResource(resourceName)

  // Query the related collection
  const { data: items = [], isLoading } = useLiveQuery((q) => {
    if (!resource?.collection) return []

    let query = q.from({ item: resource.collection as Parameters<typeof q.from>[0] })

    // Apply search filter if searching
    if (search) {
      query = query.where(({ item }) => {
        const searchLower = search.toLowerCase()
        return searchFields.some((field) =>
          String((item as Record<string, unknown>)[field] ?? '')
            .toLowerCase()
            .includes(searchLower)
        )
      })
    }

    // Limit results
    query = query.limit(50)

    return query
  })

  // Find selected item for display
  const selectedItem = items?.find(
    (item) => (item as Record<string, unknown>).id === value
  )

  if (!resource) {
    return (
      <div className="text-sm text-muted-foreground">
        Resource "{resourceName}" not found in registry
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive'
          )}
        >
          {selectedItem
            ? String((selectedItem as Record<string, unknown>)[labelField])
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${resourceName}...`}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : items?.length === 0 ? (
              <CommandEmpty>No {resourceName} found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items?.map((item) => {
                  const itemId = (item as Record<string, unknown>).id as string
                  const itemLabel = String(
                    (item as Record<string, unknown>)[labelField]
                  )
                  const secondaryField =
                    searchFields.length > 1 && searchFields[1] !== labelField
                      ? searchFields[1]
                      : null

                  return (
                    <CommandItem
                      key={itemId}
                      value={itemId}
                      onSelect={() => {
                        onChange(itemId === value ? null : itemId)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === itemId ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{itemLabel}</span>
                        {secondaryField && (
                          <span className="text-xs text-muted-foreground">
                            {String(
                              (item as Record<string, unknown>)[secondaryField]
                            )}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
