"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, BarChart3 } from "lucide-react"

interface MonthlyData {
  month: string
  [key: string]: string | number
}

interface ChartData {
  totalDonors: number
  monthlyData: MonthlyData[]
}

const bloodGroupColors: Record<string, string> = {
  "A+": "#ef4444",
  "A-": "#f87171",
  "B+": "#f97316",
  "B-": "#fb923c",
  "AB+": "#10b981",
  "AB-": "#34d399",
  "O+": "#3b82f6",
  "O-": "#60a5fa",
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-medium mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            entry.value > 0 && (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground">{entry.dataKey}</span>
                </div>
                <span className="font-medium">{entry.value}</span>
              </div>
            )
          ))}
        </div>
        <div className="border-t mt-2 pt-2 flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">{total}</span>
        </div>
      </div>
    )
  }
  return null
}

export function MonthlyChart() {
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/stats/all-time")
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.monthlyData.length) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-500" />
            Monthly Donations
          </CardTitle>
          <CardDescription>Last 12 months by blood group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
            <p>No data available yet</p>
            <p className="text-sm">Start recording donations to see trends</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format month labels
  const formattedData = data.monthlyData.map(item => {
    const [year, month] = item.month.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return {
      ...item,
      displayMonth: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  })

  // Calculate totals for each month
  const dataWithTotals = formattedData.map(item => {
    const total = bloodGroups.reduce((sum, bg) => sum + (Number((item as Record<string, unknown>)[bg]) || 0), 0)
    return { ...item, total }
  })

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              Monthly Donations
            </CardTitle>
            <CardDescription>Blood group breakdown over the last 12 months</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={dataWithTotals} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis 
              dataKey="displayMonth" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
            {bloodGroups.map((bg) => (
              <Bar 
                key={bg} 
                dataKey={bg} 
                stackId="a" 
                fill={bloodGroupColors[bg]}
                radius={bg === "O-" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function BloodGroupPieChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Blood Group Distribution</CardTitle>
          <CardDescription>Breakdown by blood type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Blood Group Distribution</CardTitle>
        <CardDescription>Total: {total} donations</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={bloodGroupColors[entry.name] || "#8884d8"} 
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function DailyTrendsChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Daily Trends</CardTitle>
          <CardDescription>Donations per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Daily Trends</CardTitle>
        <CardDescription>Donation activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#ef4444" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
