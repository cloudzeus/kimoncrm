"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Package, Wrench, Sparkles, Calculator, FileText, Download, MoreHorizontal, Image, Edit3, Save, Upload, Trash2 } from "lucide-react";
import ProductSpecificationsDialog from "@/components/products/product-specifications-dialog";
import ProductImagesDialog from "@/components/products/product-images-dialog";
import ProductTranslationsDialog from "@/components/products/product-translations-dialog";
import { useWizardContext } from "@/contexts/wizard-context";

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
  
  // Use pricing from context (shared across wizard, auto-saves to database)
  const { productPricing, servicePricing, updateProductPricing, updateServicePricing, deleteProductPricing, deleteServicePricing, saveToDatabase } = useWizardContext();
  
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

  // Pricing is now loaded from database via WizardContext (no localStorage needed)

  // Fetch products, services, brands, categories, AND site survey data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, servicesRes, brandsRes, categoriesRes, siteSurveyRes] = await Promise.all([
          fetch('/api/products?limit=999999&includeImages=true'),
          fetch('/api/services?limit=999999'),
          fetch('/api/brands?limit=999999'),
          fetch('/api/master-data/categories?limit=999999'),
          fetch(`/api/site-surveys/${siteSurveyId}`)
        ]);
        
        const productsData = await productsRes.json();
        const servicesData = await servicesRes.json();
        const brandsData = await brandsRes.json();
        const categoriesData = await categoriesRes.json();
        const siteSurveyData = await siteSurveyRes.json();
        
        if (productsData.success) setProductsList(productsData.data);
        if (servicesData.success) setServicesList(servicesData.data);
        if (brandsData.success) setBrandsList(brandsData.data);
        if (categoriesData.success) setCategoriesList(categoriesData.categories);
        
        // Update buildings from fresh database data
        if (siteSurveyData.success && siteSurveyData.data?.wizardData?.buildings) {
          console.log('🔄 Refreshing buildings data from database:', {
            buildingsCount: siteSurveyData.data.wizardData.buildings.length
          });
          onUpdate(siteSurveyData.data.wizardData.buildings);
          
          // Pricing is now loaded by WizardContext on mount (no need to load here)
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [siteSurveyId, onUpdate]);

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

  // Save progress is now handled by WizardContext auto-save (no manual save needed)

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
      erpCode: product?.code || 'N/A',
      manufacturerCode: product?.code2 || 'N/A',  // EAN code is usually code2
      eanCode: product?.code1 || 'N/A',          // Manufacturer code is usually code1
      mtrl: (product as any)?.mtrl || 'N/A',     // ERP MTRL code
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
        const productsRes = await fetch('/api/products?limit=999999&includeImages=true');
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
        const productsRes = await fetch('/api/products?limit=999999&includeImages=true');
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
      const productsRes = await fetch('/api/products?limit=999999&includeImages=true');
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

  // Function to delete product from all locations
  const handleDeleteProduct = (productId: string) => {
    const updatedBuildings = buildings.map(building => {
      // Remove from central rack
      const updatedCentralRack = building.centralRack ? {
        ...building.centralRack,
        cableTerminations: building.centralRack.cableTerminations?.map(term => ({
          ...term,
          products: term.products?.filter(p => p.productId !== productId) || [],
          // Clear old single productId if it matches
          productId: term.productId === productId ? undefined : term.productId
        })),
        switches: building.centralRack.switches?.map(sw => ({
          ...sw,
          products: sw.products?.filter(p => p.productId !== productId) || [],
          productId: sw.productId === productId ? undefined : sw.productId
        })),
        routers: building.centralRack.routers?.map(router => ({
          ...router,
          products: router.products?.filter(p => p.productId !== productId) || [],
          productId: router.productId === productId ? undefined : router.productId
        })),
        servers: building.centralRack.servers?.map(server => ({
          ...server,
          products: server.products?.filter(p => p.productId !== productId) || [],
          productId: server.productId === productId ? undefined : server.productId
        })),
        voipPbx: building.centralRack.voipPbx?.map(pbx => ({
          ...pbx,
          products: pbx.products?.filter(p => p.productId !== productId) || [],
          productId: pbx.productId === productId ? undefined : pbx.productId
        })),
        headend: building.centralRack.headend?.map(headend => ({
          ...headend,
          products: headend.products?.filter(p => p.productId !== productId) || [],
          productId: headend.productId === productId ? undefined : headend.productId
        })),
        nvr: building.centralRack.nvr?.map(nvr => ({
          ...nvr,
          products: nvr.products?.filter(p => p.productId !== productId) || [],
          productId: nvr.productId === productId ? undefined : nvr.productId
        })),
        ata: building.centralRack.ata?.map(ata => ({
          ...ata,
          products: ata.products?.filter(p => p.productId !== productId) || [],
          productId: ata.productId === productId ? undefined : ata.productId
        })),
      } : undefined;

      // Remove from floors
      const updatedFloors = building.floors.map(floor => ({
        ...floor,
        racks: floor.racks?.map(rack => ({
          ...rack,
          cableTerminations: rack.cableTerminations?.map(term => ({
            ...term,
            products: term.products?.filter(p => p.productId !== productId) || [],
            productId: term.productId === productId ? undefined : term.productId
          })),
          switches: rack.switches?.map(sw => ({
            ...sw,
            products: sw.products?.filter(p => p.productId !== productId) || [],
            productId: sw.productId === productId ? undefined : sw.productId
          })),
          routers: rack.routers?.map(router => ({
            ...router,
            products: router.products?.filter(p => p.productId !== productId) || [],
            productId: router.productId === productId ? undefined : router.productId
          })),
          servers: rack.servers?.map(server => ({
            ...server,
            products: server.products?.filter(p => p.productId !== productId) || [],
            productId: server.productId === productId ? undefined : server.productId
          })),
          voipPbx: rack.voipPbx?.map(pbx => ({
            ...pbx,
            products: pbx.products?.filter(p => p.productId !== productId) || [],
            productId: pbx.productId === productId ? undefined : pbx.productId
          })),
          headend: rack.headend?.map(headend => ({
            ...headend,
            products: headend.products?.filter(p => p.productId !== productId) || [],
            productId: headend.productId === productId ? undefined : headend.productId
          })),
          nvr: rack.nvr?.map(nvr => ({
            ...nvr,
            products: nvr.products?.filter(p => p.productId !== productId) || [],
            productId: nvr.productId === productId ? undefined : nvr.productId
          })),
          ata: rack.ata?.map(ata => ({
            ...ata,
            products: ata.products?.filter(p => p.productId !== productId) || [],
            productId: ata.productId === productId ? undefined : ata.productId
          })),
          connections: rack.connections?.map(conn => ({
            ...conn,
            products: conn.products?.filter(p => p.productId !== productId) || [],
            productId: conn.productId === productId ? undefined : conn.productId
          })),
        })),
        rooms: floor.rooms.map(room => ({
          ...room,
          devices: room.devices?.map(device => ({
            ...device,
            productId: device.productId === productId ? undefined : device.productId
          })),
          outlets: room.outlets?.map(outlet => ({
            ...outlet,
            productId: outlet.productId === productId ? undefined : outlet.productId
          })),
          connections: room.connections?.map(conn => ({
            ...conn,
            productId: conn.productId === productId ? undefined : conn.productId
          })),
        })),
      }));

      return {
        ...building,
        centralRack: updatedCentralRack,
        floors: updatedFloors
      };
    });

    onUpdate(updatedBuildings);
    
    // Also remove pricing data (using context)
    deleteProductPricing(productId);
    
    toast({
      title: "Success",
      description: "Product removed from all locations",
    });
  };

  // Function to delete service from all locations
  const handleDeleteService = (serviceId: string) => {
    const updatedBuildings = buildings.map(building => {
      // Remove from central rack
      const updatedCentralRack = building.centralRack ? {
        ...building.centralRack,
        cableTerminations: building.centralRack.cableTerminations?.map(term => ({
          ...term,
          services: term.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        switches: building.centralRack.switches?.map(sw => ({
          ...sw,
          services: sw.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        routers: building.centralRack.routers?.map(router => ({
          ...router,
          services: router.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        servers: building.centralRack.servers?.map(server => ({
          ...server,
          services: server.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        voipPbx: building.centralRack.voipPbx?.map(pbx => ({
          ...pbx,
          services: pbx.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        headend: building.centralRack.headend?.map(headend => ({
          ...headend,
          services: headend.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        nvr: building.centralRack.nvr?.map(nvr => ({
          ...nvr,
          services: nvr.services?.filter(s => s.serviceId !== serviceId) || []
        })),
        ata: building.centralRack.ata?.map(ata => ({
          ...ata,
          services: ata.services?.filter(s => s.serviceId !== serviceId) || []
        })),
      } : undefined;

      // Remove from floors
      const updatedFloors = building.floors.map(floor => ({
        ...floor,
        racks: floor.racks?.map(rack => ({
          ...rack,
          cableTerminations: rack.cableTerminations?.map(term => ({
            ...term,
            services: term.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          switches: rack.switches?.map(sw => ({
            ...sw,
            services: sw.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          routers: rack.routers?.map(router => ({
            ...router,
            services: router.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          servers: rack.servers?.map(server => ({
            ...server,
            services: server.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          voipPbx: rack.voipPbx?.map(pbx => ({
            ...pbx,
            services: pbx.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          headend: rack.headend?.map(headend => ({
            ...headend,
            services: headend.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          nvr: rack.nvr?.map(nvr => ({
            ...nvr,
            services: nvr.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          ata: rack.ata?.map(ata => ({
            ...ata,
            services: ata.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          connections: rack.connections?.map(conn => ({
            ...conn,
            services: conn.services?.filter(s => s.serviceId !== serviceId) || []
          })),
        })),
        rooms: floor.rooms.map(room => ({
          ...room,
          devices: room.devices?.map(device => ({
            ...device,
            services: device.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          outlets: room.outlets?.map(outlet => ({
            ...outlet,
            services: outlet.services?.filter(s => s.serviceId !== serviceId) || []
          })),
          connections: room.connections?.map(conn => ({
            ...conn,
            services: conn.services?.filter(s => s.serviceId !== serviceId) || []
          })),
        })),
      }));

      return {
        ...building,
        centralRack: updatedCentralRack,
        floors: updatedFloors
      };
    });

    onUpdate(updatedBuildings);
    
    // Also remove pricing data (using context)
    deleteServicePricing(serviceId);
    
    toast({
      title: "Success",
      description: "Service removed from all locations",
    });
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

  // Helper function to collect items from buildings (can be used with any buildings array)
  const collectAssignedItemsFromBuildings = (buildingsData: any[]) => {

    const productsMap = new Map<string, ProductData>();
    const servicesMap = new Map<string, ServiceData>();

    buildingsData.forEach((building: any) => {
      // Central rack
      if (building.centralRack) {
        building.centralRack.cableTerminations?.forEach((term: any) => {
          // Support new products array format
          const productsToProcess = term.products || (term.productId ? [{ productId: term.productId, quantity: term.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack');
          });
          
          term.services?.forEach((svc: any) => {
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

        building.centralRack.switches?.forEach((sw: any) => {
          // Support new products array format
          const productsToProcess = sw.products || (sw.productId ? [{ productId: sw.productId, quantity: sw.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack');
          });
          
          sw.services?.forEach((svc: any) => {
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

        building.centralRack.routers?.forEach((router: any) => {
          // Support new products array format
          const productsToProcess = router.products || (router.productId ? [{ productId: router.productId, quantity: router.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack');
          });
        });

        building.centralRack.servers?.forEach((server: any) => {
          // Support new products array format
          const productsToProcess = server.products || (server.productId ? [{ productId: server.productId, quantity: server.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack');
          });
        });

        building.centralRack.voipPbx?.forEach((pbx: any) => {
          const productsToProcess = pbx.products || (pbx.productId ? [{ productId: pbx.productId, quantity: pbx.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack - VoIP PBX');
          });
        });

        building.centralRack.headend?.forEach((headend: any) => {
          // Support new products array format
          const productsToProcess = headend.products || (headend.productId ? [{ productId: headend.productId, quantity: headend.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack - Headend');
          });
        });

        building.centralRack.nvr?.forEach((nvr: any) => {
          // Support new products array format
          const productsToProcess = nvr.products || (nvr.productId ? [{ productId: nvr.productId, quantity: nvr.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack - NVR');
          });
        });

        building.centralRack.ata?.forEach((ata: any) => {
          // Support new products array format
          const productsToProcess = ata.products || (ata.productId ? [{ productId: ata.productId, quantity: ata.quantity || 1 }] : []);
          
          productsToProcess.forEach((productAssignment: any) => {
            const key = productAssignment.productId;
            if (!productsMap.has(key)) {
              productsMap.set(key, {
                id: productAssignment.productId,
                name: getProductName(productAssignment.productId),
                code: productAssignment.productId,
                brand: getProductBrand(productAssignment.productId),
                category: getProductCategory(productAssignment.productId),
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const product = productsMap.get(key)!;
            product.quantity += productAssignment.quantity;
            product.locations.push('Central Rack - ATA Gateway');
          });
          
          ata.services?.forEach((svc: any) => {
            const key = svc.serviceId;
            if (!servicesMap.has(key)) {
              servicesMap.set(key, {
                id: svc.serviceId,
                name: getServiceName(svc.serviceId),
                code: svc.serviceId,
                category: 'ATA Service',
                quantity: 0,
                unitPrice: 0,
                margin: 0,
                totalPrice: 0,
                locations: []
              });
            }
            const service = servicesMap.get(key)!;
            service.quantity += svc.quantity || 1;
            service.locations.push('Central Rack - ATA Gateway');
          });
        });
      }

      // Floors
      building.floors.forEach((floor: any) => {
        const floorMultiplier = getFloorMultiplier(floor);
        
        floor.racks?.forEach((rack: any) => {
          rack.cableTerminations?.forEach((term: any) => {
            // Support new products array format
            const productsToProcess = term.products || (term.productId ? [{ productId: term.productId, quantity: term.quantity || 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            term.services?.forEach((svc: any) => {
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
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
          });

          rack.switches?.forEach((sw: any) => {
            // Support new products array format
            const productsToProcess = sw.products || (sw.productId ? [{ productId: sw.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            sw.services?.forEach((svc: any) => {
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

          rack.routers?.forEach((router: any) => {
            // Support new products array format
            const productsToProcess = router.products || (router.productId ? [{ productId: router.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            router.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Router Service',
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

          if (Array.isArray(rack.servers)) {
            rack.servers.forEach((server: any) => {
            // Support new products array format
            const productsToProcess = server.products || (server.productId ? [{ productId: server.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name} - Server${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            server.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Server Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name} - Server${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            });
          }

          if (Array.isArray(rack.voipPbx)) {
            rack.voipPbx.forEach((pbx: any) => {
            // Support new products array format
            const productsToProcess = pbx.products || (pbx.productId ? [{ productId: pbx.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name} - VoIP PBX${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            pbx.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'VoIP PBX Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name} - VoIP PBX${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            });
          }

          if (Array.isArray(rack.headend)) {
            rack.headend.forEach((headend: any) => {
            // Support new products array format
            const productsToProcess = headend.products || (headend.productId ? [{ productId: headend.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name} - Headend${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            headend.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'Headend Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name} - Headend${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            });
          }

          if (Array.isArray(rack.nvr)) {
            rack.nvr.forEach((nvr: any) => {
            // Support new products array format
            const productsToProcess = nvr.products || (nvr.productId ? [{ productId: nvr.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name} - NVR${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            nvr.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'NVR Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name} - NVR${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            });
          }

          if (Array.isArray(rack.ata)) {
            rack.ata.forEach((ata: any) => {
            // Support new products array format
            const productsToProcess = ata.products || (ata.productId ? [{ productId: ata.productId, quantity: 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name} - ATA${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            ata.services?.forEach((svc: any) => {
              const key = svc.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, {
                  id: svc.serviceId,
                  name: getServiceName(svc.serviceId),
                  code: svc.serviceId,
                  category: 'ATA Service',
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const service = servicesMap.get(key)!;
              service.quantity += (svc.quantity || 1) * floorMultiplier;
              service.locations.push(`${floor.name} - ${rack.name} - ATA${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            });
          }

          rack.connections?.forEach((conn: any) => {
            // Support new products array format
            const productsToProcess = conn.products || (conn.productId ? [{ productId: conn.productId, quantity: conn.quantity || 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * floorMultiplier;
              product.locations.push(`${floor.name} - ${rack.name}${floorMultiplier > 1 ? ` (×${floorMultiplier})` : ''}`);
            });
            
            conn.services?.forEach((svc: any) => {
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

        floor.rooms.forEach((room: any) => {
          const roomMultiplier = getRoomMultiplier(room);
          const totalMultiplier = getTotalMultiplier(floor, room);
          
          room.devices?.forEach((device: any) => {
            const productsToProcess = device.products || (device.productId ? [{ productId: device.productId, quantity: device.quantity || 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * totalMultiplier;
              
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
            });
            
            device.services?.forEach((svc: any) => {
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

          room.outlets?.forEach((outlet: any) => {
            // Support new products array format (multiple products per outlet)
            const productsToProcess = outlet.products || (outlet.productId ? [{ productId: outlet.productId, quantity: outlet.quantity || 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * totalMultiplier;
              
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
            });
            
            outlet.services?.forEach((svc: any) => {
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

          room.connections?.forEach((conn: any) => {
            // Support new products array format (multiple products per connection)
            const productsToProcess = conn.products || (conn.productId ? [{ productId: conn.productId, quantity: conn.quantity || 1 }] : []);
            
            productsToProcess.forEach((productAssignment: any) => {
              const key = productAssignment.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, {
                  id: productAssignment.productId,
                  name: getProductName(productAssignment.productId),
                  code: productAssignment.productId,
                  brand: getProductBrand(productAssignment.productId),
                  category: getProductCategory(productAssignment.productId),
                  quantity: 0,
                  unitPrice: 0,
                  margin: 0,
                  totalPrice: 0,
                  locations: []
                });
              }
              const product = productsMap.get(key)!;
              product.quantity += productAssignment.quantity * totalMultiplier;
              
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
            });
            
            conn.services?.forEach((svc: any) => {
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

  // Wrapper that uses current buildings state with useCallback
  const collectAssignedItems = useCallback(() => {
    return collectAssignedItemsFromBuildings(buildings);
  }, [buildings, getProductBrand, getProductCategory, getProductName, getServiceName, getTotalMultiplier, collectAssignedItemsFromBuildings]);

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

  // Pricing helper functions (use context, auto-saves to database)
  const updateProductPricingLocal = (productId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = productPricing.get(productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice / (1 - updated.margin / 100);
    
    // Update via context (triggers auto-save to database, NO localStorage)
    updateProductPricing(productId, updated);
  };

  const updateServicePricingLocal = (serviceId: string, field: 'unitPrice' | 'margin', value: number) => {
    const current = servicePricing.get(serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
    const updated = { ...current, [field]: value };
    updated.totalPrice = updated.unitPrice / (1 - updated.margin / 100);
    
    // Update via context (triggers auto-save to database, NO localStorage)
    updateServicePricing(serviceId, updated);
  };

  const handleGenerateInfrastructureExcel = async () => {
    try {
      // AUTO-SAVE before generating (context auto-saves, but ensure it's complete)
      console.log('💾 Ensuring data is saved before generating Infrastructure Excel...');
      await saveToDatabase();
      
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
      console.log('🚀 Starting BOM generation...');
      
      // STEP 1: AUTO-SAVE current data before generating
      console.log('💾 Ensuring data is saved before generating BOM...');
      await saveToDatabase();
      
      // STEP 2: Fetch fresh data from database
      const siteSurveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
      const siteSurveyData = await siteSurveyRes.json();
      
      if (!siteSurveyData?.wizardData?.buildings) {
        toast({
          title: "Error",
          description: "Failed to fetch site survey data",
          variant: "destructive",
        });
        return;
      }
      
      const freshBuildings = siteSurveyData.wizardData.buildings;
      
      // Load pricing data from database
      const dbProductPricing = siteSurveyData.wizardData.productPricing || {};
      const dbServicePricing = siteSurveyData.wizardData.servicePricing || {};
      
      // Use the existing collectAssignedItemsFromBuildings function
      const { products: freshProducts, services: freshServices } = collectAssignedItemsFromBuildings(freshBuildings);
      
      if (!freshProducts || freshProducts.length === 0) {
        toast({
          title: "No Items Found",
          description: "No products found. Please add items in Step 2 first.",
          variant: "destructive",
        });
        return;
      }

      // Prepare products data with pricing FROM DATABASE
      const productsWithPricing = (freshProducts || []).map((product: any) => {
        const pricing = dbProductPricing[product.id] || { unitPrice: 0, margin: 0, totalPrice: 0 };
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

      // Prepare services data with pricing FROM DATABASE
      const servicesWithPricing = (freshServices || []).map((service: any) => {
        const pricing = dbServicePricing[service.id] || { unitPrice: 0, margin: 0, totalPrice: 0 };
        return {
          ...service,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice * service.quantity
        };
      });

      const response = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsWithPricing,
          services: servicesWithPricing,
          siteSurveyName: buildings[0]?.name || 'Site-Survey',
          siteSurveyId: siteSurveyId // Add for versioning
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

  const handleGenerateProposal = async () => {
    try {
      console.log('🚀 Starting Proposal generation and ERP submission...');
      
      // STEP 1: AUTO-SAVE current data before generating
      console.log('💾 Ensuring data is saved before generating Proposal...');
      await saveToDatabase();
      
      // STEP 2: Fetch fresh data from database
      const siteSurveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
      const siteSurveyData = await siteSurveyRes.json();
      
      if (!siteSurveyData.success || !siteSurveyData.data?.wizardData?.buildings) {
        toast({
          title: "Error",
          description: "Failed to fetch site survey data",
          variant: "destructive",
        });
        return;
      }
      
      const freshBuildings = siteSurveyData.data.wizardData.buildings;
      console.log('📦 Fresh buildings from DB for Proposal:', freshBuildings);
      
      // Load pricing data from database
      const dbProductPricing = siteSurveyData.data.wizardData.productPricing || {};
      const dbServicePricing = siteSurveyData.data.wizardData.servicePricing || {};
      console.log('💰 Loaded pricing from DB for Proposal:', {
        productsCount: Object.keys(dbProductPricing).length,
        servicesCount: Object.keys(dbServicePricing).length
      });
      
      // Collect ALL products from fresh buildings data
      const freshProducts: any[] = [];
      const freshServices: any[] = [];
      const productsMap = new Map();
      const servicesMap = new Map();
      
      freshBuildings.forEach((building: any) => {
        const collectProducts = (elements: any[], location: string) => {
          if (!Array.isArray(elements)) return;
          elements.forEach((element: any) => {
            const products = element.products || (element.productId ? [{ productId: element.productId, quantity: element.quantity || 1 }] : []);
            if (products.length === 0) return;
            products.forEach((prod: any) => {
              const key = prod.productId;
              if (!productsMap.has(key)) {
                productsMap.set(key, { id: key, quantity: prod.quantity || 1, locations: [location] });
              } else {
                const existing = productsMap.get(key);
                existing.quantity += (prod.quantity || 1);
                existing.locations.push(location);
              }
            });
          });
        };
        
        const collectServices = (elements: any[], location: string) => {
          if (!Array.isArray(elements)) return;
          elements.forEach((element: any) => {
            const services = element.services || [];
            services.forEach((serv: any) => {
              const key = serv.serviceId;
              if (!servicesMap.has(key)) {
                servicesMap.set(key, { id: key, quantity: serv.quantity || 1, locations: [location] });
              } else {
                const existing = servicesMap.get(key);
                existing.quantity += (serv.quantity || 1);
                existing.locations.push(location);
              }
            });
          });
        };
        
        if (building.centralRack) {
          collectProducts(building.centralRack.cableTerminations || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.switches || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.routers || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.servers || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.voipPbx || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.headend || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.nvr || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.ata || [], `${building.name} - Central Rack`);
          
          collectServices(building.centralRack.cableTerminations || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.switches || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.routers || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.servers || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.voipPbx || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.headend || [], `${building.name} - Central Rack`);
          collectServices(building.centralRack.nvr || [], `${building.name} - Central Rack`);
        }
        
        building.floors?.forEach((floor: any) => {
          floor.racks?.forEach((rack: any) => {
            collectProducts(rack.switches || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.routers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.servers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.voipPbx || [], `${building.name} - ${floor.name} - ${rack.name}`);
            
            collectServices(rack.switches || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectServices(rack.routers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectServices(rack.servers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectServices(rack.voipPbx || [], `${building.name} - ${floor.name} - ${rack.name}`);
          });
        });
      });
      
      freshProducts.push(...Array.from(productsMap.values()));
      freshServices.push(...Array.from(servicesMap.values()));
      
      console.log('📦 Collected products for Proposal:', freshProducts.length);
      console.log('📦 Collected services for Proposal:', freshServices.length);
      
      // Check if we have products OR services (services-only is valid!)
      if (freshProducts.length === 0 && freshServices.length === 0) {
        toast({
          title: "No Items",
          description: "No products or services found. Please add items in Step 2 first.",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`✅ Proposal will include: ${freshProducts.length} products, ${freshServices.length} services`);

      // Prepare equipment data with pricing and ERP codes
      const equipment: any[] = [];

      // Add products with SODTYPE and VAT (prices from database)
      freshProducts.forEach((product: any) => {
        const pricing = dbProductPricing[product.id] || { unitPrice: 0, margin: 0, totalPrice: 0 };
        const productDetails = productsList.find(p => p.id === product.id) || {};
        console.log(`💰 Proposal product ${product.id}: pricing =`, pricing);
        
        equipment.push({
          id: product.id,
          type: 'product',
          name: product.name || productDetails.name || 'Unknown Product',
          brand: product.brand || productDetails.brand?.name || '',
          category: product.category || productDetails.category?.name || '',
          quantity: product.quantity || 1,
          price: pricing.unitPrice || 0,
          margin: pricing.margin || 0,
          totalPrice: (pricing.totalPrice || 0) * (product.quantity || 1),
          erpCode: productDetails.mtrl || productDetails.code || '',
          mtrl: productDetails.mtrl || productDetails.code || '',
          vat: 1410, // VAT code for 24% (Greece standard)
          sodtype: '52', // Product type in ERP
          images: productDetails.images || [],
          specifications: productDetails.specifications || [],
          translations: productDetails.translations || [],
        });
      });

      // Add services with SODTYPE and VAT (prices from database)
      freshServices.forEach((service: any) => {
        const pricing = dbServicePricing[service.id] || { unitPrice: 0, margin: 0, totalPrice: 0 };
        const serviceDetails = servicesList.find(s => s.id === service.id);
        console.log(`💰 Proposal service ${service.id}: pricing =`, pricing);
        
        equipment.push({
          id: service.id,
          type: 'service',
          name: service.name || serviceDetails?.name || 'Unknown Service',
          category: service.category || serviceDetails?.category || '',
          quantity: service.quantity || 1,
          price: pricing.unitPrice || 0,
          margin: pricing.margin || 0,
          totalPrice: (pricing.totalPrice || 0) * (service.quantity || 1),
          erpCode: serviceDetails?.mtrl || serviceDetails?.code || '',
          mtrl: serviceDetails?.mtrl || serviceDetails?.code || '',
          vat: 1410, // VAT code for 24% (Greece standard)
          sodtype: '51', // Service type in ERP
        });
      });

      console.log('📋 Equipment prepared for proposal:', {
        totalItems: equipment.length,
        itemsWithERPCodes: equipment.filter(e => e.erpCode).length,
        itemsWithoutERPCodes: equipment.filter(e => !e.erpCode).length,
      });

      // Call the API to create proposal in ERP
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment,
          series: '7001', // Default series for proposals
          comments: `Proposal for Site Survey - Generated from CRM on ${new Date().toLocaleDateString('el-GR')}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate proposal');
      }

      console.log('✅ Proposal created successfully:', data);

      toast({
        title: "Επιτυχής Δημιουργία Προσφοράς στο ERP",
        description: `Κωδικός: ${data.proposalNumber || 'N/A'} | FINDOC: ${data.erpData?.findoc || 'N/A'} | Σύνολο: €${data.erpData?.total?.toFixed(2) || '0.00'} (€${data.erpData?.turnover?.toFixed(2) || '0.00'} + ΦΠΑ €${data.erpData?.vatAmount?.toFixed(2) || '0.00'})`,
        duration: 8000,
      });

      // Optionally redirect to proposals page
      // window.location.href = '/proposals';

    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: "Σφάλμα",
        description: error instanceof Error ? error.message : "Failed to generate proposal",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProductsAnalysis = async () => {
    try {
      console.log('🚀 Starting Products Analysis generation...');
      
      // AUTO-SAVE first
      await saveToDatabase();
      
      // Fetch fresh buildings data from database
      const siteSurveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
      const siteSurveyData = await siteSurveyRes.json();
      
      if (!siteSurveyData.success || !siteSurveyData.data?.wizardData?.buildings) {
        toast({
          title: "Error",
          description: "Failed to fetch site survey data",
          variant: "destructive",
        });
        return;
      }
      
      const freshBuildings = siteSurveyData.data.wizardData.buildings;
      console.log('📦 Fresh buildings from DB:', freshBuildings);
      
      // Collect ALL products from buildings (regardless of isFutureProposal status)
      const allProductsFromBOM: any[] = [];
      const productsMap = new Map();
      
      freshBuildings.forEach((building: any) => {
        const collectProducts = (elements: any[], location: string) => {
          if (!Array.isArray(elements)) return;
          elements.forEach((element: any) => {
            // COLLECT ALL PRODUCTS - Don't filter by isFutureProposal!
            const products = element.products || (element.productId ? [{ productId: element.productId, quantity: element.quantity || 1 }] : []);
            
            if (products.length === 0) return; // Skip if no products
            
            products.forEach((prod: any) => {
              const key = prod.productId;
              console.log(`  ✅ Found product: ${key}, quantity: ${prod.quantity}`);
              if (!productsMap.has(key)) {
                productsMap.set(key, { id: key, quantity: prod.quantity || 1, locations: [location] });
              } else {
                const existing = productsMap.get(key);
                existing.quantity += (prod.quantity || 1);
                existing.locations.push(location);
              }
            });
          });
        };
        
        if (building.centralRack) {
          collectProducts(building.centralRack.cableTerminations || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.switches || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.routers || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.servers || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.voipPbx || [], `${building.name} - Central Rack - VoIP PBX`);
          collectProducts(building.centralRack.headend || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.nvr || [], `${building.name} - Central Rack`);
          collectProducts(building.centralRack.ata || [], `${building.name} - Central Rack`);
        }
        
        building.floors?.forEach((floor: any) => {
          floor.racks?.forEach((rack: any) => {
            collectProducts(rack.switches || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.routers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.servers || [], `${building.name} - ${floor.name} - ${rack.name}`);
            collectProducts(rack.voipPbx || [], `${building.name} - ${floor.name} - ${rack.name}`);
          });
        });
      });
      
      // Convert to array and enrich with product details
      Array.from(productsMap.values()).forEach((prod: any) => {
        const fullProduct = productsList.find(p => p.id === prod.id);
        console.log(`📦 Product: ${prod.id}`, {
          name: fullProduct?.name,
          quantity: prod.quantity,
          images: fullProduct?.images?.length || 0,
          specs: fullProduct?.specifications?.length || 0
        });
        
        allProductsFromBOM.push({
          id: prod.id,
          name: fullProduct?.name || 'Unknown',
          code: fullProduct?.code || '',
          brand: fullProduct?.brand?.name || '',
          category: fullProduct?.category?.name || '',
          quantity: prod.quantity,
          images: fullProduct?.images || [],
          specifications: fullProduct?.specifications || [],
          translations: fullProduct?.translations || [],
          locations: prod.locations,
        });
      });
      
      console.log('📦 Products collected:', {
        count: allProductsFromBOM.length,
        products: allProductsFromBOM
      });
      
      if (allProductsFromBOM.length === 0) {
        toast({
          title: "No Products",
          description: "No products found. Add products to equipment in Step 2 first.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Products Analysis Data being sent:', {
        productsCount: allProductsFromBOM.length,
        allProducts: allProductsFromBOM.map(p => ({ 
          id: p.id, 
          name: p.name, 
          quantity: p.quantity, 
          images: p.images?.length, 
          specs: p.specifications?.length,
          translations: p.translations?.length 
        }))
      });

      const response = await fetch('/api/site-surveys/generate-products-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: allProductsFromBOM,
          siteSurveyName: buildings[0]?.name || 'Site-Survey',
          siteSurveyId: siteSurveyId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate Products Analysis');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Products-Analysis-${buildings[0]?.name || 'Site-Survey'}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success!",
        description: `Products Analysis generated with ${allProductsFromBOM.length} products!`,
      });

    } catch (error) {
      console.error('Error generating Products Analysis:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate Products Analysis",
        variant: "destructive",
      });
    }
  };

  const handleGenerateProposalDocument = async () => {
    try {
      console.log('📄 Starting comprehensive proposal document generation...');
      
      // AUTO-SAVE before generating
      console.log('💾 Ensuring data is saved before generating Proposal Document...');
      await saveToDatabase();
      
      // Fetch fresh data from database
      const siteSurveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
      const siteSurveyData = await siteSurveyRes.json();
      
      if (!siteSurveyData.success || !siteSurveyData.data?.wizardData?.buildings) {
        toast({
          title: "Error",
          description: "Failed to fetch site survey data",
          variant: "destructive",
        });
        return;
      }
      
      const freshBuildings = siteSurveyData.data.wizardData.buildings;
      const { products: freshProducts, services: freshServices } = collectAssignedItemsFromBuildings(freshBuildings);
      
      console.log('📦 Fresh collected data:', {
        products: freshProducts.length,
        services: freshServices.length
      });
      
      // Check if we have products OR services
      if ((!freshProducts || freshProducts.length === 0) && (!freshServices || freshServices.length === 0)) {
        toast({
          title: "No Items",
          description: "No products or services found. Please add items in Step 2 first.",
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Document will include: ${freshProducts.length} products, ${freshServices.length} services`);

      // Load pricing from database
      const dbProductPricing = siteSurveyData.data.wizardData.productPricing || {};
      const dbServicePricing = siteSurveyData.data.wizardData.servicePricing || {};

      // Prepare products with pricing from database
      const productsWithPricing = (freshProducts || []).map((product: any) => {
        const pricing = dbProductPricing[product.id] || { unitPrice: 0, margin: 0, totalPrice: 0 };
        const productDetails = productsList.find(p => p.id === product.id) || {};
        
        return {
          id: product.id,
          name: product.name || productDetails.name || 'Unknown Product',
          brand: productDetails.brand?.name || product.brand || '',
          category: productDetails.category?.name || product.category || '',
          quantity: product.quantity || 1,
          unitPrice: pricing.unitPrice || 0,
          margin: pricing.margin || 0,
          totalPrice: pricing.totalPrice || 0,
          isOptional: product.isOptional || false,
          images: productDetails.images || [],
          specifications: productDetails.specifications || [],
          translations: productDetails.translations || [],
        };
      });

      // Prepare services with pricing (prices optional - default to 0 if not set)
      const servicesWithPricing = (freshServices || []).map((service: any) => {
        const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        
        return {
          id: service.id,
          name: service.name || 'Unknown Service',
          category: service.category || '',
          quantity: service.quantity || 1,
          unitPrice: pricing.unitPrice || 0,
          margin: pricing.margin || 0,
          totalPrice: pricing.totalPrice || 0,
        };
      });

      console.log('📋 Prepared data for proposal:', {
        products: productsWithPricing.length,
        services: servicesWithPricing.length
      });

      // Call API to generate comprehensive proposal document
      // Note: Technical descriptions will be pulled from the latest Proposal record if available
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-proposal-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsWithPricing,
          services: servicesWithPricing,
          technicalDescription: '', // Will use data from Proposal record if exists
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate proposal document');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Proposal_${siteSurveyData.data.projectName || 'SiteSurvey'}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Επιτυχία",
        description: "Η πλήρης προσφορά δημιουργήθηκε επιτυχώς!",
        duration: 5000,
      });
    } catch (error) {
      console.error('Error generating proposal document:', error);
      toast({
        title: "Σφάλμα",
        description: error instanceof Error ? error.message : "Failed to generate proposal document",
        variant: "destructive",
      });
    }
  };

  const handleGenerateCompleteProposal = async () => {
    try {
      console.log('📄 Starting complete proposal generation (new format)...');
      
      // AUTO-SAVE before generating
      console.log('💾 Ensuring data is saved before generating Complete Proposal...');
      await saveToDatabase();
      
      // Fetch fresh data from database
      const siteSurveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
      const siteSurveyData = await siteSurveyRes.json();
      
      if (!siteSurveyData.success || !siteSurveyData.data?.wizardData?.buildings) {
        toast({
          title: "Error",
          description: "Failed to fetch site survey data",
          variant: "destructive",
        });
        return;
      }
      
      const freshBuildings = siteSurveyData.data.wizardData.buildings;
      const { products: freshProducts, services: freshServices } = collectAssignedItemsFromBuildings(freshBuildings);
      
      console.log('📦 Fresh collected data:', {
        products: freshProducts.length,
        services: freshServices.length
      });
      
      // Check if we have products OR services
      if ((!freshProducts || freshProducts.length === 0) && (!freshServices || freshServices.length === 0)) {
        toast({
          title: "No Items",
          description: "No products or services found. Please add items in Step 2 first.",
          variant: "destructive",
        });
        return;
      }

      console.log(`✅ Document will include: ${freshProducts.length} products, ${freshServices.length} services`);

      // Load pricing from database
      const dbProductPricing = siteSurveyData.data.wizardData.productPricing || {};
      const dbServicePricing = siteSurveyData.data.wizardData.servicePricing || {};

      // Prepare products with pricing from database
      const productsWithPricing = (freshProducts || []).map((product: any) => {
        const pricing = productPricing.get(product.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        const productDetails = getProductDetails(product.id);
        
        return {
          id: product.id,
          name: product.name,
          brand: productDetails.brand || product.brand,
          category: productDetails.category || product.category,
          quantity: product.quantity,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice,
          isOptional: product.isOptional || false,
        };
      });

      // Prepare services with pricing
      const servicesWithPricing = (freshServices || []).map((service: any) => {
        const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
        
        return {
          id: service.id,
          name: service.name,
          category: service.category,
          quantity: service.quantity,
          unitPrice: pricing.unitPrice,
          margin: pricing.margin,
          totalPrice: pricing.totalPrice,
        };
      });

      console.log('📋 Prepared data for complete proposal:', {
        products: productsWithPricing.length,
        services: servicesWithPricing.length
      });

      // Call API to generate complete proposal document
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/generate-complete-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsWithPricing,
          services: servicesWithPricing,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate complete proposal');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Complete-Proposal_${siteSurveyData.data.projectName || 'SiteSurvey'}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Επιτυχία",
        description: "Η ολοκληρωμένη προσφορά δημιουργήθηκε επιτυχώς!",
        duration: 5000,
      });
    } catch (error) {
      console.error('Error generating complete proposal:', error);
      toast({
        title: "Σφάλμα",
        description: error instanceof Error ? error.message : "Failed to generate complete proposal",
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
        <Card className={collectedProducts.length === 0 ? "border-red-500 border-2" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Σύνολο Προϊόντων
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${collectedProducts.length === 0 ? "text-red-600" : ""}`}>
              {collectedProducts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {collectedProducts.length === 0 ? "⚠️ Δεν βρέθηκαν προϊόντα!" : "Διαφορετικά προϊόντα"}
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

      {/* Debug Section - Only show if no products collected */}
      {collectedProducts.length === 0 && (
        <Card className="border-red-500 border-2 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <span>⚠️ ΠΡΟΣΟΧΗ: Δεν βρέθηκαν προϊόντα!</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-red-600">
              Η συλλογή δεδομένων δεν βρήκε προϊόντα. Ελέγξτε:
            </p>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              <li>Έχετε προσθέσει προϊόντα στο Βήμα 2;</li>
              <li>Τα προϊόντα έχουν αποθηκευτεί σωστά;</li>
              <li>Ανοίξτε το console (F12) και δείτε τα logs</li>
            </ul>
            <div className="mt-4">
              <p className="text-xs font-mono text-gray-600">Buildings count: {buildings.length}</p>
              <p className="text-xs font-mono text-gray-600">
                Central rack exists: {buildings[0]?.centralRack ? "Yes" : "No"}
              </p>
              {buildings[0]?.centralRack && (
                <>
                  <p className="text-xs font-mono text-gray-600">
                    Terminations: {buildings[0].centralRack.cableTerminations?.length || 0}
                  </p>
                  <p className="text-xs font-mono text-gray-600">
                    Switches: {buildings[0].centralRack.switches?.length || 0}
                  </p>
                  {buildings[0].centralRack.cableTerminations?.[0] && (
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <p className="text-xs font-bold">Sample Termination:</p>
                      <pre className="text-xs overflow-auto max-h-32">
                        {JSON.stringify(buildings[0].centralRack.cableTerminations[0], null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
            <Button
              onClick={() => {
                console.log('📋 FULL BUILDINGS DATA:', JSON.stringify(buildings, null, 2));
                alert('Buildings data logged to console! Press F12 to see it.');
              }}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Show Full Buildings JSON in Console
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Products by Brand */}
      <div className="space-y-6">
        <h3 className="text-base font-semibold">Προϊόντα ανά Μάρκα</h3>

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
            <CardContent className="bg-white">
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
                        <tr key={product.id} className="border-b hover:bg-gray-50">
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
                                <div className={`w-8 h-8 bg-blue-100 dark:bg-blue-200 rounded-full flex items-center justify-center ${productsList.find(p => p.id === product.id)?.images?.[0]?.url ? 'hidden' : ''}`}>
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
                                onChange={(e) => updateProductPricingLocal(product.id, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                                onChange={(e) => updateProductPricingLocal(product.id, 'margin', parseFloat(e.target.value) || 0)}
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
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteProduct(product.id)} 
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Διαγραφή Προϊόντος
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
          <CardContent className="bg-white">
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
                    <th className="text-center p-2 font-semibold text-xs">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody>
                  {collectedServices.map((service) => {
                    const pricing = servicePricing.get(service.id) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                    return (
                      <tr key={service.id} className="border-b hover:bg-gray-50">
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
                            onChange={(e) => updateServicePricingLocal(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-xs h-7"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.1"
                            value={pricing.margin}
                            onChange={(e) => updateServicePricingLocal(service.id, 'margin', parseFloat(e.target.value) || 0)}
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
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
        <CardContent className="pt-6 bg-white">
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
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-xs">
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
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-xs">
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
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-xs">
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