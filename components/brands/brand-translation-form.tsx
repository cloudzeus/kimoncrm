"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, Globe, Wand2 } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface BrandTranslation {
  languageCode: string;
  name?: string;
  description?: string;
}

interface BrandTranslationFormProps {
  translations: BrandTranslation[];
  onTranslationsChange: (translations: BrandTranslation[]) => void;
  defaultLanguage?: string;
  sourceName?: string;
  sourceDescription?: string;
}

export function BrandTranslationForm({ 
  translations, 
  onTranslationsChange, 
  defaultLanguage = "en",
  sourceName = "",
  sourceDescription = ""
}: BrandTranslationFormProps) {
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTranslating, setAiTranslating] = useState<string | null>(null);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/languages");
        if (response.ok) {
          const data = await response.json();
          setAvailableLanguages(data.languages);
        }
      } catch (error) {
        toast.error("Failed to load languages");
      } finally {
        setLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const addTranslation = (languageCode: string) => {
    if (translations.find(t => t.languageCode === languageCode)) {
      toast.error("Translation for this language already exists");
      return;
    }

    const newTranslation: BrandTranslation = {
      languageCode,
      name: "",
      description: "",
    };

    onTranslationsChange([...translations, newTranslation]);
  };

  const removeTranslation = (languageCode: string) => {
    onTranslationsChange(translations.filter(t => t.languageCode !== languageCode));
  };

  const updateTranslation = (languageCode: string, field: 'name' | 'description', value: string) => {
    const updatedTranslations = translations.map(t =>
      t.languageCode === languageCode
        ? { ...t, [field]: value }
        : t
    );
    onTranslationsChange(updatedTranslations);
  };

  const translateWithAI = async (languageCode: string) => {
    if (!sourceDescription.trim()) {
      toast.error("Source description is required for AI translation");
      return;
    }

    setAiTranslating(languageCode);
    try {
      const response = await fetch("/api/brands/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: "temp", // Not used in the API but required by schema
          sourceLanguage: defaultLanguage,
          targetLanguage: languageCode,
          sourceName: sourceName,
          sourceDescription: sourceDescription,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.description) updateTranslation(languageCode, 'description', data.description);
        toast.success(`AI translation completed for ${getLanguageInfo(languageCode)?.nativeName}`);
      } else {
        const error = await response.json();
        toast.error(error.message || "AI translation failed");
      }
    } catch (error) {
      toast.error("Error during AI translation");
    } finally {
      setAiTranslating(null);
    }
  };

  const getLanguageInfo = (languageCode: string) => {
    return availableLanguages.find(l => l.code === languageCode);
  };

  // Only allow Greek ("el") since English is default
  const availableForAdding = availableLanguages
    .filter(lang => lang.code === 'el')
    .filter(lang => !translations.find(t => t.languageCode === lang.code));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>TRANSLATIONS</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading languages...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>TRANSLATIONS</span>
          </CardTitle>
          {availableForAdding.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Add:</span>
              {availableForAdding.map(lang => (
                <Button
                  key={lang.code}
                  variant="outline"
                  size="sm"
                  onClick={() => addTranslation(lang.code)}
                  className="text-xs"
                >
                  {lang.flag} {lang.nativeName}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {translations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No translations added yet.</p>
            <p className="text-sm">Click on a language button above to add translations.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {translations.map((translation, index) => {
              const languageInfo = getLanguageInfo(translation.languageCode);
              const isDefault = translation.languageCode === defaultLanguage;
              
              return (
                <div key={translation.languageCode}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{languageInfo?.flag}</span>
                      <span className="font-medium">{languageInfo?.nativeName}</span>
                      {isDefault && (
                        <Badge variant="secondary" className="text-xs">DEFAULT</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => translateWithAI(translation.languageCode)}
                          disabled={aiTranslating === translation.languageCode || !sourceName.trim()}
                          className="text-xs"
                        >
                          <Wand2 className="h-3 w-3 mr-1" />
                          {aiTranslating === translation.languageCode ? "TRANSLATING..." : "AI TRANSLATE"}
                        </Button>
                      )}
                      {!isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTranslation(translation.languageCode)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {/* For brands, only translate description (not name) */}
                    
                    <div className="space-y-2">
                      <Label htmlFor={`description-${translation.languageCode}`}>
                        DESCRIPTION {isDefault && "(DEFAULT)"}
                      </Label>
                      <Textarea
                        id={`description-${translation.languageCode}`}
                        value={translation.description || ""}
                        onChange={(e) => updateTranslation(translation.languageCode, 'description', e.target.value)}
                        placeholder={`Brand description in ${languageInfo?.nativeName}`}
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  {index < translations.length - 1 && <Separator className="mt-6" />}
                </div>
              );
            })}
          </div>
        )}
        
        {translations.length > 0 && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <p><strong>Note:</strong> The default language ({defaultLanguage}) is used as fallback when translations are missing.</p>
              <p>For brands, only the description is translated to Greek.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
