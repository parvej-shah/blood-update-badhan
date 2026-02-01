"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DonorTableLoading } from "@/components/ui/skeleton-mobile"
import { DateRangePicker } from "@/components/DateRangePicker"
import { EditDonorDialog } from "./EditDonorDialog"
import { checkAdminStatus } from "@/lib/auth"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { PullToRefreshIndicator } from "@/components/PullToRefresh"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Download, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Filter,
  Users,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SwipeableCard } from "@/components/ui/swipeable-card"

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

interface Donor {
  id: string
  name: string
  bloodGroup: string
  batch: string | null
  phone: string
  date: string
  referrer: string | null
  hallName: string | null
  createdAt: string
}

type SortField = "date" | "name" | "bloodGroup" | "batch" | "createdAt"
type SortOrder = "asc" | "desc"

interface SortConfig {
  field: SortField
  order: SortOrder
}

export function DonorTable() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null)
  const [deleteDonor, setDeleteDonor] = useState<Donor | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState({
    bloodGroup: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  })
  
  const [sort, setSort] = useState<SortConfig>({
    field: "date",
    order: "desc"
  })

  // Debounce search
  const [searchInput, setSearchInput] = useState("")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchInput }))
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Check admin status from localStorage on mount
  useEffect(() => {
    const admin = checkAdminStatus()
    setIsAdmin(admin)
    
    const handleStorageChange = () => {
      setIsAdmin(checkAdminStatus())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchDonors = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: sort.field,
        sortOrder: sort.order,
        ...(filters.bloodGroup !== "all" && { bloodGroup: filters.bloodGroup }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      })

      const response = await fetch(`/api/donors?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDonors(data.donors)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
      }
    } catch (error) {
      console.error("Error fetching donors:", error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, filters, sort])

  useEffect(() => {
    fetchDonors()
  }, [fetchDonors])

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
    setPage(1)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
    }
    return sort.order === "asc" 
      ? <ChevronUp className="h-4 w-4 text-primary" /> 
      : <ChevronDown className="h-4 w-4 text-primary" />
  }

  const handleExportCSV = () => {
    const headers = ["Name", "Blood Group", "Batch", "Phone", "Donation Date", "Referrer", "Hall Name", "Added On"]
    const rows = donors.map((donor) => [
      donor.name,
      donor.bloodGroup,
      donor.batch || "",
      donor.phone,
      donor.date,
      donor.referrer || "",
      donor.hallName || "",
      new Date(donor.createdAt).toLocaleDateString(),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `badhan-donors-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEdit = (donor: Donor) => {
    setEditingDonor(donor)
    setShowEditDialog(true)
  }

  const handleDelete = (donor: Donor) => {
    setDeleteDonor(donor)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteDonor) return

    try {
      const isRockstar = localStorage.getItem('IsRockstar')
      const response = await fetch(`/api/donors/${deleteDonor.id}`, {
        method: "DELETE",
        headers: {
          'x-is-rockstar': isRockstar || '',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete donor")
      }

      if (window.toast) {
        window.toast({
          title: "Success",
          description: "Donor deleted successfully!",
          variant: "success",
        })
      }

      fetchDonors()
      setShowDeleteDialog(false)
      setDeleteDonor(null)
    } catch (error: any) {
      if (window.toast) {
        window.toast({
          title: "Error",
          description: error.message || "Failed to delete donor",
          variant: "destructive",
        })
      }
    }
  }

  const handleEditSuccess = () => {
    fetchDonors()
  }

  const clearFilters = () => {
    setFilters({
      bloodGroup: "all",
      search: "",
      dateFrom: "",
      dateTo: "",
    })
    setSearchInput("")
    setPage(1)
  }

  const hasActiveFilters = filters.bloodGroup !== "all" || filters.search || filters.dateFrom || filters.dateTo

  // Toggle date sort order
  const toggleDateSort = () => {
    setSort(prev => ({
      field: "date",
      order: prev.field === "date" && prev.order === "desc" ? "asc" : "desc"
    }))
  }

  // Format date for display (DD-MM-YYYY to readable format)
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIndex = parseInt(parts[1], 10) - 1
    if (monthIndex < 0 || monthIndex > 11) return dateStr
    return `${parts[0]} ${months[monthIndex]} ${parts[2]}`
  }

  // Pull-to-refresh
  const { isRefreshing, pullProgress, pullDistance, containerProps } = usePullToRefresh({
    onRefresh: async () => {
      await fetchDonors()
    },
  })

  return (
    <>
      {/* Pull to refresh indicator - mobile only */}
      <div className="md:hidden">
        <PullToRefreshIndicator
          isRefreshing={isRefreshing}
          pullProgress={pullProgress}
          pullDistance={pullDistance}
        />
      </div>
      
      <Card className="border-0 shadow-lg" {...containerProps}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Donor Records
            </CardTitle>
            <CardDescription className="mt-1">
              {totalCount > 0 ? `${totalCount} donations recorded` : "Manage blood donation records"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm"
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
              )}
            </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
              Export
          </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search Bar and Sort Toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name, phone, batch, or referrer..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10 h-11"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => {
                    setSearchInput("")
                    setFilters(prev => ({ ...prev, search: "" }))
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* One-tap Date Sort Toggle */}
            <Button
              onClick={toggleDateSort}
              variant={sort.field === "date" ? "default" : "outline"}
              size="sm"
              className="h-11 px-3 sm:px-4 touch-target whitespace-nowrap"
              title={sort.field === "date" && sort.order === "desc" ? "Newest first" : "Oldest first"}
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Date</span>
              {sort.field === "date" ? (
                sort.order === "desc" ? (
                  <ArrowDown className="h-4 w-4 ml-1" />
                ) : (
                  <ArrowUp className="h-4 w-4 ml-1" />
                )
              ) : (
                <ArrowUpDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Blood Group Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Blood Group</label>
            <Select
              value={filters.bloodGroup}
              onValueChange={(value) => {
                setFilters({ ...filters, bloodGroup: value })
                setPage(1)
              }}
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

                {/* Date Range Filter */}
                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Donation Date Range</label>
                  <DateRangePicker
                    dateFrom={filters.dateFrom}
                    dateTo={filters.dateTo}
                    onDateChange={(from, to) => {
                      setFilters({ ...filters, dateFrom: from, dateTo: to })
                setPage(1)
              }}
            />
                </div>
              </div>

              {/* Quick Filter Chips */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center">Quick filters:</span>
                {["A+", "B+", "O+", "AB+"].map((bg) => (
                  <Button
                    key={bg}
                    variant={filters.bloodGroup === bg ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setFilters({ ...filters, bloodGroup: filters.bloodGroup === bg ? "all" : bg })
                setPage(1)
              }}
                  >
                    {bg}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {hasActiveFilters && !showFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {filters.bloodGroup !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {filters.bloodGroup}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, bloodGroup: "all" })}
                  />
                </Badge>
              )}
              {(filters.dateFrom || filters.dateTo) && (
                <Badge variant="secondary" className="gap-1">
                  {filters.dateFrom && filters.dateTo 
                    ? `${formatDate(filters.dateFrom)} - ${formatDate(filters.dateTo)}`
                    : filters.dateFrom 
                      ? `From ${formatDate(filters.dateFrom)}`
                      : `Until ${formatDate(filters.dateTo)}`
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}
                  />
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  "{filters.search}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      setFilters({ ...filters, search: "" })
                      setSearchInput("")
                    }}
                  />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                Clear all
              </Button>
          </div>
          )}

          {/* Table */}
          {loading ? (
            <DonorTableLoading />
          ) : donors.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-lg border border-dashed">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No donors found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters ? "Try adjusting your filters" : "Start by adding your first donor record"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Name
                            <SortIcon field="name" />
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("bloodGroup")}
                        >
                          <div className="flex items-center gap-1">
                            Blood
                            <SortIcon field="bloodGroup" />
                          </div>
                        </th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors hidden xl:table-cell"
                          onClick={() => handleSort("batch")}
                        >
                          <div className="flex items-center gap-1">
                            Batch
                            <SortIcon field="batch" />
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium">Phone</th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort("date")}
                        >
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Donated
                            <SortIcon field="date" />
                          </div>
                        </th>
                        <th className="text-left p-3 font-medium hidden xl:table-cell">Referrer</th>
                        {isAdmin && <th className="text-left p-3 font-medium w-24">Actions</th>}
                    </tr>
                  </thead>
                    <tbody className="divide-y">
                      {donors.map((donor, index) => (
                        <tr 
                          key={donor.id} 
                          className={cn(
                            "hover:bg-muted/30 transition-colors",
                            index % 2 === 0 ? "bg-background" : "bg-muted/10"
                          )}
                        >
                          <td className="p-3">
                            <div className="font-medium">{donor.name}</div>
                            {donor.hallName && (
                              <div className="text-xs text-muted-foreground">{donor.hallName}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold border",
                              bloodGroupColors[donor.bloodGroup]
                            )}>
                              {donor.bloodGroup}
                            </span>
                          </td>
                          <td className="p-3 hidden xl:table-cell text-muted-foreground">{donor.batch || "N/A"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <a href={`tel:${donor.phone}`} className="hover:underline">{donor.phone}</a>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">{formatDate(donor.date)}</div>
                          </td>
                          <td className="p-3 hidden xl:table-cell text-muted-foreground">
                            {donor.referrer || "N/A"}
                        </td>
                        {isAdmin && (
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                              <Button
                                  variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(donor)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(donor)}
                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Mobile Card View with Swipe Actions */}
              <div className="md:hidden space-y-3 stagger-fade-in">
                {donors.map((donor) => (
                  <SwipeableCard
                    key={donor.id}
                    leftActions={isAdmin ? [
                      {
                        icon: <Edit className="h-5 w-5" />,
                        label: "Edit",
                        onClick: () => handleEdit(donor),
                        variant: "primary",
                      },
                      {
                        icon: <Trash2 className="h-5 w-5" />,
                        label: "Delete",
                        onClick: () => handleDelete(donor),
                        variant: "destructive",
                      },
                    ] : []}
                    disabled={!isAdmin}
                    className="p-4 border rounded-lg hover:bg-muted/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{donor.name}</h3>
                          <span className={cn(
                            "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold border shrink-0",
                            bloodGroupColors[donor.bloodGroup]
                          )}>
                            {donor.bloodGroup}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            <a href={`tel:${donor.phone}`} className="hover:underline">{donor.phone}</a>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(donor.date)}
                          </div>
                        </div>
                      </div>
                      {/* Swipe hint for admin users */}
                      {isAdmin && (
                        <div className="flex items-center text-muted-foreground/40 shrink-0">
                          <ChevronLeft className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </SwipeableCard>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(parseInt(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>of {totalCount} records</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">{totalPages || 1}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages || totalPages === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <EditDonorDialog
        donor={editingDonor}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Donor Record
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the donation record for <strong>{deleteDonor?.name}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
    </>
  )
}
