"use client"

import React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ContextMenuGroup, ContextMenuItem as ContextMenuItemType } from "@/types/context-menu"
import { cn } from "@/lib/utils"

interface ReusableContextMenuProps {
  groups: ContextMenuGroup[]
  children: React.ReactNode
  className?: string
}

export function ReusableContextMenu({ 
  groups, 
  children, 
  className 
}: ReusableContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={className}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {groups.map((group, groupIndex) => (
          <React.Fragment key={group.id}>
            {groupIndex > 0 && <ContextMenuSeparator />}
            
            {group.label && (
              <ContextMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </ContextMenuLabel>
            )}
            
            {group.items.map((item: ContextMenuItemType) => (
              <ContextMenuItem
                key={item.id}
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  "cursor-pointer",
                  item.destructive && "text-destructive focus:text-destructive"
                )}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.label}</span>
                {item.shortcut && (
                  <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>
                )}
              </ContextMenuItem>
            ))}
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  )
}
