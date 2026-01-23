import { StatsCards } from "@/components/StatsCards"
import { DonorTable } from "@/components/DonorTable"
import { MonthlyChart } from "@/components/Charts"

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Blood donation management overview</p>
      </div>

      <StatsCards />

      <DonorTable />

      <MonthlyChart />
    </div>
  )
}
