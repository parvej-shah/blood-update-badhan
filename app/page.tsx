import { StatsCards } from "@/components/StatsCards"
import { DonorTable } from "@/components/DonorTable"
import { MonthlyChart } from "@/components/Charts"
import { Droplets, HeartHandshake, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Energetic Maroon to Coral Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#6B1E28] via-[#8B2E3C] to-[#C94C5E] text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/25 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/15 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Droplets className="h-6 w-6 blood-drop" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    Welcome to Badhan
                  </h1>
                  <p className="text-white/80 text-sm md:text-base">
                    Blood Donation Management Dashboard
                  </p>
                </div>
              </div>
              <p className="text-white/80 max-w-lg text-sm md:text-base">
                Track donations, manage donor records, and help save lives through our 
                volunteer blood donation network in Bangladesh.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <a 
                href="/submit" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6B1E28] rounded-lg font-semibold hover:bg-white/90 transition-colors shadow-lg"
              >
                <HeartHandshake className="h-5 w-5" />
                Record Donation
              </a>
              <a 
                href="/reports" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                <TrendingUp className="h-5 w-5" />
                View Reports
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <div className="h-6 md:h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold">Overview Statistics</h2>
          </div>
      <StatsCards />
        </section>

        {/* Donor Records Section */}
        <section>
      <DonorTable />
        </section>

        {/* Charts Section */}
        <section>
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <div className="h-6 md:h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-lg md:text-xl font-semibold">Donation Trends</h2>
          </div>
      <MonthlyChart />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-8 md:mt-12 mb-16 md:mb-0">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="font-medium">Badhan</span>
              <span className="text-sm">- Amar Ekushey Hall Unit</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Saving lives through voluntary blood donation in Bangladesh</p>
              <p className="mt-1">For volunteers by Parvej Shah</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
