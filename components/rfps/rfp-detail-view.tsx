"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  FileText,
  Download,
  RefreshCw,
  Edit,
  Save,
  X,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  Package,
  DollarSign,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RFPDetailViewProps {
  rfp: any;
  files: any[];
}

export function RFPDetailView({ rfp, files }: RFPDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [localEquipment, setLocalEquipment] = useState(
    rfp.requirements?.equipment || []
  );

  const requirements = rfp.requirements || {};
  const totals = requirements.totals || {};

  // Update equipment item
  const updateEquipmentItem = (
    index: number,
    field: "quantity" | "price" | "margin" | "notes",
    value: any
  ) => {
    setLocalEquipment((prev: any[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Recalculate total price
      const basePrice = updated[index].price * updated[index].quantity;
      const marginAmount = basePrice * ((updated[index].margin || 0) / 100);
      updated[index].totalPrice = basePrice + marginAmount;

      return updated;
    });
  };

  // Save changes
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipment: localEquipment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      toast.success("Changes saved successfully");
      setEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    }
  };

  // Regenerate Excel
  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const response = await fetch(`/api/rfps/${rfp.id}/regenerate-excel`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to regenerate Excel");
      }

      toast.success("Excel file regenerated successfully", {
        description: `${data.file.filename} (v${data.file.version})`,
        duration: 5000,
      });

      router.refresh();
    } catch (error) {
      console.error("Error regenerating:", error);
      toast.error(
        "Failed to regenerate Excel",
        error instanceof Error ? { description: error.message } : undefined
      );
    } finally {
      setRegenerating(false);
    }
  };

  const products = localEquipment.filter((item: any) => item.type === "product");
  const services = localEquipment.filter((item: any) => item.type === "service");

  // Calculate live totals when editing
  const calculateTotals = (items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const margin = items.reduce((sum, item) => {
      const base = item.price * item.quantity;
      return sum + base * ((item.margin || 0) / 100);
    }, 0);
    return { subtotal, margin, total: subtotal + margin };
  };

  const liveProductTotals = editing ? calculateTotals(products) : null;
  const liveServiceTotals = editing ? calculateTotals(services) : null;
  const liveGrandTotal = editing
    ? (liveProductTotals?.total || 0) + (liveServiceTotals?.total || 0)
    : null;

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-500",
      IN_PROGRESS: "bg-blue-500",
      SUBMITTED: "bg-purple-500",
      AWARDED: "bg-green-500",
      LOST: "bg-red-500",
      CANCELLED: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/rfps">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to RFPs
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {rfp.rfpNo || "Draft RFP"}
            <Badge className={getStatusColor(rfp.status)}>
              {rfp.status.replace("_", " ")}
            </Badge>
          </h1>
          <p className="text-muted-foreground">{rfp.title}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Pricing
              </Button>
              <Button onClick={handleRegenerate} disabled={regenerating}>
                {regenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Excel
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building className="h-4 w-4" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-semibold">{rfp.customer.name}</div>
            {rfp.customer.email && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {rfp.customer.email}
              </div>
            )}
            {rfp.customer.phone01 && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {rfp.customer.phone01}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Assignee
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rfp.assignee ? (
              <>
                <div className="font-semibold">{rfp.assignee.name}</div>
                <div className="text-sm text-muted-foreground">
                  {rfp.assignee.email}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Unassigned</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="font-medium">Created:</div>
              <div className="text-muted-foreground">
                {new Date(rfp.createdAt).toLocaleString()}
              </div>
            </div>
            {rfp.updatedAt && rfp.updatedAt !== rfp.createdAt && (
              <div className="text-sm mt-2">
                <div className="font-medium">Updated:</div>
                <div className="text-muted-foreground">
                  {new Date(rfp.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Summary */}
      <Card className="border-2 border-primary">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Products Total</div>
              <div className="text-2xl font-bold">
                €{editing ? liveProductTotals?.total.toFixed(2) : totals.productsTotal?.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Services Total</div>
              <div className="text-2xl font-bold">
                €{editing ? liveServiceTotals?.total.toFixed(2) : totals.servicesTotal?.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Margin</div>
              <div className="text-2xl font-bold text-green-600">
                €{editing 
                  ? ((liveProductTotals?.margin || 0) + (liveServiceTotals?.margin || 0)).toFixed(2)
                  : ((totals.productsMargin || 0) + (totals.servicesMargin || 0)).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Grand Total</div>
              <div className="text-3xl font-bold text-primary">
                €{editing ? liveGrandTotal?.toFixed(2) : totals.grandTotal?.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-accent rounded-lg"
                >
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {file.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(file.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Product</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Unit Price (€)</TableHead>
                    <TableHead className="text-right w-[100px]">Margin (%)</TableHead>
                    <TableHead className="text-right w-[120px]">Total (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((item: any, index: number) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.brand || "-"}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.infrastructureElement
                            ? `${item.infrastructureElement.buildingName} - ${item.infrastructureElement.floorName}`
                            : "General"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 text-right"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 text-right"
                          />
                        ) : (
                          `€${item.price.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.margin || 0}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "margin",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 text-right"
                          />
                        ) : (
                          `${(item.margin || 0).toFixed(1)}%`
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{item.totalPrice.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {editing && liveProductTotals && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="text-right font-semibold">
                        Products Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        €{liveProductTotals.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Table */}
      {services.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Services ({services.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right w-[100px]">Quantity</TableHead>
                    <TableHead className="text-right w-[120px]">Unit Price (€)</TableHead>
                    <TableHead className="text-right w-[100px]">Margin (%)</TableHead>
                    <TableHead className="text-right w-[120px]">Total (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((item: any, index: number) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {item.infrastructureElement
                            ? `${item.infrastructureElement.buildingName} - ${item.infrastructureElement.floorName}`
                            : "General"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20 text-right"
                          />
                        ) : (
                          item.quantity
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 text-right"
                          />
                        ) : (
                          `€${item.price.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={item.margin || 0}
                            onChange={(e) =>
                              updateEquipmentItem(
                                localEquipment.indexOf(item),
                                "margin",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 text-right"
                          />
                        ) : (
                          `${(item.margin || 0).toFixed(1)}%`
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        €{item.totalPrice.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {editing && liveServiceTotals && (
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-semibold">
                        Services Total:
                      </TableCell>
                      <TableCell className="text-right font-bold text-lg">
                        €{liveServiceTotals.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                )}
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

