"use client"

import { usePathname } from "next/navigation"
import { Home, UserPlus, Search, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptics"
import { TransitionLink } from "@/components/TransitionLink"
import { useEffect, useState, useCallback } from "react"

const navItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/submit",
    label: "Submit",
    icon: UserPlus,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Hide nav on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    const scrollDiff = currentScrollY - lastScrollY
    
    // Only trigger hide/show if scrolled more than 10px
    if (Math.abs(scrollDiff) < 10) return
    
    // Near bottom of page - always show
    if (window.innerHeight + currentScrollY >= document.body.offsetHeight - 100) {
      setIsVisible(true)
    } 
    // Scrolling down - hide
    else if (scrollDiff > 0 && currentScrollY > 80) {
      setIsVisible(false)
    } 
    // Scrolling up - show
    else if (scrollDiff < 0) {
      setIsVisible(true)
    }
    
    setLastScrollY(currentScrollY)
  }, [lastScrollY])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  // Haptic feedback on tap - use selection pattern for nav items
  const handleNavTap = useCallback(() => {
    triggerHaptic('selection')
  }, [])

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)] view-transition-nav",
          "transition-transform duration-300 ease-out",
          !isVisible && "translate-y-full"
        )}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                onClick={handleNavTap}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg touch-target min-w-[64px]",
                  "transition-all duration-200 ease-out",
                  "active:scale-90",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full",
                    "transition-all duration-300 ease-out",
                    isActive && "bg-primary/10 scale-105"
                  )}
                >
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-200" />
                  )}
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </TransitionLink>
            )
          })}
        </div>
      </nav>
      
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}

