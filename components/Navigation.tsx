"use client"

import { usePathname } from "next/navigation"
import { Droplets, Home, UserPlus, BarChart3, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { TransitionLink } from "@/components/TransitionLink"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/submit", label: "Submit Donor", icon: UserPlus },
    { href: "/search", label: "Search Donor", icon: Search },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ]

  return (
    <nav className="hidden md:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 pt-safe view-transition-header">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo & Brand */}
          <TransitionLink href="/" className="flex items-center gap-2 md:gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all" />
              <div className="relative flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg">
                <Droplets className="h-4 w-4 md:h-5 md:w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Badhan
              </span>
              <span className="text-[9px] md:text-[10px] text-muted-foreground leading-none hidden sm:block">
                Amar Ekushey Hall Unit
              </span>
            </div>
          </TransitionLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
              <TransitionLink
                key={item.href}
                href={item.href}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  pathname === item.href
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                  <Icon className="h-4 w-4" />
                {item.label}
              </TransitionLink>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
