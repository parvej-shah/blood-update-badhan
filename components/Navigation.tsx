"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Droplets, Home, UserPlus, BarChart3, Search, Settings, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/submit", label: "Submit Donor", icon: UserPlus },
    { href: "/search", label: "Search Donor", icon: Search },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ]

  // Add admin/training links if user has appropriate role
  const isAdmin = session?.user?.roles?.includes("admin")
  const isModerator = session?.user?.roles?.includes("moderator") || isAdmin

  if (isModerator) {
    navItems.push({ href: "/training", label: "Training", icon: Settings })
  }

  if (isAdmin) {
    navItems.push({ href: "/admin/users", label: "Users", icon: User })
  }

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
    router.refresh()
  }

  return (
    <nav className="hidden md:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group">
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
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
              <Link
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
              </Link>
              )
            })}
          </div>

          {/* User Info & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {status === "loading" ? (
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            ) : session?.user ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Welcome,</span>
                  <span className="font-medium">{session.user.name}</span>
                  {isAdmin && (
                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
