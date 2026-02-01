"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"

interface SwipeAction {
  icon: React.ReactNode
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "primary"
}

interface SwipeableCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Actions revealed when swiping left */
  leftActions?: SwipeAction[]
  /** Actions revealed when swiping right */
  rightActions?: SwipeAction[]
  /** Threshold in pixels to trigger action reveal */
  threshold?: number
  /** Whether the card is disabled */
  disabled?: boolean
}

const actionVariantStyles = {
  default: "bg-muted text-muted-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  primary: "bg-primary text-primary-foreground",
}

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  disabled = false,
  className,
  ...props
}: SwipeableCardProps) {
  const [offsetX, setOffsetX] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isRevealed, setIsRevealed] = React.useState<"left" | "right" | null>(null)
  const startX = React.useRef<number>(0)
  const startY = React.useRef<number>(0)
  const isHorizontalSwipe = React.useRef<boolean | null>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)

  const actionWidth = Math.max(leftActions.length, rightActions.length) * 60

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    isHorizontalSwipe.current = null
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isDragging) return
    
    const touch = e.touches[0]
    const diffX = touch.clientX - startX.current
    const diffY = touch.clientY - startY.current

    // Determine if this is a horizontal or vertical swipe
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY)
      }
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) return

    // Prevent vertical scroll when swiping horizontally
    e.preventDefault()

    // If already revealed, adjust from that position
    let newOffset = diffX
    if (isRevealed === "left") {
      newOffset = diffX - actionWidth
    } else if (isRevealed === "right") {
      newOffset = diffX + actionWidth
    }

    // Limit swipe distance
    const maxSwipe = actionWidth + 20
    if (leftActions.length > 0 && newOffset < 0) {
      newOffset = Math.max(newOffset, -maxSwipe)
    } else if (rightActions.length > 0 && newOffset > 0) {
      newOffset = Math.min(newOffset, maxSwipe)
    } else if ((leftActions.length === 0 && newOffset < 0) || (rightActions.length === 0 && newOffset > 0)) {
      // Add resistance when no actions in that direction
      newOffset = newOffset * 0.2
    }

    setOffsetX(newOffset)
  }

  const handleTouchEnd = () => {
    if (disabled) return
    setIsDragging(false)

    // Determine final position
    if (offsetX < -threshold && leftActions.length > 0) {
      // Reveal left actions (swiped left)
      setOffsetX(-actionWidth)
      setIsRevealed("left")
      triggerHaptic("light")
    } else if (offsetX > threshold && rightActions.length > 0) {
      // Reveal right actions (swiped right)
      setOffsetX(actionWidth)
      setIsRevealed("right")
      triggerHaptic("light")
    } else {
      // Snap back
      setOffsetX(0)
      setIsRevealed(null)
    }
  }

  const handleActionClick = (action: SwipeAction) => {
    triggerHaptic("medium")
    action.onClick()
    // Reset after action
    setOffsetX(0)
    setIsRevealed(null)
  }

  // Close when clicking outside
  React.useEffect(() => {
    if (!isRevealed) return

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setOffsetX(0)
        setIsRevealed(null)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [isRevealed])

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden rounded-lg"
      {...props}
    >
      {/* Left Actions (revealed when swiping left) */}
      {leftActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 bottom-0 flex items-stretch"
          style={{ width: actionWidth }}
        >
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                "touch-target min-w-[60px]",
                actionVariantStyles[action.variant || "default"]
              )}
            >
              {action.icon}
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions (revealed when swiping right) */}
      {rightActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 bottom-0 flex items-stretch"
          style={{ width: actionWidth }}
        >
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
                "touch-target min-w-[60px]",
                actionVariantStyles[action.variant || "default"]
              )}
            >
              {action.icon}
              <span className="text-[10px] font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Card Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={cn(
          "relative bg-card",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

