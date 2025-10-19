"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Building2, Plus, Trash2, Edit, Upload, FileImage, Download, FileText } from "lucide-react";
import { EquipmentItem, SelectedElement, getElementDisplayName } from "@/types/equipment-selection";
import { EquipmentSelection } from "../equipment-selection";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FutureProposalsStepProps {
  futureBuildings: any[];
  futureEquipment: EquipmentItem[];
  onUpdate: (futureBuildings: any[], futureEquipment: EquipmentItem[]) => void;
  siteSurveyId: string;
  siteSurveyData?: any;
}

export function FutureProposalsStep({
  futureBuildings,
  futureEquipment,
  onUpdate,
  siteSurveyId,
  siteSurveyData,
}: FutureProposalsStepProps) {
  const [localFutureBuildings, setLocalFutureBuildings] = useState<any[]>(futureBuildings);
  const [localFutureEquipment, setLocalFutureEquipment] = useState<EquipmentItem[]>(futureEquipment);
  const [equipmentSelectionOpen, setEquipmentSelectionOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [activeTab, setActiveTab] = useState("buildings");
  const [generatingWord, setGeneratingWord] = useState(false);
  const [downloadingBOM, setDownloadingBOM] = useState(false);

  // Sync props with local state and deduplicate by ID
  useEffect(() => {
    // Deduplicate equipment items by ID (keep the first occurrence)
    const seenIds = new Set<string>();
    const deduplicated = futureEquipment.filter(item => {
      if (seenIds.has(item.id)) {
        console.warn(`Duplicate future equipment ID found: ${item.id}`);
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    setLocalFutureEquipment(deduplicated);
    setLocalFutureBuildings(futureBuildings);
  }, [futureBuildings, futureEquipment]);

  const updateData = (newBuildings: any[], newEquipment: EquipmentItem[]) => {
    // Deduplicate equipment before updating
    const seenIds = new Set<string>();
    const deduplicated = newEquipment.filter(item => {
      if (seenIds.has(item.id)) {
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    
    setLocalFutureBuildings(newBuildings);
    setLocalFutureEquipment(deduplicated);
    onUpdate(newBuildings, deduplicated);
  };

  const handleAddEquipment = () => {
    setSelectedElement(null);
    setEquipmentSelectionOpen(true);
  };

  const handleEquipmentSave = (newItems: EquipmentItem[]) => {
    const updatedEquipment = [...localFutureEquipment, ...newItems];
    updateData(localFutureBuildings, updatedEquipment);
    setEquipmentSelectionOpen(false);
    toast.success(`Added ${newItems.length} item(s) to future proposals`);
  };

  const removeEquipment = (id: string) => {
    if (confirm("Are you sure you want to remove this equipment from future proposals?")) {
      const updatedEquipment = localFutureEquipment.filter(item => item.id !== id);
      updateData(localFutureBuildings, updatedEquipment);
      toast.success("Equipment removed from future proposals");
    }
  };

  const addBuilding = () => {
    const newBuilding = {
      id: `building-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Future Building ${localFutureBuildings.length + 1}`,
      code: "",
      address: "",
      notes: "",
      floors: [],
      centralRacks: [],
      blueprints: [],
    };
    const updatedBuildings = [...localFutureBuildings, newBuilding];
    updateData(updatedBuildings, localFutureEquipment);
    toast.success("Future building added");
  };

  const removeBuilding = (id: string) => {
    if (confirm("Are you sure you want to remove this future building?")) {
      const updatedBuildings = localFutureBuildings.filter(building => building.id !== id);
      updateData(updatedBuildings, localFutureEquipment);
      toast.success("Future building removed");
    }
  };

  const updateBuilding = (id: string, field: string, value: any) => {
    const updatedBuildings = localFutureBuildings.map(building => 
      building.id === id ? { ...building, [field]: value } : building
    );
    updateData(updatedBuildings, localFutureEquipment);
  };

  const addFloor = (buildingId: string) => {
    const building = localFutureBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const newFloor = {
      id: `floor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Floor ${(building.floors?.length || 0) + 1}`,
      level: building.floors?.length || 0,
      notes: "",
      rooms: [],
      floorRacks: [],
      blueprints: [],
    };

    const updatedBuildings = localFutureBuildings.map(b => 
      b.id === buildingId 
        ? { ...b, floors: [...(b.floors || []), newFloor] }
        : b
    );
    updateData(updatedBuildings, localFutureEquipment);
    toast.success("Floor added to future building");
  };

  const addRoom = (buildingId: string, floorId: string) => {
    const building = localFutureBuildings.find(b => b.id === buildingId);
    if (!building) return;

    const floor = building.floors?.find((f: any) => f.id === floorId);
    if (!floor) return;

    const newRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Room ${(floor.rooms?.length || 0) + 1}`,
      type: "OTHER",
      notes: "",
      devices: [],
    };

    const updatedBuildings = localFutureBuildings.map(b => 
      b.id === buildingId 
        ? {
            ...b,
            floors: b.floors?.map((f: any) => 
              f.id === floorId 
                ? { ...f, rooms: [...(f.rooms || []), newRoom] }
                : f
            )
          }
        : b
    );
    updateData(updatedBuildings, localFutureEquipment);
    toast.success("Room added to future floor");
  };

  const products = localFutureEquipment.filter(item => item.type === 'product');
  const services = localFutureEquipment.filter(item => item.type === 'service');

  const totalValue = localFutureEquipment.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQuantity = localFutureEquipment.reduce((sum, item) => sum + item.quantity, 0);

  const generateWordDocument = async () => {
    try {
      setGeneratingWord(true);
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-word`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          equipment: localFutureEquipment,
          buildings: localFutureBuildings,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate Word document");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Future-Proposals-${siteSurveyData?.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'Site-Survey'}-${siteSurveyId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Word document generated successfully!");
    } catch (error) {
      console.error("Error generating Word document:", error);
      toast.error("Failed to generate Word document");
    } finally {
      setGeneratingWord(false);
    }
  };

  const downloadBOM = async () => {
    if (!siteSurveyData) return;
    
    try {
      setDownloadingBOM(true);

      // Prepare site survey data
      const siteSurveyDataForBOM = {
        title: siteSurveyData.title,
        description: siteSurveyData.description,
        customer: siteSurveyData.customer ? {
          name: siteSurveyData.customer.name,
          email: siteSurveyData.customer.email || undefined,
          phone: siteSurveyData.customer.phone01 || undefined,
        } : undefined,
        contact: siteSurveyData.contact ? {
          name: siteSurveyData.contact.name,
          email: siteSurveyData.contact.email || undefined,
          phone: siteSurveyData.contact.mobilePhone || siteSurveyData.contact.workPhone || undefined,
        } : undefined,
        assignTo: siteSurveyData.assignTo ? {
          name: siteSurveyData.assignTo.name,
          email: siteSurveyData.assignTo.email || undefined,
        } : undefined,
        createdAt: siteSurveyData.createdAt,
        updatedAt: siteSurveyData.updatedAt,
        files: [],
      };

      // Generate BOM Excel using future proposals data
      const bomResponse = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment: localFutureEquipment,
          buildings: localFutureBuildings,
          siteSurveyData: siteSurveyDataForBOM,
        }),
      });

      if (!bomResponse.ok) {
        throw new Error("Failed to generate BOM Excel");
      }
      
      const blob = await bomResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Future-Proposals-BOM-${siteSurveyData.title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Future Proposals BOM Excel downloaded successfully!");
    } catch (error) {
      console.error("Error downloading BOM:", error);
      toast.error("Failed to download BOM Excel");
    } finally {
      setDownloadingBOM(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Future Proposals</h3>
          <p className="text-sm text-muted-foreground">
            Define future infrastructure and equipment proposals for this site survey
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={generateWordDocument}
            disabled={generatingWord}
          >
            <FileText className="h-4 w-4 mr-2" />
            {generatingWord ? "GENERATING..." : "DOWNLOAD WORD DOC"}
          </Button>
          <Button
            variant="outline"
            onClick={downloadBOM}
            disabled={downloadingBOM}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadingBOM ? "DOWNLOADING..." : "DOWNLOAD BOM EXCEL"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Future Buildings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localFutureBuildings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Future Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localFutureEquipment.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Future Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Future Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="buildings">Future Buildings</TabsTrigger>
          <TabsTrigger value="equipment">Future Equipment</TabsTrigger>
        </TabsList>

        {/* Future Buildings Tab */}
        <TabsContent value="buildings" className="space-y-6">
          {localFutureBuildings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Future Buildings Defined</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding future building proposals
                </p>
                <Button onClick={addBuilding}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Future Building
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {localFutureBuildings.map((building) => (
                <Card key={building.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {building.name}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addFloor(building.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Floor
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBuilding(building.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Building Name</label>
                        <input
                          type="text"
                          value={building.name}
                          onChange={(e) => updateBuilding(building.id, 'name', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Code</label>
                        <input
                          type="text"
                          value={building.code || ''}
                          onChange={(e) => updateBuilding(building.id, 'code', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <input
                          type="text"
                          value={building.address || ''}
                          onChange={(e) => updateBuilding(building.id, 'address', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Notes</label>
                        <input
                          type="text"
                          value={building.notes || ''}
                          onChange={(e) => updateBuilding(building.id, 'notes', e.target.value)}
                          className="w-full p-2 border rounded-md"
                        />
                      </div>
                    </div>

                    {/* Floors */}
                    {building.floors && building.floors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Floors ({building.floors.length})</h4>
                        <div className="space-y-2">
                          {building.floors.map((floor: any) => (
                            <div key={floor.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{floor.name}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addRoom(building.id, floor.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Room
                                </Button>
                              </div>
                              {floor.rooms && floor.rooms.length > 0 && (
                                <div className="ml-4">
                                  <p className="text-sm text-muted-foreground">
                                    Rooms: {floor.rooms.length}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              <Button onClick={addBuilding} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Future Building
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Future Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Future Equipment</h3>
              <p className="text-sm text-muted-foreground">
                Select products and services for future proposals
              </p>
            </div>
            <Button onClick={handleAddEquipment}>
              <Plus className="h-4 w-4 mr-2" />
              Add Future Equipment
            </Button>
          </div>

          {localFutureEquipment.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Future Equipment Selected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start by adding products and services for future proposals
                </p>
                <Button onClick={handleAddEquipment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Future Equipment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Products Table */}
              {products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Future Products ({products.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.brand || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              €{item.totalPrice.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {item.infrastructureElement ? (
                                <span className="text-xs text-muted-foreground">
                                  {getElementDisplayName(item.infrastructureElement)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">General</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEquipment(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Services Table */}
              {services.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Future Services ({services.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              €{item.totalPrice.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {item.infrastructureElement ? (
                                <span className="text-xs text-muted-foreground">
                                  {getElementDisplayName(item.infrastructureElement)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">General</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEquipment(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Equipment Selection Dialog */}
      <EquipmentSelection
        open={equipmentSelectionOpen}
        onClose={() => setEquipmentSelectionOpen(false)}
        onSave={handleEquipmentSave}
        existingEquipment={localFutureEquipment}
        selectedElement={selectedElement}
      />
    </div>
  );
}
