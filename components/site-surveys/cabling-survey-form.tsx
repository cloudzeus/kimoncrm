// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  Building2, 
  Layers, 
  Grid3x3, 
  Server, 
  Cable, 
  TestTube, 
  Image as ImageIcon,
  Loader2,
  Upload
} from "lucide-react";
import { FileUpload } from "@/components/files/file-upload";

// Validation schema
const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  code: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

const floorSchema = z.object({
  name: z.string().min(1, "Floor name is required"),
  level: z.number().optional(),
  notes: z.string().optional(),
});

const spaceSchema = z.object({
  name: z.string().min(1, "Space name is required"),
  number: z.string().optional(),
  type: z.enum(["ROOM", "CLOSET", "CORRIDOR", "LOBBY", "OUTDOOR", "OTHER"]),
  notes: z.string().optional(),
});

const rackSchema = z.object({
  name: z.string().min(1, "Rack name is required"),
  code: z.string().optional(),
  units: z.number().optional(),
  notes: z.string().optional(),
});

const deviceSchema = z.object({
  type: z.enum([
    "RACK_EQUIPMENT",
    "SWITCH",
    "PATCH_PANEL",
    "ODF",
    "MEDIA_CONVERTER",
    "SERVER",
    "UPS",
    "CAMERA",
    "ACCESS_POINT",
    "PBX",
    "OTHER",
  ]),
  vendor: z.string().optional(),
  model: z.string().optional(),
  label: z.string().optional(),
  serial: z.string().optional(),
  mgmtIp: z.string().optional(),
  notes: z.string().optional(),
});

const outletSchema = z.object({
  label: z.string().min(1, "Outlet label is required"),
  ports: z.number().min(1, "Number of ports is required"),
  notes: z.string().optional(),
});

const pathwaySchema = z.object({
  type: z.enum([
    "CONDUIT",
    "TRAY",
    "DUCT",
    "RISER",
    "SHAFT",
    "UNDERFLOOR",
    "OTHER",
  ]),
  description: z.string().optional(),
  notes: z.string().optional(),
});

const cableRunSchema = z.object({
  code: z.string().optional(),
  media: z.enum(["COPPER", "FIBER"]),
  copperCat: z.enum(["CAT5E", "CAT6", "CAT6A", "CAT7", "OTHER"]).optional(),
  pairCount: z.number().optional(),
  fiberType: z.enum(["OS2", "OM3", "OM4", "OM5", "OTHER"]).optional(),
  strandCount: z.number().optional(),
  lengthMeters: z.number().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const testRecordSchema = z.object({
  standard: z.enum(["TIA568", "ISO11801", "OTDR", "FLUKE_DSX", "OTHER"]),
  result: z.enum(["PASS", "FAIL", "MARGINAL"]),
  attachmentUrl: z.string().optional(),
  notes: z.string().optional(),
});

const cablingSurveyFormSchema = z.object({
  generalNotes: z.string().optional(),
  projectScope: z.string().optional(),
  standards: z.array(z.string()).optional().default([]),
  buildings: z.array(buildingSchema).optional().default([]),
  pathways: z.array(pathwaySchema).optional().default([]),
  cableRuns: z.array(cableRunSchema).optional().default([]),
  testRecords: z.array(testRecordSchema).optional().default([]),
});

type CablingSurveyFormValues = z.infer<typeof cablingSurveyFormSchema>;

interface CablingSurveyFormProps {
  siteSurveyId: string;
  onSuccess?: () => void;
}

export function CablingSurveyForm({
  siteSurveyId,
  onSuccess,
}: CablingSurveyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});

  const form = useForm<CablingSurveyFormValues>({
    resolver: zodResolver(cablingSurveyFormSchema),
    defaultValues: {
      generalNotes: "",
      projectScope: "",
      standards: [],
      buildings: [],
      pathways: [],
      cableRuns: [],
      testRecords: [],
    },
  });

  const {
    fields: buildingFields,
    append: appendBuilding,
    remove: removeBuilding,
  } = useFieldArray({
    control: form.control,
    name: "buildings",
  });

  const {
    fields: pathwayFields,
    append: appendPathway,
    remove: removePathway,
  } = useFieldArray({
    control: form.control,
    name: "pathways",
  });

  const {
    fields: cableRunFields,
    append: appendCableRun,
    remove: removeCableRun,
  } = useFieldArray({
    control: form.control,
    name: "cableRuns",
  });

  const {
    fields: testRecordFields,
    append: appendTestRecord,
    remove: removeTestRecord,
  } = useFieldArray({
    control: form.control,
    name: "testRecords",
  });

  // Fetch existing data
  useEffect(() => {
    async function fetchCablingSurvey() {
      try {
        const response = await fetch(
          `/api/site-surveys/${siteSurveyId}/cabling`
        );
        if (response.ok) {
          const data = await response.json();
          if (data) {
            form.reset({
              generalNotes: data.generalNotes || "",
              projectScope: data.projectScope || "",
              standards: data.standards || [],
              buildings: [],
              pathways: [],
              cableRuns: [],
              testRecords: [],
            });
          }
        }
      } catch (error) {
        console.error("Error fetching cabling survey:", error);
      } finally {
        setFetchingData(false);
      }
    }

    fetchCablingSurvey();
  }, [siteSurveyId, form]);

  async function onSubmit(values: CablingSurveyFormValues) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/site-surveys/${siteSurveyId}/cabling`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save cabling survey");
      }

      toast.success("Cabling survey saved successfully");
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save cabling survey");
      console.error("Error saving cabling survey:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (
    file: File,
    entityType: string,
    entityId?: string
  ) => {
    const uploadKey = `${entityType}-${entityId || 'general'}`;
    setUploadingFiles(prev => ({ ...prev, [uploadKey]: true }));
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", "SITESURVEY");
      formData.append("entityId", siteSurveyId);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      toast.success(`File uploaded successfully`);
      return data.url;
    } catch (error) {
      toast.error("Failed to upload file");
      console.error("Upload error:", error);
      return null;
    } finally {
      setUploadingFiles(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="buildings">BUILDINGS</TabsTrigger>
            <TabsTrigger value="pathways">PATHWAYS</TabsTrigger>
            <TabsTrigger value="cables">CABLE RUNS</TabsTrigger>
            <TabsTrigger value="tests">TESTS</TabsTrigger>
            <TabsTrigger value="images">IMAGES</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PROJECT OVERVIEW</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PROJECT SCOPE</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the project scope..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="generalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GENERAL NOTES</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any general notes..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>BUILDINGS & INFRASTRUCTURE</CardTitle>
                <Button
                  type="button"
                  onClick={() =>
                    appendBuilding({
                      name: "",
                      code: "",
                      address: "",
                      notes: "",
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ADD BUILDING
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {buildingFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No buildings added yet</p>
                    <p className="text-sm">
                      Click &quot;Add Building&quot; to get started
                    </p>
                  </div>
                ) : (
                  buildingFields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeBuilding(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`buildings.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>BUILDING NAME *</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Main Building" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`buildings.${index}.code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>BUILDING CODE</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., B1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`buildings.${index}.address`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ADDRESS</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Building address"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`buildings.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NOTES</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes..."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pathways Tab */}
          <TabsContent value="pathways" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>CABLE PATHWAYS</CardTitle>
                <Button
                  type="button"
                  onClick={() =>
                    appendPathway({
                      type: "CONDUIT",
                      description: "",
                      notes: "",
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ADD PATHWAY
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pathwayFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No pathways added yet</p>
                    <p className="text-sm">
                      Click &quot;Add Pathway&quot; to get started
                    </p>
                  </div>
                ) : (
                  pathwayFields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removePathway(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="pt-6 space-y-4">
                        <FormField
                          control={form.control}
                          name={`pathways.${index}.type`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PATHWAY TYPE *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select pathway type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="CONDUIT">CONDUIT</SelectItem>
                                  <SelectItem value="TRAY">TRAY</SelectItem>
                                  <SelectItem value="DUCT">DUCT</SelectItem>
                                  <SelectItem value="RISER">RISER</SelectItem>
                                  <SelectItem value="SHAFT">SHAFT</SelectItem>
                                  <SelectItem value="UNDERFLOOR">
                                    UNDERFLOOR
                                  </SelectItem>
                                  <SelectItem value="OTHER">OTHER</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`pathways.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>DESCRIPTION</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Pathway description..."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`pathways.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NOTES</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes..."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cable Runs Tab */}
          <TabsContent value="cables" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>CABLE RUNS</CardTitle>
                <Button
                  type="button"
                  onClick={() =>
                    appendCableRun({
                      code: "",
                      media: "COPPER",
                      purpose: "",
                      notes: "",
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ADD CABLE RUN
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cableRunFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cable className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No cable runs added yet</p>
                    <p className="text-sm">
                      Click &quot;Add Cable Run&quot; to get started
                    </p>
                  </div>
                ) : (
                  cableRunFields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeCableRun(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`cableRuns.${index}.code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CABLE CODE</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., C-001" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`cableRuns.${index}.media`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MEDIA TYPE *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="COPPER">COPPER</SelectItem>
                                    <SelectItem value="FIBER">FIBER</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`cableRuns.${index}.lengthMeters`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LENGTH (m)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseFloat(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch(`cableRuns.${index}.media`) === "COPPER" && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`cableRuns.${index}.copperCat`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>COPPER CATEGORY</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="CAT5E">CAT5E</SelectItem>
                                      <SelectItem value="CAT6">CAT6</SelectItem>
                                      <SelectItem value="CAT6A">CAT6A</SelectItem>
                                      <SelectItem value="CAT7">CAT7</SelectItem>
                                      <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`cableRuns.${index}.pairCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>PAIR COUNT</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="4"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        {form.watch(`cableRuns.${index}.media`) === "FIBER" && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`cableRuns.${index}.fiberType`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>FIBER TYPE</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select fiber type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="OS2">
                                        OS2 (Single-mode)
                                      </SelectItem>
                                      <SelectItem value="OM3">
                                        OM3 (Multi-mode)
                                      </SelectItem>
                                      <SelectItem value="OM4">
                                        OM4 (Multi-mode)
                                      </SelectItem>
                                      <SelectItem value="OM5">
                                        OM5 (Multi-mode)
                                      </SelectItem>
                                      <SelectItem value="OTHER">OTHER</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`cableRuns.${index}.strandCount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>STRAND COUNT</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      placeholder="12"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(parseInt(e.target.value))
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name={`cableRuns.${index}.purpose`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PURPOSE</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Room 214 to Patch Panel 2"
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`cableRuns.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NOTES</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes..."
                                  {...field}
                                  rows={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tests Tab */}
          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>TEST RECORDS</CardTitle>
                <Button
                  type="button"
                  onClick={() =>
                    appendTestRecord({
                      standard: "TIA568",
                      result: "PASS",
                      notes: "",
                    })
                  }
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  ADD TEST
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {testRecordFields.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TestTube className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No test records added yet</p>
                    <p className="text-sm">
                      Click &quot;Add Test&quot; to get started
                    </p>
                  </div>
                ) : (
                  testRecordFields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeTestRecord(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`testRecords.${index}.standard`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>TEST STANDARD *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="TIA568">TIA568</SelectItem>
                                    <SelectItem value="ISO11801">
                                      ISO11801
                                    </SelectItem>
                                    <SelectItem value="OTDR">OTDR</SelectItem>
                                    <SelectItem value="FLUKE_DSX">
                                      FLUKE DSX
                                    </SelectItem>
                                    <SelectItem value="OTHER">OTHER</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`testRecords.${index}.result`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RESULT *</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="PASS">PASS</SelectItem>
                                    <SelectItem value="FAIL">FAIL</SelectItem>
                                    <SelectItem value="MARGINAL">
                                      MARGINAL
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`testRecords.${index}.attachmentUrl`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>TEST REPORT (OPTIONAL)</FormLabel>
                              <FormControl>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Attachment URL"
                                    {...field}
                                    readOnly
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={uploadingFiles[`test-${index}`]}
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingFiles[`test-${index}`] ? "UPLOADING..." : "UPLOAD"}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`testRecords.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>NOTES</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Test notes..."
                                  {...field}
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>PHOTOS & BLUEPRINTS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <FileUpload
                    entityType="SITESURVEY"
                    entityId={siteSurveyId}
                    accept="image/*,.pdf"
                    multiple
                    onUploadComplete={(files) => {
                      toast.success(`${files.length} file(s) uploaded successfully`);
                      router.refresh();
                    }}
                  />
                  <div className="text-sm text-muted-foreground">
                    Upload photos, blueprints, scans, or markup images related to this cabling survey.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            CANCEL
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                SAVING...
              </>
            ) : (
              "SAVE CABLING SURVEY"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

