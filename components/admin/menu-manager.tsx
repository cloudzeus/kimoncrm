"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, Column } from "@/components/ui/data-table";
import { SortableList } from "@/components/drag-drop/sortable-list";
import { IconSelector } from "@/components/admin/icon-selector";
import { ColorPicker } from "@/components/admin/color-picker";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Menu,
  Folder,
  FileText,
  Users,
  Settings,
  ChevronRight,
  Save,
  X
} from "lucide-react";
import { toast } from "sonner";

interface MenuGroup {
  id: string;
  name: string;
  key: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isCollapsible: boolean;
  isActive: boolean;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  groupId: string;
  parentId?: string;
  name: string;
  key: string;
  path?: string;
  icon?: string;
  iconColor?: string;
  order: number;
  isActive: boolean;
  isExternal: boolean;
  parent?: MenuItem;
  children?: MenuItem[];
  permissions: MenuPermission[];
}

interface MenuPermission {
  id: string;
  role: string;
  canView: boolean;
  canEdit: boolean;
}

const USER_ROLES = ['ADMIN', 'MANAGER', 'USER', 'B2B'];

export function MenuManager() {
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("groups");
  
  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroup | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Load menu data
  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/menu/groups?includeItems=true');
      if (response.ok) {
        const data = await response.json();
        setMenuGroups(data.menuGroups);
      } else {
        toast.error("Failed to load menu data");
      }
    } catch (error) {
      console.error("Load menu error:", error);
      toast.error("Error loading menu data");
    } finally {
      setLoading(false);
    }
  };

  // Group management
  const handleCreateGroup = useCallback(async (groupData: Omit<MenuGroup, 'id' | 'items'>) => {
    try {
      const response = await fetch('/api/menu/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        toast.success("Menu group created successfully");
        setGroupDialogOpen(false);
        loadMenuData();
      } else {
        toast.error("Failed to create menu group");
      }
    } catch (error) {
      console.error("Create group error:", error);
      toast.error("Error creating menu group");
    }
  }, []);

  const handleUpdateGroup = useCallback(async (groupData: MenuGroup) => {
    try {
      const response = await fetch('/api/menu/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      if (response.ok) {
        toast.success("Menu group updated successfully");
        setGroupDialogOpen(false);
        setEditingGroup(null);
        loadMenuData();
      } else {
        toast.error("Failed to update menu group");
      }
    } catch (error) {
      console.error("Update group error:", error);
      toast.error("Error updating menu group");
    }
  }, []);

  const handleDeleteGroup = useCallback(async (group: MenuGroup) => {
    if (confirm(`Are you sure you want to delete "${group.name}"? This will also delete all menu items in this group.`)) {
      try {
        const response = await fetch(`/api/menu/groups?id=${group.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success("Menu group deleted successfully");
          loadMenuData();
        } else {
          toast.error("Failed to delete menu group");
        }
      } catch (error) {
        console.error("Delete group error:", error);
        toast.error("Error deleting menu group");
      }
    }
  }, []);

  // Item management
  const handleCreateItem = useCallback(async (itemData: Omit<MenuItem, 'id' | 'children'>) => {
    try {
      const response = await fetch('/api/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        toast.success("Menu item created successfully");
        setItemDialogOpen(false);
        loadMenuData();
      } else {
        toast.error("Failed to create menu item");
      }
    } catch (error) {
      console.error("Create item error:", error);
      toast.error("Error creating menu item");
    }
  }, []);

  const handleUpdateItem = useCallback(async (itemData: MenuItem) => {
    try {
      const response = await fetch('/api/menu/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        toast.success("Menu item updated successfully");
        setItemDialogOpen(false);
        setEditingItem(null);
        loadMenuData();
      } else {
        toast.error("Failed to update menu item");
      }
    } catch (error) {
      console.error("Update item error:", error);
      toast.error("Error updating menu item");
    }
  }, []);

  const handleDeleteItem = useCallback(async (item: MenuItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        const response = await fetch(`/api/menu/items?id=${item.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success("Menu item deleted successfully");
          loadMenuData();
        } else {
          toast.error("Failed to delete menu item");
        }
      } catch (error) {
        console.error("Delete item error:", error);
        toast.error("Error deleting menu item");
      }
    }
  }, []);

  // Reorder groups
  const handleReorderGroups = useCallback(async (reorderedGroups: MenuGroup[]) => {
    try {
      // Update order for each group
      const promises = reorderedGroups.map((group, index) =>
        fetch('/api/menu/groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: group.id, order: index }),
        })
      );
      
      await Promise.all(promises);
      toast.success("Menu groups reordered successfully");
      loadMenuData();
    } catch (error) {
      console.error("Reorder groups error:", error);
      toast.error("Error reordering menu groups");
    }
  }, []);

  // Define columns for groups table
  const groupColumns: Column<MenuGroup>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, group) => (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            {/* Icon would be rendered here */}
          </div>
          <span className="font-medium text-[11px]">{value}</span>
        </div>
      ),
    },
    {
      key: "key",
      label: "Key",
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="font-mono text-xs">
          {value}
        </Badge>
      ),
    },
    {
      key: "items",
      label: "Items",
      render: (value) => (
        <Badge variant="secondary">
          {value.length} items
        </Badge>
      ),
    },
    {
      key: "isCollapsible",
      label: "Collapsible",
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 120,
      render: (_, group) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingGroup(group);
              setGroupDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGroup(group)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Render group item for sortable list
  const renderGroupItem = useCallback((group: MenuGroup, index: number) => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-3">
        <Folder className="h-5 w-5 text-muted-foreground" />
        <div>
          <h4 className="font-medium">{group.name}</h4>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {group.key}
            </Badge>
            <span>•</span>
            <span>{group.items.length} items</span>
            {!group.isCollapsible && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-xs">
                  Always expanded
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Badge variant={group.isActive ? "default" : "secondary"} className="text-xs">
          {group.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          #{index + 1}
        </Badge>
      </div>
    </div>
  ), []);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="groups">Menu Groups</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Menu Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Menu Groups</h3>
              <p className="text-sm text-muted-foreground">
                Organize menu items into collapsible groups
              </p>
            </div>
            
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              </DialogTrigger>
              <MenuGroupDialog
                group={editingGroup}
                onSave={editingGroup ? handleUpdateGroup : handleCreateGroup}
                onClose={() => {
                  setGroupDialogOpen(false);
                  setEditingGroup(null);
                }}
              />
            </Dialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sortable List View */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Drag & Drop Order
                </CardTitle>
                <CardDescription>
                  Drag groups to reorder them in the sidebar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SortableList
                  items={menuGroups}
                  onReorder={handleReorderGroups}
                  renderItem={renderGroupItem}
                  emptyMessage="No menu groups created"
                />
              </CardContent>
            </Card>

            {/* Table View */}
            <Card>
              <CardHeader>
                <CardTitle>Group Details</CardTitle>
                <CardDescription>
                  View and manage group properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={menuGroups}
                  columns={groupColumns}
                  searchable={true}
                  sortable={true}
                  resizable={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Menu Items Tab */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Menu Items</h3>
              <p className="text-sm text-muted-foreground">
                Manage individual menu items and their hierarchy
              </p>
            </div>
            
            <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <MenuItemDialog
                item={editingItem}
                groups={menuGroups}
                onSave={editingItem ? handleUpdateItem : handleCreateItem}
                onClose={() => {
                  setItemDialogOpen(false);
                  setEditingItem(null);
                }}
              />
            </Dialog>
          </div>

          <MenuItemsTable
            menuGroups={menuGroups}
            onEditItem={(item) => {
              setEditingItem(item);
              setItemDialogOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
          />
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Role Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Configure which menu items each user role can access
            </p>
          </div>

          <PermissionsMatrix menuGroups={menuGroups} onUpdatePermissions={loadMenuData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Menu Group Dialog Component
function MenuGroupDialog({
  group,
  onSave,
  onClose,
}: {
  group: MenuGroup | null;
  onSave: (group: MenuGroup | Omit<MenuGroup, 'id' | 'items'>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [key, setKey] = useState(group?.key || "");
  const [icon, setIcon] = useState(group?.icon || "");
  const [iconColor, setIconColor] = useState(group?.iconColor || "#000000");
  const [order, setOrder] = useState(group?.order || 0);
  const [isCollapsible, setIsCollapsible] = useState(group?.isCollapsible ?? true);
  const [isActive, setIsActive] = useState(group?.isActive ?? true);
  const [loading, setLoading] = useState(false);

  // Keep local state in sync when switching between create/edit
  useEffect(() => {
    setName(group?.name || "");
    setKey(group?.key || "");
    setIcon(group?.icon || "");
    setIconColor(group?.iconColor || "#000000");
    setOrder(group?.order || 0);
    setIsCollapsible(group?.isCollapsible ?? true);
    setIsActive(group?.isActive ?? true);
  }, [group]);

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      toast.error("Name and key are required");
      return;
    }

    setLoading(true);
    try {
      const groupData = {
        ...(group && { id: group.id }),
        name: name.trim(),
        key: key.trim(),
        icon: icon || undefined,
        iconColor: iconColor || undefined,
        order,
        isCollapsible,
        isActive,
      };

      await onSave(groupData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{group ? "Edit Menu Group" : "Create Menu Group"}</DialogTitle>
        <DialogDescription>
          Configure the menu group settings
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="groupName">Name *</Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Navigation"
            />
          </div>
          
          <div>
            <Label htmlFor="groupKey">Key *</Label>
            <Input
              id="groupKey"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., main_nav"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="groupIcon">Icon</Label>
            <IconSelector
              value={icon}
              onChange={setIcon}
              placeholder="Select an icon"
            />
          </div>
          
          <div>
            <Label htmlFor="groupColor">Icon Color</Label>
            <ColorPicker
              value={iconColor}
              onChange={setIconColor}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="groupOrder">Order</Label>
          <Input
            id="groupOrder"
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCollapsible"
              checked={isCollapsible}
              onCheckedChange={(checked) => setIsCollapsible(!!checked)}
            />
            <Label htmlFor="isCollapsible">Collapsible (can be collapsed if &gt;3 items)</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : group ? "Update Group" : "Create Group"}
        </Button>
      </div>
    </DialogContent>
  );
}

// Menu Item Dialog Component
function MenuItemDialog({
  item,
  groups,
  onSave,
  onClose,
}: {
  item: MenuItem | null;
  groups: MenuGroup[];
  onSave: (item: MenuItem | Omit<MenuItem, 'id' | 'children'>) => Promise<void>;
  onClose: () => void;
}) {
  const [groupId, setGroupId] = useState(item?.groupId || "");
  const [parentId, setParentId] = useState(item?.parentId || "");
  const [name, setName] = useState(item?.name || "");
  const [key, setKey] = useState(item?.key || "");
  const [path, setPath] = useState(item?.path || "");
  const [icon, setIcon] = useState(item?.icon || "");
  const [iconColor, setIconColor] = useState(item?.iconColor || "#000000");
  const [order, setOrder] = useState(item?.order || 0);
  const [isActive, setIsActive] = useState(item?.isActive ?? true);
  const [isExternal, setIsExternal] = useState(item?.isExternal ?? false);
  const [permissions, setPermissions] = useState<Record<string, { canView: boolean; canEdit: boolean }>>(
    USER_ROLES.reduce((acc, role) => {
      const existing = item?.permissions.find(p => p.role === role);
      acc[role] = {
        canView: existing?.canView ?? true,
        canEdit: existing?.canEdit ?? false,
      };
      return acc;
    }, {} as Record<string, { canView: boolean; canEdit: boolean }>)
  );
  const [loading, setLoading] = useState(false);

  const selectedGroup = groups.find(g => g.id === groupId);
  const availableParents = selectedGroup?.items.filter(i => 
    i.id !== item?.id && 
    i.parentId === undefined // Only top-level items can be parents
  ) || [];

  // Keep local state in sync when switching items
  useEffect(() => {
    setGroupId(item?.groupId || "");
    setParentId(item?.parentId || "");
    setName(item?.name || "");
    setKey(item?.key || "");
    setPath(item?.path || "");
    setIcon(item?.icon || "");
    setIconColor(item?.iconColor || "#000000");
    setOrder(item?.order || 0);
    setIsActive(item?.isActive ?? true);
    setIsExternal(item?.isExternal ?? false);
    setPermissions(USER_ROLES.reduce((acc, role) => {
      const existing = item?.permissions.find(p => p.role === role);
      acc[role] = {
        canView: existing?.canView ?? true,
        canEdit: existing?.canEdit ?? false,
      };
      return acc;
    }, {} as Record<string, { canView: boolean; canEdit: boolean }>));
  }, [item]);

  const handleSave = async () => {
    if (!groupId || !name.trim() || !key.trim()) {
      toast.error("Group, name, and key are required");
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        ...(item && { id: item.id }),
        groupId,
        parentId: parentId || undefined,
        name: name.trim(),
        key: key.trim(),
        path: path || undefined,
        icon: icon || undefined,
        iconColor: iconColor || undefined,
        order,
        isActive,
        isExternal,
        permissions: Object.entries(permissions).map(([role, perms]) => ({
          role,
          canView: perms.canView,
          canEdit: perms.canEdit,
        })),
      };

      await onSave(itemData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{item ? "Edit Menu Item" : "Create Menu Item"}</DialogTitle>
        <DialogDescription>
          Configure the menu item settings and permissions
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemGroup">Group *</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="itemParent">Parent Item</Label>
            <Select value={parentId || "__none__"} onValueChange={(v) => setParentId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select parent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No parent (top-level item)</SelectItem>
                {availableParents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    {parent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemName">Name *</Label>
            <Input
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Dashboard"
            />
          </div>
          
          <div>
            <Label htmlFor="itemKey">Key *</Label>
            <Input
              id="itemKey"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              placeholder="e.g., dashboard"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="itemPath">Path</Label>
          <Input
            id="itemPath"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="e.g., /dashboard"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemIcon">Icon</Label>
            <IconSelector
              value={icon}
              onChange={setIcon}
              placeholder="Select an icon"
            />
          </div>
          
          <div>
            <Label htmlFor="itemColor">Icon Color</Label>
            <ColorPicker
              value={iconColor}
              onChange={setIconColor}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="itemOrder">Order</Label>
            <Input
              id="itemOrder"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isExternal"
              checked={isExternal}
              onCheckedChange={(checked) => setIsExternal(!!checked)}
            />
            <Label htmlFor="isExternal">External Link</Label>
          </div>
        </div>
        
        {/* Permissions */}
        <div className="space-y-3">
          <Label>Role Permissions</Label>
          <div className="space-y-2">
            {USER_ROLES.map((role) => (
              <div key={role} className="flex items-center justify-between p-3 border rounded-md">
                <span className="font-medium">{role}</span>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-view`}
                      checked={permissions[role]?.canView ?? true}
                      onCheckedChange={(checked) =>
                        setPermissions(prev => ({
                          ...prev,
                          [role]: { ...prev[role], canView: !!checked }
                        }))
                      }
                    />
                    <Label htmlFor={`${role}-view`}>View</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${role}-edit`}
                      checked={permissions[role]?.canEdit ?? false}
                      onCheckedChange={(checked) =>
                        setPermissions(prev => ({
                          ...prev,
                          [role]: { ...prev[role], canEdit: !!checked }
                        }))
                      }
                    />
                    <Label htmlFor={`${role}-edit`}>Edit</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </DialogContent>
  );
}

// Menu Items Table Component
function MenuItemsTable({
  menuGroups,
  onEditItem,
  onDeleteItem,
}: {
  menuGroups: MenuGroup[];
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
}) {
  const allItems = menuGroups.flatMap(group => 
    group.items.map(item => ({ ...item, groupName: group.name }))
  );

  const itemColumns: Column<MenuItem & { groupName: string }>[] = [
    {
      key: "groupName",
      label: "Group",
      sortable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      ),
    },
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 flex items-center justify-center">
            {/* Icon would be rendered here */}
          </div>
          <span className="font-medium">{value}</span>
          {item.parent && (
            <Badge variant="secondary" className="text-xs">
              Sub-item
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "path",
      label: "Path",
      sortable: true,
      render: (value) => (
        <code className="text-xs bg-muted px-1 rounded">
          {value || "-"}
        </code>
      ),
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (value) => (
        <div className="flex space-x-1">
          {value.map((perm: MenuPermission) => (
            <Badge key={perm.role} variant={perm.canView ? "default" : "secondary"} className="text-xs">
              {perm.role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: 120,
      render: (_, item) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditItem(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteItem(item)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={allItems}
      columns={itemColumns}
      searchable={true}
      sortable={true}
      resizable={true}
    />
  );
}

// Permissions Matrix Component
function PermissionsMatrix({
  menuGroups,
  onUpdatePermissions,
}: {
  menuGroups: MenuGroup[];
  onUpdatePermissions: () => void;
}) {
  const [permissions, setPermissions] = useState<Record<string, Record<string, { canView: boolean; canEdit: boolean }>>>({});

  useEffect(() => {
    const perms: Record<string, Record<string, { canView: boolean; canEdit: boolean }>> = {};
    
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (!perms[item.id]) {
          perms[item.id] = {};
        }
        
        item.permissions.forEach(perm => {
          perms[item.id][perm.role] = {
            canView: perm.canView,
            canEdit: perm.canEdit,
          };
        });
        
        // Fill in defaults for missing roles
        USER_ROLES.forEach(role => {
          if (!perms[item.id][role]) {
            perms[item.id][role] = {
              canView: true,
              canEdit: false,
            };
          }
        });
      });
    });
    
    setPermissions(perms);
  }, [menuGroups]);

  const handlePermissionChange = async (itemId: string, role: string, action: 'canView' | 'canEdit', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [role]: {
          ...prev[itemId][role],
          [action]: value,
        },
      },
    }));

    // Update in database
    try {
      const response = await fetch('/api/menu/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          permissions: Object.entries(permissions[itemId] || {}).map(([r, perms]) => ({
            role: r,
            canView: r === role && action === 'canView' ? value : perms.canView,
            canEdit: r === role && action === 'canEdit' ? value : perms.canEdit,
          })),
        }),
      });

      if (!response.ok) {
        toast.error("Failed to update permissions");
      }
    } catch (error) {
      console.error("Update permissions error:", error);
      toast.error("Error updating permissions");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Matrix</CardTitle>
        <CardDescription>
          Configure which roles can access each menu item
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Menu Item</th>
                {USER_ROLES.map(role => (
                  <th key={role} className="text-center p-2">
                    <div className="space-y-1">
                      <div className="font-medium">{role}</div>
                      <div className="flex space-x-2 text-xs">
                        <span>View</span>
                        <span>Edit</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {menuGroups.map(group => (
                <React.Fragment key={group.id}>
                  <tr className="bg-muted/50">
                    <td colSpan={USER_ROLES.length + 1} className="p-2 font-medium">
                      {group.name}
                    </td>
                  </tr>
                  {group.items.map(item => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2 pl-4">
                        <div className="flex items-center space-x-2">
                          <ChevronRight className="h-3 w-3" />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      {USER_ROLES.map(role => (
                        <td key={role} className="p-2">
                          <div className="flex space-x-2 justify-center">
                            <Checkbox
                              checked={permissions[item.id]?.[role]?.canView ?? true}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(item.id, role, 'canView', !!checked)
                              }
                            />
                            <Checkbox
                              checked={permissions[item.id]?.[role]?.canEdit ?? false}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(item.id, role, 'canEdit', !!checked)
                              }
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
