"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, type ComponentProps } from "react"
import { triggerHaptic } from "@/lib/haptics"

type TransitionDirection = "forward" | "backward" | "auto"

type TransitionLinkProps = ComponentProps<typeof Link> & {
  /** Disable view transition for this link */
  noTransition?: boolean
  /** Direction of transition animation */
  direction?: TransitionDirection
}

// Prevent concurrent view transitions — calling startViewTransition while one is
// running throws InvalidStateError. This flag guards all three call sites.
let isTransitioning = false

// Navigation hierarchy for determining transition direction
const NAV_HIERARCHY: Record<string, number> = {
  '/': 0,
  '/donate': 1,
  '/search': 1,
  '/faq': 1,
  '/about': 1,
  '/admin': 2,
  '/admin/dashboard': 2,
  '/admin/training': 3,
}

function getNavDepth(path: string): number {
  // Exact match
  if (NAV_HIERARCHY[path] !== undefined) {
    return NAV_HIERARCHY[path]
  }
  // Check parent paths
  const segments = path.split('/').filter(Boolean)
  while (segments.length > 0) {
    const parentPath = '/' + segments.join('/')
    if (NAV_HIERARCHY[parentPath] !== undefined) {
      return NAV_HIERARCHY[parentPath]
    }
    segments.pop()
  }
  // Default based on path depth
  return path.split('/').filter(Boolean).length
}

function determineDirection(fromPath: string, toPath: string): TransitionDirection {
  const fromDepth = getNavDepth(fromPath)
  const toDepth = getNavDepth(toPath)
  
  if (toDepth > fromDepth) return "forward"
  if (toDepth < fromDepth) return "backward"
  return "forward" // Default to forward for same level
}

/**
 * A Link component that uses the View Transitions API for smooth page transitions.
 * Features:
 * - Automatic direction detection (forward/backward)
 * - Haptic feedback on navigation
 * - Graceful fallback for unsupported browsers
 * - Progress indicator during transition
 */
export function TransitionLink({ 
  href, 
  onClick, 
  noTransition = false,
  direction = "auto",
  children, 
  ...props 
}: TransitionLinkProps) {
  const router = useRouter()
  const currentPath = usePathname()

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e)
    
    // If default was prevented or no transition requested, let Next.js handle it
    if (e.defaultPrevented || noTransition) {
      return
    }

    // Check if View Transitions API is supported or already in progress
    if (!document.startViewTransition || isTransitioning) {
      return // Let Next.js Link handle navigation normally
    }

    // Prevent default navigation
    e.preventDefault()

    // Trigger haptic feedback for navigation
    triggerHaptic('selection')

    // Get the href as string
    const url = typeof href === 'string' ? href : href.pathname || '/'

    // Determine transition direction
    const transitionDirection = direction === "auto"
      ? determineDirection(currentPath, url)
      : direction

    // Apply direction class to html element
    const html = document.documentElement
    html.classList.remove('transition-forward', 'transition-backward')
    html.classList.add(`transition-${transitionDirection}`)

    // Add transitioning class for progress indicator
    html.classList.add('page-transitioning')
    isTransitioning = true

    // Start view transition
    const transition = document.startViewTransition(async () => {
      router.push(url)
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    // Clean up classes after transition
    transition.finished.then(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).catch(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).finally(() => {
      isTransitioning = false
    })
  }, [href, onClick, noTransition, router, direction, currentPath])

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

/**
 * Hook to programmatically navigate with view transitions
 */
export function useTransitionRouter() {
  const router = useRouter()
  const currentPath = usePathname()

  const push = useCallback((url: string, options?: { direction?: TransitionDirection }) => {
    if (!document.startViewTransition || isTransitioning) {
      router.push(url)
      return
    }

    triggerHaptic('selection')

    const transitionDirection = options?.direction ?? determineDirection(currentPath, url)
    const html = document.documentElement

    html.classList.remove('transition-forward', 'transition-backward')
    html.classList.add(`transition-${transitionDirection}`)
    html.classList.add('page-transitioning')
    isTransitioning = true

    const transition = document.startViewTransition(async () => {
      router.push(url)
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    transition.finished.then(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).catch(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).finally(() => {
      isTransitioning = false
    })
  }, [router, currentPath])

  const back = useCallback(() => {
    if (!document.startViewTransition || isTransitioning) {
      router.back()
      return
    }

    triggerHaptic('selection')

    const html = document.documentElement
    html.classList.remove('transition-forward', 'transition-backward')
    html.classList.add('transition-backward')
    html.classList.add('page-transitioning')
    isTransitioning = true

    const transition = document.startViewTransition(async () => {
      router.back()
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    transition.finished.then(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).catch(() => {
      html.classList.remove('transition-forward', 'transition-backward', 'page-transitioning')
    }).finally(() => {
      isTransitioning = false
    })
  }, [router])

  return { push, back }
}
