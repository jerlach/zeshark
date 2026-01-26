import type { ParsedResource } from '../utils/schema-parser'

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Map icon names to tabler icons
const ICON_MAP: Record<string, string> = {
  DollarSign: 'IconCurrencyDollar',
  ShoppingCart: 'IconShoppingCart',
  TrendingUp: 'IconTrendingUp',
  Clock: 'IconClock',
  Users: 'IconUsers',
  Package: 'IconPackage',
  FileText: 'IconFileText',
  Activity: 'IconActivity',
  BarChart: 'IconChartBar',
  PieChart: 'IconChartPie',
  Hash: 'IconHash',
  Percent: 'IconPercentage',
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
  const iconSet = new Set<string>(['IconArrowLeft'])
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
      const iconComponent = k.icon && ICON_MAP[k.icon] ? ICON_MAP[k.icon] : 'IconActivity'
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

  // Generate time series chart components with interactive controls
  const timeSeriesChartComponents = timeSeriesCharts
    .map((c, i) => {
      const varName = `timeSeries${i}Data`
      const loadingVar = `timeSeries${i}Loading`
      const stateVar = `timeRange${i}`
      const chartConfig = `{ value: { label: '${c.metric}', color: 'var(--primary)' } }`

      let chartJsx = ''
      if (c.type === 'area') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="aspect-auto h-[250px] w-full">
                <AreaChart data={filtered${i}Data}>
                  <defs>
                    <linearGradient id="fillValue${i}" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    type="natural"
                    dataKey="value"
                    fill="url(#fillValue${i})"
                    stroke="var(--primary)"
                  />
                </AreaChart>
              </ChartContainer>`
      } else if (c.type === 'bar') {
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="aspect-auto h-[250px] w-full">
                <BarChart data={filtered${i}Data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        indicator="dot"
                      />
                    }
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={4} />
                </BarChart>
              </ChartContainer>`
      } else {
        // line chart default
        chartJsx = `
              <ChartContainer config={${chartConfig}} className="aspect-auto h-[250px] w-full">
                <LineChart data={filtered${i}Data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(v) => {
                      const date = new Date(v)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        indicator="dot"
                      />
                    }
                  />
                  <Line
                    type="natural"
                    dataKey="value"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>`
      }

      return `
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>${c.title}</CardTitle>
            ${c.description ? `<CardDescription className="hidden @[540px]/card:block">${c.description}</CardDescription>` : ''}
            <CardAction>
              <ToggleGroup
                type="single"
                value={${stateVar}}
                onValueChange={set${capitalize(stateVar)}}
                variant="outline"
                className="hidden *:data-[slot=toggle-group-item]:!px-4 @[600px]/card:flex"
              >
                <ToggleGroupItem value="90d">3 months</ToggleGroupItem>
                <ToggleGroupItem value="30d">30 days</ToggleGroupItem>
                <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
              </ToggleGroup>
              <Select value={${stateVar}} onValueChange={set${capitalize(stateVar)}}>
                <SelectTrigger className="w-36 @[600px]/card:hidden" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {${loadingVar} ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
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

  // Generate time range state variables for each time series chart
  const timeRangeStates = timeSeriesCharts
    .map((_, i) => `const [timeRange${i}, setTimeRange${i}] = useState('90d')`)
    .join('\n  ')

  // Generate filtered data for each time series chart
  const filteredDataFns = timeSeriesCharts
    .map((_, i) => `
  const filtered${i}Data = useMemo(() => {
    if (!timeSeries${i}Data) return []
    const now = new Date()
    let daysToSubtract = 90
    if (timeRange${i} === '30d') daysToSubtract = 30
    else if (timeRange${i} === '7d') daysToSubtract = 7
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return timeSeries${i}Data.filter((item: { date: string }) => new Date(item.date) >= startDate)
  }, [timeSeries${i}Data, timeRange${i}])`)
    .join('\n')

  return `// 🔄 GENERATED by codegen - Analytics Dashboard

import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ${rechartsImportList},
} from 'recharts'
import { ${iconImports} } from '@tabler/icons-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
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
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function ${displayName}AnalyticsPage() {
  // Time range states for interactive charts
  ${timeRangeStates}

  // KPI Metrics
  const { data: kpis, isLoading: kpisLoading } = useKPIMetrics({
    baseUrl: API_URL,
    metrics: [
      ${kpiMetricsArray}
    ],
  })
${groupedHooks}
${timeSeriesHooks}
${filteredDataFns}

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/${pluralName}">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">${displayName} Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Real-time insights powered by DuckDB
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-${Math.min(kpis.length, 4)}">
        ${kpiCards}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        ${groupedChartComponents}
      </div>

      {/* Time Series Charts - Full Width */}
      <div className="flex flex-col gap-4">
        ${timeSeriesChartComponents}
      </div>
    </div>
  )
}
`
}
