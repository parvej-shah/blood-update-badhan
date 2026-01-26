"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkAdminStatus } from "@/lib/auth"
import { TrainingExamplesTab } from "@/components/TrainingExamplesTab"
import { UserFeedbackTab } from "@/components/UserFeedbackTab"
import { LearnedPatternsTab } from "@/components/LearnedPatternsTab"
import { PatternLearningTab } from "@/components/PatternLearningTab"

export default function TrainingPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const admin = checkAdminStatus()
    setIsAdmin(admin)
    setLoading(false)
    
    if (!admin) {
      router.push("/")
    }
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You must be an admin to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Training Data Management</h1>
        <p className="text-muted-foreground">
          Manage training examples, review user feedback, and train the parsing model
        </p>
      </div>

      <Tabs defaultValue="examples" className="space-y-4">
        <TabsList>
          <TabsTrigger value="examples">Training Examples</TabsTrigger>
          <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="learning">Pattern Learning</TabsTrigger>
        </TabsList>

        <TabsContent value="examples">
          <TrainingExamplesTab />
        </TabsContent>

        <TabsContent value="feedback">
          <UserFeedbackTab />
        </TabsContent>

        <TabsContent value="patterns">
          <LearnedPatternsTab />
        </TabsContent>

        <TabsContent value="learning">
          <PatternLearningTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

