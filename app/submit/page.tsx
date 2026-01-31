"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonorForm } from "@/components/DonorForm"
import { DonorPaste } from "@/components/DonorPaste"
import { FileText, FormInput, HeartHandshake, Droplets } from "lucide-react"

export default function SubmitPage() {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#6B1E28] via-[#8B2E3C] to-[#C94C5E] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 left-10 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-5 right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        
        <div className="container mx-auto px-4 py-12 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
              <HeartHandshake className="h-7 w-7 blood-drop" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Submit Donation
              </h1>
              <p className="text-white/80">
                Record a new blood donation
              </p>
            </div>
          </div>
          <p className="text-white/80 max-w-2xl text-sm md:text-base">
            Add donor information to the Badhan database. You can enter details manually 
            using the form or paste pre-formatted text for quick entry.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto -mt-6">
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/80 backdrop-blur-sm shadow-lg rounded-xl">
              <TabsTrigger 
                value="form" 
                className="h-12 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg gap-2"
              >
                <FormInput className="h-4 w-4" />
                <span>Form Entry</span>
              </TabsTrigger>
              <TabsTrigger 
                value="paste" 
                className="h-12 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Paste Text</span>
              </TabsTrigger>
        </TabsList>
            <div className="mt-6">
              <TabsContent value="form" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DonorForm />
        </TabsContent>
              <TabsContent value="paste" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DonorPaste />
        </TabsContent>
            </div>
      </Tabs>
        </div>

        {/* Help Section */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="p-6 bg-muted/50 rounded-xl border">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-lg shrink-0">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Tips for Accurate Records</h3>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Verify the blood group before submission
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Use the correct donation date, not the entry date
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Include referrer name if someone helped arrange the donation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    Phone numbers should be in Bangladesh format (01XXXXXXXXX)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
