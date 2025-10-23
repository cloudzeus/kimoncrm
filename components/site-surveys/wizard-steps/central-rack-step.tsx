"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BuildingData } from "../comprehensive-infrastructure-wizard";
import { useToast } from "@/hooks/use-toast";
import { Package, Wrench, Sparkles, Calculator, FileText, Download } from "lucide-react";

interface CentralRackStepProps {
  buildings: BuildingData[];
  onUpdate: (buildings: BuildingData[]) => void;
  siteSurveyId: string;
}

interface ProductData {
  id: string;
  name: string;
  code: string;
  brand: string;
  category: string;
  quantity: number;
  unitPrice: number;
  margin: number;
  totalPrice: number;
  locations: string[];
}

interface ServiceData {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unitPrice: number;
  margin: number;
  totalPrice: number;
  locations: string[];
}

export function CentralRackStep({
  buildings,
  onUpdate,
  siteSurveyId,
}: CentralRackStepProps) {
  const { toast } = useToast();
  const [productPricing, setProductPricing] = useState<Map<string, { unitPrice: number; margin: number; totalPrice: number }>>(new Map());
  const [servicePricing, setServicePricing] = useState<Map<string, { unitPrice: number; margin: number; totalPrice: number }>>(new Map());
  const [productsList, setProductsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);

  // Load saved pricing from localStorage on mount
  useEffect(() => {
    try {
      const savedProductPricing = localStorage.getItem(`pricing-products-${siteSurveyId}`);
      const savedServicePricing = localStorage.getItem(`pricing-services-${siteSurveyId}`);
      
      if (savedProductPricing) {
        const data = JSON.parse(savedProductPricing);
        setProductPricing(new Map(data));
      }
      
      if (savedServicePricing) {
        const data = JSON.parse(savedServicePricing);
        setServicePricing(new Map(data));
      }
    } catch (error) {
      console.error('Failed to load saved pricing:', error);
    }
  }, [siteSurveyId]);

  // Fetch products and services
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, servicesRes] = await Promise.all([
          fetch('/api/products?limit=1000'),
          fetch('/api/services?limit=1000')
        ]);
        
        const productsData = await productsRes.json();
        const servicesData = await servicesRes.json();
        
        if (productsData.success) setProductsList(productsData.data);
        if (servicesData.success) setServicesList(servicesData.data);
      } catch (error) {
        console.error('Error fetching products/services:', error);
      }
    };
    
    fetchData();
  }, []);

  // Helper to calculate multiplier for typical floors
  const getFloorMultiplier = (floor: any) => {
    return floor.isTypical && floor.repeatCount ? floor.repeatCount : 1;
  };

  // Helper to calculate multiplier for typical rooms
  const getRoomMultiplier = (room: any) => {
    return room.isTypical && room.repeatCount ? room.repeatCount : 1;
  };

  // Helper to calculate total multiplier (floor × room)
  const getTotalMultiplier = (floor: any, room: any) => {
    return getFloorMultiplier(floor) * getRoomMultiplier(room);
  };

  // Helper to get product name
  const getProductName = (productId: string) => {
    const product = productsList.find(p => p.id === productId);
    return product ? product.name : productId;
  };

  // Helper to get service name
  const getServiceName = (serviceId: string) => {
    const service = servicesList.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Collect all assigned products and services from Step 2
  const collectAssignedItems = () => {
    const productsMap = new Map<string, ProductData>();
    const servicesMap = new Map<string, ServiceData>();

    buildings.forEach(building => {
      // Central rack
      if (building.centralRack) {
        building.centralRack.cableTerminations?.forEach(term => {
          if (term.productId) {
            const key = term.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: term.productId,
                name: getProductName(term.productId),
                code: term.productId,
                brand: term.cableType.split('_')[0] || 'Generic',
                category: 'Cable Termination',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += term.quantity || 1;
            product.locations.push('Central Rack');
          }
          
          term.services?.forEach(svc => {
            const key = svc.serviceId;
            if (!servicesMap.has(key)) {
              servicesMap.set(key, {
                id: svc.serviceId,
                name: getServiceName(svc.serviceId),
                code: svc.serviceId,
                category: 'Cable Termination Service',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const service = servicesMap.get(key)!;
            service.quantity += svc.quantity;
            service.locations.push('Central Rack');
          });
        });

        building.centralRack.switches?.forEach(sw => {
          if (sw.productId) {
            const key = sw.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: sw.productId,
                name: getProductName(sw.productId),
                code: sw.productId,
                brand: sw.brand || 'Generic',
                category: 'Network Switch',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += 1;
            product.locations.push('Central Rack');
          }
          
          sw.services?.forEach(svc => {
            const key = svc.serviceId;
            if (!servicesMap.has(key)) {
              servicesMap.set(key, {
                id: svc.serviceId,
                name: getServiceName(svc.serviceId),
                code: svc.serviceId,
                category: 'Switch Service',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const service = servicesMap.get(key)!;
            service.quantity += svc.quantity;
            service.locations.push('Central Rack');
          });
        });

        building.centralRack.routers?.forEach(router => {
          if (router.productId) {
            const key = router.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: router.productId,
                name: getProductName(router.productId),
                code: router.productId,
                brand: router.brand || 'Generic',
                category: 'Network Router',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += 1;
            product.locations.push('Central Rack');
          }
        });

        building.centralRack.servers?.forEach(server => {
          if (server.productId) {
            const key = server.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: server.productId,
                name: getProductName(server.productId),
                code: server.productId,
                brand: server.brand || 'Generic',
                category: 'Server',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += 1;
            product.locations.push('Central Rack');
          }
        });
      }

      // Floors
      building.floors.forEach(floor => {
        const floorMultiplier = getFloorMultiplier(floor);
        
        floor.racks?.forEach(rack => {
          rack.cableTerminations?.forEach(term => {
            if (term.productId) {
              const key = term.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: term.productId,
                  name: getProductName(term.productId),
                  code: term.productId,
                  brand: term.cableType.split('_')[0] || 'Generic',
                  category: 'Cable Termination',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += (term.quantity || 1) * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            }
          });

          rack.switches?.forEach(sw => {
            if (sw.productId) {
              const key = sw.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: sw.productId,
                  name: getProductName(sw.productId),
                  code: sw.productId,
                  brand: sw.brand || 'Generic',
                  category: 'Network Switch',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += 1 * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            }
            
            sw.services?.forEach(svc => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Switch Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
          });

          rack.connections?.forEach(conn => {
            if ((conn as any).productId) {
              const key = (conn as any).productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: (conn as any).productId,
                  name: getProductName((conn as any).productId),
                  code: (conn as any).productId,
                  brand: 'Generic',
                  category: 'Network Connection',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += ((conn as any).quantity || 1) * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            }
            
            (conn as any).services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Connection Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
          });
        });

        floor.rooms.forEach(room => {
          const roomMultiplier = getRoomMultiplier(room);
          const totalMultiplier = getTotalMultiplier(floor, room);
          
          room.devices?.forEach(device => {
            if (device.productId) {
              const key = device.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: device.productId,
                  name: getProductName(device.productId),
                  code: device.productId,
                  brand: device.brand || 'Generic',
                  category: device.type,
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += (device.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              product.locations.push(locationText);
            }
            
            device.services?.forEach(svc => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Device Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              service.locations.push(locationText);
            });
          });

          room.outlets?.forEach(outlet => {
            if (outlet.productId) {
              const key = outlet.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: outlet.productId,
                  name: getProductName(outlet.productId),
                  code: outlet.productId,
                  brand: outlet.brand || 'Generic',
                  category: 'Network Outlet',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += (outlet.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              product.locations.push(locationText);
            }
            
            outlet.services?.forEach(svc => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Outlet Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              service.locations.push(locationText);
            });
          });

          room.connections?.forEach(conn => {
            if (conn.productId) {
              const key = conn.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: conn.productId,
                  name: getProductName(conn.productId),
                  code: conn.productId,
                  brand: 'Generic',
                  category: 'Room Connection',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += (conn.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              product.locations.push(locationText);
            }
            
            conn.services?.forEach(svc => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Room Connection Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * totalMultiplier;
              
              let locationText = `${floor.name} - ${room.name}`;
              if (totalMultiplier > 1) {
                if (floorMultiplier > 1 && roomMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors × ${roomMultiplier} rooms = ×${totalMultiplier})`;
                } else if (floorMultiplier > 1) {
                  locationText += ` (×${floorMultiplier} floors)`;
                } else if (roomMultiplier > 1) {
                  locationText += ` (×${roomMultiplier} rooms)`;
                }
              }
              service.locations.push(locationText);
            });
          });
        });
      });
    });

    return {
      products: Array.from(productsMap.values()),
      services: Array.from(servicesMap.values())
    };
  };

  const { products: collectedProducts, services: collectedServices } = collectAssignedItems();

  // Group products by brand
  const productsByBrand = collectedProducts.reduce((acc, product) => {
    const brand = product.brand;
    if (!acc[brand]) {
      acc[brand] = [];
    }
    acc[brand].push(product);
    return acc;
  }, {} as Record<string, ProductData[]>);

  // Pricing helper functions
  const updateProductPricing = (productId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = productPricing.get(productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice / (1 - updated.margin / 100);
    const newPricing = new Map(productPricing.set(productId, updated));
    setProductPricing(newPricing);
    
    // Save to localStorage for persistence
    try {
      const pricingData = Array.from(newPricing.entries());
      localStorage.setItem(`pricing-products-${siteSurveyId}`, JSON.stringify(pricingData));
    } catch (error) {
      console.error('Failed to save product pricing:', error);
    }
  };

  const updateServicePricing = (serviceId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = servicePricing.get(serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice / (1 - updated.margin / 100);
    const newPricing = new Map(servicePricing.set(serviceId, updated));
    setServicePricing(newPricing);
    
    // Save to localStorage for persistence
    try {
      const pricingData = Array.from(newPricing.entries());
      localStorage.setItem(`pricing-services-${siteSurveyId}`, JSON.stringify(pricingData));
    } catch (error) {
      console.error('Failed to save service pricing:', error);
    }
  };

  const handleGenerateInfrastructureExcel = async () => {
    try {
      const response = await fetch('/api/site-surveys/generate-infrastructure-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildings,
          siteSurveyId,
          siteSurveyName: buildings[0]?.name || 'Site-Survey'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate infrastructure Excel');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Infrastructure-${buildings[0]?.name || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Infrastructure Excel generated successfully!",
      });

    } catch (error) {
      console.error('Error generating infrastructure Excel:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate infrastructure Excel",
        variant: "destructive",
      });
    }
  };

  const handleGenerateBOM = async () => {
    try {
      // Prepare products data with pricing
      const productsWithPricing = Object.values(productsByBrand).flat().map((product: any) => {
        const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        return {
          ...product,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice * product.quantity
        };
      });

      // Prepare services data with pricing
      const servicesWithPricing = collectedServices.map((service: any) => {
        const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        return {
          ...service,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice * service.quantity
        };
      });

      console.log('🔍 BOM Data being sent:', {
        productsCount: productsWithPricing.length,
        servicesCount: servicesWithPricing.length,
        brands: [...new Set(productsWithPricing.map(p => p.brand))],
        sampleProduct: productsWithPricing[0]
      });

      const response = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsWithPricing,
          services: servicesWithPricing,
          siteSurveyName: buildings[0]?.name || 'Site-Survey'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate BOM');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM-${buildings[0]?.name || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "BOM Excel generated successfully!",
      });

    } catch (error) {
      console.error('Error generating BOM:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate BOM",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h2 className="text-xl font-bold">Τιμολόγηση Προϊόντων & Υπηρεσιών</h2>
        </div>
        <p className="text-muted-foreground">
          Τιμολόγηση όλων των προϊόντων και υπηρεσιών που ανατέθηκαν στο Βήμα 2
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Σύνολο Προϊόντων
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{collectedProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Διαφορετικά προϊόντα
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Σύνολο Υπηρεσιών
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{collectedServices.length}</div>
            <p className="text-xs text-muted-foreground">
              Διαφορετικές υπηρεσίες
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Μάρκες
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{Object.keys(productsByBrand).length}</div>
            <p className="text-xs text-muted-foreground">
              Διαφορετικές μάρκες
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Σύνολο Αντικειμένων
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {collectedProducts.reduce((sum, p) => sum + p.quantity, 0) + collectedServices.reduce((sum, s) => sum + s.quantity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Συνολική ποσότητα
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products by Brand */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Προϊόντα ανά Μάρκα</h3>
          <div className="flex gap-2">
            <Button onClick={handleGenerateInfrastructureExcel} variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Υποδομή Excel
            </Button>
            <Button onClick={handleGenerateBOM} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Δημιουργία BOM
            </Button>
          </div>
        </div>

        {Object.entries(productsByBrand).map(([brand, brandProducts]) => (
          <Card key={brand}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Προϊόντα {brand}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold text-[11px]">Προϊόν</th>
                      <th className="text-left p-2 font-semibold text-[11px]">Κατηγορία</th>
                      <th className="text-right p-2 font-semibold text-[11px]">Ποσότητα</th>
                      <th className="text-right p-2 font-semibold text-[11px]">Τιμή Μονάδας (€)</th>
                      <th className="text-right p-2 font-semibold text-[11px]">Ποσοστό Κέρδους (%)</th>
                      <th className="text-right p-2 font-semibold text-[11px]">Συνολική Τιμή (€)</th>
                      <th className="text-left p-2 font-semibold text-[11px]">Τοποθεσίες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandProducts.map((product) => {
                      const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                <Package className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-[11px]">{product.name}</div>
                                <div className="text-[10px] text-muted-foreground">{product.code}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2 text-[11px]">{product.category}</td>
                          <td className="p-2 text-right text-[11px]">{product.quantity}</td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={pricing.unitPrice}
                              onChange={(e) => updateProductPricing(product.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-20 text-right text-[11px] h-7"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={pricing.margin}
                              onChange={(e) => updateProductPricing(product.id, 'margin', parseFloat(e.target.value) || 0)}
                              className="w-16 text-right text-[11px] h-7"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-semibold text-[11px]">
                            €{(pricing.totalPrice * product.quantity).toFixed(2)}
                          </td>
                          <td className="p-2">
                            <div className="text-[10px] text-muted-foreground">
                              {product.locations.join(', ')}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={5} className="p-2 text-right text-[11px]">Υποσύνολο {brand}:</td>
                      <td className="p-2 text-right text-[11px]">
                        €{brandProducts.reduce((sum, product) => {
                          const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                          return sum + (pricing.totalPrice * product.quantity);
                        }, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services */}
      {collectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Υπηρεσίες
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-[11px]">Υπηρεσία</th>
                    <th className="text-left p-2 font-semibold text-[11px]">Κατηγορία</th>
                    <th className="text-right p-2 font-semibold text-[11px]">Ποσότητα</th>
                    <th className="text-right p-2 font-semibold text-[11px]">Τιμή Μονάδας (€)</th>
                    <th className="text-right p-2 font-semibold text-[11px]">Ποσοστό Κέρδους (%)</th>
                    <th className="text-right p-2 font-semibold text-[11px]">Συνολική Τιμή (€)</th>
                    <th className="text-left p-2 font-semibold text-[11px]">Τοποθεσίες</th>
                  </tr>
                </thead>
                <tbody>
                  {collectedServices.map((service) => {
                    const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                    return (
                      <tr key={service.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                              <Wrench className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-[11px]">{service.name}</div>
                              <div className="text-[10px] text-muted-foreground">{service.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-[11px]">{service.category}</td>
                        <td className="p-2 text-right text-[11px]">{service.quantity}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={pricing.unitPrice}
                            onChange={(e) => updateServicePricing(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-[11px] h-7"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={pricing.margin}
                            onChange={(e) => updateServicePricing(service.id, 'margin', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right text-[11px] h-7"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-[11px]">
                          €{(pricing.totalPrice * service.quantity).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <div className="text-[10px] text-muted-foreground">
                            {service.locations.join(', ')}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={5} className="p-2 text-right text-[11px]">Υποσύνολο Υπηρεσιών:</td>
                    <td className="p-2 text-right text-[11px]">
                      €{collectedServices.reduce((sum, service) => {
                        const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                        return sum + (pricing.totalPrice * service.quantity);
                      }, 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grand Total */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200">
        <CardContent className="pt-6 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-semibold text-green-900 dark:text-green-100">
              Συνολικό Σύνολο
            </h3>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              €{(
                Object.values(productsByBrand).flat().reduce((sum, product) => {
                  const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                  return sum + (pricing.totalPrice * product.quantity);
                }, 0) +
                collectedServices.reduce((sum, service) => {
                  const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                  return sum + (pricing.totalPrice * service.quantity);
                }, 0)
              ).toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}