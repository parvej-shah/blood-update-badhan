"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Droplets,
  Sparkles
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

// Helper function to capitalize and format text
function capitalizeWords(text: string | null | undefined): string | null | undefined {
  if (!text) return text
  return text
    .split(' ')
    .map(word => {
      if (word.length === 0) return word
      // Keep acronyms uppercase (2-3 letters all caps)
      if (word.length <= 3 && word === word.toUpperCase()) return word
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

const FIELD_LINE_RE = new RegExp([
  /(\+?880)?01[3-9]\d{8}/.source,                          // BD phone
  /\+?880\s*1[3-9][\d\s\-]{7,}/.source,                   // +880 spaced phone
  /\b\d{1,2}[\/\-._]\d{1,2}[\/\-._]\d{2,4}\b/.source,    // numeric date
  /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4}\b/i.source, // written date
  /^(A[B]?|B|O)[+\-](\(?ve\)?|positive|negative)?$/i.source, // blood group standalone
  /\b(IIT|Math|Mathematics|MTH|Chemistry|SWE|INFS|Fisheries|AMATH|Physics|Ocn|NE|ACCE|EEE|GEB|Botany|Microbiology|Zoology|Statistics|CSE|EECE|BUET|DU|RU|CU|JU|SUST|KUET|RUET|CUET)\b/i.source, // dept/uni
  /\b(?:20)?[1-2]\d[-_/](?:20)?[1-2]\d\b/.source,         // batch year range
  /\b(AEH|AE|SK|PG|mohsin|jagannath|surjasen|21\s*hall)\b/i.source, // hall
].join('|'))

function isFieldLine(line: string): boolean {
  return FIELD_LINE_RE.test(line)
}

function isNameLike(line: string): boolean {
  const t = line.trim()
  if (!t || t.length < 2) return false
  if (isFieldLine(t)) return false
  // Should be mostly letters/spaces/hyphens, no digits beyond a couple
  if (/\d{4,}/.test(t)) return false        // long digit run = phone/date
  if (/[:@#]/.test(t)) return false          // obviously not a name
  return /[a-zA-Zঀ-৿]/.test(t)    // has at least some letters
}

// When blocks are pasted without blank-line separators, detect boundaries:
// a field line followed by a name-like line signals the start of a new block.
function insertBlockSeparators(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let seenFieldInBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') {
      out.push(line)
      seenFieldInBlock = false
      continue
    }

    if (isFieldLine(trimmed)) {
      seenFieldInBlock = true
      out.push(line)
      continue
    }

    if (isNameLike(trimmed) && seenFieldInBlock) {
      // Name-like line after fields → new block boundary
      out.push('')
      seenFieldInBlock = false
    }

    out.push(line)
  }

  return out.join('\n')
}

// Strip WhatsApp metadata artifacts from pasted text
function cleanPastedText(raw: string): string {
  let s = raw
  // "Name  · \nEdited" or "Name · Edited" — remove · and the Edited token (cross-line)
  s = s.replace(/[ \t]*·[ \t]*\n[ \t]*Edited[ \t]*/gi, '')
  s = s.replace(/[ \t]*·[ \t]*Edited[ \t]*/gi, ' ')
  // Standalone "Edited" line
  s = s.replace(/^[ \t]*Edited[ \t]*$/gim, '')
  // Remaining middle dots
  s = s.replace(/·/g, ' ')
  // WhatsApp timestamps — replace with blank line (block separator)
  // Matches: "00:24", "11:32", "9:05", optionally preceded by a date like "21 May 2026, 11:32"
  s = s.replace(/^[ \t]*(?:\d{1,2}\s+\w+\s+\d{4},?\s*)?\d{1,2}:\d{2}(?:\s*[AP]M)?[ \t]*$/gim, '\n')
  // Strip stray Bengali/Arabic numerals and reaction-like single characters on their own line
  s = s.replace(/^[ \t]*[০-৯٠-٩]+[ \t]*$/gm, '')
  // Insert blank-line separators where blocks run together without them
  s = insertBlockSeparators(s)
  // Collapse multiple blank lines down to one
  s = s.replace(/\n{3,}/g, '\n\n')
  // Strip trailing spaces per line
  s = s.replace(/[ \t]+$/gm, '')
  return s.trim()
}

// Format donor data before submission
function formatDonorData(donor: any) {
  return {
    ...donor,
    name: capitalizeWords(donor.name),
    referrer: capitalizeWords(donor.referrer),
    hallName: capitalizeWords(donor.hallName),
    // Batch and blood group stay as-is
    batch: donor.batch,
    bloodGroup: donor.bloodGroup,
    phone: donor.phone,
    date: donor.date,
  }
}

export function DonorPaste() {
  const [text, setText] = useState("")
  const [parsedData, setParsedData] = useState<any[] | any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBulk, setIsBulk] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [usedAI, setUsedAI] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(true)
  const parsedDataRef = useRef<any>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    parsedDataRef.current = parsedData
  }, [parsedData])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault()
        if (!loadingRef.current) handleParse()
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (!loadingRef.current && parsedDataRef.current) handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleParse = async () => {
    try {
      setError(null)
      setUsedAI(false)
      setLoading(true)

      const { safeResponseJson } = await import('@/lib/utils')
      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, useAI: aiEnabled }),
      })

      const data = await safeResponseJson(response, 'parse API')

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse text')
      }

      const parsed: any[] = data.donors
      if (parsed && parsed.length > 0) {
        setUsedAI(data.usedAI === true)
        const formattedParsed = parsed.map(donor => formatDonorData(donor))

        if (formattedParsed.length > 1) {
          setIsBulk(true)
          setParsedData(formattedParsed)
        } else {
          setIsBulk(false)
          setParsedData(formattedParsed[0])
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
      let duplicateCount = 0
      let errorCount = 0
      const errors: string[] = []
      const failedDonors: any[] = []

      // Submit all donors
      for (const donor of donors) {
        try {
          // Format and capitalize donor data before submission
          const formattedDonor = formatDonorData(donor)

          const response = await fetch("/api/donors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formattedDonor),
          })

          // Use safe JSON parsing with consistent error handling
          const { safeResponseJson } = await import('@/lib/utils')
          const data = await safeResponseJson(response, 'donor submission')

          if (!response.ok) {
            if (response.status === 409 || data.code === 'DUPLICATE_ENTRY') {
              duplicateCount++
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
          if (donor.phone) parts.push(`Phone: ${donor.phone}`)
          if (donor.date) parts.push(`Date: ${donor.date}`)
          if (donor.referrer) parts.push(`Referrer: ${donor.referrer}`)
          if (donor.hallName) parts.push(`Hall Name: ${donor.hallName}`)
          return parts.join('\n')
        }).join('\n\n')
        setText(failedText)
      } else {
        // All succeeded or duplicated, clear everything
        setText("")
        setParsedData(null)
        setIsBulk(false)
        setShowFeedback(false)
        setUsedAI(false)
      }

      if (window.toast) {
        if (errorCount === 0 && duplicateCount === 0) {
          window.toast({
            title: "Success",
            description: `Successfully submitted ${successCount} donor${successCount > 1 ? "s" : ""}!`,
            variant: "success",
          })
        } else if (errorCount === 0 && duplicateCount > 0) {
          const parts = []
          if (successCount > 0) parts.push(`${successCount} submitted`)
          parts.push(`${duplicateCount} already exist${duplicateCount > 1 ? "" : "s"}`)
          window.toast({
            title: successCount > 0 ? "Partial Success" : "Already Exists",
            description: parts.join(", ") + ".",
            variant: successCount > 0 ? "success" : "destructive",
          })
        } else {
          window.toast({
            title: "Partial Success",
            description: `Submitted ${successCount}, ${duplicateCount} duplicate${duplicateCount !== 1 ? "s" : ""}, ${errorCount} failed. Only failed entries remain for retry.`,
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
            <div>Hasanur Rahman <span className="text-primary/50">← referrer</span></div>
            <div>Parvej Shah <span className="text-primary/50">← donor</span></div>
            <div>B+</div>
            <div>IIT 23-24</div>
            <div>01516538054</div>
            <div>25-08-25</div>
            <div>AEH</div>
          </div>
          <p className="text-muted-foreground text-xs">
            Line 1 = referrer, Line 2 = donor name, then blood group / batch / phone / date / hall in any order. Separate multiple donors with a blank line.
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
            onChange={(e) => {
              setText(e.target.value)
              if (parsedData) {
                setParsedData(null)
                setUsedAI(false)
              }
            }}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = cleanPastedText(e.clipboardData.getData('text'))
              const el = e.currentTarget
              const start = el.selectionStart ?? text.length
              const end = el.selectionEnd ?? text.length
              const before = text.slice(0, start)
              const after = text.slice(end)
              // Ensure there's a blank line before the pasted block if there's existing content
              const prefix = before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : before ? '' : ''
              const newText = before + prefix + pasted.trimEnd() + '\n\n' + after
              setText(newText)
              if (parsedData) {
                setParsedData(null)
                setUsedAI(false)
              }
              // Move cursor to after the blank line separator
              const cursorPos = before.length + prefix.length + pasted.trimEnd().length + 2
              requestAnimationFrame(() => {
                el.selectionStart = cursorPos
                el.selectionEnd = cursorPos
              })
            }}
            placeholder="Paste donor info here (one line per field)"
            className="min-h-40 font-mono text-sm"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setAiEnabled(v => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors shrink-0",
              aiEnabled
                ? "bg-violet-50 border-violet-200 text-violet-600"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI {aiEnabled ? "On" : "Off"}
          </button>

          <Button
            onClick={handleParse}
            variant="outline"
            className="flex-1 h-11"
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
        </div>

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
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Preview
                  {isBulk && Array.isArray(parsedData) && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {parsedData.length} donors
                    </Badge>
                  )}
                  {usedAI && (
                    <Badge variant="secondary" className="gap-1 text-xs text-violet-600 border-violet-200 bg-violet-50">
                      <Sparkles className="h-3 w-3" />
                      AI parsed
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
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {parsedData.map((donor, index) => (
                    <div key={index} className="border rounded-xl bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Compact header */}
                      <div className="bg-gradient-to-r from-primary/5 to-transparent px-4 py-2.5 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs font-semibold text-primary">
                            #{index + 1}
                          </span>
                          <span className="font-medium truncate">{donor.name || "N/A"}</span>
                        </div>
                        {donor.bloodGroup && (
                          <span className={cn(
                            "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold border flex-shrink-0",
                            bloodGroupColors[donor.bloodGroup] || "bg-muted text-muted-foreground"
                          )}>
                            <Droplets className="h-3 w-3 mr-1" />
                            {donor.bloodGroup}
                          </span>
                        )}
                      </div>

                      {/* Compact details */}
                      <div className="p-3 grid grid-cols-2 gap-2.5 text-sm">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{donor.phone || "N/A"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{donor.date || "N/A"}</p>
                        </div>
                        <div className="space-y-0.5 col-span-2">
                          <p className="text-xs text-muted-foreground">Batch</p>
                          <p className="truncate">{donor.batch || "Unknown"}</p>
                        </div>
                        {donor.referrer && (
                          <div className="space-y-0.5 col-span-2">
                            <p className="text-xs text-muted-foreground">Referrer</p>
                            <p className="truncate">{donor.referrer}</p>
                          </div>
                        )}
                        {donor.hallName && (
                          <div className="space-y-0.5 col-span-2">
                            <p className="text-xs text-muted-foreground">Hall</p>
                            <p className="truncate">{donor.hallName}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
                  {/* Header with name and blood group */}
                  <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4 border-b">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{parsedData.name || "N/A"}</h3>
                      </div>
                      {parsedData.bloodGroup && (
                        <span className={cn(
                          "inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-sm font-bold border flex-shrink-0",
                          bloodGroupColors[parsedData.bloodGroup] || "bg-muted text-muted-foreground"
                        )}>
                          <Droplets className="h-3.5 w-3.5 mr-1.5" />
                          {parsedData.bloodGroup}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Phone</p>
                        <p className="text-sm font-medium">{parsedData.phone || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Date</p>
                        <p className="text-sm font-medium">{parsedData.date || "N/A"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Batch</p>
                      <p className="text-sm">{parsedData.batch || "Unknown"}</p>
                    </div>

                    {(parsedData.referrer || parsedData.hallName) && (
                      <div className="pt-2 border-t space-y-2">
                        {parsedData.referrer && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Referrer</p>
                            <p className="text-sm">{parsedData.referrer}</p>
                          </div>
                        )}
                        {parsedData.hallName && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Hall</p>
                            <p className="text-sm">{parsedData.hallName}</p>
                          </div>
                        )}
                      </div>
                    )}
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
