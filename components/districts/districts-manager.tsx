"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  Languages,
  Wand2
} from 'lucide-react';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// District type matching our API response
interface DistrictTranslation {
  languageCode: string;
  name: string;
}

interface District {
  id: string;
  code: string;
  countrySoftone: string;
  name: string;
  country?: {
    name: string;
    softoneCode: string;
  };
  translations?: DistrictTranslation[];
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export function DistrictsManager() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  // Load districts from database with translations
  const loadDistricts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/districts/list');
      const data = await response.json();

      if (response.ok) {
        setDistricts(data.districts || []);
      } else {
        toast.error(data.message || "Failed to load districts");
        setDistricts([]);
      }
    } catch (error) {
      console.error("Load districts error:", error);
      toast.error("Error loading districts");
      setDistricts([]);
    } finally {
      setLoading(false);
    }
  };

  const syncFromSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/districts', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        const message = result.skipped > 0 
          ? `Synced ${result.total} districts (${result.created} created, ${result.updated} updated, ${result.skipped} skipped)`
          : `Successfully synced ${result.total} districts (${result.created} created, ${result.updated} updated)`;
        toast.success(message);
        setLastSync(new Date());
        // Reload districts to show synced data
        loadDistricts();
      } else {
        toast.error(result.message || "Failed to sync districts");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Error syncing districts from SoftOne");
    } finally {
      setSyncing(false);
    }
  };

  const translateDistricts = async () => {
    if (!selectedLanguage) {
      toast.error("Please select a target language");
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch('/api/districts/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetLanguage: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (result.failed > 0) {
          toast.warning(`Translated ${result.translated} districts with ${result.failed} failures`);
        } else {
          toast.success(`Successfully translated ${result.translated} districts to ${selectedLanguage}`);
        }
        // Reload districts to show new translations
        loadDistricts();
      } else {
        toast.error(result.message || "Failed to translate districts");
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Error translating districts");
    } finally {
      setTranslating(false);
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch("/api/languages");
      if (response.ok) {
        const data = await response.json();
        // Get all languages for table columns (including Greek for display)
        const allLangs = data.languages;
        
        // Filter out Greek for translation selection
        const translatableLangs = allLangs.filter((l: Language) => l.code !== 'el');
        
        setAvailableLanguages(allLangs); // All languages for table columns
        
        // Auto-select English if available for translation
        const english = translatableLangs.find((l: Language) => l.code === 'en');
        if (english) {
          setSelectedLanguage('en');
        }
      }
    } catch (error) {
      console.error("Failed to load languages:", error);
    }
  };

  // Define columns for districts table - dynamically add language columns
  const getDistrictColumns = (): Column<District>[] => {
    const baseColumns: Column<District>[] = [
      {
        key: "code",
        header: "Code",
        render: (value) => (
          <div className="font-mono text-sm">{value}</div>
        ),
      },
      {
        key: "name",
        header: "District Name (Greek)",
        render: (value) => (
          <div className="font-medium text-[11px]">{value}</div>
        ),
      },
      {
        key: "country",
        header: "Country",
        render: (value, row) => (
          <div className="text-sm text-muted-foreground">
            {row.country?.name || row.countrySoftone}
          </div>
        ),
      },
    ];

    // Add a column for each available language
    const languageColumns: Column<District>[] = availableLanguages.map((lang) => ({
      key: `translation_${lang.code}`,
      header: `${lang.flag}`,
      render: (value, row) => {
        const translation = row.translations?.find(t => t.languageCode === lang.code);
        
        if (!translation) {
          return (
            <div className="text-center text-muted-foreground">
              <span className="text-xs">-</span>
            </div>
          );
        }

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center cursor-help">
                  <span className="text-2xl">{lang.flag}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">{lang.nativeName}</p>
                  <p className="text-sm">{translation.name}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    }));

    return [...baseColumns, ...languageColumns];
  };

  useEffect(() => {
    loadDistricts();
    loadLanguages();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading districts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with sync button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              DISTRICTS MANAGEMENT
            </CardTitle>
            <CardDescription>
              Sync districts from SoftOne ERP system to your database
            </CardDescription>
          </div>
            
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {lastSync.toLocaleString()}
                </span>
              )}
              <Button 
                onClick={syncFromSoftOne} 
                disabled={syncing || translating}
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {syncing ? "Syncing..." : "Sync from SoftOne"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Translation Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            AI TRANSLATION
          </CardTitle>
          <CardDescription>
            Translate all district names from Greek to other languages using DeepSeek AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.filter((l) => l.code !== 'el').map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName} ({lang.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={translateDistricts} 
              disabled={!selectedLanguage || translating || syncing}
              className="flex items-center gap-2"
            >
              {translating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {translating ? "Translating..." : "Translate All Districts"}
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> This will translate all district names that don't have a translation for the selected language.
              The system uses DeepSeek AI to provide accurate geographic translations from Greek (source language from SoftOne).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Districts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            DISTRICTS DATABASE
          </CardTitle>
          <CardDescription>
            {districts.length} districts with translations - Hover over language flags to see translated names
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={districts}
            columns={getDistrictColumns()}
            searchKey="name"
            searchPlaceholder="Search districts..."
          />
        </CardContent>
      </Card>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            SYNC INFORMATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total Districts: {districts.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm">From SoftOne ERP</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Synced to Database</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Field Mapping:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>CODE</code> → <code>code</code> (Unique district code)</li>
                <li><code>NAME</code> → <code>name</code> (District name in Greek)</li>
                <li><code>COUNTRY</code> → <code>countrySoftone</code> (Relation to Country)</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    SoftOne ERP Sync & Translation
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    1. Make sure countries are synced first.<br/>
                    2. Click "Sync from SoftOne" to fetch and save districts from SoftOne ERP (Greek names).<br/>
                    3. Use "AI Translation" to automatically translate district names to other languages using DeepSeek AI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

