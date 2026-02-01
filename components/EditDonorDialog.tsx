"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/DatePicker"
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
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetBody,
  BottomSheetFooter,
  BottomSheetTitle,
  BottomSheetDescription,
} from "@/components/ui/bottom-sheet"
import { useIsMobile } from "@/hooks/useIsMobile"
import { User, Droplets, Phone, Calendar, UserCheck, Home } from "lucide-react"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

interface Donor {
  id: string
  name: string
  bloodGroup: string
  batch: string | null
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
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    batch: "",
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

  // Form content shared between dialog and bottom sheet
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-shake">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Donor Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-name" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            Donor Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter donor name"
            className="h-11"
          />
        </div>

        {/* Blood Group */}
        <div className="space-y-2">
          <Label htmlFor="edit-bloodGroup" className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="h-4 w-4 text-primary" />
            Blood Group <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.bloodGroup}
            onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
            required
          >
            <SelectTrigger id="edit-bloodGroup" className="h-11">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {bloodGroups.map((bg) => (
                <SelectItem key={bg} value={bg} className="font-medium">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-red-100 text-red-700 text-xs font-bold">
                  {bg}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="edit-phone" className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="01XXXXXXXXX"
            className="h-11"
          />
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="edit-date" className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Donation Date <span className="text-destructive">*</span>
          </Label>
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData({ ...formData, date })}
            placeholder="Select donation date"
          />
        </div>

        {/* Batch */}
        <div className="space-y-2">
          <Label htmlFor="edit-batch" className="text-sm font-medium">
            Batch
          </Label>
          <Input
            id="edit-batch"
            value={formData.batch}
            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            placeholder="Enter batch"
            className="h-11"
          />
        </div>

        {/* Referrer */}
        <div className="space-y-2">
          <Label htmlFor="edit-referrer" className="flex items-center gap-2 text-sm font-medium">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Referrer
          </Label>
          <Input
            id="edit-referrer"
            value={formData.referrer}
            onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
            placeholder="Enter referrer name"
            className="h-11"
          />
        </div>

        {/* Hall Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-hallName" className="flex items-center gap-2 text-sm font-medium">
            <Home className="h-4 w-4 text-muted-foreground" />
            Hall Name
          </Label>
          <Input
            id="edit-hallName"
            value={formData.hallName}
            onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
            placeholder="Enter hall name"
            className="h-11"
          />
        </div>
      </div>
    </form>
  )

  // Footer buttons shared between dialog and bottom sheet
  const footerButtons = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={loading}
        className="h-11 flex-1 sm:flex-none"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="edit-donor-form"
        disabled={loading}
        className="h-11 flex-1 sm:flex-none bg-primary hover:bg-primary/90"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Updating...
          </span>
        ) : (
          "Update Donor"
        )}
      </Button>
    </>
  )

  // Mobile: Use Bottom Sheet
  if (isMobile) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>Edit Donor Record</BottomSheetTitle>
            <BottomSheetDescription>
              Update the donor information below.
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetBody>
            <form id="edit-donor-form" onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-shake">
                  {error}
                </div>
              )}

              {/* Simplified single column layout for mobile */}
              <div className="space-y-4">
                {/* Donor Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-name-mobile" className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Donor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name-mobile"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter donor name"
                    className="h-12"
                  />
                </div>

                {/* Blood Group & Phone Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-bloodGroup-mobile" className="flex items-center gap-2 text-sm font-medium">
                      <Droplets className="h-4 w-4 text-primary" />
                      Blood Group <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                      required
                    >
                      <SelectTrigger id="edit-bloodGroup-mobile" className="h-12">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map((bg) => (
                          <SelectItem key={bg} value={bg} className="font-medium">
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone-mobile" className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-phone-mobile"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="01XXXXXXXXX"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="edit-date-mobile" className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Donation Date <span className="text-destructive">*</span>
                  </Label>
                  <DatePicker
                    value={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    placeholder="Select donation date"
                  />
                </div>

                {/* Batch & Referrer Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-batch-mobile" className="text-sm font-medium">
                      Batch
                    </Label>
                    <Input
                      id="edit-batch-mobile"
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                      placeholder="Batch"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-referrer-mobile" className="flex items-center gap-2 text-sm font-medium">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      Referrer
                    </Label>
                    <Input
                      id="edit-referrer-mobile"
                      value={formData.referrer}
                      onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                      placeholder="Referrer"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Hall Name */}
                <div className="space-y-2">
                  <Label htmlFor="edit-hallName-mobile" className="flex items-center gap-2 text-sm font-medium">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    Hall Name
                  </Label>
                  <Input
                    id="edit-hallName-mobile"
                    value={formData.hallName}
                    onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                    placeholder="Enter hall name"
                    className="h-12"
                  />
                </div>
              </div>
            </form>
          </BottomSheetBody>
          <BottomSheetFooter>
            {footerButtons}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    )
  }

  // Desktop: Use Alert Dialog
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold">Edit Donor Record</AlertDialogTitle>
          <AlertDialogDescription>
            Update the donor information below. Changes will be saved immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form id="edit-donor-form" onSubmit={handleSubmit} className="space-y-5 py-2">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-shake">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Donor Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Donor Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Enter donor name"
                className="h-10"
              />
            </div>

            {/* Blood Group */}
            <div className="space-y-2">
              <Label htmlFor="edit-bloodGroup" className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4 text-primary" />
                Blood Group <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                required
              >
                <SelectTrigger id="edit-bloodGroup" className="h-10">
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((bg) => (
                    <SelectItem key={bg} value={bg} className="font-medium">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-red-100 text-red-700 text-xs font-bold">
                      {bg}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="01XXXXXXXXX"
                className="h-10"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="edit-date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Donation Date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                value={formData.date}
                onChange={(date) => setFormData({ ...formData, date })}
                placeholder="Select donation date"
              />
            </div>

            {/* Batch */}
            <div className="space-y-2">
              <Label htmlFor="edit-batch" className="text-sm font-medium">
                Batch
              </Label>
              <Input
                id="edit-batch"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                placeholder="Enter batch"
                className="h-10"
              />
            </div>

            {/* Referrer */}
            <div className="space-y-2">
              <Label htmlFor="edit-referrer" className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Referrer
              </Label>
              <Input
                id="edit-referrer"
                value={formData.referrer}
                onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                placeholder="Enter referrer name"
                className="h-10"
              />
            </div>

            {/* Hall Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-hallName" className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4 text-muted-foreground" />
                Hall Name
              </Label>
              <Input
                id="edit-hallName"
                value={formData.hallName}
                onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                placeholder="Enter hall name"
                className="h-10"
              />
            </div>
          </div>

          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel type="button" disabled={loading} className="h-10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              type="submit" 
              disabled={loading}
              className="h-10 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Donor"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

