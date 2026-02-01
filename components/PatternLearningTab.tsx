"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkAdminStatus } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

export function PatternLearningTab() {
  const [learning, setLearning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleRetrain = async () => {
    setLearning(true)
    setResult(null)
    
    try {
      const isAdmin = checkAdminStatus()
      if (!isAdmin) return

      const response = await fetch("/api/training/learn", {
        method: "POST",
        headers: {
          "x-is-rockstar": "true",
        },
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
      }
    } catch (error) {
      console.error("Error learning patterns:", error)
    } finally {
      setLearning(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Pattern Learning</h2>

      <Card>
        <CardHeader>
          <CardTitle>Retrain Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Analyze all training examples and extract patterns to improve parsing accuracy.
          </p>
          
          <Button
            onClick={handleRetrain}
            disabled={learning}
            className="w-full"
          >
            {learning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Learning Patterns...
              </>
            ) : (
              "Retrain Model"
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h3 className="font-semibold mb-2">Learning Results</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Patterns Learned:</span>{" "}
                  {result.patternsLearned}
                </div>
                <div>
                  <span className="font-medium">Total Examples:</span>{" "}
                  {result.statistics?.totalExamples}
                </div>
                <div>
                  <span className="font-medium">Regex Patterns:</span>{" "}
                  {result.statistics?.regexPatterns}
                </div>
                <div>
                  <span className="font-medium">Positional Patterns:</span>{" "}
                  {result.statistics?.positionalPatterns}
                </div>
                <div>
                  <span className="font-medium">Keyword Patterns:</span>{" "}
                  {result.statistics?.keywordPatterns}
                </div>
                <div>
                  <span className="font-medium">Average Confidence:</span>{" "}
                  {(result.statistics?.averageConfidence * 100 || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

