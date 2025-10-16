'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Sparkles, Plus, Trash2, Save } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface ProductSpecificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

interface SpecTranslation {
  id?: string;
  languageCode: string;
  specName: string;
  specValue: string;
  language?: {
    code: string;
    name: string;
  };
}

interface Specification {
  id?: string;
  specKey: string;
  order: number;
  translations: SpecTranslation[];
}

const ProductSpecificationsDialog: React.FC<ProductSpecificationsDialogProps> = ({
  open,
  onOpenChange,
  productId,
  productName,
}) => {
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en');

  useEffect(() => {
    if (open) {
      fetchSpecifications();
    }
  }, [open, productId]);

  const fetchSpecifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/specifications`);
      const data = await res.json();
      if (data.success) {
        setSpecifications(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch specifications');
      }
    } catch (error) {
      toast.error('Failed to fetch specifications');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/products/${productId}/specifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          languages: ['en', 'el'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Specifications generated successfully');
        setSpecifications(data.data || []);
      } else {
        toast.error(data.error || 'Failed to generate specifications');
      }
    } catch (error) {
      toast.error('Failed to generate specifications');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/specifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          specifications,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${productName} - Specifications saved successfully`);
        setSpecifications(data.data || []);
        
        // Close modal after successful save
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to save specifications');
      }
    } catch (error) {
      toast.error('Failed to save specifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete all specifications?')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/specifications`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`${productName} - All specifications deleted`);
        setSpecifications([]);
      } else {
        toast.error(data.error || 'Failed to delete specifications');
      }
    } catch (error) {
      toast.error('Failed to delete specifications');
    } finally {
      setLoading(false);
    }
  };

  const updateSpecTranslation = (specIndex: number, lang: string, field: 'specName' | 'specValue', value: string) => {
    const newSpecs = [...specifications];
    const translation = newSpecs[specIndex].translations.find(t => t.languageCode === lang);
    if (translation) {
      translation[field] = value;
      setSpecifications(newSpecs);
    }
  };

  const addNewSpec = () => {
    const newSpec: Specification = {
      specKey: `custom_spec_${Date.now()}`,
      order: specifications.length,
      translations: [
        { languageCode: 'en', specName: '', specValue: '' },
        { languageCode: 'el', specName: '', specValue: '' },
      ],
    };
    setSpecifications([...specifications, newSpec]);
  };

  const removeSpec = (index: number) => {
    const newSpecs = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecs);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PRODUCT SPECIFICATIONS: {productName.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Generate AI-powered technical specifications or add them manually
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleGenerate}
            disabled={generating || loading}
            variant="default"
            size="sm"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                GENERATING WITH AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                GENERATE WITH AI
              </>
            )}
          </Button>
          <Button onClick={addNewSpec} disabled={loading} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            ADD MANUAL SPEC
          </Button>
          {specifications.length > 0 && (
            <Button onClick={handleDelete} disabled={loading} variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              DELETE ALL
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 border rounded-md p-4">
          {loading && !generating ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : specifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>No specifications found</p>
              <p className="text-sm">Click "Generate with AI" to auto-generate specs</p>
            </div>
          ) : (
            <div className="space-y-6">
              {specifications.map((spec, index) => (
                <div key={spec.id || spec.specKey} className="border rounded-lg p-4 relative">
                  <Button
                    onClick={() => removeSpec(index)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>

                  <div className="mb-2">
                    <Badge variant="outline">{spec.specKey}</Badge>
                  </div>

                  <Tabs defaultValue="en" value={selectedLang} onValueChange={setSelectedLang}>
                    <TabsList>
                      <TabsTrigger value="en">English</TabsTrigger>
                      <TabsTrigger value="el">Greek</TabsTrigger>
                    </TabsList>

                    {['en', 'el'].map(lang => (
                      <TabsContent key={lang} value={lang} className="space-y-3">
                        {(() => {
                          const translation = spec.translations.find(t => t.languageCode === lang);
                          if (!translation) return null;

                          return (
                            <>
                              <div>
                                <Label>SPECIFICATION NAME ({lang.toUpperCase()})</Label>
                                <Input
                                  value={translation.specName}
                                  onChange={(e) =>
                                    updateSpecTranslation(index, lang, 'specName', e.target.value)
                                  }
                                  placeholder={lang === 'el' ? 'π.χ. ΕΠΕΞΕΡΓΑΣΤΗΣ' : 'e.g., Processor'}
                                />
                              </div>
                              <div>
                                <Label>SPECIFICATION VALUE ({lang.toUpperCase()})</Label>
                                <Textarea
                                  value={translation.specValue}
                                  onChange={(e) =>
                                    updateSpecTranslation(index, lang, 'specValue', e.target.value)
                                  }
                                  placeholder={
                                    lang === 'el'
                                      ? 'π.χ. Dual-Core ARM Cortex-A53 1.2GHz'
                                      : 'e.g., Dual-Core ARM Cortex-A53 1.2GHz'
                                  }
                                  rows={3}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            CANCEL
          </Button>
          <Button onClick={handleSave} disabled={loading || specifications.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            SAVE SPECIFICATIONS
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSpecificationsDialog;

