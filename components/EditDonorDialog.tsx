"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

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
}

interface EditDonorDialogProps {
  donor: Donor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDonorDialog({ donor, open, onOpenChange, onSuccess }: EditDonorDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    batch: "",
    hospital: "",
    phone: "",
    date: "",
    referrer: "",
    hallName: "",
  })

  // Update form data when donor changes
  useEffect(() => {
    if (donor) {
      setFormData({
        name: donor.name || "",
        bloodGroup: donor.bloodGroup || "",
        batch: donor.batch || "",
        hospital: donor.hospital || "",
        phone: donor.phone || "",
        date: donor.date || "",
        referrer: donor.referrer || "",
        hallName: donor.hallName || "",
      })
      setError(null)
    }
  }, [donor])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donor) return

    setLoading(true)
    setError(null)

    try {
      const isRockstar = localStorage.getItem('IsRockstar')
      const response = await fetch(`/api/donors/${donor.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          'x-is-rockstar': isRockstar || '',
        },
        body: JSON.stringify({
          ...formData,
          batch: formData.batch || "Unknown",
          hospital: formData.hospital || "Unknown",
          referrer: formData.referrer || undefined,
          hallName: formData.hallName || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update donor")
      }

      // Show success toast
      if (window.toast) {
        window.toast({
          title: "Success",
          description: "Donor updated successfully!",
          variant: "success",
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to update donor")
      if (window.toast) {
        window.toast({
          title: "Error",
          description: err.message || "Failed to update donor",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!donor) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Donor</AlertDialogTitle>
          <AlertDialogDescription>
            Update the donor information below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">Donor Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter donor name"
              />
            </div>

            <div>
              <Label htmlFor="edit-bloodGroup">Blood Group *</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                required
              >
                <SelectTrigger id="edit-bloodGroup">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg} value={bg}>
                      {bg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-batch">Batch</Label>
              <Input
                id="edit-batch"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="Enter batch"
              />
            </div>

            <div>
              <Label htmlFor="edit-hospital">Hospital</Label>
              <Input
                id="edit-hospital"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                placeholder="Enter hospital name"
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
              />
            </div>

            <div>
              <Label htmlFor="edit-date">Date *</Label>
              <Input
                id="edit-date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                placeholder="DD-MM-YYYY, DD.MM.YYYY, or M/D/YYYY"
              />
            </div>

            <div>
              <Label htmlFor="edit-referrer">Referrer</Label>
              <Input
                id="edit-referrer"
                value={formData.referrer}
                onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                placeholder="Enter referrer name"
              />
            </div>

            <div>
              <Label htmlFor="edit-hallName">Hall Name</Label>
              <Input
                id="edit-hallName"
                value={formData.hallName}
                onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                placeholder="Enter hall name"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={loading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Donor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

