import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted shimmer", className)}
      {...props}
    />
  )
}

// Mobile-optimized skeleton components
function MobileDonorCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Header with name and blood group */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      
      {/* Contact info */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Additional details */}
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

function MobileStatsCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-4 space-y-2">
      <Skeleton className="h-4 w-24 bg-primary/20" />
      <Skeleton className="h-10 w-16 bg-primary/20" />
      <Skeleton className="h-3 w-32 bg-primary/20" />
    </div>
  )
}

function MobileSearchCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 card-hover">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      
      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

function MobileTableRowSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 md:p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1 flex-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

function MobileBloodGroupCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-center space-y-2">
      <Skeleton className="h-8 w-12 mx-auto rounded-full" />
      <Skeleton className="h-6 w-8 mx-auto" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  )
}

// Loading states for different sections
function DonorTableLoading() {
  return (
    <div className="space-y-3 md:space-y-4">
      {[...Array(5)].map((_, i) => (
        <MobileTableRowSkeleton key={i} />
      ))}
    </div>
  )
}

function SearchResultsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <MobileSearchCardSkeleton key={i} />
      ))}
    </div>
  )
}

function StatsCardsLoading() {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <MobileStatsCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <MobileBloodGroupCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  )
}

export {
  Skeleton,
  MobileDonorCardSkeleton,
  MobileStatsCardSkeleton,
  MobileSearchCardSkeleton,
  MobileTableRowSkeleton,
  MobileBloodGroupCardSkeleton,
  DonorTableLoading,
  SearchResultsLoading,
  StatsCardsLoading,
}

