"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns"
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  dateFrom?: string // DD-MM-YYYY format
  dateTo?: string // DD-MM-YYYY format
  onDateChange: (from: string, to: string) => void
  className?: string
}

// Parse DD-MM-YYYY to Date
function parseDateString(dateStr: string): Date | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.split('-')
  if (parts.length !== 3) return undefined
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? undefined : date
}

// Format Date to DD-MM-YYYY
function formatDateToString(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

const presets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: "Last 7 days", getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "This month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last month", getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "This year", getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
]

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const fromDate = dateFrom ? parseDateString(dateFrom) : undefined
  const toDate = dateTo ? parseDateString(dateTo) : undefined
  
  const dateRange: DateRange | undefined = fromDate || toDate 
    ? { from: fromDate, to: toDate } 
    : undefined

  const handleSelect = (range: DateRange | undefined) => {
    const from = range?.from ? formatDateToString(range.from) : ""
    const to = range?.to ? formatDateToString(range.to) : ""
    onDateChange(from, to)
  }

  const handlePreset = (preset: typeof presets[0]) => {
    const { from, to } = preset.getValue()
    onDateChange(formatDateToString(from), formatDateToString(to))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDateChange("", "")
  }

  const hasValue = dateFrom || dateTo

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !hasValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">
            {fromDate && toDate ? (
              <>
                {format(fromDate, "dd MMM")} - {format(toDate, "dd MMM yyyy")}
              </>
            ) : fromDate ? (
              <>From {format(fromDate, "dd MMM yyyy")}</>
            ) : toDate ? (
              <>Until {format(toDate, "dd MMM yyyy")}</>
            ) : (
              "Filter by date range"
            )}
          </span>
          {hasValue ? (
            <X
              className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r p-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick select</p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handlePreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {/* Calendar */}
          <div className="p-0">
            <Calendar
              mode="range"
              defaultMonth={fromDate}
              selected={dateRange}
              onSelect={handleSelect}
              numberOfMonths={2}
              initialFocus
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

