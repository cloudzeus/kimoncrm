"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root

export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({ className, sideOffset = 6, ...props }: TooltipPrimitive.TooltipContentProps & { className?: string }) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={`z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md border ${className ?? ""}`}
      {...props}
    />
  )
}


