import { useLiveQuery } from '@tanstack/react-db'
import { getResource } from '@/lib/registry'

type RelationCellProps = {
  resourceName: string
  id: string | null | undefined
  labelField: string
}

/**
 * Display a relation field value by fetching from the related collection
 */
export function RelationCell({ resourceName, id, labelField }: RelationCellProps) {
  const resource = getResource(resourceName)

  const { data } = useLiveQuery((q) => {
    if (!resource?.collection || !id) return []

    return q
      .from({ item: resource.collection as Parameters<typeof q.from>[0] })
      .where(({ item }) => (item as Record<string, unknown>).id === id)
  })

  const item = data?.[0]

  if (!id) {
    return <span className="text-muted-foreground">-</span>
  }

  if (!item) {
    return <span className="text-muted-foreground">Loading...</span>
  }

  return <span>{String((item as Record<string, unknown>)[labelField])}</span>
}
