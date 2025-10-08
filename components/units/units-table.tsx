"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Edit, Trash2, Search, Wand2, Globe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UnitTranslation {
  id: string;
  languageCode: string;
  name?: string;
  language?: { code: string; name: string; nativeName: string; flag: string };
}

interface Unit {
  id: string;
  name: string;
  shortcut?: string | null;
  qdecimals?: number | null;
  softoneCode?: string | null;
  translations?: UnitTranslation[];
}

export function UnitsTable() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Unit | null>(null);
  const [form, setForm] = useState<{ name: string; shortcut?: string; qdecimals?: number }>(
    { name: "", shortcut: "", qdecimals: 0 }
  );
  const [languages, setLanguages] = useState<Array<{ code: string; name: string; nativeName: string; flag: string; isActive: boolean; isDefault: boolean }>>([]);
  const [translationsByLang, setTranslationsByLang] = useState<Record<string, string>>({});

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      const res = await fetch(`/api/master-data/units?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setUnits(data.units || []);
    } catch {
      toast.error("Failed to load units");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadUnits(); }, [loadUnits]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/languages', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLanguages((data.languages || []).filter((l: any) => l.isActive));
        }
      } catch {}
    })();
  }, []);

  const onEdit = (u: Unit) => {
    setEditing(u);
    setForm({ name: u.name, shortcut: u.shortcut || "", qdecimals: u.qdecimals ?? 0 });
    const map: Record<string, string> = {};
    (u.translations || []).forEach(t => { if (t.languageCode) map[t.languageCode] = t.name || ""; });
    setTranslationsByLang(map);
    setIsDialogOpen(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete unit?")) return;
    try {
      const res = await fetch(`/api/master-data/units?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Unit deleted");
      loadUnits();
    } catch {
      toast.error("Delete failed");
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const translations = Object.entries(translationsByLang)
        .filter(([code]) => !!code)
        .map(([languageCode, name]) => ({ languageCode, name }));
      const res = await fetch("/api/master-data/units", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing!.id, name: form.name.trim(), shortcut: form.shortcut || undefined, qdecimals: Number(form.qdecimals) || 0, translations }),
      });
      if (!res.ok) throw new Error();
      toast.success("Unit updated");
      setIsDialogOpen(false);
      setEditing(null);
      loadUnits();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <Card>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NAME (DEFAULT)</TableHead>
                  <TableHead>SHORTCUT</TableHead>
                  <TableHead>Q DECIMALS</TableHead>
                  <TableHead>SOFTONE</TableHead>
                  <TableHead>TRANSLATIONS</TableHead>
                  <TableHead>ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">No units found</TableCell>
                  </TableRow>
                ) : (
                  units.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {(() => {
                          const defaultLang = languages.find(l => l.isDefault)?.code || 'el';
                          const defaultFlag = languages.find(l => l.isDefault)?.flag || '🇬🇷';
                          const name = defaultLang === 'el' ? u.name : (u.translations || []).find(t => t.languageCode === defaultLang)?.name || u.name;
                          return (
                            <div className="flex items-center gap-2">
                              <span>{name}</span>
                              <Badge variant="secondary" className="text-xs">{defaultFlag}</Badge>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{u.shortcut || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>{Number.isFinite(u.qdecimals as any) ? u.qdecimals : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>{u.softoneCode ? (<Badge variant="outline">{u.softoneCode}</Badge>) : (<span className="text-muted-foreground">-</span>)}</TableCell>
                      <TableCell>
                        {u.translations && u.translations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.translations.map((t) => (
                              <TooltipProvider key={`${u.id}-${t.languageCode}`}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs">
                                      {t.language?.flag || t.languageCode.toUpperCase()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t.name || "(empty)"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => onEdit(u)}><Edit className="h-4 w-4" /></Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/master-data/units/translate', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ unitId: u.id, sourceLanguage: 'el', targetLanguage: 'en', sourceName: u.name }),
                                });
                                if (!res.ok) throw new Error();
                                const data = await res.json();
                                toast.success('Translated to EN');
                                loadUnits();
                              } catch {
                                toast.error('Translate failed');
                              }
                            }}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => onDelete(u.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{editing ? "EDIT UNIT" : "NEW UNIT"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={onSave} className="space-y-4">
              <div>
                <Label htmlFor="unitName">NAME *</Label>
                <Input id="unitName" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitShortcut">SHORTCUT</Label>
                  <Input id="unitShortcut" value={form.shortcut || ""} onChange={(e) => setForm((p) => ({ ...p, shortcut: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="unitQ">Q DECIMALS</Label>
                  <Input id="unitQ" type="number" min={0} max={6} value={form.qdecimals ?? 0} onChange={(e) => setForm((p) => ({ ...p, qdecimals: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label>TRANSLATIONS</Label>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.code} className="grid grid-cols-5 gap-2 items-center">
                      <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName} ({lang.code.toUpperCase()})</span>
                      </div>
                      <div className="col-span-3">
                        <Input
                          value={lang.code === 'el' ? form.name : (translationsByLang[lang.code] ?? '')}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (lang.code === 'el') setForm((p) => ({ ...p, name: value }));
                            else setTranslationsByLang((prev) => ({ ...prev, [lang.code]: value }));
                          }}
                          placeholder={`Name in ${lang.nativeName}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>CANCEL</Button>
                <Button type="submit">UPDATE</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}


