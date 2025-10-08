# Context Menu System

A flexible and reusable right-click context menu system built with shadcn/ui components and TypeScript.

## Features

- ✅ **Reusable**: Use across any component with customizable actions
- ✅ **Type-safe**: Full TypeScript support with proper typing
- ✅ **Flexible**: Support for icons, shortcuts, groups, and destructive actions
- ✅ **Email-specific**: Pre-built email context menu with common actions
- ✅ **Builder pattern**: Easy creation of custom context menus
- ✅ **Utility functions**: Common patterns like CRUD, associations, and status management

## Components

### Core Components

- `ReusableContextMenu`: Main context menu component
- `EmailContextMenu`: Email-specific context menu with predefined actions
- `ContextMenuBuilder`: Builder class for creating custom menus
- `ContextMenuUtils`: Utility functions for common patterns

### UI Components

- `ContextMenu` (shadcn/ui): Base context menu implementation
- `Separator` (shadcn/ui): Visual separator for menu groups

## Usage Examples

### 1. Email Context Menu

```tsx
import { EmailContextMenu } from "@/components/shared"
import { EmailContextMenuActions } from "@/types/context-menu"

const emailActions: EmailContextMenuActions = {
  onDelete: () => handleDelete(email.id),
  onReply: () => handleReply(email.id),
  onForward: () => handleForward(email.id),
  onAssociateToContact: () => handleAssociateToContact(email.id),
  // ... other actions
}

<EmailContextMenu actions={emailActions}>
  <EmailCard email={email} />
</EmailContextMenu>
```

### 2. Generic Context Menu

```tsx
import { ReusableContextMenu } from "@/components/shared"

const menuGroups = [
  {
    id: "actions",
    items: [
      {
        id: "edit",
        label: "Edit",
        icon: Edit,
        onClick: () => handleEdit(item.id),
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onClick: () => handleDelete(item.id),
      },
    ],
  },
]

<ReusableContextMenu groups={menuGroups}>
  <YourComponent />
</ReusableContextMenu>
```

### 3. Using ContextMenuBuilder

```tsx
import { ContextMenuBuilder } from "@/lib/context-menu-builder"

const menu = ContextMenuBuilder.create()
  .addGroup("Actions")
  .addItem("view", "View", () => handleView(item.id), { 
    icon: Eye, 
    shortcut: "Enter" 
  })
  .addItem("edit", "Edit", () => handleEdit(item.id), { 
    icon: Edit, 
    shortcut: "E" 
  })
  .addGroup()
  .addItem("delete", "Delete", () => handleDelete(item.id), { 
    icon: Trash2, 
    destructive: true 
  })
  .build()

<ReusableContextMenu groups={menu}>
  <YourComponent />
</ReusableContextMenu>
```

### 4. Using Utility Functions

```tsx
import { ContextMenuUtils } from "@/lib/context-menu-builder"

// CRUD operations
const crudMenu = ContextMenuUtils.createCRUDMenu(
  () => handleView(item.id),
  () => handleEdit(item.id),
  () => handleDelete(item.id),
  () => handleDuplicate(item.id)
)

// Association menu
const associationMenu = ContextMenuUtils.createAssociationMenu(
  () => handleAssociateToContact(item.id),
  () => handleAssociateToCompany(item.id),
  () => handleAssociateToProject(item.id)
)

// Status management
const statusMenu = ContextMenuUtils.createStatusMenu(
  () => handleMarkAsActive(item.id),
  () => handleMarkAsInactive(item.id),
  () => handleArchive(item.id)
)
```

## Email Context Menu Actions

The email context menu includes the following actions:

### Communication Actions
- **Reply** (R)
- **Reply to All** (Shift+R)
- **Forward** (F)

### Status Actions
- **Mark as Read**
- **Mark as Unread**
- **Flag** (G)
- **Archive** (A)

### Association Actions
- **Associate to Contact**
- **Associate to Company**
- **Associate to Project**
- **Associate to Lead**
- **Associate to Support Ticket**

### Destructive Actions
- **Delete** (Del)

## Customization

### Adding Custom Actions

```tsx
const customActions = {
  onCustomAction1: () => console.log("Custom action 1"),
  onCustomAction2: () => console.log("Custom action 2"),
}

// Using ContextMenuBuilder
const menu = ContextMenuBuilder.create()
  .addGroup("Custom Actions")
  .addItem("action1", "Custom Action 1", customActions.onCustomAction1, {
    icon: CustomIcon,
    shortcut: "Ctrl+1",
  })
  .build()
```

### Styling

The context menu uses Tailwind CSS classes and follows your design system:
- No transparent backgrounds
- Shadow-based depth instead of borders
- Uppercase headers
- Consistent spacing and typography

## Type Safety

All components are fully typed with TypeScript:

```tsx
interface ContextMenuItem {
  id: string
  label: string
  icon?: LucideIcon
  shortcut?: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
}

interface EmailContextMenuActions {
  onDelete?: () => void
  onReply?: () => void
  onReplyAll?: () => void
  onForward?: () => void
  onAssociateToContact?: () => void
  onAssociateToCompany?: () => void
  onAssociateToProject?: () => void
  onAssociateToLead?: () => void
  onAssociateToSupport?: () => void
  // ... more actions
}
```

## Examples

See the complete examples in:
- `components/examples/context-menu-examples.tsx` - Comprehensive usage examples
- `components/emails/email-list-example.tsx` - Email list implementation
- `components/shared/context-menu.tsx` - Core component implementation

## Dependencies

- `@radix-ui/react-context-menu` - Core context menu functionality
- `lucide-react` - Icons
- `shadcn/ui` - UI components
- `tailwindcss` - Styling
