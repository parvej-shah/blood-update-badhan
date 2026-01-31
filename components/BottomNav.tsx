"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, UserPlus, Search, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

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

  return (
    <>
      {/* Bottom Navigation - Only visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 pb-safe md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 touch-target min-w-[64px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive && "scale-110"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
      
      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  )
}

