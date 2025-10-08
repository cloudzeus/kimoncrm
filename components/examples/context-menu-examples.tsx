"use client"

import React from "react"
import { 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Archive, 
  CheckCircle, 
  Clock, 
  User,
  Building2,
  FolderOpen,
  Target,
  Headphones,
  Mail,
  FileText,
  Calendar,
} from "lucide-react"
import { ReusableContextMenu } from "@/components/shared/context-menu"
import { ContextMenuBuilder, ContextMenuUtils } from "@/lib/context-menu-builder"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function ContextMenuExamples() {
  // Example 1: CRUD Operations
  const handleCRUDAction = (action: string, itemId: string) => {
    console.log(`CRUD Action: ${action} on item ${itemId}`)
  }

  const crudMenuGroups = ContextMenuUtils.createCRUDMenu(
    () => handleCRUDAction("view", "item-1"),
    () => handleCRUDAction("edit", "item-1"),
    () => handleCRUDAction("delete", "item-1"),
    () => handleCRUDAction("duplicate", "item-1")
  )

  // Example 2: Association Menu
  const handleAssociationAction = (type: string, itemId: string) => {
    console.log(`Associate to ${type}: ${itemId}`)
  }

  const associationMenuGroups = ContextMenuUtils.createAssociationMenu(
    () => handleAssociationAction("contact", "item-2"),
    () => handleAssociationAction("company", "item-2"),
    () => handleAssociationAction("project", "item-2"),
    () => handleAssociationAction("lead", "item-2"),
    () => handleAssociationAction("support", "item-2")
  )

  // Example 3: Status Management
  const handleStatusAction = (status: string, itemId: string) => {
    console.log(`Change status to ${status}: ${itemId}`)
  }

  const statusMenuGroups = ContextMenuUtils.createStatusMenu(
    () => handleStatusAction("active", "item-3"),
    () => handleStatusAction("inactive", "item-3"),
    () => handleStatusAction("completed", "item-3"),
    () => handleStatusAction("pending", "item-3"),
    () => handleStatusAction("archive", "item-3")
  )

  // Example 4: Custom Menu with Builder
  const customMenuGroups = ContextMenuBuilder.create()
    .addGroup("Document Actions")
    .addItem("open", "Open", () => console.log("Open document"), { 
      icon: Eye, 
      shortcut: "Enter" 
    })
    .addItem("edit", "Edit", () => console.log("Edit document"), { 
      icon: Edit, 
      shortcut: "E" 
    })
    .addItem("copy", "Copy", () => console.log("Copy document"), { 
      icon: Copy, 
      shortcut: "Ctrl+C" 
    })
    .addGroup("Share")
    .addItem("email", "Send via Email", () => console.log("Email document"), { 
      icon: Mail 
    })
    .addItem("calendar", "Schedule Meeting", () => console.log("Schedule meeting"), { 
      icon: Calendar 
    })
    .addGroup()
    .addItem("delete", "Delete", () => console.log("Delete document"), { 
      icon: Trash2, 
      destructive: true 
    })
    .build()

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-3xl font-bold uppercase tracking-wider">CONTEXT MENU EXAMPLES</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CRUD Operations Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CRUD Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableContextMenu groups={crudMenuGroups}>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <p className="text-sm text-gray-600">Right-click this item for CRUD operations</p>
                <Badge variant="outline" className="mt-2">Sample Document</Badge>
              </div>
            </ReusableContextMenu>
          </CardContent>
        </Card>

        {/* Association Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Association Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableContextMenu groups={associationMenuGroups}>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                <p className="text-sm text-gray-600">Right-click to associate this item</p>
                <Badge variant="outline" className="mt-2">Lead: John Doe</Badge>
              </div>
            </ReusableContextMenu>
          </CardContent>
        </Card>

        {/* Status Management Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Status Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableContextMenu groups={statusMenuGroups}>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                <p className="text-sm text-gray-600">Right-click to change status</p>
                <Badge variant="secondary" className="mt-2">Project: Website Redesign</Badge>
              </div>
            </ReusableContextMenu>
          </CardContent>
        </Card>

        {/* Custom Menu Example */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Custom Menu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableContextMenu groups={customMenuGroups}>
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                <p className="text-sm text-gray-600">Right-click for custom actions</p>
                <Badge variant="outline" className="mt-2">Document: Project Brief</Badge>
              </div>
            </ReusableContextMenu>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Basic Usage with ReusableContextMenu:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<ReusableContextMenu groups={menuGroups}>
  <YourComponent />
</ReusableContextMenu>`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Using ContextMenuUtils for common patterns:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const crudMenu = ContextMenuUtils.createCRUDMenu(
  onView, onEdit, onDelete, onDuplicate
)`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Using ContextMenuBuilder for custom menus:</h3>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const menu = ContextMenuBuilder.create()
  .addGroup("Actions")
  .addItem("save", "Save", onSave, { icon: Save, shortcut: "Ctrl+S" })
  .build()`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
