"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  onClose?: () => void
}

// Get icon based on variant
function ToastIcon({ variant }: { variant: ToastProps["variant"] }) {
  switch (variant) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
    case "destructive":
      return <AlertCircle className="h-5 w-5 shrink-0" />
    default:
      return <Info className="h-5 w-5 text-primary shrink-0" />
  }
}

export function Toast({ title, description, variant = "default", onClose }: ToastProps) {
  const [isExiting, setIsExiting] = React.useState(false)
  const [startX, setStartX] = React.useState<number | null>(null)
  const [offsetX, setOffsetX] = React.useState(0)
  const toastRef = React.useRef<HTMLDivElement>(null)

  // Handle swipe to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    // Only allow swiping right (positive direction)
    if (diff > 0) {
      setOffsetX(diff)
    }
  }

  const handleTouchEnd = () => {
    if (offsetX > 100) {
      // Swipe threshold reached, dismiss
      handleDismiss()
    } else {
      // Snap back
      setOffsetX(0)
    }
    setStartX(null)
  }

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose?.()
    }, 200)
  }

  return (
    <div
      ref={toastRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: offsetX > 0 ? `translateX(${offsetX}px)` : undefined,
        opacity: offsetX > 0 ? 1 - offsetX / 200 : 1,
      }}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border p-4 pr-10 shadow-xl backdrop-blur-sm transition-all duration-200",
        // Entry/exit animations
        !isExiting && "animate-in slide-in-from-top-2 fade-in-0 duration-300",
        isExiting && "animate-out slide-out-to-right fade-out-0 duration-200",
        // Variant styles
        variant === "destructive" && "border-destructive/50 bg-destructive/95 text-destructive-foreground",
        variant === "success" && "border-green-500/50 bg-green-50/95 text-green-900 dark:bg-green-900/95 dark:text-green-50",
        variant === "default" && "border-border/50 bg-background/95 text-foreground"
      )}
    >
      <ToastIcon variant={variant} />
      <div className="grid gap-0.5 flex-1 min-w-0">
        {title && <div className="text-sm font-semibold leading-tight">{title}</div>}
        {description && <div className="text-sm opacity-80 leading-snug">{description}</div>}
      </div>
      {onClose && (
        <button
          className={cn(
            "absolute right-3 top-3 rounded-full p-1 transition-all",
            "text-foreground/40 hover:text-foreground hover:bg-foreground/10",
            "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring",
            "touch-target"
          )}
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

declare global {
  interface Window {
    toast?: (props: Omit<ToastProps, "id" | "onClose">) => void
  }
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  React.useEffect(() => {
    // Global toast function
    window.toast = ({ title, description, variant }: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substring(7)
      const newToast: ToastProps = {
        id,
        title,
        description,
        variant,
        onClose: () => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        },
      }
      setToasts((prev) => [...prev, newToast])
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 4000)
    }

    return () => {
      delete window.toast
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className={cn(
      "pointer-events-none fixed z-[100] flex flex-col gap-2 p-4",
      // Mobile: top center, Desktop: top right
      "top-0 left-0 right-0 items-center",
      "md:left-auto md:right-0 md:items-end md:max-w-[420px]",
      // Account for safe area on notched devices
      "pt-safe"
    )}>
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto w-full max-w-sm"
          style={{
            // Stagger animation delay for multiple toasts
            animationDelay: `${index * 50}ms`,
          }}
        >
          <Toast {...toast} />
        </div>
      ))}
    </div>
  )
}

