'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SaveProjectAsTemplateDialogProps {
  projectId: string;
  projectName: string;
}

export function SaveProjectAsTemplateDialog({ 
  projectId, 
  projectName 
}: SaveProjectAsTemplateDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    
    try {
      const response = await fetch(`/api/projects/${projectId}/save-as-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setIsOpen(false);
        setFormData({ name: '', description: '' });
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save project as template');
      }
    } catch (error) {
      console.error('Error saving project as template:', error);
      toast.error('Failed to save project as template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Save className="h-4 w-4 mr-2" />
        SAVE AS TEMPLATE
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>SAVE PROJECT AS TEMPLATE</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium">Creating template from:</h3>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>

            <div className="space-y-4">
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
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

