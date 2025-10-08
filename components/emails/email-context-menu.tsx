"use client"

import React from "react"
import {
  Trash2,
  Reply,
  ReplyAll,
  Forward,
  UserPlus,
  Building2,
  FolderOpen,
  Target,
  Headphones,
  Eye,
  EyeOff,
  Archive,
  Flag,
  Mail,
} from "lucide-react"
import { ReusableContextMenu } from "@/components/shared/context-menu"
import { ContextMenuGroup, EmailContextMenuActions } from "@/types/context-menu"

interface EmailContextMenuProps {
  actions: EmailContextMenuActions
  children: React.ReactNode
  className?: string
}

export function EmailContextMenu({ 
  actions, 
  children, 
  className 
}: EmailContextMenuProps) {
  const groups: ContextMenuGroup[] = [
    {
      id: "email-actions",
      items: [
        {
          id: "reply",
          label: "Reply",
          icon: Reply,
          shortcut: "R",
          onClick: actions.onReply || (() => {}),
          disabled: !actions.onReply,
        },
        {
          id: "reply-all",
          label: "Reply to All",
          icon: ReplyAll,
          shortcut: "Shift+R",
          onClick: actions.onReplyAll || (() => {}),
          disabled: !actions.onReplyAll,
        },
        {
          id: "forward",
          label: "Forward",
          icon: Forward,
          shortcut: "F",
          onClick: actions.onForward || (() => {}),
          disabled: !actions.onForward,
        },
      ],
    },
    {
      id: "mark-as",
      items: [
        {
          id: "mark-read",
          label: "Mark as Read",
          icon: Eye,
          onClick: actions.onMarkAsRead || (() => {}),
          disabled: !actions.onMarkAsRead,
        },
        {
          id: "mark-unread",
          label: "Mark as Unread",
          icon: EyeOff,
          onClick: actions.onMarkAsUnread || (() => {}),
          disabled: !actions.onMarkAsUnread,
        },
        {
          id: "flag",
          label: "Flag",
          icon: Flag,
          shortcut: "G",
          onClick: actions.onFlag || (() => {}),
          disabled: !actions.onFlag,
        },
        {
          id: "archive",
          label: "Archive",
          icon: Archive,
          shortcut: "A",
          onClick: actions.onArchive || (() => {}),
          disabled: !actions.onArchive,
        },
      ],
    },
    {
      id: "associate",
      label: "Associate To",
      items: [
        {
          id: "associate-contact",
          label: "Contact",
          icon: UserPlus,
          onClick: actions.onAssociateToContact || (() => {}),
          disabled: !actions.onAssociateToContact,
        },
        {
          id: "associate-company",
          label: "Company",
          icon: Building2,
          onClick: actions.onAssociateToCompany || (() => {}),
          disabled: !actions.onAssociateToCompany,
        },
        {
          id: "associate-project",
          label: "Project",
          icon: FolderOpen,
          onClick: actions.onAssociateToProject || (() => {}),
          disabled: !actions.onAssociateToProject,
        },
        {
          id: "associate-lead",
          label: "Lead",
          icon: Target,
          onClick: actions.onAssociateToLead || (() => {}),
          disabled: !actions.onAssociateToLead,
        },
        {
          id: "associate-support",
          label: "Support Ticket",
          icon: Headphones,
          onClick: actions.onAssociateToSupport || (() => {}),
          disabled: !actions.onAssociateToSupport,
        },
      ],
    },
    {
      id: "danger",
      items: [
        {
          id: "delete",
          label: "Delete",
          icon: Trash2,
          shortcut: "Del",
          destructive: true,
          onClick: actions.onDelete || (() => {}),
          disabled: !actions.onDelete,
        },
      ],
    },
  ]

  return (
    <ReusableContextMenu groups={groups} className={className}>
      {children}
    </ReusableContextMenu>
  )
}
