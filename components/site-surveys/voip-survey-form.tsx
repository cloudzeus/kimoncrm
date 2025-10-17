// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, FileText, Upload as UploadIcon, FileDown } from "lucide-react";
import { toast } from "sonner";
import { FileUpload } from "@/components/files/file-upload";
import { FilesList } from "@/components/files/files-list";
import { downloadVoipSurveyExcel } from "@/lib/excel/voip-survey-excel";

const voipSurveySchema = z.object({
  oldPbxModel: z.string().optional(),
  oldPbxDescription: z.string().optional(),
  oldPbxDevices: z.array(z.object({
    type: z.enum(["Αναλογική", "Ψηφιακή", "VOIP"]),
    model: z.string().min(1, "Model is required"),
    number: z.string().min(1, "Number is required"),
    location: z.string().optional(),
  })).optional().default([]),
  providerName: z.string().optional(),
  providerLines: z.array(z.object({
    type: z.enum(["PSTN", "ISDN", "PRI", "SIP"]),
    lines: z.string().min(1, "Lines is required"),
    phoneNumber: z.string().optional(),
  })).optional().default([]),
  internetFeedType: z.string().optional(),
  internetFeedSpeed: z.string().optional(),
  networkDevices: z.array(z.object({
    type: z.enum(["ROUTER", "POE", "SWITCH", "ATA", "FIREWALL", "GATEWAY"]),
    deviceName: z.string().min(1, "Device name is required"),
    deviceIp: z.string().optional(),
  })).optional().default([]),
  cablingStatus: z.string().optional(),
  pbxBrand: z.string().optional(),
  conChannelsNum: z.string().optional(),
  extensionsNum: z.string().optional(),
  hotelPms: z.string().optional(),
});

type VoipSurveyFormValues = z.infer<typeof voipSurveySchema>;

interface VoipSurveyFormProps {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  siteSurveyId: string;
  siteSurveyTitle: string;
}

export function VoipSurveyForm({
  open,
  onClose,
  siteSurveyId,
  siteSurveyTitle,
}: VoipSurveyFormProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("old-pbx");
  const [filesRefreshTrigger, setFilesRefreshTrigger] = useState(0);
  const [voipData, setVoipData] = useState<any>(null);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const form = useForm<VoipSurveyFormValues>({
    resolver: zodResolver(voipSurveySchema),
    defaultValues: {
      oldPbxModel: "",
      oldPbxDescription: "",
      oldPbxDevices: [],
      providerName: "",
      providerLines: [],
      internetFeedType: "",
      internetFeedSpeed: "",
      networkDevices: [],
      cablingStatus: "",
      pbxBrand: "",
      conChannelsNum: "",
      extensionsNum: "",
      hotelPms: "",
    },
  });

  const { fields: pbxDevices, append: appendPbxDevice, remove: removePbxDevice } = useFieldArray({
    control: form.control,
    name: "oldPbxDevices",
  });

  const { fields: providerLines, append: appendProviderLine, remove: removeProviderLine } = useFieldArray({
    control: form.control,
    name: "providerLines",
  });

  const { fields: networkDevices, append: appendNetworkDevice, remove: removeNetworkDevice } = useFieldArray({
    control: form.control,
    name: "networkDevices",
  });

  // Load existing VOIP survey data
  useEffect(() => {
    if (open) {
      fetchVoipSurvey();
    }
  }, [open, siteSurveyId]);

  const fetchVoipSurvey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/voip`);
      
      if (response.ok) {
        const data = await response.json();
        setVoipData(data);
        form.reset({
          oldPbxModel: data.oldPbxModel || "",
          oldPbxDescription: data.oldPbxDescription || "",
          oldPbxDevices: data.oldPbxDevices || [],
          providerName: data.providerName || "",
          providerLines: data.providerLines || [],
          internetFeedType: data.internetFeedType || "",
          internetFeedSpeed: data.internetFeedSpeed || "",
          networkDevices: data.networkDevices || [],
          cablingStatus: data.cablingStatus || "",
          pbxBrand: data.pbxBrand || "",
          conChannelsNum: data.conChannelsNum || "",
          extensionsNum: data.extensionsNum || "",
          hotelPms: data.hotelPms || "",
        });
      } else if (response.status !== 404) {
        toast.error("Failed to load VOIP survey data");
      }
    } catch (error) {
      console.error("Error fetching VOIP survey:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: VoipSurveyFormValues) => {
    try {
      setSaving(true);

      const response = await fetch(`/api/site-surveys/${siteSurveyId}/voip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success("VOIP survey saved successfully and status set to Completed");
        // Refresh data
        await fetchVoipSurvey();
        // Don't close - let user generate PDF or add more data
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save VOIP survey");
      }
    } catch (error) {
      console.error("Error saving VOIP survey:", error);
      toast.error("Failed to save VOIP survey");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateExcel = async () => {
    try {
      setGeneratingExcel(true);
      
      // Fetch latest data
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/voip`);
      
      if (!response.ok) {
        toast.error("Please save the VOIP survey first before generating Excel");
        return;
      }

      const data = await response.json();
      
      // Generate and download Excel
      await downloadVoipSurveyExcel(data);
      toast.success("Excel file generated successfully");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    } finally {
      setGeneratingExcel(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="uppercase">VOIP SURVEY DETAILS</DialogTitle>
            <DialogDescription>Loading...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">VOIP SURVEY DETAILS</DialogTitle>
          <DialogDescription>
            Technical details for VOIP site survey: {siteSurveyTitle}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="old-pbx">OLD PBX</TabsTrigger>
                <TabsTrigger value="provider">PROVIDER</TabsTrigger>
                <TabsTrigger value="internet">INTERNET</TabsTrigger>
                <TabsTrigger value="network">NETWORK</TabsTrigger>
                <TabsTrigger value="future">FUTURE REQUEST</TabsTrigger>
                <TabsTrigger value="files">FILES</TabsTrigger>
              </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Tab 1: Old PBX */}
              <TabsContent value="old-pbx" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="oldPbxModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">OLD PBX MODEL</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Panasonic KX-TDA100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="oldPbxDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">OLD PBX DESCRIPTION</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description of the old PBX system..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase">OLD PBX DEVICES</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendPbxDevice({ type: "VOIP", model: "", number: "", location: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      ADD DEVICE
                    </Button>
                  </div>

                  {pbxDevices.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">DEVICE {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePbxDevice(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`oldPbxDevices.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">TYPE *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Αναλογική">ΑΝΑΛΟΓΙΚΗ</SelectItem>
                                    <SelectItem value="Ψηφιακή">ΨΗΦΙΑΚΗ</SelectItem>
                                    <SelectItem value="VOIP">VOIP</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`oldPbxDevices.${index}.model`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">MODEL *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Device model" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`oldPbxDevices.${index}.number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">NUMBER *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Quantity" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`oldPbxDevices.${index}.location`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">LOCATION</FormLabel>
                                <FormControl>
                                  <Input placeholder="Installation location" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {pbxDevices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No PBX devices added yet. Click "Add Device" to add one.
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="cablingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">CABLING STATUS</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Current cabling status and notes..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab 2: Provider */}
              <TabsContent value="provider" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="providerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">PROVIDER NAME</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., OTE, Vodafone, Wind" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase">PROVIDER LINES</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendProviderLine({ type: "PSTN", lines: "", phoneNumber: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      ADD LINE
                    </Button>
                  </div>

                  {providerLines.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">LINE {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProviderLine(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`providerLines.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">TYPE *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="PSTN">PSTN</SelectItem>
                                    <SelectItem value="ISDN">ISDN</SelectItem>
                                    <SelectItem value="PRI">PRI</SelectItem>
                                    <SelectItem value="SIP">SIP</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`providerLines.${index}.lines`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">LINES *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Number of lines" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`providerLines.${index}.phoneNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">PHONE NUMBER</FormLabel>
                                <FormControl>
                                  <Input placeholder="Phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {providerLines.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No provider lines added yet. Click "Add Line" to add one.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Internet */}
              <TabsContent value="internet" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="internetFeedType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">INTERNET FEED TYPE</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Fiber, ADSL, VDSL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internetFeedSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">INTERNET FEED SPEED</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 100Mbps, 1Gbps" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Tab 4: Network Devices */}
              <TabsContent value="network" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase">NETWORK DEVICES</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendNetworkDevice({ type: "ROUTER", deviceName: "", deviceIp: "" })}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      ADD DEVICE
                    </Button>
                  </div>

                  {networkDevices.map((field, index) => (
                    <Card key={field.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium">DEVICE {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeNetworkDevice(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`networkDevices.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">TYPE *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ROUTER">ROUTER</SelectItem>
                                    <SelectItem value="POE">POE</SelectItem>
                                    <SelectItem value="SWITCH">SWITCH</SelectItem>
                                    <SelectItem value="ATA">ATA</SelectItem>
                                    <SelectItem value="FIREWALL">FIREWALL</SelectItem>
                                    <SelectItem value="GATEWAY">GATEWAY</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`networkDevices.${index}.deviceName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">DEVICE NAME *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Device name/model" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`networkDevices.${index}.deviceIp`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="uppercase">DEVICE IP</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 192.168.1.1" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {networkDevices.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No network devices added yet. Click "Add Device" to add one.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 5: Future Request */}
              <TabsContent value="future" className="space-y-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Future Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pbxBrand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PBX Brand</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter PBX brand" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="conChannelsNum"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Concurrent Channels Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter number of concurrent channels" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="extensionsNum"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Extensions Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter number of extensions" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hotelPms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hotel PMS</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter Hotel PMS system" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 6: Files */}
              <TabsContent value="files" className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-6">
                  <FileUpload
                    entityId={siteSurveyId}
                    entityType="SITESURVEY"
                    onUploadComplete={() => {
                      setFilesRefreshTrigger((prev) => prev + 1);
                      toast.success("Files uploaded successfully");
                    }}
                  />
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-4 uppercase">UPLOADED FILES</h3>
                  <FilesList
                    entityId={siteSurveyId}
                    entityType="SITESURVEY"
                    refreshTrigger={filesRefreshTrigger}
                    onFileDeleted={() => setFilesRefreshTrigger((prev) => prev + 1)}
                  />
                </div>
              </TabsContent>

              {/* Footer with action buttons */}
              {activeTab !== "files" && (
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onClose(true)}
                    disabled={saving || generatingExcel}
                  >
                    CLOSE
                  </Button>
                  {voipData && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGenerateExcel}
                      disabled={saving || generatingExcel}
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      {generatingExcel ? "GENERATING..." : "DOWNLOAD EXCEL"}
                    </Button>
                  )}
                  <Button type="submit" disabled={saving || generatingExcel}>
                    {saving ? "SAVING..." : "SAVE VOIP DETAILS"}
                  </Button>
                </DialogFooter>
              )}

              {activeTab === "files" && (
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    onClick={() => onClose(true)}
                  >
                    DONE
                  </Button>
                </DialogFooter>
              )}
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

