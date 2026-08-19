import * as React from "react"
import { Droplets, Linkedin, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t mt-8 md:mt-12 mb-20 md:mb-0 bg-card/50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Badhan</span>
            <span className="text-muted-foreground text-sm">• Amar Ekushey Hall Unit</span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap mt-1">
            <span>For volunteers by</span>
            <a
              href="https://parvejshah.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Parvej Shah
            </a>
            <span>•</span>
            <a
              href="https://www.linkedin.com/in/parvejshah/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline transition-colors"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </a>
            <span>•</span>
            <a
              href="https://parvejshah.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-3 w-3" />
              Portfolio
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
