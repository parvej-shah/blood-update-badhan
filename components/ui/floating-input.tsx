"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface FloatingInputProps extends Omit<React.ComponentProps<"input">, "placeholder"> {
  /** The label text */
  label: string
  /** Show success state with checkmark */
  success?: boolean
  /** Error message to display */
  error?: string
  /** Icon to show at the start of the input */
  icon?: React.ReactNode
}

/**
 * A floating label input that animates the label when focused or filled.
 * Includes success checkmark animation and error shake animation.
 */
function FloatingInput({
  label,
  success = false,
  error,
  icon,
  className,
  id,
  value,
  defaultValue,
  ...props
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(
    Boolean(value || defaultValue)
  )
  const inputRef = React.useRef<HTMLInputElement>(null)
  const inputId = id || React.useId()

  // Update hasValue when controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setHasValue(Boolean(value))
    }
  }, [value])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    props.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    setHasValue(Boolean(e.target.value))
    props.onBlur?.(e)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(Boolean(e.target.value))
    props.onChange?.(e)
  }

  const isFloating = isFocused || hasValue

  return (
    <div className="relative">
      {/* Icon */}
      {icon && (
        <div className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200",
          isFocused ? "text-primary" : "text-muted-foreground",
          error && "text-destructive"
        )}>
          {icon}
        </div>
      )}

      {/* Input */}
      <input
        ref={inputRef}
        id={inputId}
        data-slot="floating-input"
        value={value}
        defaultValue={defaultValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        className={cn(
          "peer w-full h-14 rounded-lg border bg-background px-4 pt-5 pb-2 text-base outline-none transition-all duration-200",
          "border-input hover:border-ring/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
          icon && "pl-10",
          success && "pr-10 border-green-500 focus:border-green-500 focus:ring-green-500/20",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20 animate-shake",
          className
        )}
        placeholder=" "
        {...props}
      />

      {/* Floating Label */}
      <label
        htmlFor={inputId}
        className={cn(
          "absolute left-4 pointer-events-none transition-all duration-200 ease-out",
          icon && "left-10",
          isFloating
            ? "top-2 text-xs font-medium"
            : "top-1/2 -translate-y-1/2 text-base",
          isFocused ? "text-primary" : "text-muted-foreground",
          error && "text-destructive"
        )}
      >
        {label}
      </label>

      {/* Success Checkmark */}
      {success && !error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-scale-in">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-xs text-destructive animate-slide-down">
          {error}
        </p>
      )}
    </div>
  )
}

export { FloatingInput }

