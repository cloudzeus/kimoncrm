"use client";

import { useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Bot } from "lucide-react";

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  phone1: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  accountingEmail: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  logoFileId: z.string().optional().nullable(),
  imageFileIds: z.array(z.string()).optional().nullable(),
  isoCerts: z.array(z.object({
    code: z.string().min(1),
    imageFileId: z.string().optional().nullable(),
    order: z.number().int().min(0).optional(),
    descriptionByLang: z.record(z.string()).optional(),
  })).optional().nullable(),
});

type CompanyDetails = z.infer<typeof schema> & { id?: string };

export default function CompanyDetailsForm({ initialData }: { initialData: CompanyDetails | null }) {
  const router = useRouter();
  const isoInitial = ((((initialData as any)?.isoCerts) ?? []).map((c: any) => ({ code: c.code, imageUrl: c.image?.url, descriptionByLang: Object.fromEntries((c.translations ?? []).map((t: any) => [t.languageCode, t.description ?? ""])) })));
  const [form, setForm] = useState<CompanyDetails>({
    companyName: initialData?.companyName ?? "",
    address: initialData?.address ?? "",
    city: initialData?.city ?? "",
    zip: initialData?.zip ?? "",
    phone1: initialData?.phone1 ?? "",
    phone2: initialData?.phone2 ?? "",
    email: initialData?.email ?? "",
    accountingEmail: initialData?.accountingEmail ?? "",
    website: initialData?.website ?? "",
    logoFileId: undefined,
    imageFileIds: [],
    isoCerts: isoInitial.map((c:any) => ({ code: c.code, descriptionByLang: c.descriptionByLang })),
  });
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>((initialData as any)?.logo?.url ?? null);
  const [imagePreviews, setImagePreviews] = useState<string[]>((((initialData as any)?.images) ?? []).map((i: any) => i.file?.url).filter(Boolean));
  const [isoUi, setIsoUi] = useState<any[]>(isoInitial);
  const [activeLang, setActiveLang] = useState<string>("en");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBefore, setPreviewBefore] = useState<string | null>(null);
  const [previewAfter, setPreviewAfter] = useState<string | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ folder: string; for: 'logo' | 'iso' | 'images'; idx?: number } | null>(null);

  const handleChange = (key: keyof CompanyDetails) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "Invalid data";
      toast.error(first);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/default-company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Saved company details");
      router.refresh();
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>DEFAULT COMPANY DETAILS</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={form.companyName} onChange={handleChange("companyName")} required />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address ?? ""} onChange={handleChange("address")} />
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={form.city ?? ""} onChange={handleChange("city")} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" value={form.zip ?? ""} onChange={handleChange("zip")} />
          </div>

          <div>
            <Label htmlFor="phone1">Phone 1</Label>
            <Input id="phone1" value={form.phone1 ?? ""} onChange={handleChange("phone1")} />
          </div>
          <div>
            <Label htmlFor="phone2">Phone 2</Label>
            <Input id="phone2" value={form.phone2 ?? ""} onChange={handleChange("phone2")} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email ?? ""} onChange={handleChange("email")} />
          </div>
          <div>
            <Label htmlFor="accountingEmail">Accounting Email</Label>
            <Input id="accountingEmail" type="email" value={form.accountingEmail ?? ""} onChange={handleChange("accountingEmail")} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={form.website ?? ""} onChange={handleChange("website")} />
          </div>

          {/* Multilingual Address & City */}
          <div>
            <Label htmlFor="address">Address</Label>
            <div className="flex gap-2">
              <Input id="address" value={form.address ?? ""} onChange={handleChange("address")} />
              <Select value={activeLang} onValueChange={setActiveLang}>
                <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="el">EL</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" onClick={async () => {
                const text = form.address ?? '';
                if (!text) return;
                const res = await fetch('/api/ai/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, sourceLang: activeLang, targetLang: activeLang === 'en' ? 'el' : 'en' }) });
                if (res.ok) {
                  const data = await res.json();
                  setForm((p:any) => ({ ...p, translations: { ...(p.translations||{}), [activeLang === 'en' ? 'el' : 'en']: { ...(p.translations?.[activeLang === 'en' ? 'el' : 'en']||{}), address: data.translation } } }));
                  toast.success('Translated');
                }
              }}>AI</Button>
            </div>
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <div className="flex gap-2">
              <Input id="city" value={form.city ?? ""} onChange={handleChange("city")} />
              <Button type="button" variant="outline" size="sm" onClick={async () => {
                const text = form.city ?? '';
                if (!text) return;
                const res = await fetch('/api/ai/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, sourceLang: activeLang, targetLang: activeLang === 'en' ? 'el' : 'en' }) });
                if (res.ok) {
                  const data = await res.json();
                  setForm((p:any) => ({ ...p, translations: { ...(p.translations||{}), [activeLang === 'en' ? 'el' : 'en']: { ...(p.translations?.[activeLang === 'en' ? 'el' : 'en']||{}), city: data.translation } } }));
                  toast.success('Translated');
                }
              }}>AI</Button>
            </div>
          </div>

          {/* Logo uploader */}
          <div>
            <Label>Company Logo</Label>
            <div className="flex items-center gap-3">
              {logoPreview ? (
                <div className="h-16 w-28 rounded border bg-white p-1 relative overflow-hidden">
                  <Image src={logoPreview} alt="Logo" fill className="object-contain" />
                </div>
              ) : (
                <div className="h-16 w-28 rounded border flex items-center justify-center text-xs text-muted-foreground bg-white">No logo</div>
              )}
              <Button type="button" variant="default" onClick={() => document.getElementById('logoInput')?.click()}>Upload</Button>
              <input id="logoInput" className="hidden" type="file" accept="image/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch('/api/files/preview-bg', { method: 'POST', body: fd });
                if (res.ok) {
                  const data = await res.json();
                  setPreviewBefore(data.original);
                  setPreviewAfter(data.processed);
                  setPreviewOpen(true);
                  setPendingUpload({ folder: 'company/logo', for: 'logo' });
                }
              }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">PNG or SVG recommended. Max 5MB.</p>
          </div>

          {/* Gallery uploader */}
          <div className="md:col-span-2">
            <Label>Company Images</Label>
            <div className="flex flex-wrap gap-3 mb-2">
              {imagePreviews.length === 0 && (
                <div className="text-xs text-muted-foreground">No images uploaded</div>
              )}
              {imagePreviews.map((src, i) => (
                <div key={i} className="h-20 w-20 rounded border bg-white relative overflow-hidden">
                  <Image src={src} alt={`Company image ${i+1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
            <Button type="button" variant="default" onClick={() => document.getElementById('imagesInput')?.click()}>Upload Images</Button>
            <input id="imagesInput" className="hidden" type="file" accept="image/*" multiple onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const file = Array.from(files)[0];
              const fd = new FormData();
              fd.append('file', file);
              const res = await fetch('/api/files/preview-bg', { method: 'POST', body: fd });
              if (res.ok) {
                const data = await res.json();
                setPreviewBefore(data.original);
                setPreviewAfter(data.processed);
                setPreviewOpen(true);
                setPendingUpload({ folder: 'company/images', for: 'images' });
              }
            }} />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WEBP. You can upload multiple images.</p>
          </div>

          {/* ISO Certifications */}
          <div className="md:col-span-2">
            <Label>ISO Certifications</Label>
            <div className="space-y-3">
              {(form.isoCerts ?? []).map((cert, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                  <Input
                    placeholder="ISO Code (e.g., ISO 9001)"
                    value={cert.code}
                    onChange={(e) => {
                      const next = [...(form.isoCerts ?? [])];
                      next[idx] = { ...next[idx], code: e.target.value };
                      setForm((p) => ({ ...p, isoCerts: next }));
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="default" size="sm" onClick={() => document.getElementById(`isoInput-${idx}`)?.click()}>Upload</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(`isoInput-${idx}`)?.click()} title="Remove background and preview">BG</Button>
                    <input id={`isoInput-${idx}`} className="hidden" type="file" accept="image/*" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const fd = new FormData();
                      fd.append('file', file);
                      const res = await fetch('/api/files/preview-bg', { method: 'POST', body: fd });
                      if (res.ok) {
                        const data = await res.json();
                        setPreviewBefore(data.original);
                        setPreviewAfter(data.processed);
                        setPreviewOpen(true);
                        setPendingUpload({ folder: 'company/iso', for: 'iso', idx });
                      }
                    }} />
                  </div>
                  <div className="h-12 w-12 border rounded bg-white relative overflow-hidden">
                    {isoUi[idx]?.imageUrl ? (
                      <Image src={isoUi[idx].imageUrl} alt={`ISO ${cert.code}`} fill className="object-contain" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>
                  <Select value={activeLang} onValueChange={setActiveLang}>
                    <SelectTrigger className="w-[95px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">EN</SelectItem>
                      <SelectItem value="el">EL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder={"Description (multi-language JSON, e.g., {en:'...', el:'...'})"}
                    className="md:col-span-2"
                    value={String(cert.descriptionByLang?.[activeLang] ?? "")}
                    onChange={(e) => {
                      const next = [...(form.isoCerts ?? [])];
                      const current = next[idx] || {} as any;
                      const map = { ...(current.descriptionByLang || {}) } as Record<string,string>;
                      map[activeLang] = e.target.value;
                      next[idx] = { ...current, descriptionByLang: map };
                      setForm((p) => ({ ...p, isoCerts: next }));
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={async () => {
                    try {
                      const desc = (form.isoCerts?.[idx]?.descriptionByLang?.[activeLang] ?? '').trim();
                      if (!desc) return;
                      const res = await fetch('/api/translations/ai', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          translationKeyIds: [],
                          sourceLang: activeLang === 'en' ? 'en' : 'el',
                          targetLang: activeLang === 'en' ? 'el' : 'en',
                          batchName: undefined,
                        }),
                      });
                      // This is a placeholder; ideally we should call a dedicated AI endpoint
                    } catch {}
                  }}>
                    <Bot className="h-4 w-4 mr-1" /> AI
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm((p) => ({ ...p, isoCerts: [ ...(p.isoCerts ?? []), { code: "" } as any ] }))}
              >
                Add ISO Certification
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Preview Modal */}
    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Background removal preview</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs mb-1 text-muted-foreground">Before</div>
            {previewBefore && (
              <div className="w-full h-48 bg-white border rounded relative overflow-hidden">
                <Image src={previewBefore} alt="Before" fill className="object-contain" />
              </div>
            )}
          </div>
          <div>
            <div className="text-xs mb-1 text-muted-foreground">After</div>
            {previewAfter && (
              <div className="w-full h-48 bg-white border rounded relative overflow-hidden">
                <Image src={previewAfter} alt="After" fill className="object-contain" />
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <Button variant="default" onClick={async () => {
            if (!pendingUpload || !previewAfter) { setPreviewOpen(false); return; }
            // Convert data URL to Blob
            const resData = await fetch(previewAfter);
            const blob = await resData.blob();
            const fd = new FormData();
            fd.append('file', new File([blob], 'processed.webp', { type: 'image/webp' }));
            fd.append('folder', pendingUpload.folder);
            const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
            if (res.ok) {
              const data = await res.json();
              if (pendingUpload.for === 'logo') {
                setForm((prev) => ({ ...prev, logoFileId: data.id }));
                setLogoPreview(data.url);
              } else if (pendingUpload.for === 'images') {
                setForm((prev) => ({ ...prev, imageFileIds: [ ...(prev.imageFileIds ?? []), data.id ] }));
                setImagePreviews((p) => [ ...p, data.url ]);
              } else if (pendingUpload.for === 'iso') {
                const idx = pendingUpload.idx!;
                const next = [...(form.isoCerts ?? [])];
                next[idx] = { ...next[idx], imageFileId: data.id };
                setForm((p) => ({ ...p, isoCerts: next }));
                setIsoUi((u) => { const copy = [...u]; copy[idx] = { ...(copy[idx]||{}), imageUrl: data.url }; return copy; });
              }
              toast.success('Image saved');
            } else {
              toast.error('Save failed');
            }
            setPreviewOpen(false);
            setPendingUpload(null);
          }}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}


