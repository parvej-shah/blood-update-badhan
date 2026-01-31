"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { parseFormattedText, parseBulkFormattedText } from "@/lib/parser"
import { Badge } from "@/components/ui/badge"
import { ParsingFeedbackDialog } from "@/components/ParsingFeedbackDialog"
import { cn } from "@/lib/utils"
import { 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Send,
  MessageSquare,
  Droplets
} from "lucide-react"

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

export function DonorPaste() {
  const [text, setText] = useState("")
  const [parsedData, setParsedData] = useState<any[] | any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBulk, setIsBulk] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const handleParse = async () => {
    try {
      setError(null)
      setLoading(true)
      
      // Use async parsing (supports custom parser)
      const parsed = await parseBulkFormattedText(text)
      
      if (parsed.length > 0) {
        if (parsed.length > 1) {
          setIsBulk(true)
          setParsedData(parsed)
        } else {
          setIsBulk(false)
          setParsedData(parsed[0])
        }
      } else {
        setError("Could not parse the text. Please check the format.")
        setParsedData(null)
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
        setShowFeedback(false)
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Paste Formatted Text
        </CardTitle>
        <CardDescription>
          Paste pre-formatted donor information for quick entry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Format Guide */}
        <div className="p-4 bg-muted/50 rounded-lg border text-sm space-y-2">
          <p className="font-medium text-foreground">Expected format:</p>
          <div className="font-mono text-xs bg-background p-3 rounded border space-y-0.5 text-muted-foreground">
            <div>Donor Name: John Doe</div>
            <div>Blood Group: B+ <span className="text-muted-foreground/60">(or B(+ve), B(positive))</span></div>
            <div>Batch: 2020</div>
            <div>Hospital: Dhaka Medical</div>
            <div>Phone: 01712345678</div>
            <div>Date: 25-01-2026 <span className="text-muted-foreground/60">(DD-MM-YYYY)</span></div>
            <div>Referrer: Jane Smith</div>
            <div>Hall Name: Shahid Hall</div>
          </div>
          <p className="text-muted-foreground text-xs">
            For multiple donors, separate entries with blank lines.
          </p>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <Label htmlFor="paste-text" className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Formatted Text
          </Label>
          <Textarea
            id="paste-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your formatted donor information here..."
            className="min-h-40 font-mono text-sm"
          />
        </div>

        <Button 
          onClick={handleParse} 
          variant="outline" 
          className="w-full h-11" 
          disabled={loading || !text.trim()}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Parsing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Parse & Preview
            </span>
          )}
        </Button>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm text-destructive">{error}</div>
          </div>
        )}

        {parsedData && (
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Preview
                  {isBulk && Array.isArray(parsedData) && (
                    <Badge variant="secondary" className="ml-2">
                      <Users className="h-3 w-3 mr-1" />
                      {parsedData.length} donors
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFeedback(true)}
                  className="text-xs gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Feedback
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBulk && Array.isArray(parsedData) ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {parsedData.map((donor, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          Donor #{index + 1}
                        </span>
                        {donor.bloodGroup && (
                          <span className={cn(
                            "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold border",
                            bloodGroupColors[donor.bloodGroup] || "bg-muted text-muted-foreground"
                          )}>
                            {donor.bloodGroup}
                          </span>
                        )}
                        </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                        <div className="flex gap-1">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium truncate">{donor.name || "N/A"}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{donor.phone || "N/A"}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{donor.date || "N/A"}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-muted-foreground">Hospital:</span>
                          <span className="truncate">{donor.hospital || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">{parsedData.name || "N/A"}</span>
                    {parsedData.bloodGroup && (
                      <span className={cn(
                        "inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-bold border",
                        bloodGroupColors[parsedData.bloodGroup] || "bg-muted text-muted-foreground"
                      )}>
                        <Droplets className="h-3.5 w-3.5 mr-1.5" />
                        {parsedData.bloodGroup}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{parsedData.phone || "N/A"}</span>
                  </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{parsedData.date || "N/A"}</span>
                  </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Batch:</span>
                      <span>{parsedData.batch || "N/A"}</span>
                  </div>
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">Hospital:</span>
                      <span className="truncate">{parsedData.hospital || "N/A"}</span>
                  </div>
                    <div className="flex gap-2 col-span-2">
                      <span className="text-muted-foreground">Referrer:</span>
                      <span>{parsedData.referrer || "N/A"}</span>
                  </div>
                    <div className="flex gap-2 col-span-2">
                      <span className="text-muted-foreground">Hall:</span>
                      <span>{parsedData.hallName || "N/A"}</span>
                  </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleSubmit} 
                disabled={loading} 
                className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    {isBulk && Array.isArray(parsedData)
                  ? `Submit ${parsedData.length} Donors`
                      : "Submit Donation Record"}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Feedback Dialog */}
        {parsedData && (
          <ParsingFeedbackDialog
            open={showFeedback}
            onOpenChange={setShowFeedback}
            rawText={text}
            parsedData={parsedData}
            onFeedbackSubmitted={() => {
              setShowFeedback(false)
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}
