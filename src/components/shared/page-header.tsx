import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PageHeaderProps = {
  title: string
  description?: string
  action?: React.ReactNode
  backLink?: string
}

export function PageHeader({
  title,
  description,
  action,
  backLink,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        {backLink && (
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to={backLink}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
