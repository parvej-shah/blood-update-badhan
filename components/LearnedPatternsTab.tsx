"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { checkAdminStatus } from "@/lib/auth-client"

interface Pattern {
  id: string
  patternType: string
  pattern: string
  field: string
  confidence: number
  usageCount: number
  successRate: number
  isEnabled: boolean
}

export function LearnedPatternsTab() {
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatterns = async () => {
    setLoading(true)
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const response = await fetch("/api/training/patterns?limit=100", {
        headers: {
          "x-is-rockstar": "true",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPatterns(data.patterns)
      }
    } catch (error) {
      console.error("Error fetching patterns:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatterns()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Learned Patterns</h2>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : patterns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No patterns learned yet. Train the model to extract patterns.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {patterns.map((pattern) => (
            <Card key={pattern.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pattern.field}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{pattern.patternType}</Badge>
                      <Badge variant={pattern.isEnabled ? "default" : "secondary"}>
                        {pattern.isEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Pattern</span>
                    <p className="text-sm bg-muted p-2 rounded font-mono">
                      {pattern.pattern.substring(0, 100)}
                      {pattern.pattern.length > 100 ? "..." : ""}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Confidence:</span>{" "}
                      {(pattern.confidence * 100).toFixed(0)}%
                    </div>
                    <div>
                      <span className="font-medium">Usage Count:</span>{" "}
                      {pattern.usageCount}
                    </div>
                    <div>
                      <span className="font-medium">Success Rate:</span>{" "}
                      {(pattern.successRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

