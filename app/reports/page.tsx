"use client"

import { useState, useEffect } from "react"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DailyTrendsChart } from "@/components/Charts"
import { DateRangePicker } from "@/components/DateRangePicker"
import { 
  Download, 
  BarChart3, 
  Droplets, 
  UserCheck, 
  FileText,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { cn } from "@/lib/utils"

const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const bloodGroupColors: Record<string, string> = {
  "A+": "bg-rose-100 text-rose-700 border-rose-200",
  "A-": "bg-rose-50 text-rose-600 border-rose-100",
  "B+": "bg-orange-100 text-orange-700 border-orange-200",
  "B-": "bg-orange-50 text-orange-600 border-orange-100",
  "AB+": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "AB-": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "O+": "bg-blue-100 text-blue-700 border-blue-200",
  "O-": "bg-blue-50 text-blue-600 border-blue-100",
}

interface ReportData {
  totalDonations: number
  bloodGroupBreakdown: Record<string, number>
  topReferrers: Array<{ referrer: string; count: number }>
  dailyTrends: Array<{ date: string; count: number }>
  peakPerformance: {
    busiestDayOfWeek: { day: string; count: number } | null
    busiestWeekOfMonth: { week: string; count: number } | null
    peakDay: { date: string; count: number } | null
  }
  growthMetrics: {
    currentPeriod: {
      totalDonations: number
      dateFrom: string
      dateTo: string
    }
    previousPeriod: {
      totalDonations: number
      dateFrom: string
      dateTo: string
    }
    growthPercentage: number
    bloodGroupGrowth: Record<string, { current: number; previous: number; growth: number }>
  } | null
}

// Helper function to format Date to DD-MM-YYYY
function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  
  // Set default dates to current month
  const getCurrentMonthDates = () => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    return {
      dateFrom: formatDateToString(monthStart),
      dateTo: formatDateToString(monthEnd),
    }
  }
  
  const [filters, setFilters] = useState({
    ...getCurrentMonthDates(),
    bloodGroup: "all",
  })

  const handleGenerateReport = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      })

      if (response.ok) {
        // Use safe JSON parsing with consistent error handling
        const { safeResponseJson } = await import('@/lib/utils')
        const data = await safeResponseJson(response, 'report generation')
        setReportData(data)
      } else {
        // Use safe JSON parsing for error response
        const { safeResponseJson } = await import('@/lib/utils')
        const error = await safeResponseJson(response, 'error response')
        if (window.toast) {
          window.toast({
            title: "Error",
            description: error.error || "Failed to generate report",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      if (window.toast) {
        window.toast({
          title: "Error",
          description: error.message || "Failed to generate report",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Auto-generate report on mount with current month
  useEffect(() => {
    handleGenerateReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount
  
  // Helper to format date for display
  const formatDateForDisplay = (dateStr: string): string => {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const day = parts[0]
    const month = parts[1]
    const year = parts[2]
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${day} ${monthNames[parseInt(month) - 1]} ${year}`
  }

  const handleExportCSV = () => {
    if (!reportData) return

    const headers = ["Metric", "Value"]
    const rows: string[][] = [
      ["Total Donations", reportData.totalDonations.toString()],
      ...Object.entries(reportData.bloodGroupBreakdown).map(([bg, count]) => [
        `Blood Group ${bg}`,
        count.toString(),
      ]),
      ...reportData.topReferrers.map((r) => [`Referrer: ${r.referrer}`, r.count.toString()]),
    ]
    
    // Add growth metrics if available
    if (reportData.growthMetrics) {
      rows.push(
        ["", ""],
        ["Growth Metrics", ""],
        ["Growth Percentage", `${reportData.growthMetrics.growthPercentage.toFixed(1)}%`],
        ["Previous Period Donations", reportData.growthMetrics.previousPeriod.totalDonations.toString()],
        ["Previous Period Start", reportData.growthMetrics.previousPeriod.dateFrom],
        ["Previous Period End", reportData.growthMetrics.previousPeriod.dateTo],
        ["", ""],
        ["Blood Group Growth", ""],
        ...Object.entries(reportData.growthMetrics.bloodGroupGrowth).map(([bg, data]) => [
          `Blood Group ${bg} Growth`,
          `${data.growth >= 0 ? '+' : ''}${data.growth.toFixed(1)}% (Current: ${data.current}, Previous: ${data.previous})`,
        ])
      )
    }

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `badhan-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Modern Sleek Header */}
      <div className="relative z-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B1E28] via-[#7A2A36] to-[#8B3444]" />
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-6 md:py-8 pb-10 md:pb-12">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
      <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Reports
              </h1>
              <p className="text-white/60 text-sm">
                Analytics & donation insights
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-[2.5rem]" />
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6 pb-6 md:pb-8 space-y-6 md:space-y-8">
        {/* Filters Card */}
        <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Report Filters
            </CardTitle>
            <CardDescription className="text-xs md:text-sm mt-1">
              Select date range and blood group to generate a customized report
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium text-foreground">Date Range</Label>
                <DateRangePicker
                  dateFrom={filters.dateFrom}
                  dateTo={filters.dateTo}
                  onDateChange={(from, to) => setFilters({ ...filters, dateFrom: from, dateTo: to })}
                  className="w-full"
                />
            </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Blood Group</Label>
              <Select
                value={filters.bloodGroup}
                onValueChange={(value) => setFilters({ ...filters, bloodGroup: value })}
              >
                  <SelectTrigger className="h-11 md:h-10 w-full text-sm">
                    <SelectValue placeholder="All Blood Groups" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg} value={bg} className="text-sm">
                        {bg === "all" ? (
                          "All Blood Groups"
                        ) : (
                          <span className="flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center justify-center w-8 h-5 rounded text-xs font-bold border",
                              bloodGroupColors[bg]
                            )}>
                              {bg}
                            </span>
                          </span>
                        )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleGenerateReport} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 h-11 md:h-10 w-full sm:flex-1 text-sm md:text-base font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Generate Report
                  </span>
                )}
            </Button>
            {reportData && (
              <Button 
                onClick={handleExportCSV} 
                variant="outline"
                className="h-11 md:h-10 w-full sm:w-auto text-sm md:text-base font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
          <div className="space-y-8 animate-pulse">
            {/* Summary Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
              ))}
          </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
                  <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
              <Card className="border-0 shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                        <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6 md:space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-[#6B1E28] to-[#8B2E3C] text-white">
                <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-3xl md:text-4xl font-bold">{reportData.totalDonations}</div>
                  <p className="text-white/80 text-xs mt-1">in selected period</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2 px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Top Referrer
                  </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                  <div className="text-lg md:text-xl font-bold truncate">
                    {reportData.topReferrers[0]?.referrer || "—"}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {reportData.topReferrers[0]?.count || 0} referrals
                  </p>
              </CardContent>
            </Card>
            </div>

            {/* Top Referrers */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Top 10 Referrers
                </CardTitle>
                <CardDescription>Volunteers who brought the most donors</CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.topReferrers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No referrers found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportData.topReferrers.map((ref, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                          index === 0 ? "bg-amber-100 text-amber-700" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate">{ref.referrer}</span>
                        <Badge variant="secondary">{ref.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Blood Group Breakdown */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="px-4 pt-4 md:px-6 md:pt-6 pb-3 md:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Droplets className="h-5 w-5 text-primary" />
                  Blood Group Details
                </CardTitle>
                <CardDescription className="text-xs md:text-sm mt-1">Breakdown by blood type</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
                <div className="space-y-2.5 md:space-y-3">
                  {Object.entries(reportData.bloodGroupBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([bg, count]) => {
                      const percentage = reportData.totalDonations > 0 
                        ? Math.round((count / reportData.totalDonations) * 100) 
                        : 0
                      return (
                        <div key={bg} className="flex items-center gap-2 md:gap-3">
                          <span className={cn(
                            "inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold border shrink-0",
                            bloodGroupColors[bg]
                          )}>
                            {bg}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                          <span className="font-semibold w-10 md:w-12 text-right text-sm md:text-base shrink-0">{count}</span>
                          <span className="text-muted-foreground text-xs md:text-sm w-10 md:w-12 text-right shrink-0">{percentage}%</span>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Peak Performance Metrics */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Peak Performance Metrics
                </CardTitle>
                <CardDescription>Busiest days and weeks for donations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Busiest Day of Week */}
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Busiest Day</span>
                    </div>
                    {reportData.peakPerformance.busiestDayOfWeek ? (
                      <>
                        <div className="text-2xl font-bold text-blue-700 mb-1">
                          {reportData.peakPerformance.busiestDayOfWeek.day}
                        </div>
                        <div className="text-sm text-blue-600">
                          {reportData.peakPerformance.busiestDayOfWeek.count} donations
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No data</div>
                    )}
                  </div>

                  {/* Busiest Week of Month */}
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Busiest Week</span>
                    </div>
                    {reportData.peakPerformance.busiestWeekOfMonth ? (
                      <>
                        <div className="text-2xl font-bold text-purple-700 mb-1">
                          {reportData.peakPerformance.busiestWeekOfMonth.week}
                        </div>
                        <div className="text-sm text-purple-600">
                          {reportData.peakPerformance.busiestWeekOfMonth.count} donations
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No data</div>
                    )}
                  </div>

                  {/* Peak Day */}
                  <div className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Peak Day</span>
                    </div>
                    {reportData.peakPerformance.peakDay ? (
                      <>
                        <div className="text-lg font-bold text-orange-700 mb-1 text-center">
                          {formatDateForDisplay(reportData.peakPerformance.peakDay.date)}
                        </div>
                        <div className="text-sm text-orange-600">
                          {reportData.peakPerformance.peakDay.count} donations
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No data</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Metrics & Comparison - Shown at bottom before trends graph */}
            {reportData.growthMetrics && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Growth Metrics & Comparison
                  </CardTitle>
                  <CardDescription>
                    Comparing current period with previous period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall Growth Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={cn(
                        "md:col-span-2 p-4 rounded-lg border",
                        reportData.growthMetrics.growthPercentage >= 0
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                          : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "text-sm font-medium",
                            reportData.growthMetrics.growthPercentage >= 0 ? "text-green-900" : "text-red-900"
                          )}>
                            Total Donations Growth
                          </span>
                          {reportData.growthMetrics.growthPercentage >= 0 ? (
                            <ArrowUpRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className={cn(
                            "text-3xl font-bold",
                            reportData.growthMetrics.growthPercentage >= 0 ? "text-green-700" : "text-red-700"
                          )}>
                            {reportData.growthMetrics.growthPercentage >= 0 ? '+' : ''}
                            {reportData.growthMetrics.growthPercentage.toFixed(1)}%
                          </span>
                          <span className={cn(
                            "text-sm",
                            reportData.growthMetrics.growthPercentage >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            vs previous period
                          </span>
                        </div>
                        <div className={cn(
                          "mt-3 text-xs space-y-1",
                          reportData.growthMetrics.growthPercentage >= 0 ? "text-green-700" : "text-red-700"
                        )}>
                          <div>Current: {reportData.growthMetrics.currentPeriod.totalDonations} donations</div>
                          <div>Previous: {reportData.growthMetrics.previousPeriod.totalDonations} donations</div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="text-xs text-muted-foreground mb-1">Period Comparison</div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="font-medium">Current:</span>{' '}
                            {formatDateForDisplay(reportData.growthMetrics.currentPeriod.dateFrom)} - {formatDateForDisplay(reportData.growthMetrics.currentPeriod.dateTo)}
                          </div>
                          <div>
                            <span className="font-medium">Previous:</span>{' '}
                            {formatDateForDisplay(reportData.growthMetrics.previousPeriod.dateFrom)} - {formatDateForDisplay(reportData.growthMetrics.previousPeriod.dateTo)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Blood Group Growth Breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Blood Group Growth</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(reportData.growthMetrics.bloodGroupGrowth)
                          .sort((a, b) => b[1].growth - a[1].growth)
                          .map(([bg, data]) => {
                            const isPositive = data.growth >= 0
                            return (
                              <div
                                key={bg}
                                className={cn(
                                  "p-3 rounded-lg border",
                                  isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                )}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={cn(
                                    "inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold border",
                                    bloodGroupColors[bg]
                                  )}>
                                    {bg}
                                  </span>
                                  {isPositive ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div className={cn(
                                  "text-lg font-bold mb-1",
                                  isPositive ? "text-green-700" : "text-red-700"
                                )}>
                                  {isPositive ? '+' : ''}{data.growth.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <div>Current: {data.current}</div>
                                  <div>Previous: {data.previous}</div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Trends */}
          <DailyTrendsChart data={reportData.dailyTrends} />
        </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
            <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Generate a Report</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select your date range and blood group filters above, then click 
              "Generate Report" to view detailed analytics and trends.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
