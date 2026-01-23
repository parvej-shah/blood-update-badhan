"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Droplet } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/submit", label: "Submit Donor" },
    { href: "/reports", label: "Reports" },
  ]

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Droplet className="h-6 w-6 text-red-600" />
            <span className="text-xl font-bold hidden sm:inline">Blood Donation</span>
            <span className="text-xl font-bold sm:hidden">BD</span>
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

