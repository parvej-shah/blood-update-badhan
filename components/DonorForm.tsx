"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export function DonorForm() {
  const [loading, setLoading] = useState(false)
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
          hospital: formData.hospital || "Unknown",
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
        hospital: "",
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
    <Card>
      <CardHeader>
        <CardTitle>Submit Donor Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Donor Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter donor name"
            />
          </div>

          <div>
            <Label htmlFor="bloodGroup">Blood Group *</Label>
            <Select
              value={formData.bloodGroup}
              onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
              required
            >
              <SelectTrigger>
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
            <Label htmlFor="batch">Batch</Label>
            <Input
              id="batch"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
              placeholder="Unknown"
            />
          </div>

          <div>
            <Label htmlFor="hospital">Hospital</Label>
            <Input
              id="hospital"
              value={formData.hospital}
              onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
              placeholder="Unknown"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, or M/D/YYYY"
            />
          </div>

          <div>
            <Label htmlFor="referrer">Referrer</Label>
            <Input
              id="referrer"
              value={formData.referrer}
              onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="hallName">Hall Name</Label>
            <Input
              id="hallName"
              value={formData.hallName}
              onChange={(e) => setFormData({ ...formData, hallName: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

