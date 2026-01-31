import { StatsCards } from "@/components/StatsCards"
import { DonorTable } from "@/components/DonorTable"
import { MonthlyChart } from "@/components/Charts"
import { Droplets, HeartHandshake, TrendingUp, BarChart3, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Modern Sleek Header */}
      <div className="relative z-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#6B1E28] via-[#7A2A36] to-[#8B3444]" />
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-6 md:py-8 pb-10 md:pb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
                <Droplets className="h-5 w-5 text-white" />
              </div>
      <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Dashboard
                </h1>
                <p className="text-white/60 text-sm">
                  Badhan Blood Donation
                </p>
              </div>
            </div>
            
            {/* Quick Action - Desktop Only */}
            <a 
              href="/submit" 
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
            >
              <HeartHandshake className="h-4 w-4" />
              New Donation
            </a>
          </div>
        </div>
        
        {/* Bottom Curve */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-background to-background rounded-t-[2.5rem]" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Stats Section */}
        <section>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold">Overview Statistics</h2>
          </div>
      <StatsCards />
        </section>

        {/* Donor Records Section */}
        <section>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold">Donor Records</h2>
          </div>
      <DonorTable />
        </section>

        {/* Charts Section */}
        <section>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-semibold">Donation Trends</h2>
          </div>
      <MonthlyChart />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t mt-8 md:mt-12 mb-20 md:mb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Badhan</span>
              <span className="text-muted-foreground text-sm">• Amar Ekushey Hall Unit</span>
            </div>
            <p className="text-xs text-muted-foreground">
              For volunteers by Parvej Shah
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
