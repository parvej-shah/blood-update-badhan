"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface MonthlyStats {
  totalThisMonth: number
  bloodGroupBreakdown: Record<string, number>
  topReferrer: string | null
  topReferrerCount: number
}

interface AllTimeStats {
  totalDonors: number
  monthlyData: Array<{
    month: string
    [key: string]: string | number
  }>
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function StatsCards() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null)
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [monthlyRes, allTimeRes] = await Promise.all([
          fetch("/api/stats/monthly"),
          fetch("/api/stats/all-time"),
        ])

        if (monthlyRes.ok) {
          const monthly = await monthlyRes.json()
          setMonthlyStats(monthly)
        }

        if (allTimeRes.ok) {
          const allTime = await allTimeRes.json()
          setAllTimeStats(allTime)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Skeleton className="h-6 w-64 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-12" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-8" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyStats?.totalThisMonth || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">All Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTimeStats?.totalDonors || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Referrer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {monthlyStats?.topReferrer || "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">
              {monthlyStats?.topReferrerCount || 0} donations
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Blood Group Breakdown (This Month)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {bloodGroups.map((bg) => (
            <Card key={bg}>
              <CardHeader>
                <CardTitle className="text-sm">
                  <Badge>{bg}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">
                  {monthlyStats?.bloodGroupBreakdown[bg] || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

