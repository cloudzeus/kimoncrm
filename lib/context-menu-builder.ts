import { ContextMenuGroup, ContextMenuItem, GenericContextMenuActions } from "@/types/context-menu"
import { LucideIcon } from "lucide-react"

export class ContextMenuBuilder {
  private groups: ContextMenuGroup[] = []
  private currentGroupId = 0

  /**
   * Create a new context menu builder instance
   */
  static create(): ContextMenuBuilder {
    return new ContextMenuBuilder()
  }

  /**
   * Add a new group to the context menu
   */
  addGroup(label?: string): ContextMenuBuilder {
    this.currentGroupId++
    this.groups.push({
      id: `group-${this.currentGroupId}`,
      label,
      items: [],
    })
    return this
  }

  /**
   * Add an item to the current group
   */
  addItem(
    id: string,
    label: string,
    onClick: () => void,
    options?: {
      icon?: LucideIcon
      shortcut?: string
      disabled?: boolean
      destructive?: boolean
    }
  ): ContextMenuBuilder {
    if (this.groups.length === 0) {
      this.addGroup()
    }

    const currentGroup = this.groups[this.groups.length - 1]
    currentGroup.items.push({
      id,
      label,
      onClick,
      icon: options?.icon,
      shortcut: options?.shortcut,
      disabled: options?.disabled,
      destructive: options?.destructive,
    })

    return this
  }

  /**
   * Add multiple items to the current group
   */
  addItems(items: Array<{
    id: string
    label: string
    onClick: () => void
    icon?: LucideIcon
    shortcut?: string
    disabled?: boolean
    destructive?: boolean
  }>): ContextMenuBuilder {
    items.forEach(item => {
      this.addItem(item.id, item.label, item.onClick, {
        icon: item.icon,
        shortcut: item.shortcut,
        disabled: item.disabled,
        destructive: item.destructive,
      })
    })
    return this
  }

  /**
   * Build the context menu groups
   */
  build(): ContextMenuGroup[] {
    return this.groups
  }

  /**
   * Create a context menu from a generic actions object
   */
  static fromActions(
    actions: GenericContextMenuActions,
    itemConfig?: Record<string, {
      label: string
      icon?: LucideIcon
      shortcut?: string
      disabled?: boolean
      destructive?: boolean
    }>
  ): ContextMenuGroup[] {
    const builder = new ContextMenuBuilder()
    
    Object.entries(actions).forEach(([key, action]) => {
      if (action && itemConfig?.[key]) {
        const config = itemConfig[key]
        builder.addItem(key, config.label, action, {
          icon: config.icon,
          shortcut: config.shortcut,
          disabled: config.disabled,
          destructive: config.destructive,
        })
      }
    })

    return builder.build()
  }
}

/**
 * Utility function to create context menu groups for common use cases
 */
export const ContextMenuUtils = {
  /**
   * Create CRUD operations context menu
   */
  createCRUDMenu: (
    onView?: () => void,
    onEdit?: () => void,
    onDelete?: () => void,
    onDuplicate?: () => void
  ): ContextMenuGroup[] => {
    return ContextMenuBuilder.create()
      .addGroup("Actions")
      .addItem("view", "View", onView || (() => {}), { disabled: !onView })
      .addItem("edit", "Edit", onEdit || (() => {}), { disabled: !onEdit })
      .addItem("duplicate", "Duplicate", onDuplicate || (() => {}), { disabled: !onDuplicate })
      .addGroup()
      .addItem("delete", "Delete", onDelete || (() => {}), { 
        destructive: true, 
        disabled: !onDelete 
      })
      .build()
  },

  /**
   * Create association context menu for linking items
   */
  createAssociationMenu: (
    onAssociateToContact?: () => void,
    onAssociateToCompany?: () => void,
    onAssociateToProject?: () => void,
    onAssociateToLead?: () => void,
    onAssociateToSupport?: () => void
  ): ContextMenuGroup[] => {
    return ContextMenuBuilder.create()
      .addGroup("Associate To")
      .addItems([
        {
          id: "contact",
          label: "Contact",
          onClick: onAssociateToContact || (() => {}),
          disabled: !onAssociateToContact,
        },
        {
          id: "company", 
          label: "Company",
          onClick: onAssociateToCompany || (() => {}),
          disabled: !onAssociateToCompany,
        },
        {
          id: "project",
          label: "Project", 
          onClick: onAssociateToProject || (() => {}),
          disabled: !onAssociateToProject,
        },
        {
          id: "lead",
          label: "Lead",
          onClick: onAssociateToLead || (() => {}),
          disabled: !onAssociateToLead,
        },
        {
          id: "support",
          label: "Support Ticket",
          onClick: onAssociateToSupport || (() => {}),
          disabled: !onAssociateToSupport,
        },
      ])
      .build()
  },

  /**
   * Create status management context menu
   */
  createStatusMenu: (
    onMarkAsActive?: () => void,
    onMarkAsInactive?: () => void,
    onMarkAsCompleted?: () => void,
    onMarkAsPending?: () => void,
    onArchive?: () => void
  ): ContextMenuGroup[] => {
    return ContextMenuBuilder.create()
      .addGroup("Status")
      .addItems([
        {
          id: "active",
          label: "Mark as Active",
          onClick: onMarkAsActive || (() => {}),
          disabled: !onMarkAsActive,
        },
        {
          id: "inactive",
          label: "Mark as Inactive", 
          onClick: onMarkAsInactive || (() => {}),
          disabled: !onMarkAsInactive,
        },
        {
          id: "completed",
          label: "Mark as Completed",
          onClick: onMarkAsCompleted || (() => {}),
          disabled: !onMarkAsCompleted,
        },
        {
          id: "pending",
          label: "Mark as Pending",
          onClick: onMarkAsPending || (() => {}),
          disabled: !onMarkAsPending,
        },
      ])
      .addGroup()
      .addItem("archive", "Archive", onArchive || (() => {}), {
        disabled: !onArchive,
      })
      .build()
  },
}
