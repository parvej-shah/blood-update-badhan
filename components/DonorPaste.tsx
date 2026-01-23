"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { parseFormattedText, parseBulkFormattedTextSync } from "@/lib/parser"
import { Badge } from "@/components/ui/badge"

export function DonorPaste() {
  const [text, setText] = useState("")
  const [parsedData, setParsedData] = useState<any[] | any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBulk, setIsBulk] = useState(false)

  const handleParse = async () => {
    try {
      setError(null)
      setLoading(true)
      
      // Try bulk parsing first (sync version for client-side)
      const bulkParsed = parseBulkFormattedTextSync(text)
      
      if (bulkParsed.length > 0) {
        // Sync parsing succeeded
        if (bulkParsed.length > 1) {
          setIsBulk(true)
          setParsedData(bulkParsed)
        } else {
          setIsBulk(false)
          setParsedData(bulkParsed[0])
        }
      } else {
        // Sync parsing failed, try AI parsing via API
        try {
          const response = await fetch("/api/test/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          })
          
          const data = await response.json()
          
          if (response.ok && data.success && data.donors.length > 0) {
            if (data.donors.length > 1) {
              setIsBulk(true)
              setParsedData(data.donors)
            } else {
              setIsBulk(false)
              setParsedData(data.donors[0])
            }
          } else {
            // Fallback to single parsing
            const parsed = parseFormattedText(text)
            setIsBulk(false)
            setParsedData(parsed)
          }
        } catch (aiError: any) {
          // AI parsing failed, try single parsing
          const parsed = parseFormattedText(text)
          setIsBulk(false)
          setParsedData(parsed)
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse text")
      setParsedData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!parsedData) return

    setLoading(true)
    try {
      const donors = Array.isArray(parsedData) ? parsedData : [parsedData]
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []
      const failedDonors: any[] = []

      // Submit all donors
      for (const donor of donors) {
        try {
          const response = await fetch("/api/donors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(donor),
          })

          const data = await response.json()

          if (!response.ok) {
            // Check if it's a duplicate error
            if (response.status === 409 || data.code === 'DUPLICATE_ENTRY') {
              // Treat duplicate as success (already exists, no need to resubmit)
              successCount++
            } else {
              throw new Error(data.error || "Failed to submit donor")
            }
          } else {
            successCount++
          }
        } catch (err: any) {
          errorCount++
          errors.push(`${donor.name || "Unknown"}: ${err.message}`)
          // Keep failed donors for retry
          failedDonors.push(donor)
        }
      }

      // Update parsedData to only include failed donors
      if (failedDonors.length > 0) {
        if (failedDonors.length === 1) {
          setParsedData(failedDonors[0])
          setIsBulk(false)
        } else {
          setParsedData(failedDonors)
          setIsBulk(true)
        }
        // Reconstruct text from failed donors only
        const failedText = failedDonors.map((donor) => {
          const parts = []
          if (donor.name) parts.push(`Donor Name: ${donor.name}`)
          if (donor.bloodGroup) parts.push(`Blood Group: ${donor.bloodGroup}`)
          if (donor.batch) parts.push(`Batch: ${donor.batch}`)
          if (donor.hospital) parts.push(`Hospital: ${donor.hospital}`)
          if (donor.phone) parts.push(`Phone: ${donor.phone}`)
          if (donor.date) parts.push(`Date: ${donor.date}`)
          if (donor.referrer) parts.push(`Referrer: ${donor.referrer}`)
          if (donor.hallName) parts.push(`Hall Name: ${donor.hallName}`)
          return parts.join('\n')
        }).join('\n\n')
        setText(failedText)
      } else {
        // All succeeded, clear everything
        setText("")
        setParsedData(null)
        setIsBulk(false)
      }

      if (window.toast) {
        if (errorCount === 0) {
          window.toast({
            title: "Success",
            description: `Successfully submitted ${successCount} donor${successCount > 1 ? "s" : ""}!`,
            variant: "success",
          })
        } else {
          window.toast({
            title: "Partial Success",
            description: `Submitted ${successCount} donor${successCount > 1 ? "s" : ""}, ${errorCount} failed. Only failed entries remain for retry.`,
            variant: successCount > 0 ? "success" : "destructive",
          })
          setError(errors.join("; "))
        }
      }
    } catch (error: any) {
      if (window.toast) {
        window.toast({
          title: "Error",
          description: error.message || "Failed to submit donor information",
          variant: "destructive",
        })
      }
      // Keep the data so user can fix and resubmit
      setError(error.message || "Failed to submit donor information")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paste Formatted Text</CardTitle>
        <CardDescription>
          Paste the formatted donor information below. You can paste single or multiple donors (separated by blank lines).
          <br />
          <br />
          Expected format:
          <br />
          Donor Name: ...
          <br />
          Blood Group: ... (supports B(+ve), B(positive), etc.)
          <br />
          Batch: ...
          <br />
          Hospital: ...
          <br />
          Phone: ...
          <br />
          Date: ... (supports DD-MM-YY, DD-MM-YYYY, DD.MM.YY, DD.MM.YYYY, M/D/YY, M/D/YYYY)
          <br />
          Referrer: ...
          <br />
          Hall Name: ...
          <br />
          <br />
          For multiple donors, separate entries with blank lines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="paste-text">Formatted Text</Label>
          <Textarea
            id="paste-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste formatted text here..."
            className="min-h-32"
          />
        </div>

        <Button onClick={handleParse} variant="outline" className="w-full" disabled={loading}>
          {loading ? "Parsing..." : "Parse & Preview"}
        </Button>

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {parsedData && (
          <Card>
            <CardHeader>
              <CardTitle>
                Preview {isBulk && Array.isArray(parsedData) && `(${parsedData.length} donors)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBulk && Array.isArray(parsedData) ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {parsedData.map((donor, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="text-xs text-muted-foreground mb-2">Donor #{index + 1}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {donor.name || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Blood Group:</span>{" "}
                          <Badge>{donor.bloodGroup || "N/A"}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Batch:</span> {donor.batch || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Hospital:</span> {donor.hospital || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {donor.phone || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {donor.date || "N/A"}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Referrer:</span> {donor.referrer || "N/A"}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Hall Name:</span> {donor.hallName || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {parsedData.name || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Blood Group:</span>{" "}
                    <Badge>{parsedData.bloodGroup || "N/A"}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Batch:</span> {parsedData.batch || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Hospital:</span> {parsedData.hospital || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {parsedData.phone || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {parsedData.date || "N/A"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Referrer:</span> {parsedData.referrer || "N/A"}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Hall Name:</span> {parsedData.hallName || "N/A"}
                  </div>
                </div>
              )}
              <Button onClick={handleSubmit} disabled={loading} className="w-full mt-4">
                {loading
                  ? "Submitting..."
                  : isBulk && Array.isArray(parsedData)
                  ? `Submit ${parsedData.length} Donors`
                  : "Submit"}
              </Button>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

