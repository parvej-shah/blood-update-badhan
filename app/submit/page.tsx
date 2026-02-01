"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonorForm } from "@/components/DonorForm"
import { DonorPaste } from "@/components/DonorPaste"
import { FileText, FormInput, HeartHandshake, Droplets } from "lucide-react"

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Modern Sleek Header */}
      <div className="relative z-0 view-transition-header">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B1E28] via-[#7A2A36] to-[#8B3444]" />
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-6 md:py-8 pb-10 md:pb-12">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-center w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <HeartHandshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Submit Donation
              </h1>
              <p className="text-white/60 text-sm">
                Record a new blood donation entry
              </p>
            </div>
          </div>
        </div>
        
        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-[2.5rem]" />
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-6 pb-8 view-transition-content">
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 fill-mode-backwards">
          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/80 backdrop-blur-sm shadow-lg rounded-xl">
              <TabsTrigger 
                value="paste" 
                className="h-12 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Paste Text</span>
              </TabsTrigger>
              <TabsTrigger 
                value="form" 
                className="h-12 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg gap-2"
              >
                <FormInput className="h-4 w-4" />
                <span>Form Entry</span>
              </TabsTrigger>
        </TabsList>
            <div className="mt-6">
              <TabsContent value="paste" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DonorPaste />
        </TabsContent>
              <TabsContent value="form" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <DonorForm />
        </TabsContent>
            </div>
      </Tabs>
        </div>

        {/* Help Section */}
        <div className="max-w-2xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
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
