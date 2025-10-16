'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Save, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface ProductTranslationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

interface TranslationData {
  languageCode: string;
  languageName: string;
  name: string;
  shortDescription: string;
  description: string;
}

export default function ProductTranslationsDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSuccess,
}: ProductTranslationsDialogProps) {
  const [translationsData, setTranslationsData] = useState<TranslationData[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState<{ eanCode?: string; manufacturerCode?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadExistingTranslations();
    } else {
      // Reset state when closing
      setHasGenerated(false);
      setGeneratedCodes({});
    }
  }, [open, productId]);

  const loadExistingTranslations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/translate`);
      const data = await response.json();

      if (data.success && data.data) {
        setTranslationsData(
          data.data.map((t: any) => ({
            languageCode: t.languageCode,
            languageName: t.language.name,
            name: t.name || '',
            shortDescription: t.shortDescription || '',
            description: t.description || '',
          }))
        );
      }
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      toast({
        title: 'Generating',
        description: 'AI is generating translations...',
      });

      // We'll use the existing generate endpoint but not save automatically
      // For now, call the API to generate and then we'll handle the response
      const response = await fetch(`/api/products/${productId}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'generate' }),
      });

      const data = await response.json();

      if (data.success) {
        // Fetch the newly generated translations
        await loadExistingTranslations();
        setHasGenerated(true);

        // Store any generated codes
        if (data.updatedCodes) {
          setGeneratedCodes(data.updatedCodes);
        }

        const successCount = data.results.filter((r: any) => r.success).length;
        toast({
          title: 'Generated',
          description: `${successCount} translations generated. Review and click SAVE to confirm.`,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate translations',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${productId}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save',
          translations: translationsData,
          codes: generatedCodes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Translations saved successfully',
        });

        // Show ERP sync status if codes were updated
        if (generatedCodes.eanCode || generatedCodes.manufacturerCode) {
          const codeMessages = [];
          if (generatedCodes.eanCode) codeMessages.push(`EAN: ${generatedCodes.eanCode}`);
          if (generatedCodes.manufacturerCode) codeMessages.push(`Mfr: ${generatedCodes.manufacturerCode}`);
          
          const erpMsg = data.erpSyncStatus === 'success' 
            ? ' | ✅ Synced to ERP' 
            : data.erpSyncStatus === 'failed' 
            ? ' | ⚠️ ERP sync failed' 
            : '';
          
          toast({
            title: '✅ Codes Updated',
            description: codeMessages.join(' | ') + erpMsg,
            duration: 5000,
          });
        }

        if (onSuccess) {
          onSuccess();
        }

        // Close modal
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save translations',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTranslation = (langCode: string, field: string, value: string) => {
    setTranslationsData(prev =>
      prev.map(t =>
        t.languageCode === langCode ? { ...t, [field]: value } : t
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>PRODUCT TRANSLATIONS: {productName.toUpperCase()}</DialogTitle>
          <DialogDescription>
            Generate AI translations and review/edit before saving
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : translationsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p>No translations yet</p>
              <p className="text-sm">Click "GENERATE WITH AI" to create translations</p>
            </div>
          ) : (
            <Tabs defaultValue={translationsData[0]?.languageCode} className="h-full flex flex-col">
              <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${translationsData.length}, 1fr)` }}>
                {translationsData.map((t) => (
                  <TabsTrigger key={t.languageCode} value={t.languageCode}>
                    {t.languageName.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>

              {translationsData.map((translation) => (
                <TabsContent key={translation.languageCode} value={translation.languageCode} className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-2">
                    <Label>PRODUCT NAME ({translation.languageCode.toUpperCase()})</Label>
                    <Input
                      value={translation.name}
                      onChange={(e) => updateTranslation(translation.languageCode, 'name', e.target.value)}
                      placeholder="Product name..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>SHORT DESCRIPTION</Label>
                    <Textarea
                      value={translation.shortDescription}
                      onChange={(e) => updateTranslation(translation.languageCode, 'shortDescription', e.target.value)}
                      placeholder="Short technical description (100-150 characters)..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      {translation.shortDescription.length} characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>DESCRIPTION</Label>
                    <Textarea
                      value={translation.description}
                      onChange={(e) => updateTranslation(translation.languageCode, 'description', e.target.value)}
                      placeholder="Full technical description (250-400 characters)..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      {translation.description.length} characters
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>

        {/* Generated Codes Display */}
        {(generatedCodes.eanCode || generatedCodes.manufacturerCode) && (
          <div className="border-t pt-4">
            <Label className="text-xs font-semibold mb-2 block">AI-GENERATED CODES:</Label>
            <div className="flex gap-4">
              {generatedCodes.eanCode && (
                <div>
                  <Label className="text-xs text-muted-foreground">EAN CODE</Label>
                  <Input
                    value={generatedCodes.eanCode}
                    onChange={(e) => setGeneratedCodes({ ...generatedCodes, eanCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
              {generatedCodes.manufacturerCode && (
                <div>
                  <Label className="text-xs text-muted-foreground">MANUFACTURER CODE</Label>
                  <Input
                    value={generatedCodes.manufacturerCode}
                    onChange={(e) => setGeneratedCodes({ ...generatedCodes, manufacturerCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleGenerate}
            disabled={generating || saving}
            variant="outline"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                GENERATE WITH AI
              </>
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || generating || translationsData.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                SAVE TRANSLATIONS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

