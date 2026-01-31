"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Droplets, 
  Phone, 
  Calendar, 
  Building2, 
  GraduationCap,
  Users,
  AlertCircle,
  ArrowUpDown
} from "lucide-react"
import { cn } from "@/lib/utils"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

const bloodGroupColors: Record<string, string> = {
  "A+": "bg-red-100 text-red-700 border-red-200",
  "A-": "bg-red-50 text-red-600 border-red-100",
  "B+": "bg-orange-100 text-orange-700 border-orange-200",
  "B-": "bg-orange-50 text-orange-600 border-orange-100",
  "AB+": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "AB-": "bg-emerald-50 text-emerald-600 border-emerald-100",
  "O+": "bg-blue-100 text-blue-700 border-blue-200",
  "O-": "bg-blue-50 text-blue-600 border-blue-100",
}

interface AvailableDonor {
  phone: string
  name: string
  bloodGroup: string
  batch: string | null
  hallName: string | null
  lastDonationDate: string
  daysSinceLastDonation: number
}

interface SearchResponse {
  bloodGroup: string
  count: number
  donors: AvailableDonor[]
}

// Format date for display
function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthIndex = parseInt(parts[1], 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return dateStr
  return `${parts[0]} ${months[monthIndex]} ${parts[2]}`
}

// Format days since donation
function formatDaysSince(days: number): string {
  if (days < 30) {
    return `${days} days`
  } else if (days < 365) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    if (remainingDays === 0) {
      return `${months} month${months > 1 ? 's' : ''}`
    }
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`
  } else {
    const years = Math.floor(days / 365)
    const remainingMonths = Math.floor((days % 365) / 30)
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? 's' : ''}`
    }
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
  }
}

type SortOption = 'newest' | 'oldest' | 'name'

export default function SearchDonorPage() {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('oldest')

  const handleSearch = async (bloodGroup: string) => {
    if (!bloodGroup || bloodGroup === "all") {
      setSearchResults(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/donors/search?bloodGroup=${encodeURIComponent(bloodGroup)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResults(data)
      } else {
        console.error("Error searching donors:", data.error)
        setSearchResults(null)
      }
    } catch (error) {
      console.error("Error searching donors:", error)
      setSearchResults(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedBloodGroup) {
      handleSearch(selectedBloodGroup)
    } else {
      setSearchResults(null)
    }
  }, [selectedBloodGroup])

  // Sort donors based on selected option
  const sortedDonors = React.useMemo(() => {
    if (!searchResults?.donors) return []
    
    const donors = [...searchResults.donors]
    
    switch (sortBy) {
      case 'newest':
        // Most recent donation first (least days since donation)
        return donors.sort((a, b) => a.daysSinceLastDonation - b.daysSinceLastDonation)
      case 'oldest':
        // Oldest donation first (most days since donation)
        return donors.sort((a, b) => b.daysSinceLastDonation - a.daysSinceLastDonation)
      case 'name':
        // Alphabetical by name
        return donors.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return donors
    }
  }, [searchResults, sortBy])

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-5 right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
              <Search className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Search Available Donors
              </h1>
              <p className="text-red-100">
                Find donors who are eligible to donate again
              </p>
            </div>
          </div>
          <p className="text-red-100 max-w-2xl text-sm md:text-base">
            Search for donors by blood group. The system shows donors whose last donation 
            was at least 4 months ago, making them eligible to donate again.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Blood Group Selector */}
        <Card className="border-0 shadow-lg -mt-6 relative z-10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-red-500" />
              Select Blood Group
            </CardTitle>
            <CardDescription>
              Choose a blood group to see available donors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedBloodGroup}
              onValueChange={setSelectedBloodGroup}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Select blood group to search" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blood Groups</SelectItem>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center justify-center w-10 h-6 rounded text-xs font-bold border",
                        bloodGroupColors[bg]
                      )}>
                        {bg}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-28 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchResults ? (
          <div className="space-y-6">
            {/* Results Summary and Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6 text-red-500" />
                  Available Donors
                </h2>
                <p className="text-muted-foreground mt-1">
                  Found <span className="font-semibold text-foreground">{searchResults.count}</span> available donor{searchResults.count !== 1 ? 's' : ''} with blood group{" "}
                  <span className={cn(
                    "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold border ml-1",
                    bloodGroupColors[searchResults.bloodGroup]
                  )}>
                    {searchResults.bloodGroup}
                  </span>
                </p>
              </div>
              
              {/* Sort Options */}
              {searchResults.count > 0 && (
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[180px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oldest">Longest wait time</SelectItem>
                      <SelectItem value="newest">Shortest wait time</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {searchResults.count === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="py-16 text-center">
                  <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Available Donors</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    There are no donors with blood group {searchResults.bloodGroup} who are 
                    eligible to donate again. All donors in this group have donated within the last 4 months.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedDonors.map((donor, index) => (
                  <Card 
                    key={`${donor.phone}-${index}`} 
                    className="border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      {/* Header with Name and Blood Group */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold truncate mb-1">{donor.name}</h3>
                          <span className={cn(
                            "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-sm font-bold border",
                            bloodGroupColors[donor.bloodGroup]
                          )}>
                            {donor.bloodGroup}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3">
                        {/* Phone */}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <a 
                            href={`tel:${donor.phone}`} 
                            className="font-medium hover:text-red-600 hover:underline transition-colors"
                          >
                            {donor.phone}
                          </a>
                        </div>

                        {/* Last Donation Date */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Last donated: </span>
                            <span className="font-medium">{formatDate(donor.lastDonationDate)}</span>
                          </div>
                        </div>

                        {/* Days Since */}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatDaysSince(donor.daysSinceLastDonation)} ago
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            Available
                          </Badge>
                        </div>

                        {/* Hall Name */}
                        {donor.hallName && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Hall: </span>
                            <span className="font-medium">{donor.hallName}</span>
                          </div>
                        )}

                        {/* Batch */}
                        {donor.batch && donor.batch !== "Unknown" && (
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Batch: </span>
                            <span className="font-medium">{donor.batch}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Blood Group</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose a blood group from the dropdown above to search for available donors 
                who are eligible to donate again (last donation 4+ months ago).
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

