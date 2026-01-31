"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { checkAdminStatus } from "@/lib/auth"
import { ParsedDonorData } from "@/lib/parser"
import { Plus, Edit, Trash2, TestTube } from "lucide-react"

interface ParsingExample {
  id: string
  rawText: string
  expectedOutput: ParsedDonorData
  parsedOutput?: ParsedDonorData
  confidence?: number
  isCorrect?: boolean
  createdAt: string
}

export function TrainingExamplesTab() {
  const [examples, setExamples] = useState<ParsingExample[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingExample, setEditingExample] = useState<ParsingExample | null>(null)
  const [testResult, setTestResult] = useState<ParsedDonorData | null>(null)

  const [formData, setFormData] = useState({
    rawText: "",
    expectedOutput: {
      name: "",
      bloodGroup: "",
      phone: "",
      date: "",
      batch: "",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  })

  const fetchExamples = async () => {
    setLoading(true)
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const response = await fetch(`/api/training/examples?page=${page}&limit=20`, {
        headers: {
          "x-is-rockstar": "true",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExamples(data.examples)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error("Error fetching examples:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExamples()
  }, [page])

  const handleTestParse = async () => {
    if (!formData.rawText) return

    try {
      const response = await fetch("/api/test/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formData.rawText }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.donors && data.donors.length > 0) {
          setTestResult(data.donors[0])
        }
      }
    } catch (error) {
      console.error("Error testing parse:", error)
    }
  }

  const handleSave = async () => {
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const url = editingExample
        ? `/api/training/examples/${editingExample.id}`
        : "/api/training/examples"
      const method = editingExample ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-is-rockstar": "true",
        },
        body: JSON.stringify({
          rawText: formData.rawText,
          expectedOutput: formData.expectedOutput,
        }),
      })

      if (response.ok) {
        setShowAddDialog(false)
        setEditingExample(null)
        setFormData({
          rawText: "",
          expectedOutput: {
            name: "",
            bloodGroup: "",
            phone: "",
            date: "",
            batch: "",
            referrer: "",
            hallName: "",
          },
        })
        setTestResult(null)
        fetchExamples()
      }
    } catch (error) {
      console.error("Error saving example:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this example?")) return

    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const response = await fetch(`/api/training/examples/${id}`, {
        method: "DELETE",
        headers: {
          "x-is-rockstar": "true",
        },
      })

      if (response.ok) {
        fetchExamples()
      }
    } catch (error) {
      console.error("Error deleting example:", error)
    }
  }

  const openEditDialog = (example: ParsingExample) => {
    setEditingExample(example)
    setFormData({
      rawText: example.rawText,
      expectedOutput: example.expectedOutput,
    })
    setTestResult(example.parsedOutput || null)
    setShowAddDialog(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Training Examples</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Example
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : examples.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No training examples yet. Add your first example to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {examples.map((example) => (
              <Card key={example.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Example #{example.id.slice(-8)}
                      </CardTitle>
                      {example.confidence !== undefined && (
                        <Badge
                          variant={
                            example.confidence > 0.7 ? "default" : "secondary"
                          }
                          className="mt-2"
                        >
                          Confidence: {(example.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(example)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(example.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Raw Text
                      </Label>
                      <p className="text-sm bg-muted p-2 rounded">
                        {example.rawText.substring(0, 200)}
                        {example.rawText.length > 200 ? "..." : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {example.expectedOutput.name}
                      </div>
                      <div>
                        <span className="font-medium">Blood Group:</span>{" "}
                        {example.expectedOutput.bloodGroup}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>{" "}
                        {example.expectedOutput.phone}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {example.expectedOutput.date}
                      </div>
                    </div>
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

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExample ? "Edit Training Example" : "Add Training Example"}
            </DialogTitle>
            <DialogDescription>
              Paste raw text and fill in the expected output
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="raw-text">Raw Text</Label>
              <Textarea
                id="raw-text"
                value={formData.rawText}
                onChange={(e) =>
                  setFormData({ ...formData, rawText: e.target.value })
                }
                className="min-h-32"
                placeholder="Paste unstructured donor data here..."
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleTestParse}
              >
                <TestTube className="mr-2 h-4 w-4" />
                Test Parse
              </Button>
            </div>

            {testResult && (
              <div className="p-3 bg-muted rounded">
                <Label className="text-xs text-muted-foreground mb-2 block">
                  Current Parser Output
                </Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Name: {testResult.name || "N/A"}</div>
                  <div>Blood Group: {testResult.bloodGroup || "N/A"}</div>
                  <div>Phone: {testResult.phone || "N/A"}</div>
                  <div>Date: {testResult.date || "N/A"}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Donor Name *</Label>
                <Input
                  id="name"
                  value={formData.expectedOutput.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        name: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="bloodGroup">Blood Group *</Label>
                <Input
                  id="bloodGroup"
                  value={formData.expectedOutput.bloodGroup}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        bloodGroup: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.expectedOutput.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        phone: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  value={formData.expectedOutput.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        date: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Input
                  id="batch"
                  value={formData.expectedOutput.batch || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        batch: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="referrer">Referrer</Label>
                <Input
                  id="referrer"
                  value={formData.expectedOutput.referrer || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        referrer: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="hallName">Hall Name</Label>
                <Input
                  id="hallName"
                  value={formData.expectedOutput.hallName || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedOutput: {
                        ...formData.expectedOutput,
                        hallName: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

