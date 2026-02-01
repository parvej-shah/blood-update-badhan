"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, type ComponentProps } from "react"
import { triggerHaptic } from "@/lib/haptics"

type TransitionLinkProps = ComponentProps<typeof Link> & {
  /** Disable view transition for this link */
  noTransition?: boolean
}

/**
 * A Link component that uses the View Transitions API for smooth page transitions.
 * Falls back to regular navigation on unsupported browsers.
 */
export function TransitionLink({ 
  href, 
  onClick, 
  noTransition = false,
  children, 
  ...props 
}: TransitionLinkProps) {
  const router = useRouter()

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e)
    
    // If default was prevented or no transition requested, let Next.js handle it
    if (e.defaultPrevented || noTransition) {
      return
    }

    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      return // Let Next.js Link handle navigation normally
    }

    // Prevent default navigation
    e.preventDefault()
    
    // Trigger haptic feedback for navigation
    triggerHaptic('selection')

    // Get the href as string
    const url = typeof href === 'string' ? href : href.pathname || '/'

    // Start view transition
    document.startViewTransition(async () => {
      router.push(url)
      // Wait for the navigation to complete
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  }, [href, onClick, noTransition, router])

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}

