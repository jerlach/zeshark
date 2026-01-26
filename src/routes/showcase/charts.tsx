import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export const Route = createFileRoute('/showcase/charts')({
  component: ChartsShowcase,
})

// Mock data with date for time filtering
const monthlyRevenue = [
  { month: 'Jan', date: '2025-01-15', revenue: 45000, orders: 120 },
  { month: 'Feb', date: '2025-02-15', revenue: 52000, orders: 145 },
  { month: 'Mar', date: '2025-03-15', revenue: 48000, orders: 130 },
  { month: 'Apr', date: '2025-04-15', revenue: 61000, orders: 165 },
  { month: 'May', date: '2025-05-15', revenue: 55000, orders: 150 },
  { month: 'Jun', date: '2025-06-15', revenue: 67000, orders: 180 },
  { month: 'Jul', date: '2025-07-15', revenue: 72000, orders: 195 },
  { month: 'Aug', date: '2025-08-15', revenue: 69000, orders: 185 },
  { month: 'Sep', date: '2025-09-15', revenue: 78000, orders: 210 },
  { month: 'Oct', date: '2025-10-15', revenue: 82000, orders: 225 },
  { month: 'Nov', date: '2025-11-15', revenue: 95000, orders: 260 },
  { month: 'Dec', date: '2025-12-15', revenue: 110000, orders: 300 },
]

const categoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Home & Garden', value: 20 },
  { name: 'Sports', value: 12 },
  { name: 'Other', value: 8 },
]

const statusData = [
  { name: 'Fulfilled', value: 450, color: '#22c55e' },
  { name: 'Pending', value: 120, color: '#eab308' },
  { name: 'Cancelled', value: 30, color: '#ef4444' },
]

const dealershipData = [
  { name: 'Dealership A', revenue: 125000 },
  { name: 'Dealership B', revenue: 98000 },
  { name: 'Dealership C', revenue: 87000 },
  { name: 'Dealership D', revenue: 76000 },
  { name: 'Dealership E', revenue: 65000 },
]

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

// Chart configs matching codegen output
const revenueChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--primary)',
  },
  orders: {
    label: 'Orders',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const categoryChartConfig = {
  value: {
    label: 'Share',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

const dealershipChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'var(--primary)',
  },
} satisfies ChartConfig

function ChartsShowcase() {
  const [revenueTimeRange, setRevenueTimeRange] = useState('12m')
  const [ordersTimeRange, setOrdersTimeRange] = useState('12m')

  // Filter data based on time range
  const filteredRevenueData = useMemo(() => {
    const now = new Date('2025-12-31')
    const months = revenueTimeRange === '3m' ? 3 : revenueTimeRange === '6m' ? 6 : 12
    const startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - months)
    return monthlyRevenue.filter(item => new Date(item.date) >= startDate)
  }, [revenueTimeRange])

  const filteredOrdersData = useMemo(() => {
    const now = new Date('2025-12-31')
    const months = ordersTimeRange === '3m' ? 3 : ordersTimeRange === '6m' ? 6 : 12
    const startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - months)
    return monthlyRevenue.filter(item => new Date(item.date) >= startDate)
  }, [ordersTimeRange])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Charts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Interactive charts with ChartContainer - matching codegen output
        </p>
      </div>

      {/* Interactive Area Chart with Time Range */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Revenue performance with gradient fill</CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={revenueTimeRange}
              onValueChange={setRevenueTimeRange}
              variant="outline"
              className="hidden @[540px]/card:flex"
            >
              <ToggleGroupItem value="12m" className="h-8 px-2.5">12 months</ToggleGroupItem>
              <ToggleGroupItem value="6m" className="h-8 px-2.5">6 months</ToggleGroupItem>
              <ToggleGroupItem value="3m" className="h-8 px-2.5">3 months</ToggleGroupItem>
            </ToggleGroup>
            <Select value={revenueTimeRange} onValueChange={setRevenueTimeRange}>
              <SelectTrigger className="w-32 @[540px]/card:hidden" aria-label="Select time range">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12m">12 months</SelectItem>
                <SelectItem value="6m">6 months</SelectItem>
                <SelectItem value="3m">3 months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={revenueChartConfig} className="aspect-auto h-64 w-full">
            <AreaChart data={filteredRevenueData}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => value}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Interactive Line Chart with Time Range */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Order Volume</CardTitle>
          <CardDescription>Number of orders per month</CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={ordersTimeRange}
              onValueChange={setOrdersTimeRange}
              variant="outline"
              className="hidden @[540px]/card:flex"
            >
              <ToggleGroupItem value="12m" className="h-8 px-2.5">12 months</ToggleGroupItem>
              <ToggleGroupItem value="6m" className="h-8 px-2.5">6 months</ToggleGroupItem>
              <ToggleGroupItem value="3m" className="h-8 px-2.5">3 months</ToggleGroupItem>
            </ToggleGroup>
            <Select value={ordersTimeRange} onValueChange={setOrdersTimeRange}>
              <SelectTrigger className="w-32 @[540px]/card:hidden" aria-label="Select time range">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12m">12 months</SelectItem>
                <SelectItem value="6m">6 months</SelectItem>
                <SelectItem value="3m">3 months</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={revenueChartConfig} className="aspect-auto h-64 w-full">
            <LineChart data={filteredOrdersData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Line
                dataKey="orders"
                type="natural"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-2)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bar Charts */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Bar Charts</h2>
          <p className="text-sm text-muted-foreground">Categorical comparisons with ChartContainer</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Vertical Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Top Dealerships</CardTitle>
              <CardDescription>Revenue by dealership</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={dealershipChartConfig} className="aspect-auto h-64 w-full">
                <BarChart data={dealershipData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Horizontal Bar */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Percentage of total sales</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={categoryChartConfig} className="aspect-auto h-64 w-full">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Pie Charts</h2>
          <p className="text-sm text-muted-foreground">Distribution and composition visualizations</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Current order breakdown by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="aspect-auto h-64 w-full">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
              <CardDescription>Sales share by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="aspect-auto h-64 w-full">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
