"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface FormSuccessProps {
  /** Whether to show the success animation */
  show: boolean
  /** Message to display */
  message?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Callback when animation completes */
  onAnimationComplete?: () => void
}

const sizeStyles = {
  sm: {
    container: "w-12 h-12",
    icon: "h-5 w-5",
    text: "text-sm",
  },
  md: {
    container: "w-16 h-16",
    icon: "h-7 w-7",
    text: "text-base",
  },
  lg: {
    container: "w-20 h-20",
    icon: "h-9 w-9",
    text: "text-lg",
  },
}

/**
 * A success animation component with a checkmark that draws itself.
 * Great for form submission confirmations.
 */
export function FormSuccess({
  show,
  message = "Success!",
  size = "md",
  onAnimationComplete,
}: FormSuccessProps) {
  const styles = sizeStyles[size]

  React.useEffect(() => {
    if (show && onAnimationComplete) {
      const timer = setTimeout(onAnimationComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [show, onAnimationComplete])

  if (!show) return null

  return (
    <div className="flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-300">
      {/* Animated Circle with Checkmark */}
      <div
        className={cn(
          "relative rounded-full bg-green-500 flex items-center justify-center",
          "animate-success-circle",
          styles.container
        )}
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-success-ripple" />
        
        {/* Checkmark icon with draw animation */}
        <Check
          className={cn("text-white animate-success-check", styles.icon)}
          strokeWidth={3}
        />
      </div>

      {/* Success message */}
      {message && (
        <p className={cn(
          "font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200",
          styles.text
        )}>
          {message}
        </p>
      )}
    </div>
  )
}

