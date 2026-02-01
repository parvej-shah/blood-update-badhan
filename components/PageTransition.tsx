"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  /** Name for view transitions API */
  transitionName?: string
  /** Animation variant */
  variant?: "fade" | "slide-up" | "slide-left" | "scale" | "none"
  /** Delay before animation starts (in ms) */
  delay?: number
}

/**
 * Wraps page content with smooth entry animations.
 * Works with both View Transitions API and CSS animations as fallback.
 */
export function PageTransition({
  children,
  className,
  transitionName = "main-content",
  variant = "slide-up",
  delay = 0,
}: PageTransitionProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const variantStyles = {
    fade: "opacity-0 data-[visible=true]:opacity-100",
    "slide-up": "opacity-0 translate-y-4 data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
    "slide-left": "opacity-0 translate-x-4 data-[visible=true]:opacity-100 data-[visible=true]:translate-x-0",
    scale: "opacity-0 scale-95 data-[visible=true]:opacity-100 data-[visible=true]:scale-100",
    none: "",
  }

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        "motion-reduce:transition-none motion-reduce:transform-none",
        variantStyles[variant],
        className
      )}
      style={{ 
        viewTransitionName: transitionName,
        transitionDelay: `${delay}ms`,
      }}
      data-visible={isVisible}
    >
      {children}
    </div>
  )
}

interface StaggeredContainerProps {
  children: React.ReactNode
  className?: string
  /** Base delay for first child (ms) */
  baseDelay?: number
  /** Delay increment between children (ms) */
  staggerDelay?: number
  /** Animation variant for children */
  variant?: "fade" | "slide-up" | "slide-left" | "scale"
}

/**
 * Container that staggers the animation of its children.
 * Great for lists, grids, and sequential content.
 */
export function StaggeredContainer({
  children,
  className,
  baseDelay = 50,
  staggerDelay = 50,
  variant = "slide-up",
}: StaggeredContainerProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    setIsVisible(true)
  }, [])

  const variantStyles = {
    fade: { from: "opacity-0", to: "opacity-100" },
    "slide-up": { from: "opacity-0 translate-y-3", to: "opacity-100 translate-y-0" },
    "slide-left": { from: "opacity-0 translate-x-3", to: "opacity-100 translate-x-0" },
    scale: { from: "opacity-0 scale-95", to: "opacity-100 scale-100" },
  }

  return (
    <div className={cn("contents", className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        const delay = baseDelay + index * staggerDelay
        const styles = variantStyles[variant]

        return (
          <div
            className={cn(
              "transition-all duration-400 ease-out",
              "motion-reduce:transition-none motion-reduce:transform-none",
              isVisible ? styles.to : styles.from
            )}
            style={{ transitionDelay: `${delay}ms` }}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
  /** Animation style */
  animation?: "fade-slide" | "fade-scale" | "slide-only"
}

/**
 * Animated list with smooth entry for each item.
 * Items animate in sequence with a subtle stagger effect.
 */
export function AnimatedList({
  children,
  className,
  animation = "fade-slide",
}: AnimatedListProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        const animationClass = {
          "fade-slide": "animate-in fade-in-0 slide-in-from-bottom-2",
          "fade-scale": "animate-in fade-in-0 zoom-in-95",
          "slide-only": "animate-in slide-in-from-bottom-3",
        }

        return (
          <div
            className={cn(
              animationClass[animation],
              "duration-300 fill-mode-backwards"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Hero section with smooth reveal animation
 */
export function HeroTransition({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-700 ease-out",
        className
      )}
      style={{ viewTransitionName: "hero" }}
    >
      {children}
    </div>
  )
}

