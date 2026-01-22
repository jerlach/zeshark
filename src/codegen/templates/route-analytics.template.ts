import type { ParsedResource } from '../utils/schema-parser'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Map icon names to lucide imports
const ICON_MAP: Record<string, string> = {
  DollarSign: 'DollarSign',
  ShoppingCart: 'ShoppingCart',
  TrendingUp: 'TrendingUp',
  Clock: 'Clock',
  Users: 'Users',
  Package: 'Package',
  FileText: 'FileText',
  Activity: 'Activity',
  BarChart: 'BarChart3',
  PieChart: 'PieChartIcon',
  Hash: 'Hash',
  Percent: 'Percent',
}

export function generateRouteAnalytics(resource: ParsedResource): string | null {
  const { config } = resource
  const { name, pluralName, analytics, dataSource } = config

  // Only generate for parquet resources with analytics enabled
  if (dataSource !== 'parquet' || !analytics?.enabled) {
    return null
  }

  const typeName = capitalize(name)
  const displayName = capitalize(pluralName)

  const kpis = analytics.kpis ?? []
  const groupedCharts = analytics.groupedCharts ?? []
  const timeSeriesCharts = analytics.timeSeriesCharts ?? []

  // Collect unique icons needed
  const iconSet = new Set<string>(['ArrowLeft'])
  for (const kpi of kpis) {
    if (kpi.icon && ICON_MAP[kpi.icon]) {
      iconSet.add(ICON_MAP[kpi.icon])
    }
  }
  const iconImports = Array.from(iconSet).join(', ')

  // Generate KPI metrics config
  const kpiMetricsArray = kpis
    .map(
      (k) => {
        // Escape single quotes in SQL for the template string
        const escapedSql = k.sql.replace(/'/g, "\\'") 
        return `{ name: '${k.name}', sql: '${escapedSql}', label: '${k.label}', format: '${k.format ?? 'number'}' }`
      }
    )
    .join(',\n      ')

  // Generate KPI cards
  const kpiCards = kpis
    .map((k, i) => {
      const iconComponent = k.icon && ICON_MAP[k.icon] ? ICON_MAP[k.icon] : 'Activity'
      const formatFn = k.format === 'currency' ? 'formatCurrency' : 'formatNumber'
      return `
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">${k.label}</CardTitle>
            <${iconComponent} className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisLoading ? '...' : ${formatFn}(Number(kpis[${i}]?.value ?? 0))}
            </div>
          </CardContent>
        </Card>`
    })
    .join('\n')

  // Generate grouped chart hooks
  const groupedHooks = groupedCharts
    .map((c, i) => {
      const varName = `grouped${i}Data`
      const loadingVar = `grouped${i}Loading`
      return `
  const { data: ${varName}, isLoading: ${loadingVar} } = useGroupedAnalytics({
    baseUrl: API_URL,
    groupBy: '${c.groupBy}',
    metric: '${c.metric}',
    metricSql: '${c.metricSql}',
    limit: ${c.limit ?? 10},
  })`
    })
    .join('\n')

  // Generate time series hooks
  const timeSeriesHooks = timeSeriesCharts
    .map((c, i) => {
      const varName = `timeSeries${i}Data`
      const loadingVar = `timeSeries${i}Loading`
      return `
  const { data: ${varName}, isLoading: ${loadingVar} } = useTimeSeriesAnalytics({
    baseUrl: API_URL,
    dateField: '${c.dateField}',
    metric: '${c.metric}',
    metricSql: '${c.metricSql}',
    granularity: '${c.granularity ?? 'month'}',
  })`
    })
    .join('\n')

  // Generate grouped chart components
  const groupedChartComponents = groupedCharts
    .map((c, i) => {
      const varName = `grouped${i}Data`
      const loadingVar = `grouped${i}Loading`
      const chartConfig = `{ value: { label: '${c.metric}' } }`

      let chartJsx = ''
      if (c.type === 'pie' || c.type === 'donut') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <PieChart>
                  <Pie
                    data={${varName} ?? []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    ${c.type === 'donut' ? 'innerRadius={60} ' : ''}outerRadius={100}
                    label={({ name, value }) => \`\${name}: \${value}\`}
                  >
                    {(${varName} ?? []).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>`
      } else if (c.type === 'horizontal-bar') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <BarChart data={${varName} ?? []} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={4}>
                    {(${varName} ?? []).map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>`
      } else {
        // default bar
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <BarChart data={${varName} ?? []}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS[0]} radius={4} />
                </BarChart>
              </ChartContainer>`
      }

      return `
        <Card>
          <CardHeader>
            <CardTitle>${c.title}</CardTitle>
            ${c.description ? `<CardDescription>${c.description}</CardDescription>` : ''}
          </CardHeader>
          <CardContent>
            {${loadingVar} ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (${chartJsx}
            )}
          </CardContent>
        </Card>`
    })
    .join('\n')

  // Generate time series chart components
  const timeSeriesChartComponents = timeSeriesCharts
    .map((c, i) => {
      const varName = `timeSeries${i}Data`
      const loadingVar = `timeSeries${i}Loading`
      const chartConfig = `{ value: { label: '${c.metric}', color: COLORS[${i % 5}] } }`

      let chartJsx = ''
      if (c.type === 'area') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <AreaChart data={${varName} ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[${i % 5}]}
                    fill={COLORS[${i % 5}]}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>`
      } else if (c.type === 'bar') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <BarChart data={${varName} ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS[${i % 5}]} radius={4} />
                </BarChart>
              </ChartContainer>`
      } else {
        // line chart default
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="h-[300px]">
                <LineChart data={${varName} ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    }}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={COLORS[${i % 5}]}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>`
      }

      return `
        <Card>
          <CardHeader>
            <CardTitle>${c.title}</CardTitle>
            ${c.description ? `<CardDescription>${c.description}</CardDescription>` : ''}
          </CardHeader>
          <CardContent>
            {${loadingVar} ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : (${chartJsx}
            )}
          </CardContent>
        </Card>`
    })
    .join('\n')

  // Determine recharts imports needed
  const rechartsImports = new Set<string>(['XAxis', 'YAxis'])
  for (const c of groupedCharts) {
    if (c.type === 'pie' || c.type === 'donut') {
      rechartsImports.add('Pie')
      rechartsImports.add('PieChart')
      rechartsImports.add('Cell')
    } else {
      rechartsImports.add('Bar')
      rechartsImports.add('BarChart')
      if (c.type === 'horizontal-bar') {
        // already covered
      } else {
        rechartsImports.add('Cell')
      }
    }
  }
  for (const c of timeSeriesCharts) {
    rechartsImports.add('CartesianGrid')
    if (c.type === 'area') {
      rechartsImports.add('Area')
      rechartsImports.add('AreaChart')
    } else if (c.type === 'bar') {
      rechartsImports.add('Bar')
      rechartsImports.add('BarChart')
    } else {
      rechartsImports.add('Line')
      rechartsImports.add('LineChart')
    }
  }

  const rechartsImportList = Array.from(rechartsImports).join(',\n  ')

  // Arrange charts in 2-column grid
  const allCharts = [...groupedChartComponents.split('</Card>').filter(Boolean).map(c => c + '</Card>')]
  const timeCharts = [...timeSeriesChartComponents.split('</Card>').filter(Boolean).map(c => c + '</Card>')]

  return `// 🔄 GENERATED by codegen - Analytics Dashboard

import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ${rechartsImportList},
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ${iconImports} } from 'lucide-react'
import {
  useKPIMetrics,
  useGroupedAnalytics,
  useTimeSeriesAnalytics,
} from '@/hooks/use-analytics-query'

export const Route = createFileRoute('/_app/${pluralName}/analytics')({
  component: ${displayName}AnalyticsPage,
})

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const API_URL = \`\${API_BASE}/${pluralName}\`

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

function ${displayName}AnalyticsPage() {
  // KPI Metrics
  const { data: kpis, isLoading: kpisLoading } = useKPIMetrics({
    baseUrl: API_URL,
    metrics: [
      ${kpiMetricsArray}
    ],
  })
${groupedHooks}
${timeSeriesHooks}

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/${pluralName}">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">${displayName} Analytics</h1>
            <p className="text-muted-foreground">
              Real-time insights powered by DuckDB
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-${Math.min(kpis.length, 4)}">
        ${kpiCards}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        ${groupedChartComponents}
        ${timeSeriesChartComponents}
      </div>
    </div>
  )
}
`
}
