"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Pixels to pull before triggering refresh
  resistance?: number // Resistance factor (higher = harder to pull)
}

interface UsePullToRefreshReturn {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
  pullProgress: number // 0-1, progress towards threshold
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    style: React.CSSProperties
  }
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)
  const isAtTop = useRef<boolean>(true)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull if at the top of the scroll container
    if (window.scrollY <= 0 || e.currentTarget.scrollTop <= 0) {
      isAtTop.current = true
      startY.current = e.touches[0].clientY
      setIsPulling(true)
    } else {
      isAtTop.current = false
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isAtTop.current || isRefreshing) return
    
    currentY.current = e.touches[0].clientY
    const diff = currentY.current - startY.current
    
    // Only track downward pulls
    if (diff > 0) {
      // Apply resistance - the further you pull, the harder it gets
      const adjustedDiff = diff / resistance
      setPullDistance(Math.min(adjustedDiff, threshold * 1.5))
    }
  }, [isRefreshing, resistance, threshold])

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(threshold * 0.6) // Show partial pull during refresh
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back
      setPullDistance(0)
    }
    
    startY.current = 0
    currentY.current = 0
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh])

  // Trigger haptic feedback when threshold is reached
  useEffect(() => {
    if (pullDistance >= threshold && isPulling && !isRefreshing) {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(15)
      }
    }
  }, [pullDistance, threshold, isPulling, isRefreshing])

  const pullProgress = Math.min(pullDistance / threshold, 1)

  const containerProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
      transition: isPulling ? "none" : "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    } as React.CSSProperties,
  }

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    containerProps,
  }
}


