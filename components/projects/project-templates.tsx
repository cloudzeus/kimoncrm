'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Save, 
  Copy, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  creator: {
    name: string | null;
    email: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: string;
    estimatedHours: number | null;
  }>;
}

interface ProjectTemplatesProps {
  projectId?: string;
  onTemplateSelected?: (template: ProjectTemplate) => void;
  showCreateFromTemplate?: boolean;
}

export function ProjectTemplates({ 
  projectId, 
  onTemplateSelected, 
  showCreateFromTemplate = false 
}: ProjectTemplatesProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load project templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      const response = await fetch('/api/projects/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        setTemplates(prev => [newTemplate, ...prev]);
        toast.success('Project template created successfully!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create template');
        return false;
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
      return false;
    }
  };

  const handleUpdateTemplate = async (templateId: string, templateData: any) => {
    try {
      const response = await fetch(`/api/projects/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        setTemplates(prev => prev.map(t => t.id === templateId ? updatedTemplate : t));
        toast.success('Template updated successfully!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update template');
        return false;
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
      return false;
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!projectId) {
      toast.error('No project selected');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks/from-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        toast.success('Tasks created from template successfully!');
        if (onTemplateSelected) {
          const template = templates.find(t => t.id === templateId);
          if (template) {
            onTemplateSelected(template);
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create tasks from template');
      }
    } catch (error) {
      console.error('Error creating tasks from template:', error);
      toast.error('Failed to create tasks from template');
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Template Name',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-muted-foreground">
            Created by {row.original.creator.name || row.original.creator.email}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'tasks',
      header: 'Tasks',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => (
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-medium">{row.original.tasks.length}</span>
          <span className="text-sm text-muted-foreground">tasks</span>
        </div>
      ),
    },
    {
      accessorKey: 'estimatedHours',
      header: 'Estimated Hours',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => {
        const totalHours = row.original.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
        return (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{totalHours}h</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: ProjectTemplate } }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(row.original);
              setIsDetailsDialogOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTemplate(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>

          {showCreateFromTemplate && projectId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCreateFromTemplate(row.original.id)}
              title="Create tasks from template"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteTemplate(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>PROJECT TEMPLATES</span>
            </div>
            <Button size="sm" disabled>
              <Plus className="h-4 w-4 mr-2" />
              NEW TEMPLATE
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>PROJECT TEMPLATES</span>
            </div>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              NEW TEMPLATE
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={templates} />
        </CardContent>
      </Card>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={handleCreateTemplate}
      />

      {/* Edit Template Dialog */}
      {selectedTemplate && (
        <EditTemplateDialog
          template={selectedTemplate}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedTemplate(null);
          }}
          onSave={async (templateData) => {
            const success = await handleUpdateTemplate(selectedTemplate.id, templateData);
            if (success) {
              setIsEditDialogOpen(false);
              setSelectedTemplate(null);
            }
          }}
        />
      )}

      {/* Template Details Dialog */}
      {selectedTemplate && (
        <TemplateDetailsDialog
          template={selectedTemplate}
          isOpen={isDetailsDialogOpen}
          onClose={() => {
            setIsDetailsDialogOpen(false);
            setSelectedTemplate(null);
          }}
          onCreateFromTemplate={projectId ? () => handleCreateFromTemplate(selectedTemplate.id) : undefined}
        />
      )}
    </div>
  );
}

// Create Template Dialog Component
interface CreateTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: any) => Promise<boolean>;
}

function CreateTemplateDialog({ isOpen, onClose, onSave }: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please provide a template name');
      return;
    }

    setLoading(true);
    
    const success = await onSave({
      name: formData.name,
      description: formData.description,
    });

    if (success) {
      setFormData({ name: '', description: '' });
      onClose();
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>CREATE PROJECT TEMPLATE</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Template Dialog Component
interface EditTemplateDialogProps {
  template: ProjectTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: any) => Promise<boolean>;
}

function EditTemplateDialog({ template, isOpen, onClose, onSave }: EditTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description || '',
    isActive: template.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please provide a template name');
      return;
    }

    setLoading(true);
    
    const success = await onSave({
      name: formData.name,
      description: formData.description,
      isActive: formData.isActive,
    });

    if (success) {
      onClose();
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>EDIT PROJECT TEMPLATE</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe this template..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Template Details Dialog Component
interface TemplateDetailsDialogProps {
  template: ProjectTemplate;
  isOpen: boolean;
  onClose: () => void;
  onCreateFromTemplate?: () => void;
}

function TemplateDetailsDialog({ template, isOpen, onClose, onCreateFromTemplate }: TemplateDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{template.name}</span>
            <Badge variant={template.isActive ? 'default' : 'secondary'}>
              {template.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {template.description && (
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{template.tasks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {template.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)}h
              </div>
              <div className="text-sm text-muted-foreground">Estimated Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {template.tasks.filter(task => task.priority === 'High' || task.priority === 'Critical').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">Tasks</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {template.tasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{task.priority}</Badge>
                      {task.estimatedHours && (
                        <span className="text-sm text-muted-foreground">
                          {task.estimatedHours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            {onCreateFromTemplate && (
              <Button onClick={onCreateFromTemplate}>
                <Copy className="h-4 w-4 mr-2" />
                Create Tasks from Template
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

