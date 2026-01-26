"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ParsedDonorData } from "@/lib/parser"

interface ParsingFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rawText: string
  parsedData: ParsedDonorData | ParsedDonorData[]
  onFeedbackSubmitted?: () => void
}

export function ParsingFeedbackDialog({
  open,
  onOpenChange,
  rawText,
  parsedData,
  onFeedbackSubmitted,
}: ParsingFeedbackDialogProps) {
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isCorrect === null) return

    setSubmitting(true)
    try {
      const donors = Array.isArray(parsedData) ? parsedData : [parsedData]
      
      // Submit feedback for each donor
      for (const donor of donors) {
        await fetch("/api/parsing/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rawText,
            parsedOutput: donor,
            isCorrect,
            comment: isCorrect ? null : comment,
          }),
        })
      }

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted()
      }
      
      // Reset and close
      setIsCorrect(null)
      setComment("")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Failed to submit feedback:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = () => {
    setIsCorrect(null)
    setComment("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Help Improve Parsing</DialogTitle>
          <DialogDescription>
            Was the parsing correct? Your feedback helps us improve the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Question 1: Was parsing correct? */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Was this parsing correct?
            </Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={isCorrect === true ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsCorrect(true)}
                disabled={submitting}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={isCorrect === false ? "default" : "outline"}
                className="flex-1"
                onClick={() => setIsCorrect(false)}
                disabled={submitting}
              >
                No
              </Button>
            </div>
          </div>

          {/* Question 2: Comment (only if No) */}
          {isCorrect === false && (
            <div>
              <Label htmlFor="feedback-comment" className="mb-2 block">
                What was incorrect? (Optional)
              </Label>
              <Textarea
                id="feedback-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe what was wrong or what should be corrected..."
                className="min-h-24"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCorrect === null || submitting}
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

