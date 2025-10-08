"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, Wand2 } from "lucide-react";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface CategoryTranslation {
  languageCode: string;
  name?: string;
  description?: string;
}

export function CategoryTranslationForm({
  translations,
  onTranslationsChange,
  sourceLanguage = "el",
  sourceName = "",
}: {
  translations: CategoryTranslation[];
  onTranslationsChange: (t: CategoryTranslation[]) => void;
  sourceLanguage?: string;
  sourceName?: string;
}) {
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiTranslating, setAiTranslating] = useState<string | null>(null);
  const [bulkTranslating, setBulkTranslating] = useState(false);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch("/api/languages", { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setAvailableLanguages(data.languages || []);
        }
      } catch (_e) {
        toast.error("Failed to load languages");
      } finally {
        setLoading(false);
      }
    };
    loadLanguages();
  }, []);

  const addLanguage = (code: string) => {
    if (translations.find(t => t.languageCode === code)) {
      toast.error("Translation already exists");
      return;
    }
    onTranslationsChange([...translations, { languageCode: code, name: "" }]);
  };

  const removeLanguage = (code: string) => {
    onTranslationsChange(translations.filter(t => t.languageCode !== code));
  };

  const updateName = (code: string, name: string) => {
    onTranslationsChange(
      translations.map(t => t.languageCode === code ? { ...t, name } : t)
    );
  };

  const langMap = useMemo(() => {
    const m = new Map<string, Language>();
    for (const l of availableLanguages) m.set(l.code, l);
    return m;
  }, [availableLanguages]);

  const translateOne = async (target: string) => {
    if (!sourceName.trim()) {
      toast.error("Source name is required");
      return;
    }
    setAiTranslating(target);
    try {
      const response = await fetch("/api/master-data/categories/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceLanguage, targetLanguage: target, sourceName }),
      });
      if (!response.ok) throw new Error("AI translate failed");
      const data = await response.json();
      updateName(target, data.name || "");
      toast.success(`Translated to ${target.toUpperCase()}`);
    } catch (_e) {
      toast.error("AI translation failed");
    } finally {
      setAiTranslating(null);
    }
  };

  const translateAllMissing = async () => {
    if (!sourceName.trim()) {
      toast.error("Source name is required");
      return;
    }
    setBulkTranslating(true);
    try {
      const targets = availableLanguages
        .map(l => l.code)
        .filter(code => code !== sourceLanguage);
      for (const code of targets) {
        const existing = translations.find(t => t.languageCode === code);
        if (existing?.name && existing.name.trim()) continue;
        await translateOne(code);
      }
    } finally {
      setBulkTranslating(false);
    }
  };

  const addable = availableLanguages.filter(l => !translations.find(t => t.languageCode === l.code));

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Translations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>Loading languages...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Translations</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {addable.map(l => (
              <Button key={l.code} variant="outline" size="sm" onClick={() => addLanguage(l.code)} className="text-xs">
                {l.flag} {l.nativeName}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={translateAllMissing} disabled={bulkTranslating}>
              <Wand2 className="h-3 w-3 mr-1" /> {bulkTranslating ? 'Translating…' : 'AI Translate All'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {translations.length === 0 ? (
          <div className="text-sm text-muted-foreground">No translations added.</div>
        ) : (
          translations.map((t, idx) => {
            const info = langMap.get(t.languageCode);
            const isSource = t.languageCode === sourceLanguage;
            return (
              <div key={t.languageCode}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info?.flag}</span>
                    <span className="font-medium">{info?.nativeName}</span>
                    {isSource && <Badge variant="secondary" className="text-xs">SOURCE</Badge>}
                  </div>
                  {!isSource && (
                    <Button variant="outline" size="sm" onClick={() => translateOne(t.languageCode)} disabled={aiTranslating === t.languageCode}>
                      <Wand2 className="h-3 w-3 mr-1" /> {aiTranslating === t.languageCode ? 'Translating…' : 'AI Translate'}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor={`name-${t.languageCode}`}>Name</Label>
                    <Input id={`name-${t.languageCode}`} value={t.name || ""} onChange={(e) => updateName(t.languageCode, e.target.value)} />
                  </div>
                </div>
                {idx < translations.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}


