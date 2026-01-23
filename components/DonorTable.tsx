"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateForDisplay } from "@/lib/validation"
import { Download, Edit, Trash2 } from "lucide-react"
import { EditDonorDialog } from "./EditDonorDialog"
import { checkAdminStatus } from "@/lib/auth"
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

const bloodGroups = ["all", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface Donor {
  id: string
  name: string
  bloodGroup: string
  batch: string | null
  hospital: string | null
  phone: string
  date: string
  referrer: string | null
  hallName: string | null
  createdAt: string
}

export function DonorTable() {
  const [donors, setDonors] = useState<Donor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null)
  const [deleteDonor, setDeleteDonor] = useState<Donor | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [filters, setFilters] = useState({
    bloodGroup: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  })

  // Check admin status from localStorage on mount
  useEffect(() => {
    const admin = checkAdminStatus()
    setIsAdmin(admin)
    
    // Listen for storage changes (in case admin status changes in another tab)
    const handleStorageChange = () => {
      setIsAdmin(checkAdminStatus())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchDonors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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
      }
    } catch (error) {
      console.error("Error fetching donors:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDonors()
  }, [page, limit, filters])

  const handleExportCSV = () => {
    const headers = ["Name", "Blood Group", "Batch", "Hospital", "Phone", "Date", "Referrer", "Hall Name", "Added On"]
    const rows = donors.map((donor) => [
      donor.name,
      donor.bloodGroup,
      donor.batch || "",
      donor.hospital || "",
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
    a.download = `donors-${new Date().toISOString().split("T")[0]}.csv`
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

      // Refresh the table
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Donor Records</CardTitle>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search by name or phone..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value })
                setPage(1)
              }}
            />
            <Select
              value={filters.bloodGroup}
              onValueChange={(value) => {
                setFilters({ ...filters, bloodGroup: value })
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroups.map((bg) => (
                  <SelectItem key={bg} value={bg}>
                    {bg === "all" ? "All" : bg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="text"
              placeholder="Date From (DD-MM-YY, DD.MM.YY, or M/D/YY)"
              value={filters.dateFrom}
              onChange={(e) => {
                setFilters({ ...filters, dateFrom: e.target.value })
                setPage(1)
              }}
            />
            <Input
              type="text"
              placeholder="Date To (DD-MM-YY, DD.MM.YY, or M/D/YY)"
              value={filters.dateTo}
              onChange={(e) => {
                setFilters({ ...filters, dateTo: e.target.value })
                setPage(1)
              }}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-4">
              {/* Table Header Skeleton */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-20" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-12" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-12" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-20" /></th>
                      <th className="text-left p-2"><Skeleton className="h-4 w-20" /></th>
                      {isAdmin && <th className="text-left p-2"><Skeleton className="h-4 w-16" /></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(limit)].map((_, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-2"><Skeleton className="h-6 w-12" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-24" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                        {isAdmin && (
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-8 w-8" />
                              <Skeleton className="h-8 w-8" />
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No donors found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Blood Group</th>
                      <th className="text-left p-2">Batch</th>
                      <th className="text-left p-2">Hospital</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Referrer</th>
                      <th className="text-left p-2">Hall Name</th>
                      <th className="text-left p-2">Added On</th>
                      {isAdmin && <th className="text-left p-2">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((donor) => (
                      <tr key={donor.id} className="border-b">
                        <td className="p-2">{donor.name}</td>
                        <td className="p-2">
                          <Badge>{donor.bloodGroup}</Badge>
                        </td>
                        <td className="p-2">{donor.batch || "N/A"}</td>
                        <td className="p-2">{donor.hospital || "N/A"}</td>
                        <td className="p-2">{donor.phone}</td>
                        <td className="p-2">{donor.date}</td>
                        <td className="p-2">{donor.referrer || "N/A"}</td>
                        <td className="p-2">{donor.hallName || "N/A"}</td>
                        <td className="p-2">{new Date(donor.createdAt).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(donor)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(donor)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select
                    value={limit.toString()}
                    onValueChange={(value) => {
                      setLimit(parseInt(value))
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
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
            <AlertDialogTitle>Delete Donor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete donor <strong>{deleteDonor?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

