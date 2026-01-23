"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BloodGroupPieChart, DailyTrendsChart } from "@/components/Charts"
import { Download } from "lucide-react"

const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

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
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">Generate detailed reports with filters</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="text"
                placeholder="DD-MM-YY, DD.MM.YY, or M/D/YY"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="text"
                placeholder="DD-MM-YY, DD.MM.YY, or M/D/YY"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={filters.bloodGroup}
                onValueChange={(value) => setFilters({ ...filters, bloodGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg === "all" ? "All" : bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleGenerateReport} disabled={loading}>
              {loading ? "Generating..." : "Generate Report"}
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
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      ) : reportData ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData.totalDonations}</div>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blood Group Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(reportData.bloodGroupBreakdown).map(([bg, count]) => (
                    <div key={bg} className="flex justify-between">
                      <span>{bg}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <BloodGroupPieChart data={reportData.bloodGroupBreakdown} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topReferrers.length === 0 ? (
                    <p className="text-muted-foreground">No referrers found</p>
                  ) : (
                    reportData.topReferrers.map((ref, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{ref.referrer}</span>
                        <span className="font-semibold">{ref.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Hospitals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.topHospitals.length === 0 ? (
                    <p className="text-muted-foreground">No hospitals found</p>
                  ) : (
                    reportData.topHospitals.map((hosp, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{hosp.hospital}</span>
                        <span className="font-semibold">{hosp.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DailyTrendsChart data={reportData.dailyTrends} />
        </div>
      ) : null}
    </div>
  )
}

