"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DatePicker } from "@/components/DatePicker"
import { User, Droplets, Phone, Calendar, UserCheck, Home } from "lucide-react"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function DonorForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bloodGroup: "",
    batch: "",
    phone: "",
    date: "",
    referrer: "",
    hallName: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          ...formData,
          batch: formData.batch || "Unknown",
          referrer: formData.referrer || undefined,
          hallName: formData.hallName || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit donor")
      }

      // Show success toast
      if (window.toast) {
        window.toast({
          title: "Success",
          description: "Donor information submitted successfully!",
          variant: "success",
        })
      }

      // Clear form
      setFormData({
        name: "",
        bloodGroup: "",
        batch: "",
        phone: "",
        date: "",
        referrer: "",
        hallName: "",
      })
    } catch (error: any) {
      if (window.toast) {
        window.toast({
          title: "Error",
          description: error.message || "Failed to submit donor information",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center">Submit Donor Information</CardTitle>
        <CardDescription className="text-center">
          Record a blood donation with complete details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Donor Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Donor Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter donor's full name"
              className="h-11"
            />
          </div>

          {/* Blood Group & Phone - Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodGroup" className="flex items-center gap-2 text-sm font-medium">
                <Droplets className="h-4 w-4 text-primary" />
                Blood Group <span className="text-destructive">*</span>
              </Label>
            <Select
              value={formData.bloodGroup}
              onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
              required
            >
                <SelectTrigger className="h-11">
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

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone <span className="text-destructive">*</span>
              </Label>
            <Input
                id="phone"
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="h-11"
              />
            </div>
          </div>

          {/* Donation Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
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
            <Label htmlFor="batch" className="text-sm font-medium">
              Batch
            </Label>
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="Batch number (optional)"
              className="h-11"
            />
          </div>

          {/* Referrer & Hall Name - Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="referrer" className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Referrer
              </Label>
            <Input
              id="referrer"
              value={formData.referrer}
              onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                placeholder="Who referred? (optional)"
                className="h-11"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="hallName" className="flex items-center gap-2 text-sm font-medium">
                <Home className="h-4 w-4 text-muted-foreground" />
                Hall Name
              </Label>
            <Input
              id="hallName"
              value={formData.hallName}
              onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
                placeholder="Hall name (optional)"
                className="h-11"
            />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Submit Donation Record
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

