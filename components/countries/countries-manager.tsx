// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Download, 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  Upload, 
  AlertCircle,
  MapPin,
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

// Country type matching our API response
interface CountryTranslation {
  languageCode: string;
  name: string;
}

interface Country {
  id: string;
  softoneCode: string;
  name: string;
  iso2: string;
  shortcut: string;
  currency: string;
  countryType: string;
  isActive: boolean;
  translations?: CountryTranslation[];
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export function CountriesManager() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  // Load countries from database with translations
  const loadCountries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/countries/list');
      const data = await response.json();

      if (response.ok) {
        setCountries(data.countries || []);
      } else {
        toast.error(data.message || "Failed to load countries");
        setCountries([]);
      }
    } catch (error) {
      console.error("Load countries error:", error);
      toast.error("Error loading countries");
      setCountries([]);
    } finally {
      setLoading(false);
    }
  };

  const syncWithSoftOne = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/countries', {
        method: 'GET',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully connected to SoftOne - ${result.total} countries available`);
        setLastSync(new Date());
        loadCountries(); // Reload the data from SoftOne
      } else {
        toast.error(result.message || "Failed to connect to SoftOne");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Error connecting to SoftOne");
    } finally {
      setSyncing(false);
    }
  };

  const saveToDatabase = async () => {
    setSavingToDb(true);
    try {
      const response = await fetch('/api/countries', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully synced ${result.total} countries to database (${result.created} created, ${result.updated} updated)`);
        setLastSync(new Date());
        // Reload countries to show synced data
        loadCountries();
      } else {
        toast.error(result.message || "Failed to sync countries to database");
      }
    } catch (error) {
      console.error("Save to DB error:", error);
      toast.error("Error saving countries to database");
    } finally {
      setSavingToDb(false);
    }
  };

  const translateCountries = async () => {
    if (!selectedLanguage) {
      toast.error("Please select a target language");
      return;
    }

    setTranslating(true);
    try {
      const response = await fetch('/api/countries/translate', {
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
          toast.warning(`Translated ${result.translated} countries with ${result.failed} failures`);
        } else {
          toast.success(`Successfully translated ${result.translated} countries to ${selectedLanguage}`);
        }
        // Reload countries to show new translations
        loadCountries();
      } else {
        toast.error(result.message || "Failed to translate countries");
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Error translating countries");
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

  // Get country flag emoji from ISO2 code
  const getFlagEmoji = (iso2: string) => {
    if (!iso2 || iso2.length !== 2) return "🏳️";
    const codePoints = iso2
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  // Define columns for countries table - dynamically add language columns
  const getCountryColumns = (): Column<Country>[] => {
    const baseColumns: Column<Country>[] = [
      {
        key: "iso2",
        header: "Flag",
        render: (value) => (
          <span className="text-2xl">{getFlagEmoji(value as string)}</span>
        ),
      },
      {
        key: "softoneCode",
        header: "Code",
        render: (value) => (
          <div className="font-mono text-sm">{value}</div>
        ),
      },
      {
        key: "name",
        header: "Country Name (Greek)",
        render: (value) => (
          <div className="font-medium text-[11px]">{value}</div>
        ),
      },
      {
        key: "iso2",
        header: "ISO2",
        render: (value) => (
          <Badge variant="outline" className="font-mono text-xs">
            {value}
          </Badge>
        ),
      },
      {
        key: "currency",
        header: "Currency",
        render: (value) => (
          <div className="text-sm text-muted-foreground">{value}</div>
        ),
      },
    ];

    // Add a column for each available language
    const languageColumns: Column<Country>[] = availableLanguages.map((lang) => ({
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
    loadCountries();
    loadLanguages();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <div className="text-muted-foreground">Loading countries from SoftOne ERP...</div>
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
              <Globe className="h-5 w-5" />
              COUNTRIES MANAGEMENT
            </CardTitle>
            <CardDescription>
              Sync countries from SoftOne ERP system to your database
            </CardDescription>
          </div>
            
            <div className="flex items-center gap-2">
              {lastSync && (
                <span className="text-sm text-muted-foreground">
                  Last sync: {lastSync.toLocaleString()}
                </span>
              )}
              <Button 
                onClick={syncWithSoftOne} 
                disabled={syncing || savingToDb || translating}
                variant="outline"
                className="flex items-center gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {syncing ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={saveToDatabase} 
                disabled={syncing || savingToDb || translating}
                className="flex items-center gap-2"
              >
                {savingToDb ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {savingToDb ? "Syncing..." : "Sync from SoftOne"}
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
            Translate all country names from Greek to other languages using DeepSeek AI
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
              onClick={translateCountries} 
              disabled={!selectedLanguage || translating || syncing || savingToDb}
              className="flex items-center gap-2"
            >
              {translating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {translating ? "Translating..." : "Translate All Countries"}
            </Button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> This will translate all country names that don't have a translation for the selected language.
              The system uses DeepSeek AI to provide accurate geographic translations from Greek (source language from SoftOne).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Countries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            COUNTRIES DATABASE
          </CardTitle>
          <CardDescription>
            {countries.length} countries with translations - Hover over language flags to see translated names
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={countries}
            columns={getCountryColumns()}
            searchKey="name"
            searchPlaceholder="Search countries..."
          />
        </CardContent>
      </Card>

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            CONNECTION INFORMATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Total Countries: {countries.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Live from SoftOne ERP</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Real-time Data</span>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Field Mapping:</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code>COUNTRY</code> → <code>softoneCode</code> (SoftOne country code)</li>
                <li><code>NAME</code> → <code>name</code> (Country name)</li>
                <li><code>INTERCODE</code> → <code>iso2</code> (ISO 2-letter country code)</li>
                <li><code>SHORTCUT</code> → <code>shortcut</code> (Country shortcut)</li>
                <li><code>SOCURRENCY</code> → <code>currency</code> (Currency code)</li>
                <li><code>ISACTIVE</code> → <code>isActive</code> (Active status)</li>
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
                    1. Click "Sync from SoftOne" to fetch and save countries from SoftOne ERP (Greek names).<br/>
                    2. Use "AI Translation" to automatically translate country names to other languages using DeepSeek AI.
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
