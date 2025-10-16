'use client';

/**
 * Service Translate Dialog Component
 * Dialog for translating services using DeepSeek AI
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Languages } from 'lucide-react';

interface Service {
  id: string;
  name: string;
}

interface ServiceTranslateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess: () => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export default function ServiceTranslateDialog({
  open,
  onOpenChange,
  service,
  onSuccess,
}: ServiceTranslateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Fetch available languages
  useEffect(() => {
    if (open) {
      fetchLanguages();
    }
  }, [open]);

  const fetchLanguages = async () => {
    try {
      setLoadingLanguages(true);
      const response = await fetch('/api/languages');
      const data = await response.json();
      
      if (data.success) {
        // Filter out Greek (el) as it's the source language
        const availableLanguages = data.data.filter((lang: Language) => lang.code !== 'el');
        setLanguages(availableLanguages);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      toast({
        title: 'ERROR',
        description: 'Failed to fetch languages',
        variant: 'destructive',
      });
    } finally {
      setLoadingLanguages(false);
    }
  };

  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      setSelectedLanguages(selectedLanguages.filter((c) => c !== code));
    } else {
      setSelectedLanguages([...selectedLanguages, code]);
    }
  };

  const handleTranslate = async () => {
    if (!service || selectedLanguages.length === 0) return;
    
    try {
      setLoading(true);

      toast({
        title: 'TRANSLATING',
        description: 'Generating translations via DeepSeek AI...',
      });

      const response = await fetch(`/api/services/${service.id}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetLanguages: selectedLanguages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'SUCCESS',
          description: data.message,
        });
        onSuccess();
        onOpenChange(false);
        setSelectedLanguages([]);
      } else {
        throw new Error(data.error || 'Failed to translate service');
      }
    } catch (error) {
      console.error('Error translating service:', error);
      toast({
        title: 'ERROR',
        description: error instanceof Error ? error.message : 'Failed to translate service',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="uppercase flex items-center gap-2">
            <Languages className="h-5 w-5" />
            TRANSLATE SERVICE
          </DialogTitle>
          <DialogDescription>
            Select target languages for AI translation
          </DialogDescription>
        </DialogHeader>
        
        {service && (
          <div className="py-4">
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium uppercase text-muted-foreground">SERVICE</p>
              <p className="font-medium">{service.name}</p>
            </div>

            <div className="space-y-3">
              <Label className="uppercase">SELECT TARGET LANGUAGES</Label>
              
              {loadingLanguages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : languages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No languages available
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((language) => (
                    <div key={language.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={language.code}
                        checked={selectedLanguages.includes(language.code)}
                        onCheckedChange={() => toggleLanguage(language.code)}
                      />
                      <label
                        htmlFor={language.code}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {language.name} ({language.nativeName})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedLanguages([]);
            }}
            disabled={loading}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleTranslate}
            disabled={loading || selectedLanguages.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            TRANSLATE ({selectedLanguages.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

