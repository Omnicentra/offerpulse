"use client"

import { Bell } from "lucide-react"
import { cn } from "@offerpulse/lib/utils"

interface MockAlertProps {
  className?: string
  /** e.g. "Just now" */
  time?: string
}

export function MockAlert({ className, time = "Just now" }: MockAlertProps) {
  return (
    <div
      className={cn(
        "absolute -right-2 top-4 z-10 flex w-64 gap-3 rounded-2xl border border-border bg-surface p-4 shadow-soft-lg",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Bell className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-ink">
          Change detected
        </p>
        <p className="mt-1 truncate text-xs text-body">
          Free shipping £50 → £35
        </p>
        <p className="mt-1.5 text-[10px] font-medium text-body/60">{time}</p>
      </div>
    </div>
  )
}
