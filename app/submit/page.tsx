"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonorForm } from "@/components/DonorForm"
import { DonorPaste } from "@/components/DonorPaste"

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Submit Donor</h1>
        <p className="text-muted-foreground">Add new donor information using form or paste format</p>
      </div>

      <Tabs defaultValue="form" className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Form Input</TabsTrigger>
          <TabsTrigger value="paste">Paste Format</TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <DonorForm />
        </TabsContent>
        <TabsContent value="paste">
          <DonorPaste />
        </TabsContent>
      </Tabs>
    </div>
  )
}

