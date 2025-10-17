"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface EquipmentDisplayProps {
  buildings: any[];
}

interface EquipmentItem {
  id: string;
  name: string;
  type: 'product' | 'service';
  brand?: string;
  model?: string;
  category?: string;
  quantity: number;
  notes?: string;
  placement: string;
}

export function EquipmentDisplay({ buildings }: EquipmentDisplayProps) {
  // Extract all equipment from buildings hierarchy
  const extractEquipment = (): { products: EquipmentItem[], services: EquipmentItem[] } => {
    const products: EquipmentItem[] = [];
    const services: EquipmentItem[] = [];

    buildings.forEach((building: any) => {
      // Central Racks
      if (building.centralRacks) {
        building.centralRacks.forEach((rack: any) => {
          if (rack.devices) {
            rack.devices.forEach((device: any) => {
              const item: EquipmentItem = {
                id: device.equipmentId || device.id,
                name: device.name,
                type: device.itemType || 'product',
                brand: device.brand,
                model: device.model,
                category: device.category,
                quantity: device.quantity || 1,
                notes: device.notes,
                placement: `${building.name} > Central Rack: ${rack.name}`,
              };
              
              if (item.type === 'service') {
                services.push(item);
              } else {
                products.push(item);
              }
            });
          }
        });
      }

      // Floors
      if (building.floors) {
        building.floors.forEach((floor: any) => {
          // Floor Racks
          if (floor.floorRacks) {
            floor.floorRacks.forEach((rack: any) => {
              if (rack.devices) {
                rack.devices.forEach((device: any) => {
                  const item: EquipmentItem = {
                    id: device.equipmentId || device.id,
                    name: device.name,
                    type: device.itemType || 'product',
                    brand: device.brand,
                    model: device.model,
                    category: device.category,
                    quantity: device.quantity || 1,
                    notes: device.notes,
                    placement: `${building.name} > ${floor.name} > Floor Rack: ${rack.name}`,
                  };
                  
                  if (item.type === 'service') {
                    services.push(item);
                  } else {
                    products.push(item);
                  }
                });
              }
            });
          }

          // Rooms
          if (floor.rooms) {
            floor.rooms.forEach((room: any) => {
              if (room.devices) {
                room.devices.forEach((device: any) => {
                  const item: EquipmentItem = {
                    id: device.equipmentId || device.id,
                    name: device.name,
                    type: device.itemType || 'product',
                    brand: device.brand,
                    model: device.model,
                    category: device.category,
                    quantity: device.quantity || 1,
                    notes: device.notes,
                    placement: `${building.name} > ${floor.name} > Room: ${room.name}`,
                  };
                  
                  if (item.type === 'service') {
                    services.push(item);
                  } else {
                    products.push(item);
                  }
                });
              }
            });
          }
        });
      }
    });

    return { products, services };
  };

  const { products, services } = extractEquipment();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Products Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle>PRODUCTS</CardTitle>
            <Badge variant="secondary">{products.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No products added yet</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>BRAND</TableHead>
                    <TableHead>QTY</TableHead>
                    <TableHead>PLACEMENT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={`${product.id}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.category && (
                            <div className="text-xs text-muted-foreground">{product.category}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {product.brand && <div className="font-medium">{product.brand}</div>}
                          {product.model && (
                            <div className="text-xs text-muted-foreground">{product.model}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {product.placement}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-green-600" />
            <CardTitle>SERVICES</CardTitle>
            <Badge variant="secondary">{services.length} items</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No services added yet</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>CATEGORY</TableHead>
                    <TableHead>QTY</TableHead>
                    <TableHead>PLACEMENT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service, index) => (
                    <TableRow key={`${service.id}-${index}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.notes && (
                            <div className="text-xs text-muted-foreground">{service.notes}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.category && (
                          <div className="text-sm">{service.category}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                        {service.placement}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

