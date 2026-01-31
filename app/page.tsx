import { StatsCards } from "@/components/StatsCards"
import { DonorTable } from "@/components/DonorTable"
import { MonthlyChart } from "@/components/Charts"
import { Droplets, HeartHandshake, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative">
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
                  <p className="text-red-100 text-sm md:text-base">
                    Blood Donation Management Dashboard
                  </p>
                </div>
              </div>
              <p className="text-red-100 max-w-lg text-sm md:text-base">
                Track donations, manage donor records, and help save lives through our 
                volunteer blood donation network in Bangladesh.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <a 
                href="/submit" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors shadow-lg"
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-red-500 rounded-full" />
            <h2 className="text-xl font-semibold">Overview Statistics</h2>
          </div>
      <StatsCards />
        </section>

        {/* Donor Records Section */}
        <section>
      <DonorTable />
        </section>

        {/* Charts Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-1 bg-red-500 rounded-full" />
            <h2 className="text-xl font-semibold">Donation Trends</h2>
          </div>
      <MonthlyChart />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-5 w-5 text-red-500" />
              <span className="font-medium">Badhan</span>
              <span className="text-sm">- Amar Ekushey Hall Unit</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Saving lives through voluntary blood donation in Bangladesh</p>
              <p className="mt-1">Made with ❤️ by volunteers</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
