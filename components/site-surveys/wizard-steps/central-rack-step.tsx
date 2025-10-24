"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BuildingData } from "@/types/building-data";
import { useToast } from "@/hooks/use-toast";
import { Package, Wrench, Sparkles, Calculator, FileText, Download, MoreHorizontal, Image, Edit3, Save, Upload } from "lucide-react";
import ProductSpecificationsDialog from "@/components/products/product-specifications-dialog";
import ProductImagesDialog from "@/components/products/product-images-dialog";
import ProductTranslationsDialog from "@/components/products/product-translations-dialog";

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
  erpCode?: string;
  manufacturerCode?: string;
  eanCode?: string;
  images?: any[];
  specifications?: any;
  translations?: any;
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
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  
  // Dialog states
  const [specificationsDialogOpen, setSpecificationsDialogOpen] = useState(false);
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [translationsDialogOpen, setTranslationsDialogOpen] = useState(false);
  const [productEditDialogOpen, setProductEditDialogOpen] = useState(false);
  const [productDetailsDialogOpen, setProductDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Product editing form state
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    category: '',
    erpCode: '',
    manufacturerCode: '',
    eanCode: '',
    description: ''
  });

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    brand: true,
    category: true,
    quantity: true,
    unitPrice: true,
    margin: true,
    totalPrice: true,
    locations: true,
    actions: true
  });

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

  // Fetch products, services, brands, and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, servicesRes, brandsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=1000&includeImages=true'),
          fetch('/api/services?limit=1000'),
          fetch('/api/brands?limit=1000'),
          fetch('/api/master-data/categories?limit=1000')
        ]);
        
        const productsData = await productsRes.json();
        const servicesData = await servicesRes.json();
        const brandsData = await brandsRes.json();
        const categoriesData = await categoriesRes.json();
        
        if (productsData.success) setProductsList(productsData.data);
        if (servicesData.success) setServicesList(servicesData.data);
        if (brandsData.success) setBrandsList(brandsData.data);
        if (categoriesData.success) setCategoriesList(categoriesData.categories);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  // Helper to get product brand
  const getProductBrand = (productId: string) => {
    const product = productsList.find(p => p.id === productId);
    return product?.brand?.name || product?.brand || 'Generic';
  };

  // Helper to get product category
  const getProductCategory = (productId: string) => {
    const product = productsList.find(p => p.id === productId);
    return product?.category?.name || product?.category || 'Uncategorized';
  };

  // Helper to get service name
  const getServiceName = (serviceId: string) => {
    const service = servicesList.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Helper to get product details
  const getProductDetails = (productId: string) => {
    const product = productsList.find(p => p.id === productId);
    return {
      name: product?.name || 'Unknown Product',
      brand: product?.brand?.name || product?.brand || 'Generic',
      category: product?.category?.name || product?.category || 'Uncategorized',
      erpCode: product?.erpCode || 'N/A',
      manufacturerCode: product?.manufacturerCode || 'N/A',
      eanCode: product?.eanCode || 'N/A',
      images: product?.images || [],
      specifications: product?.specifications || null,
      translations: product?.translations || null,
      hasImages: product?.images && product.images.length > 0,
      hasSpecs: product?.specifications && Object.keys(product.specifications).length > 0,
      hasTranslations: product?.translations && Object.keys(product.translations).length > 0
    };
  };

  // Function to update product in ERP
  const updateProductInERP = async (productId: string, updates: any) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Refresh products list
        const productsRes = await fetch('/api/products?limit=1000&includeImages=true');
        const productsData = await productsRes.json();
        if (productsData.success) {
          setProductsList(productsData.data);
          // Force re-render to update product grouping
          setForceUpdate(prev => prev + 1);
        }
        
        toast({
          title: "Success",
          description: "Product updated in ERP successfully!",
        });
      } else {
        throw new Error('Failed to update product in ERP');
      }
    } catch (error) {
      console.error('Error updating product in ERP:', error);
      toast({
        title: "Error",
        description: "Failed to update product in ERP",
        variant: "destructive",
      });
    }
  };

  // Function to update product category in ERP
  const updateProductCategoryInERP = async (productId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId })
      });

      if (response.ok) {
        // Refresh products list
        const productsRes = await fetch('/api/products?limit=1000&includeImages=true');
        const productsData = await productsRes.json();
        if (productsData.success) {
          setProductsList(productsData.data);
          setForceUpdate(prev => prev + 1);
        }
        
        toast({
          title: "Success",
          description: "Product category updated in ERP successfully!",
        });
      } else {
        throw new Error('Failed to update product category in ERP');
      }
    } catch (error) {
      console.error('Error updating product category in ERP:', error);
      toast({
        title: "Error",
        description: "Failed to update product category in ERP",
        variant: "destructive",
      });
    }
  };

  // Function to update service category in ERP
  const updateServiceCategoryInERP = async (serviceId: string, categoryId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: categoryId })
      });

      if (response.ok) {
        // Refresh services list
        const servicesRes = await fetch('/api/services?limit=1000');
        const servicesData = await servicesRes.json();
        if (servicesData.success) setServicesList(servicesData.data);
        
        toast({
          title: "Success",
          description: "Service category updated in ERP successfully!",
        });
      } else {
        throw new Error('Failed to update service category in ERP');
      }
    } catch (error) {
      console.error('Error updating service category in ERP:', error);
      toast({
        title: "Error",
        description: "Failed to update service category in ERP",
        variant: "destructive",
      });
    }
  };

  // Function to refresh products list
  const refreshProductsList = async () => {
    try {
      const productsRes = await fetch('/api/products?limit=1000&includeImages=true');
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProductsList(productsData.data);
        setForceUpdate(prev => prev + 1);
        console.log('🔄 Products list refreshed after modal update');
      }
    } catch (error) {
      console.error('Error refreshing products list:', error);
    }
  };

  // Function to open product details modal
  const openProductDetailsModal = (product: any) => {
    setSelectedProduct(product);
    setProductDetailsDialogOpen(true);
  };

  // Function to open product editing modal
  const openProductEditModal = (product: any) => {
    setSelectedProduct(product);
    setSpecificationsDialogOpen(true);
  };

  // Function to open product images modal
  const openProductImagesModal = (product: any) => {
    setSelectedProduct(product);
    setImagesDialogOpen(true);
  };

  // Function to open product translations modal
  const openProductTranslationsModal = (product: any) => {
    setSelectedProduct(product);
    setTranslationsDialogOpen(true);
  };

  // Force re-render when productsList changes (for brand updates)
  useEffect(() => {
    // This will trigger a re-render and recalculate productsByBrand
    console.log('🔄 Products list updated, recalculating productsByBrand');
    // Force a re-render by updating a dummy state
    setForceUpdate(prev => prev + 1);
  }, [productsList]);

  // Force update state for brand changes
  const [forceUpdate, setForceUpdate] = useState(0);

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
                brand: getProductBrand(term.productId),
                category: getProductCategory(term.productId),
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
                brand: getProductBrand(sw.productId),
                category: getProductCategory(sw.productId),
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
                brand: getProductBrand(router.productId),
                category: getProductCategory(router.productId),
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
                brand: getProductBrand(server.productId),
                category: getProductCategory(server.productId),
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
                brand: getProductBrand(term.productId),
                category: getProductCategory(term.productId),
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
            if (conn.productId) {
              const key = conn.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: conn.productId,
                  name: getProductName(conn.productId),
                  code: conn.productId,
                brand: getProductBrand(conn.productId),
                category: getProductCategory(conn.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += (conn.quantity || 1) * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            }
            
            conn.services?.forEach(svc => {
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
                brand: getProductBrand(device.productId),
                category: getProductCategory(device.productId),
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
                brand: getProductBrand(outlet.productId),
                category: getProductCategory(outlet.productId),
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
      const productsWithPricing = Object.values(productsByBrand || {}).flat().map((product: any) => {
        const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        const productDetails = getProductDetails(product.id);
        return {
          ...product,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice * product.quantity,
          manufacturerCode: productDetails.manufacturerCode,
          eanCode: productDetails.eanCode
        };
      });

      // Prepare services data with pricing
      const servicesWithPricing = (collectedServices || []).map((service: any) => {
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

        {Object.entries(productsByBrand || {}).map(([brand, brandProducts]) => (
          <Card key={brand}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm">Προϊόντα {brand}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      Στήλες
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="p-2">
                      <div className="text-xs font-medium mb-2">Εμφάνιση Στηλών</div>
                      <div className="space-y-1">
                        {Object.entries(visibleColumns).map(([key, visible]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={key}
                              checked={visible}
                              onCheckedChange={(checked) => 
                                setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                              }
                            />
                            <Label htmlFor={key} className="text-xs">
                              {key === 'product' && 'Προϊόν'}
                              {key === 'brand' && 'Μάρκα'}
                              {key === 'category' && 'Κατηγορία'}
                              {key === 'quantity' && 'Ποσότητα'}
                              {key === 'unitPrice' && 'Τιμή Μονάδας'}
                              {key === 'margin' && 'Ποσοστό Κέρδους'}
                              {key === 'totalPrice' && 'Συνολική Τιμή'}
                              {key === 'locations' && 'Τοποθεσίες'}
                              {key === 'actions' && 'Ενέργειες'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-white dark:bg-gray-900">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      {visibleColumns.product && <th className="text-left p-2 font-semibold text-xs">Προϊόν</th>}
                      {visibleColumns.brand && <th className="text-left p-2 font-semibold text-xs">Μάρκα</th>}
                      {visibleColumns.category && <th className="text-left p-2 font-semibold text-xs">Κατηγορία</th>}
                      {visibleColumns.quantity && <th className="text-right p-2 font-semibold text-xs">Ποσότητα</th>}
                      {visibleColumns.unitPrice && <th className="text-right p-2 font-semibold text-xs">Τιμή Μονάδας (€)</th>}
                      {visibleColumns.margin && <th className="text-right p-2 font-semibold text-xs">Ποσοστό Κέρδους (%)</th>}
                      {visibleColumns.totalPrice && <th className="text-right p-2 font-semibold text-xs">Συνολική Τιμή (€)</th>}
                      {visibleColumns.locations && <th className="text-left p-2 font-semibold text-xs">Τοποθεσίες</th>}
                      {visibleColumns.actions && <th className="text-center p-2 font-semibold text-xs">Ενέργειες</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(brandProducts || []).map((product) => {
                      const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                      return (
                        <tr key={product.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          {visibleColumns.product && (
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {productsList.find(p => p.id === product.id)?.images?.[0]?.url ? (
                                <img 
                                  src={productsList.find(p => p.id === product.id)?.images[0].url} 
                                  alt={product.name || 'Product image'}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                                ) : null}
                                <div className={`w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center ${productsList.find(p => p.id === product.id)?.images?.[0]?.url ? 'hidden' : ''}`}>
                                  <Package className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="font-medium text-xs cursor-help underline decoration-dotted">
                                          {product.name}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <div className="space-y-1 text-xs">
                                          <div><strong>ERP Code:</strong> {getProductDetails(product.id).erpCode}</div>
                                          <div><strong>Manufacturer Code:</strong> {getProductDetails(product.id).manufacturerCode}</div>
                                          <div><strong>EAN Code:</strong> {getProductDetails(product.id).eanCode}</div>
                                          
                                          {/* Product readiness indicators */}
                                          <div className="flex gap-1 mt-2 pt-2 border-t">
                                            {getProductDetails(product.id).hasImages && (
                                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                                📷 Images
                                              </Badge>
                                            )}
                                            {getProductDetails(product.id).hasSpecs && (
                                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                                📋 Specs
                                              </Badge>
                                            )}
                                            {getProductDetails(product.id).hasTranslations && (
                                              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                                🌐 Translations
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <div className="text-xs text-muted-foreground">
                                    {getProductDetails(product.id).erpCode !== 'N/A' && `ERP: ${getProductDetails(product.id).erpCode}`}
                                    {getProductDetails(product.id).manufacturerCode !== 'N/A' && ` | MFG: ${getProductDetails(product.id).manufacturerCode}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.brand && (
                            <td className="p-2">
                              <Select
                                value={getProductDetails(product.id).brand}
                                onValueChange={(value) => {
                                  const brand = brandsList.find(b => b.name === value);
                                  if (brand) {
                                    updateProductInERP(product.id, { brandId: brand.id });
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {brandsList?.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.name} className="text-xs">
                                      {brand.name}
                                    </SelectItem>
                                  )) || []}
                                </SelectContent>
                              </Select>
                            </td>
                          )}
                          {visibleColumns.category && (
                            <td className="p-2">
                              <Select
                                value={getProductDetails(product.id).category}
                                onValueChange={(value) => {
                                  const category = categoriesList.find(c => c.name === value);
                                  if (category) {
                                    updateProductCategoryInERP(product.id, category.id);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {categoriesList?.map((category) => (
                                    <SelectItem key={category.id} value={category.name} className="text-xs">
                                      {category.name}
                                    </SelectItem>
                                  )) || []}
                                </SelectContent>
                              </Select>
                            </td>
                          )}
                          {visibleColumns.quantity && (
                            <td className="p-2 text-right text-xs">{product.quantity}</td>
                          )}
                          {visibleColumns.unitPrice && (
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={pricing.unitPrice}
                                onChange={(e) => updateProductPricing(product.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-xs h-7"
                                placeholder="0.00"
                              />
                            </td>
                          )}
                          {visibleColumns.margin && (
                            <td className="p-2">
                              <Input
                                type="number"
                                step="0.1"
                                value={pricing.margin}
                                onChange={(e) => updateProductPricing(product.id, 'margin', parseFloat(e.target.value) || 0)}
                                className="w-20 text-right text-xs h-7"
                                placeholder="0"
                              />
                            </td>
                          )}
                          {visibleColumns.totalPrice && (
                            <td className="p-2 text-right font-semibold text-xs">
                              €{(pricing.totalPrice * product.quantity).toFixed(2)}
                            </td>
                          )}
                          {visibleColumns.locations && (
                            <td className="p-2">
                              <div className="text-xs text-muted-foreground">
                                {product.locations.join(', ')}
                              </div>
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td className="p-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openProductDetailsModal(product)} className="text-xs">
                                    <Package className="mr-2 h-3 w-3" />
                                    Product Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openProductImagesModal(product)} className="text-xs">
                                    <Image className="mr-2 h-3 w-3" />
                                    Εικόνες
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openProductEditModal(product)} className="text-xs">
                                    <Edit3 className="mr-2 h-3 w-3" />
                                    Προδιαγραφές
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openProductTranslationsModal(product)} className="text-xs">
                                    <Sparkles className="mr-2 h-3 w-3" />
                                    Μεταφράσεις
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={5} className="p-2 text-right text-xs">Υποσύνολο {brand}:</td>
                      <td className="p-2 text-right text-xs">
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
              <Wrench className="h-4 w-4" />
              <span className="text-sm">Υπηρεσίες</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold text-xs">Υπηρεσία</th>
                    <th className="text-left p-2 font-semibold text-xs">Κατηγορία</th>
                    <th className="text-right p-2 font-semibold text-xs">Ποσότητα</th>
                    <th className="text-right p-2 font-semibold text-xs">Τιμή Μονάδας (€)</th>
                    <th className="text-right p-2 font-semibold text-xs">Ποσοστό Κέρδους (%)</th>
                    <th className="text-right p-2 font-semibold text-xs">Συνολική Τιμή (€)</th>
                    <th className="text-left p-2 font-semibold text-xs">Τοποθεσίες</th>
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
                              <div className="font-medium text-xs">{service.name}</div>
                              <div className="text-xs text-muted-foreground">{service.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Select
                            value={service.category}
                            onValueChange={(value) => {
                              const category = categoriesList.find(c => c.name === value);
                              if (category) {
                                updateServiceCategoryInERP(service.id, category.id);
                              }
                            }}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriesList?.map((category) => (
                                <SelectItem key={category.id} value={category.name} className="text-xs">
                                  {category.name}
                                </SelectItem>
                              )) || []}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2 text-right text-xs">{service.quantity}</td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={pricing.unitPrice}
                            onChange={(e) => updateServicePricing(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-xs h-7"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={pricing.margin}
                            onChange={(e) => updateServicePricing(service.id, 'margin', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-xs h-7"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2 text-right font-semibold text-xs">
                          €{(pricing.totalPrice * service.quantity).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <div className="text-xs text-muted-foreground">
                            {service.locations.join(', ')}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={5} className="p-2 text-right text-xs">Υποσύνολο Υπηρεσιών:</td>
                    <td className="p-2 text-right text-xs">
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
            <h3 className="text-sm font-semibold text-green-900 dark:text-green-100">
              Συνολικό Σύνολο
            </h3>
            <div className="text-base font-bold text-green-600 dark:text-green-400">
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

      {/* Product Modals */}
      {selectedProduct && (
        <>
          <ProductSpecificationsDialog
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            open={specificationsDialogOpen}
            onOpenChange={(open) => {
              setSpecificationsDialogOpen(open);
              if (!open) refreshProductsList();
            }}
          />
          
          <ProductImagesDialog
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            open={imagesDialogOpen}
            onOpenChange={(open) => {
              setImagesDialogOpen(open);
              if (!open) refreshProductsList();
            }}
          />
          
          <ProductTranslationsDialog
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            open={translationsDialogOpen}
            onOpenChange={(open) => {
              setTranslationsDialogOpen(open);
              if (!open) refreshProductsList();
            }}
          />

          {/* Product Details Modal */}
          <Dialog open={productDetailsDialogOpen} onOpenChange={(open) => {
            setProductDetailsDialogOpen(open);
            if (!open) refreshProductsList();
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Product Details: {selectedProduct?.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Product Images */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Images</h3>
                  {selectedProduct?.images && selectedProduct.images.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {selectedProduct.images.map((image: any, index: number) => (
                        <div key={index} className="relative">
                          <img 
                            src={image.url} 
                            alt={`Product image ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-3">No images available</div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductDetailsDialogOpen(false);
                      openProductImagesModal(selectedProduct);
                    }}
                    className="text-xs"
                  >
                    <Image className="mr-2 h-3 w-3" />
                    Manage Images
                  </Button>
                </div>

                {/* Product Specifications */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Specifications</h3>
                  {selectedProduct?.specifications ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedProduct.specifications, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-3">No specifications available</div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductDetailsDialogOpen(false);
                      openProductEditModal(selectedProduct);
                    }}
                    className="text-xs"
                  >
                    <Edit3 className="mr-2 h-3 w-3" />
                    Manage Specifications
                  </Button>
                </div>

                {/* Product Translations */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Translations</h3>
                  {selectedProduct?.translations ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(selectedProduct.translations, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground mb-3">No translations available</div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductDetailsDialogOpen(false);
                      openProductTranslationsModal(selectedProduct);
                    }}
                    className="text-xs"
                  >
                    <Sparkles className="mr-2 h-3 w-3" />
                    Manage Translations
                  </Button>
                </div>

                {/* Product Description */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Description</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs">
                    {selectedProduct?.description || 'No description available'}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}