"use client"

import { usePathname } from "next/navigation"
import { Droplets, Home, UserPlus, BarChart3, Search, Award, Sparkles, ExternalLink } from "lucide-react"
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

  const externalTools = [
    {
      href: "https://badhan-certificate.lovable.app/",
      label: "Certificates",
      icon: Award,
    },
    {
      href: "https://parvej-shah.github.io/badhan-benner-generator/",
      label: "Banner Generator",
      icon: Sparkles,
    },
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
                    "flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
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

            {/* Divider */}
            <div className="h-5 w-px bg-border mx-1 lg:mx-2" />

            {/* External Tools */}
            {externalTools.map((tool) => {
              const Icon = tool.icon
              return (
                <a
                  key={tool.href}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 lg:px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 group"
                  title={`Open ${tool.label}`}
                >
                  <Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-200" />
                  <span>{tool.label}</span>
                  <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
