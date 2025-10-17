'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Percent,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';

interface MarkupRule {
  id: string;
  name: string;
  description: string | null;
  type: string;
  targetId: string | null;
  targetName: string;
  priority: number;
  b2bMarkupPercent: number;
  retailMarkupPercent: number;
  minB2BPrice: number | null;
  maxB2BPrice: number | null;
  minRetailPrice: number | null;
  maxRetailPrice: number | null;
  isActive: boolean;
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Manufacturer {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface MarkupRulesManagerProps {
  className?: string;
}

export function MarkupRulesManager({ className }: MarkupRulesManagerProps) {
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRule, setSelectedRule] = useState<MarkupRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, brandsRes, manufacturersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/markup-rules'),
        fetch('/api/master-data/brands'),
        fetch('/api/master-data/manufacturers'),
        fetch('/api/master-data/categories')
      ]);

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setRules(rulesData);
      }

      if (brandsRes.ok) {
        const brandsData = await brandsRes.json();
        setBrands(brandsData);
      }

      if (manufacturersRes.ok) {
        const manufacturersData = await manufacturersRes.json();
        setManufacturers(manufacturersData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Failed to fetch markup rules data:', error);
      toast.error('Failed to load markup rules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: any) => {
    try {
      const response = await fetch('/api/admin/markup-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        const newRule = await response.json();
        setRules(prev => [newRule, ...prev]);
        toast.success('Markup rule created successfully!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create markup rule');
        return false;
      }
    } catch (error) {
      console.error('Error creating markup rule:', error);
      toast.error('Failed to create markup rule');
      return false;
    }
  };

  const handleUpdateRule = async (ruleId: string, ruleData: any) => {
    try {
      const response = await fetch(`/api/admin/markup-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        const updatedRule = await response.json();
        setRules(prev => prev.map(rule => 
          rule.id === ruleId ? updatedRule : rule
        ));
        toast.success('Markup rule updated successfully!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update markup rule');
        return false;
      }
    } catch (error) {
      console.error('Error updating markup rule:', error);
      toast.error('Failed to update markup rule');
      return false;
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this markup rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/markup-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules(prev => prev.filter(rule => rule.id !== ruleId));
        toast.success('Markup rule deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete markup rule');
      }
    } catch (error) {
      console.error('Error deleting markup rule:', error);
      toast.error('Failed to delete markup rule');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brand':
        return '🏷️';
      case 'manufacturer':
        return '🏭';
      case 'category':
        return '📂';
      case 'global':
        return '🌐';
      default:
        return '⚙️';
    }
  };

  const columns: Column<MarkupRule>[] = [
    {
      key: 'name',
      label: 'Rule Name',
      sortable: true,
      width: 250,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTypeIcon(row.type)}</span>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.type} • {row.targetName}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'b2bMarkupPercent',
      label: 'B2B Markup',
      sortable: true,
      width: 120,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.b2bMarkupPercent}%</span>
        </div>
      ),
    },
    {
      key: 'retailMarkupPercent',
      label: 'Retail Markup',
      sortable: true,
      width: 120,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.retailMarkupPercent}%</span>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      width: 100,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{row.priority}</Badge>
          {row.priority > 5 && (
            <ArrowUp className="h-4 w-4 text-green-600" />
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      width: 100,
      render: (value, row) => (
        <Badge variant={row.isActive ? 'default' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 120,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRule(row);
              setIsEditDialogOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteRule(row.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>MARKUP RULES MANAGEMENT</span>
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
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>MARKUP RULES MANAGEMENT</span>
            </div>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              NEW RULE
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={rules} />
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <MarkupRuleDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        brands={brands}
        manufacturers={manufacturers}
        categories={categories}
        onSave={handleCreateRule}
      />

      {/* Edit Rule Dialog */}
      {selectedRule && (
        <MarkupRuleDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedRule(null);
          }}
          brands={brands}
          manufacturers={manufacturers}
          categories={categories}
          rule={selectedRule}
          onSave={async (ruleData) => {
            const success = await handleUpdateRule(selectedRule.id, ruleData);
            if (success) {
              setIsEditDialogOpen(false);
              setSelectedRule(null);
            }
            return success;
          }}
        />
      )}
    </div>
  );
}

// Markup Rule Dialog Component
interface MarkupRuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  brands: Brand[];
  manufacturers: Manufacturer[];
  categories: Category[];
  rule?: MarkupRule;
  onSave: (ruleData: any) => Promise<boolean>;
}

function MarkupRuleDialog({ 
  isOpen, 
  onClose, 
  brands, 
  manufacturers, 
  categories, 
  rule, 
  onSave 
}: MarkupRuleDialogProps) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    type: rule?.type || 'global',
    targetId: rule?.targetId || '',
    priority: rule?.priority || 0,
    b2bMarkupPercent: rule?.b2bMarkupPercent || 25,
    retailMarkupPercent: rule?.retailMarkupPercent || 50,
    minB2BPrice: rule?.minB2BPrice || null,
    maxB2BPrice: rule?.maxB2BPrice || null,
    minRetailPrice: rule?.minRetailPrice || null,
    maxRetailPrice: rule?.maxRetailPrice || null,
    isActive: rule?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const getTargetOptions = () => {
    switch (formData.type) {
      case 'brand':
        return brands.map(brand => ({ id: brand.id, name: brand.name }));
      case 'manufacturer':
        return manufacturers.map(manufacturer => ({ id: manufacturer.id, name: manufacturer.name }));
      case 'category':
        return categories.map(category => ({ id: category.id, name: category.name }));
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please provide a rule name');
      return;
    }

    if (formData.type !== 'global' && !formData.targetId) {
      toast.error('Please select a target for this rule');
      return;
    }

    setLoading(true);
    
    const success = await onSave({
      ...formData,
      targetId: formData.type === 'global' ? null : formData.targetId,
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
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{rule ? 'EDIT MARKUP RULE' : 'CREATE MARKUP RULE'}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this markup rule..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Rule Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    type: value, 
                    targetId: '' 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (All Products)</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type !== 'global' && (
                <div className="space-y-2">
                  <Label htmlFor="targetId">Target *</Label>
                  <Select
                    value={formData.targetId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTargetOptions().map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Higher priority rules override lower priority ones
              </p>
            </div>
          </div>

          {/* Markup Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Markup Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="b2bMarkupPercent">B2B Markup % *</Label>
                <Input
                  id="b2bMarkupPercent"
                  type="number"
                  step="0.01"
                  value={formData.b2bMarkupPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, b2bMarkupPercent: parseFloat(e.target.value) || 0 }))}
                  placeholder="25.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retailMarkupPercent">Retail Markup % *</Label>
                <Input
                  id="retailMarkupPercent"
                  type="number"
                  step="0.01"
                  value={formData.retailMarkupPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, retailMarkupPercent: parseFloat(e.target.value) || 0 }))}
                  placeholder="50.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minB2BPrice">Min B2B Price</Label>
                <Input
                  id="minB2BPrice"
                  type="number"
                  step="0.01"
                  value={formData.minB2BPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minB2BPrice: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxB2BPrice">Max B2B Price</Label>
                <Input
                  id="maxB2BPrice"
                  type="number"
                  step="0.01"
                  value={formData.maxB2BPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxB2BPrice: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minRetailPrice">Min Retail Price</Label>
                <Input
                  id="minRetailPrice"
                  type="number"
                  step="0.01"
                  value={formData.minRetailPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, minRetailPrice: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRetailPrice">Max Retail Price</Label>
                <Input
                  id="maxRetailPrice"
                  type="number"
                  step="0.01"
                  value={formData.maxRetailPrice || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxRetailPrice: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
