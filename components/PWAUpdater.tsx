"use client"

import { useEffect, useState } from "react"
import { RefreshCw, X } from "lucide-react"

export function PWAUpdater() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    // Check for updates once on app entry
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          await registration.update()
        }
      } catch (error) {
        console.log("Update check failed:", error)
      }
    }

    // Single check on first load (after 2 seconds to not block initial render)
    const initialCheck = setTimeout(checkForUpdates, 2000)

    // Listen for new service worker activation
    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

    // Listen for updates from SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "UPDATE_AVAILABLE") {
        setShowUpdate(true)
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage)

    // Check if there's a waiting service worker
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        setShowUpdate(true)
      }

      // Listen for new waiting service workers
      registration?.addEventListener("updatefound", () => {
        const newWorker = registration.installing
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setShowUpdate(true)
          }
        })
      })
    })

    return () => {
      clearTimeout(initialCheck)
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
      navigator.serviceWorker.removeEventListener("message", handleMessage)
    }
  }, [])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        // Tell the waiting service worker to take over
        registration.waiting.postMessage({ type: "SKIP_WAITING" })
      } else {
        // Force reload if no waiting worker
        window.location.reload()
      }
    } catch (error) {
      console.error("Update failed:", error)
      window.location.reload()
    }
  }

  if (!showUpdate) return null

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[100] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className={`h-5 w-5 ${updating ? "animate-spin" : ""}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Update Available</p>
            <p className="text-xs text-white/80 mt-0.5">
              A new version is ready. Refresh to get the latest features.
            </p>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-white/60 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowUpdate(false)}
            className="flex-1 text-xs py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="flex-1 text-xs py-2 px-3 rounded-lg bg-white text-primary font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {updating ? "Updating..." : "Refresh Now"}
          </button>
        </div>
      </div>
    </div>
  )
}

