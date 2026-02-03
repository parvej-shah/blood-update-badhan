"use client"

import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean
  pullProgress: number // 0-1
  pullDistance: number
}

export function PullToRefreshIndicator({
  isRefreshing,
  pullProgress,
  pullDistance,
}: PullToRefreshIndicatorProps) {
  if (pullDistance <= 0 && !isRefreshing) return null

  const isReady = pullProgress >= 1

  return (
    <div 
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none",
        "transition-all duration-200"
      )}
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.min(pullDistance * 0.5, 60)}px)`,
        opacity: Math.min(pullProgress * 2, 1),
      }}
    >
      <div 
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "bg-background shadow-lg border border-border/50",
          isReady && "bg-primary text-primary-foreground border-primary",
          isRefreshing && "bg-primary text-primary-foreground"
        )}
        style={{
          transform: `scale(${0.6 + pullProgress * 0.4})`,
        }}
      >
        <RefreshCw 
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${pullProgress * 180}deg)`,
          }}
        />
      </div>
      
      {/* Pull text */}
      {!isRefreshing && pullProgress > 0.3 && (
        <p 
          className={cn(
            "text-xs font-medium text-center mt-2 whitespace-nowrap",
            isReady ? "text-primary" : "text-muted-foreground"
          )}
          style={{ opacity: pullProgress }}
        >
          {isReady ? "Release to refresh" : "Pull to refresh"}
        </p>
      )}
      
      {isRefreshing && (
        <p className="text-xs font-medium text-primary text-center mt-2">
          Refreshing...
        </p>
      )}
    </div>
  )
}


