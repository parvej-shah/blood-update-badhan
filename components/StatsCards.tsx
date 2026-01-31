"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCardsLoading } from "@/components/ui/skeleton-mobile"
import { 
  Droplets, 
  TrendingUp, 
  Users, 
  UserCheck, 
  Calendar,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"

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

const bloodGroupColors: Record<string, { bg: string; text: string; border: string }> = {
  "A+": { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  "A-": { bg: "bg-red-50", text: "text-red-600", border: "border-red-100" },
  "B+": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  "B-": { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100" },
  "AB+": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  "AB-": { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
  "O+": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  "O-": { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
}

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
      <div className="space-y-6">
        <StatsCardsLoading />
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This Month */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-[#6B1E28] to-[#8B2E3C] text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-100 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyStats?.totalThisMonth || 0}</div>
            <p className="text-red-100 text-xs mt-1">donations in {currentMonth.split(' ')[0]}</p>
          </CardContent>
        </Card>

        {/* All Time */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{allTimeStats?.totalDonors || 0}</div>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
              <Heart className="h-3 w-3 text-primary" />
              total donations
            </p>
          </CardContent>
        </Card>

        {/* Top Referrer */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Top Referrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground truncate">
              {monthlyStats?.topReferrer || "—"}
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              {monthlyStats?.topReferrerCount || 0} referrals this month
            </p>
          </CardContent>
        </Card>

        {/* Growth Indicator */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden relative">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {monthlyStats?.totalThisMonth && allTimeStats?.totalDonors
                  ? Math.round((monthlyStats.totalThisMonth / allTimeStats.totalDonors) * 100)
                  : 0}%
              </span>
              <span className="text-emerald-600 text-xs font-medium">of total</span>
            </div>
            <p className="text-muted-foreground text-xs mt-1">this month's contribution</p>
          </CardContent>
        </Card>
      </div>

      {/* Blood Group Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Blood Group Breakdown</h3>
          <Badge variant="secondary" className="text-xs">{currentMonth}</Badge>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {bloodGroups.map((bg) => {
            const count = monthlyStats?.bloodGroupBreakdown[bg] || 0
            const colors = bloodGroupColors[bg]
            return (
              <Card 
                key={bg} 
                className={cn(
                  "border shadow-sm hover:shadow-md transition-all cursor-default group",
                  count > 0 ? colors.border : "border-muted"
                )}
              >
                <CardContent className="p-4 text-center">
                  <div className={cn(
                    "inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold mb-2 transition-transform group-hover:scale-105",
                    count > 0 ? `${colors.bg} ${colors.text}` : "bg-muted text-muted-foreground"
                  )}>
                    {bg}
                  </div>
                  <div className={cn(
                    "text-xl font-bold",
                    count > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {count}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
