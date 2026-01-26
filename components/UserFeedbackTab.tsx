"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { checkAdminStatus } from "@/lib/auth"
import { Check, X } from "lucide-react"

interface UserFeedback {
  id: string
  rawText: string
  parsedOutput: any
  isCorrect: boolean
  comment?: string
  reviewedByAdmin: boolean
  createdAt: string
}

export function UserFeedbackTab() {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("pending")

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const reviewed = filter === "pending" ? "false" : filter === "reviewed" ? "true" : undefined
      const url = `/api/parsing/feedback?page=${page}&limit=20${reviewed ? `&reviewed=${reviewed}` : ""}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching feedback:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [page, filter])

  const handleApproveAsExample = async (feedback: UserFeedback) => {
    // This would open the add example dialog with pre-filled data
    // For now, just mark as reviewed
    await handleMarkReviewed(feedback.id)
  }

  const handleMarkReviewed = async (id: string) => {
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const response = await fetch(`/api/parsing/feedback/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-is-rockstar": "true",
        },
        body: JSON.stringify({ reviewedByAdmin: true }),
      })

      if (response.ok) {
        fetchFeedbacks()
      }
    } catch (error) {
      console.error("Error marking feedback as reviewed:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">User Feedback</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "reviewed" ? "default" : "outline"}
            onClick={() => setFilter("reviewed")}
          >
            Reviewed
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No feedback to review.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {feedback.isCorrect ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                        Feedback #{feedback.id.slice(-8)}
                      </CardTitle>
                      {feedback.reviewedByAdmin && (
                        <Badge className="mt-2">Reviewed</Badge>
                      )}
                    </div>
                    {!feedback.reviewedByAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveAsExample(feedback)}
                        >
                          Approve as Example
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkReviewed(feedback.id)}
                        >
                          Mark Reviewed
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-muted-foreground">Raw Text</span>
                      <p className="text-sm bg-muted p-2 rounded">
                        {feedback.rawText.substring(0, 200)}
                        {feedback.rawText.length > 200 ? "..." : ""}
                      </p>
                    </div>
                    {feedback.comment && (
                      <div>
                        <span className="text-xs text-muted-foreground">Comment</span>
                        <p className="text-sm bg-muted p-2 rounded">{feedback.comment}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

