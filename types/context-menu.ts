import { LucideIcon } from "lucide-react"

export interface ContextMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
}

export interface ContextMenuGroup {
  id: string
  label?: string
  items: ContextMenuItem[]
}

export interface ContextMenuProps {
  groups: ContextMenuGroup[]
  children: React.ReactNode
  className?: string
}

// Email-specific context menu items
export interface EmailContextMenuActions {
  onDelete?: () => void
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
  onAssociateToContact?: () => void
  onAssociateToCompany?: () => void
  onAssociateToProject?: () => void
  onAssociateToLead?: () => void
  onAssociateToSupport?: () => void
  onMarkAsRead?: () => void
  onMarkAsUnread?: () => void
  onArchive?: () => void
  onFlag?: () => void
}

// Generic context menu actions for other use cases
export interface GenericContextMenuActions {
  [key: string]: (() => void) | undefined
}
