"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { BloodGroupPieChart, DailyTrendsChart } from "@/components/Charts"
import { DateRangePicker } from "@/components/DateRangePicker"
import { 
  Download, 
  BarChart3, 
  Droplets, 
  Building2, 
  UserCheck, 
  FileText,
  TrendingUp,
  Award
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
  topHospitals: Array<{ hospital: string; count: number }>
  dailyTrends: Array<{ date: string; count: number }>
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
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
        const data = await response.json()
        setReportData(data)
      } else {
        const error = await response.json()
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
      ...reportData.topHospitals.map((h) => [`Hospital: ${h.hospital}`, h.count.toString()]),
    ]

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
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#6B1E28] via-[#8B2E3C] to-[#C94C5E] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-5 right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
      </div>

        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Reports & Analytics
              </h1>
              <p className="text-white/80">
                Generate detailed donation reports
              </p>
            </div>
          </div>
          <p className="text-white/80 max-w-2xl text-sm md:text-base">
            Analyze donation patterns, track top referrers, and view blood group distributions
            with customizable date ranges and filters.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Filters Card */}
        <Card className="border-0 shadow-lg -mt-6 relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Select date range and blood group to generate a customized report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <DateRangePicker
                  dateFrom={filters.dateFrom}
                  dateTo={filters.dateTo}
                  onDateChange={(from, to) => setFilters({ ...filters, dateFrom: from, dateTo: to })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blood Group</Label>
              <Select
                value={filters.bloodGroup}
                onValueChange={(value) => setFilters({ ...filters, bloodGroup: value })}
              >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Blood Groups" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg} value={bg}>
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
            <div className="mt-6 flex flex-wrap gap-3">
              <Button 
                onClick={handleGenerateReport} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
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
              <Button onClick={handleExportCSV} variant="outline">
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
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-[#6B1E28] to-[#8B2E3C] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-white/80 flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{reportData.totalDonations}</div>
                  <p className="text-white/80 text-xs mt-1">in selected period</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Top Referrer
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="text-xl font-bold truncate">
                    {reportData.topReferrers[0]?.referrer || "—"}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {reportData.topReferrers[0]?.count || 0} referrals
                  </p>
              </CardContent>
            </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Top Hospital
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold truncate">
                    {reportData.topHospitals[0]?.hospital || "—"}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {reportData.topHospitals[0]?.count || 0} donations
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Blood Group Breakdown & Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BloodGroupPieChart data={reportData.bloodGroupBreakdown} />

              <Card className="border-0 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-primary" />
                    Blood Group Details
                  </CardTitle>
                  <CardDescription>Breakdown by blood type</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3">
                    {Object.entries(reportData.bloodGroupBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([bg, count]) => {
                        const percentage = reportData.totalDonations > 0 
                          ? Math.round((count / reportData.totalDonations) * 100) 
                          : 0
                        return (
                          <div key={bg} className="flex items-center gap-3">
                            <span className={cn(
                              "inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold border",
                              bloodGroupColors[bg]
                            )}>
                              {bg}
                            </span>
                            <div className="flex-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="font-semibold w-12 text-right">{count}</span>
                            <span className="text-muted-foreground text-sm w-12 text-right">{percentage}%</span>
                    </div>
                        )
                      })}
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Top Referrers & Hospitals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <Card className="border-0 shadow-lg">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Top 5 Hospitals
                  </CardTitle>
                  <CardDescription>Hospitals with most donations</CardDescription>
              </CardHeader>
              <CardContent>
                  {reportData.topHospitals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p>No hospitals found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reportData.topHospitals.map((hosp, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className={cn(
                            "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                            index === 0 ? "bg-blue-100 text-blue-700" :
                            index === 1 ? "bg-blue-50 text-blue-600" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {index + 1}
                          </span>
                          <span className="flex-1 truncate">{hosp.hospital}</span>
                          <Badge variant="secondary">{hosp.count}</Badge>
                        </div>
                      ))}
                      </div>
                  )}
              </CardContent>
            </Card>
          </div>

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
