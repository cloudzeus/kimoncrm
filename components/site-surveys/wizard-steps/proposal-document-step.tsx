// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BuildingData } from "@/types/building-data";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Building2, User, Phone, Mail, MapPin, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductSpecificationsDialog from "@/components/products/product-specifications-dialog";
import ProductImagesDialog from "@/components/products/product-images-dialog";

interface ProposalDocumentStepProps {
  buildings: BuildingData[];
  onComplete: () => void;
  siteSurveyId: string;
}

interface CompanyDetails {
  name: string;
  description: string;
  address: string;
  taxId: string;
  taxOffice: string;
  phone: string;
  email: string;
}

interface CustomerDetails {
  name: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

export default function ProposalDocumentStep({
  buildings,
  onComplete,
  siteSurveyId
}: ProposalDocumentStepProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Product enhancement states
  const [specificationsDialogOpen, setSpecificationsDialogOpen] = useState(false);
  const [imagesDialogOpen, setImagesDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Products and services data
  const [productsList, setProductsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);

  // Company details form
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: "Your Company Name",
    description: "Information Technology & Telecommunications Systems",
    address: "Your Company Address",
    taxId: "123456789",
    taxOffice: "Your Tax Office",
    phone: "+30 210-1234567",
    email: "info@yourcompany.com"
  });

  // Customer details form
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: ""
  });

  // Fetch company and customer data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch products and services
        const [productsRes, servicesRes] = await Promise.all([
          fetch('/api/products?limit=1000&includeImages=true'),
          fetch('/api/services?limit=1000')
        ]);
        
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProductsList(productsData.data || []);
        }
        
        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServicesList(servicesData.data || []);
        }
        
        // Fetch company details
        const companyRes = await fetch('/api/settings/default-company');
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          if (companyData.data) {
            setCompanyDetails({
              name: companyData.data.companyName || "Your Company Name",
              description: "Information Technology & Telecommunications Systems",
              address: `${companyData.data.address || ''}, ${companyData.data.city || ''} ${companyData.data.zip || ''}`.trim(),
              taxId: companyData.data.taxId || "N/A",
              taxOffice: companyData.data.taxOffice || "N/A",
              phone: companyData.data.phone1 || companyData.data.phone2 || "N/A",
              email: companyData.data.email || "info@company.com"
            });
          }
        }

        // Fetch site survey with customer data
        const surveyRes = await fetch(`/api/site-surveys/${siteSurveyId}`);
        if (surveyRes.ok) {
          const surveyData = await surveyRes.json();
          if (surveyData.survey?.customer) {
            const customer = surveyData.survey.customer;
            setCustomerDetails({
              name: customer.name || "",
              address: customer.address || "",
              contactPerson: surveyData.survey.contact?.name || "",
              phone: customer.phone01 || customer.phone02 || "",
              email: customer.email || ""
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Warning",
          description: "Could not load company/customer details. Please fill them manually.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [siteSurveyId, toast]);

  // Collect all assigned products and services
  const collectAssignedItems = () => {
    const products: any[] = [];
    const services: any[] = [];
    
    buildings.forEach(building => {
      // Central rack
      if (building.centralRack) {
        building.centralRack.cableTerminations?.forEach(term => {
          if (term.productId && term.isFutureProposal) {
            const product = productsList.find(p => p.id === term.productId);
            products.push({
              id: term.productId,
              name: product?.name || `${term.cableType} Termination`,
              brand: product?.brand || 'Generic',
              category: product?.category || 'Cable Termination',
              quantity: term.quantity || 1,
              hasImages: product?.images && product.images.length > 0,
              hasSpecs: product?.specifications && product.specifications.length > 0,
              product: product
            });
          }
          
          term.services?.forEach(svc => {
            const service = servicesList.find(s => s.id === svc.serviceId);
            services.push({
              id: svc.serviceId,
              name: service?.name || 'Termination Service',
              category: service?.category || 'Installation',
              quantity: svc.quantity || 1,
              service: service
            });
          });
        });

        building.centralRack.switches?.forEach(sw => {
          if (sw.productId && sw.isFutureProposal) {
            const product = productsList.find(p => p.id === sw.productId);
            products.push({
              id: sw.productId,
              name: product?.name || sw.model || 'Network Switch',
              brand: product?.brand || sw.brand || 'Generic',
              category: product?.category || 'Network Switch',
              quantity: 1,
              hasImages: product?.images && product.images.length > 0,
              hasSpecs: product?.specifications && product.specifications.length > 0,
              product: product
            });
          }
          
          sw.services?.forEach(svc => {
            const service = servicesList.find(s => s.id === svc.serviceId);
            services.push({
              id: svc.serviceId,
              name: service?.name || 'Switch Configuration',
              category: service?.category || 'Configuration',
              quantity: svc.quantity || 1,
              service: service
            });
          });
        });
      }

      // Floors and rooms
      building.floors?.forEach(floor => {
        floor.racks?.forEach(rack => {
          rack.cableTerminations?.forEach(term => {
            if (term.productId && term.isFutureProposal) {
              const product = productsList.find(p => p.id === term.productId);
              products.push({
                id: term.productId,
                name: product?.name || `${term.cableType} Termination`,
                brand: product?.brand || 'Generic',
                category: product?.category || 'Cable Termination',
                quantity: term.quantity || 1,
                hasImages: product?.images && product.images.length > 0,
                hasSpecs: product?.specifications && product.specifications.length > 0,
                product: product
              });
            }
            
            term.services?.forEach(svc => {
              const service = servicesList.find(s => s.id === svc.serviceId);
              services.push({
                id: svc.serviceId,
                name: service?.name || 'Termination Service',
                category: service?.category || 'Installation',
                quantity: svc.quantity || 1,
                service: service
              });
            });
          });

          rack.switches?.forEach(sw => {
            if (sw.productId && sw.isFutureProposal) {
              const product = productsList.find(p => p.id === sw.productId);
              products.push({
                id: sw.productId,
                name: product?.name || sw.model || 'Network Switch',
                brand: product?.brand || sw.brand || 'Generic',
                category: product?.category || 'Network Switch',
                quantity: 1,
                hasImages: product?.images && product.images.length > 0,
                hasSpecs: product?.specifications && product.specifications.length > 0,
                product: product
              });
            }
            
            sw.services?.forEach(svc => {
              const service = servicesList.find(s => s.id === svc.serviceId);
              services.push({
                id: svc.serviceId,
                name: service?.name || 'Switch Configuration',
                category: service?.category || 'Configuration',
                quantity: svc.quantity || 1,
                service: service
              });
            });
          });
        });

        floor.rooms?.forEach(room => {
          room.devices?.forEach(device => {
            if (device.productId && device.isFutureProposal) {
              const product = productsList.find(p => p.id === device.productId);
              products.push({
                id: device.productId,
                name: product?.name || device.model || device.type,
                brand: product?.brand || device.brand || 'Generic',
                category: product?.category || device.type,
                quantity: device.quantity || 1,
                hasImages: product?.images && product.images.length > 0,
                hasSpecs: product?.specifications && product.specifications.length > 0,
                product: product
              });
            }
            
            device.services?.forEach(svc => {
              const service = servicesList.find(s => s.id === svc.serviceId);
              services.push({
                id: svc.serviceId,
                name: service?.name || 'Device Configuration',
                category: service?.category || 'Configuration',
                quantity: svc.quantity || 1,
                service: service
              });
            });
          });
        });
      });
    });

    return { products, services };
  };

  // Complete site survey
  const handleCompleteSurvey = async () => {
    try {
      setIsCompleting(true);
      
      const response = await fetch(`/api/site-surveys/${siteSurveyId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete survey');
      }

      toast({
        title: "Success",
        description: "Site survey completed successfully!",
      });

      onComplete();
    } catch (error) {
      console.error('Error completing survey:', error);
      toast({
        title: "Error",
        description: "Failed to complete survey",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGenerateInfrastructureExcel = async () => {
    try {
      setIsGenerating(true);
      
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBOM = async () => {
    try {
      setIsGenerating(true);
      
      // Load saved pricing from Step 3
      let productPricingMap = new Map();
      let servicePricingMap = new Map();
      
      try {
        const savedProductPricing = localStorage.getItem(`pricing-products-${siteSurveyId}`);
        const savedServicePricing = localStorage.getItem(`pricing-services-${siteSurveyId}`);
        
        if (savedProductPricing) {
          productPricingMap = new Map(JSON.parse(savedProductPricing));
        }
        if (savedServicePricing) {
          servicePricingMap = new Map(JSON.parse(savedServicePricing));
        }
      } catch (err) {
        console.warn('Could not load pricing data:', err);
      }

      // Collect all products and services from buildings with pricing
      const products: any[] = [];
      const services: any[] = [];
      
      buildings.forEach(building => {
        // Process central rack
        if (building.centralRack) {
          building.centralRack.cableTerminations?.forEach(term => {
            if (term.productId && term.isFutureProposal) {
              const pricing = productPricingMap.get(term.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              products.push({
                id: term.productId,
                name: `${term.cableType} Termination`,
                brand: 'Generic',
                category: 'Cable Termination',
                quantity: term.quantity || 1,
                unitPrice: pricing.unitPrice,
                margin: pricing.margin,
                totalPrice: pricing.totalPrice * (term.quantity || 1),
                locations: ['Central Rack']
              });
            }
            
            term.services?.forEach(svc => {
              const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              services.push({
                id: svc.serviceId,
                name: 'Termination Service',
                category: 'Installation',
                quantity: svc.quantity || 1,
                unitPrice: pricing.unitPrice,
                margin: pricing.margin,
                totalPrice: pricing.totalPrice * (svc.quantity || 1),
                locations: ['Central Rack']
              });
            });
          });

          building.centralRack.switches?.forEach(sw => {
            if (sw.productId && sw.isFutureProposal) {
              const pricing = productPricingMap.get(sw.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              products.push({
                id: sw.productId,
                name: sw.model || 'Network Switch',
                brand: sw.brand || 'Generic',
                category: 'Network Switch',
                quantity: 1,
                unitPrice: pricing.unitPrice,
                margin: pricing.margin,
                totalPrice: pricing.totalPrice,
                locations: ['Central Rack']
              });
            }
            
            sw.services?.forEach(svc => {
              const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              services.push({
                id: svc.serviceId,
                name: 'Switch Configuration',
                category: 'Configuration',
                quantity: svc.quantity || 1,
                unitPrice: pricing.unitPrice,
                margin: pricing.margin,
                totalPrice: pricing.totalPrice * (svc.quantity || 1),
                locations: ['Central Rack']
              });
            });
          });
        }

        // Process floors and racks
        building.floors?.forEach(floor => {
          floor.racks?.forEach(rack => {
            rack.cableTerminations?.forEach(term => {
              if (term.productId && term.isFutureProposal) {
                const pricing = productPricingMap.get(term.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: term.productId,
                  name: `${term.cableType} Termination`,
                  brand: 'Generic',
                  category: 'Cable Termination',
                  quantity: term.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (term.quantity || 1),
                  locations: [`${floor.name} - ${rack.name}`]
                });
              }
              
              term.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Termination Service',
                  category: 'Installation',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${rack.name}`]
                });
              });
            });

            rack.switches?.forEach(sw => {
              if (sw.productId && sw.isFutureProposal) {
                const pricing = productPricingMap.get(sw.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: sw.productId,
                  name: sw.model || 'Network Switch',
                  brand: sw.brand || 'Generic',
                  category: 'Network Switch',
                  quantity: 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice,
                  locations: [`${floor.name} - ${rack.name}`]
                });
              }
              
              sw.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Switch Configuration',
                  category: 'Configuration',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${rack.name}`]
                });
              });
            });

            rack.connections?.forEach(conn => {
              if (conn.productId && conn.isFutureProposal) {
                const pricing = productPricingMap.get(conn.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: conn.productId,
                  name: 'Connection Cable',
                  brand: 'Generic',
                  category: 'Cable',
                  quantity: conn.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (conn.quantity || 1),
                  locations: [`${floor.name} - ${rack.name}`]
                });
              }
              
              conn.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Connection Service',
                  category: 'Installation',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${rack.name}`]
                });
              });
            });
          });

          // Process rooms
          floor.rooms?.forEach(room => {
            room.devices?.forEach(device => {
              if (device.productId && device.isFutureProposal) {
                const pricing = productPricingMap.get(device.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: device.productId,
                  name: device.model || device.type,
                  brand: device.brand || 'Generic',
                  category: device.type,
                  quantity: device.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (device.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              }
              
              device.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Device Configuration',
                  category: 'Configuration',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              });
            });

            room.outlets?.forEach(outlet => {
              if (outlet.productId && outlet.isFutureProposal) {
                const pricing = productPricingMap.get(outlet.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: outlet.productId,
                  name: 'Network Outlet',
                  brand: 'Generic',
                  category: 'Network Outlet',
                  quantity: outlet.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (outlet.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              }
              
              outlet.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Outlet Installation',
                  category: 'Installation',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              });
            });

            room.connections?.forEach(conn => {
              if (conn.productId && conn.isFutureProposal) {
                const pricing = productPricingMap.get(conn.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: conn.productId,
                  name: 'Room Connection',
                  brand: 'Generic',
                  category: 'Cable',
                  quantity: conn.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (conn.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              }
              
              conn.services?.forEach(svc => {
                const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                services.push({
                  id: svc.serviceId,
                  name: 'Room Connection Service',
                  category: 'Installation',
                  quantity: svc.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  margin: pricing.margin,
                  totalPrice: pricing.totalPrice * (svc.quantity || 1),
                  locations: [`${floor.name} - ${room.name}`]
                });
              });
            });
          });
        });
      });

      console.log('🔍 BOM Data:', { products: products.length, services: services.length, productPricingMap, servicePricingMap });

      const response = await fetch('/api/site-surveys/generate-bom-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          services,
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
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!customerDetails.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter customer name",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Load saved pricing from Step 3
      let productPricingMap = new Map();
      let servicePricingMap = new Map();
      
      try {
        const savedProductPricing = localStorage.getItem(`pricing-products-${siteSurveyId}`);
        const savedServicePricing = localStorage.getItem(`pricing-services-${siteSurveyId}`);
        
        if (savedProductPricing) {
          productPricingMap = new Map(JSON.parse(savedProductPricing));
        }
        if (savedServicePricing) {
          servicePricingMap = new Map(JSON.parse(savedServicePricing));
        }
      } catch (err) {
        console.warn('Could not load pricing data:', err);
      }

      // Collect products and services with pricing
      const products: any[] = [];
      const services: any[] = [];
      
      buildings.forEach(building => {
        // Central rack products
        if (building.centralRack) {
          building.centralRack.cableTerminations?.forEach(term => {
            if (term.productId && term.isFutureProposal) {
              const pricing = productPricingMap.get(term.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              products.push({
                id: term.productId,
                name: `${term.cableType} Termination`,
                description: `Cable termination for ${term.cableType}`,
                specifications: [`Type: ${term.cableType}`, `Quantity: ${term.quantity || 1}`],
                quantity: term.quantity || 1,
                unitPrice: pricing.unitPrice,
                totalPrice: pricing.totalPrice * (term.quantity || 1),
                brand: 'Generic',
                category: 'Cable Termination'
              });
            }
            
            term.services?.forEach(svc => {
              const pricing = servicePricingMap.get(svc.serviceId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
              services.push({
                id: svc.serviceId,
                name: 'Termination Service',
                description: 'Installation service',
                quantity: svc.quantity || 1,
                unitPrice: pricing.unitPrice,
                totalPrice: pricing.totalPrice * (svc.quantity || 1)
              });
            });
          });
        }

        // Floor racks and rooms
        building.floors?.forEach(floor => {
          floor.racks?.forEach(rack => {
            rack.switches?.forEach(sw => {
              if (sw.productId && sw.isFutureProposal) {
                const pricing = productPricingMap.get(sw.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: sw.productId,
                  name: sw.model || 'Network Switch',
                  description: `${sw.brand || 'Network'} Switch`,
                  specifications: [`Brand: ${sw.brand}`, `Model: ${sw.model}`, `Ports: ${sw.ports}`],
                  quantity: 1,
                  unitPrice: pricing.unitPrice,
                  totalPrice: pricing.totalPrice,
                  brand: sw.brand || 'Generic',
                  category: 'Network Switch'
                });
              }
            });
          });

          floor.rooms?.forEach(room => {
            room.devices?.forEach(device => {
              if (device.productId && device.isFutureProposal) {
                const pricing = productPricingMap.get(device.productId) || { unitPrice: 0, margin: 0, totalPrice: 0 };
                products.push({
                  id: device.productId,
                  name: device.model || device.type,
                  description: `${device.type} Device`,
                  specifications: [`Type: ${device.type}`, `Brand: ${device.brand}`, `Model: ${device.model}`],
                  quantity: device.quantity || 1,
                  unitPrice: pricing.unitPrice,
                  totalPrice: pricing.totalPrice * (device.quantity || 1),
                  brand: device.brand || 'Generic',
                  category: device.type
                });
              }
            });
          });
        });
      });

      console.log('🔍 Proposal Data:', { 
        buildings: buildings.length, 
        companyDetails, 
        customerDetails, 
        products: products.length, 
        services: services.length 
      });

      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          building: buildings[0],
          companyDetails,
          customerDetails,
          products,
          services
        }),
      });

      console.log('🔍 Proposal Response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 Proposal Error Response:', errorText);
        throw new Error(`Failed to generate proposal: ${response.status} ${errorText}`);
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Technical-Proposal-${customerDetails.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Proposal document generated successfully!",
      });

    } catch (error) {
      console.error('Error generating proposal:', error);
      toast({
        title: "Error",
        description: "Failed to generate proposal document",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Collect proposed items summary
  const getProposedItemsSummary = () => {
    let totalProducts = 0;
    let totalServices = 0;
    const categories = new Set<string>();

    buildings.forEach(building => {
      // Central rack
      if (building.centralRack) {
        building.centralRack.cableTerminations?.forEach(term => {
          if (term.isFutureProposal) {
            totalProducts += term.quantity || 1;
            categories.add('Cable Terminations');
            totalServices += term.services?.length || 0;
          }
        });

        building.centralRack.switches?.forEach(sw => {
          if (sw.isFutureProposal) {
            totalProducts += 1;
            categories.add('Network Switches');
            totalServices += sw.services?.length || 0;
          }
        });

        building.centralRack.routers?.forEach(router => {
          if (router.isFutureProposal) {
            totalProducts += 1;
            categories.add('Network Routers');
            totalServices += router.services?.length || 0;
          }
        });

        building.centralRack.servers?.forEach(server => {
          if (server.isFutureProposal) {
            totalProducts += 1;
            categories.add('Servers');
            totalServices += server.services?.length || 0;
          }
        });
      }

      // Floors
      building.floors.forEach(floor => {
        floor.racks?.forEach(rack => {
          rack.cableTerminations?.forEach(term => {
            if (term.isFutureProposal) {
              totalProducts += term.quantity || 1;
              categories.add('Cable Terminations');
              totalServices += term.services?.length || 0;
            }
          });

          rack.switches?.forEach(sw => {
            if (sw.isFutureProposal) {
              totalProducts += 1;
              categories.add('Network Switches');
              totalServices += sw.services?.length || 0;
            }
          });
        });

        floor.rooms.forEach(room => {
          room.devices?.forEach(device => {
            if (device.isFutureProposal) {
              totalProducts += device.quantity || 1;
              categories.add(device.type);
              totalServices += device.services?.length || 0;
            }
          });

          room.outlets?.forEach(outlet => {
            if (outlet.isFutureProposal) {
              totalProducts += outlet.quantity || 1;
              categories.add('Network Outlets');
              totalServices += outlet.services?.length || 0;
            }
          });
        });
      });
    });

    return { totalProducts, totalServices, categories: Array.from(categories) };
  };

  const summary = getProposedItemsSummary();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading company and customer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Δημιουργία Τεχνικής Προσφοράς</h2>
        </div>
        <p className="text-muted-foreground">
          Δημιουργία επαγγελματικού εγγράφου Word με την προσφορά υποδομής
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proposed Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Total items to be installed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Associated Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Installation & configuration services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Different equipment types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Proposed Equipment Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {summary.categories.map((category) => (
              <Badge key={category} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyDetails.name}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Description</Label>
              <Input
                id="companyDescription"
                value={companyDetails.description}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Company description"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={companyDetails.address}
              onChange={(e) => setCompanyDetails(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Company address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={companyDetails.taxId}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="Tax ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxOffice">Tax Office</Label>
              <Input
                id="taxOffice"
                value={companyDetails.taxOffice}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, taxOffice: e.target.value }))}
                placeholder="Tax Office"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Phone</Label>
              <Input
                id="companyPhone"
                value={companyDetails.phone}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyDetails.email}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email address"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerDetails.name}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Customer company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Customer Address</Label>
            <Textarea
              id="customerAddress"
              value={customerDetails.address || ''}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Customer address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={customerDetails.contactPerson || ''}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Contact person name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={customerDetails.phone || ''}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Customer phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerDetails.email || ''}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Customer email"
            />
          </div>
        </CardContent>
      </Card>

      {/* Download Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Λήψη Εγγράφων
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-white dark:bg-gray-900">
          <p className="text-sm text-muted-foreground">
            Κατεβάστε όλα τα απαραίτητα έγγραφα για την τεχνική προσφορά
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Infrastructure Excel */}
            <Button
              onClick={handleGenerateInfrastructureExcel}
              disabled={isGenerating}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-semibold">Υποδομή Excel</div>
                <div className="text-xs text-muted-foreground">
                  Πλήρης καταγραφή υφιστάμενης κατάστασης
                </div>
              </div>
            </Button>

            {/* BOM Excel */}
            <Button
              onClick={handleGenerateBOM}
              disabled={isGenerating}
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <FileText className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-semibold">BOM Excel</div>
                <div className="text-xs text-muted-foreground">
                  Υλικά & υπηρεσίες ανά μάρκα
                </div>
              </div>
            </Button>

            {/* Word Proposal */}
            <Button
              onClick={handleGenerateProposal}
              disabled={isGenerating}
              className="h-auto py-4 flex flex-col items-center gap-2"
            >
              <Download className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Τεχνική Προσφορά</div>
                <div className="text-xs">
                  Επαγγελματικό έγγραφο Word
                </div>
              </div>
            </Button>
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
              <span className="text-sm text-muted-foreground">Δημιουργία εγγράφου...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conclusion Section */}
      <Card className="bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Συμπέρασμα & Ενίσχυση Προϊόντων
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ελέγξτε και ενισχύστε τα προϊόντα και υπηρεσίες πριν την οριστικοποίηση
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Products Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Προϊόντα</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Προϊόν</TableHead>
                    <TableHead>Μάρκα</TableHead>
                    <TableHead>Κατηγορία</TableHead>
                    <TableHead>Ποσότητα</TableHead>
                    <TableHead>Εικόνες</TableHead>
                    <TableHead>Προδιαγραφές</TableHead>
                    <TableHead>Ενέργειες</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectAssignedItems().products.map((item, index) => (
                    <TableRow key={`${item.id}-${index}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{typeof item.brand === 'string' ? item.brand : item.brand?.name || 'N/A'}</TableCell>
                      <TableCell>{typeof item.category === 'string' ? item.category : item.category?.name || 'N/A'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {item.hasImages ? (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {item.product?.images?.length || 0}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Χρειάζεται
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.hasSpecs ? (
                          <Badge variant="secondary" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Υπάρχει
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Χρειάζεται
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(item.product);
                              setImagesDialogOpen(true);
                            }}
                            disabled={!item.product}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Εικόνες
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(item.product);
                              setSpecificationsDialogOpen(true);
                            }}
                            disabled={!item.product}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Προδιαγραφές
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Services Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Υπηρεσίες</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Υπηρεσία</TableHead>
                    <TableHead>Κατηγορία</TableHead>
                    <TableHead>Ποσότητα</TableHead>
                    <TableHead>Περιγραφή</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectAssignedItems().services.map((item, index) => (
                    <TableRow key={`${item.id}-${index}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.service?.description || 'Δεν υπάρχει περιγραφή'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Regenerate Documents Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => {
                handleGenerateInfrastructureExcel();
                handleGenerateBOM();
                handleGenerateProposal();
              }}
              disabled={isGenerating}
              className="flex items-center gap-2"
              size="lg"
            >
              <RefreshCw className="h-4 w-4" />
              Επανεγγραφή Όλων των Εγγράφων
            </Button>
          </div>

          {/* Complete Survey Button */}
          <div className="flex justify-center pt-4 border-t">
            <Button
              onClick={handleCompleteSurvey}
              disabled={isCompleting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="h-4 w-4" />
              Ολοκλήρωση Μελέτης
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6 bg-white dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Document Contents
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Professional cover page with company and customer details</li>
                <li>• Detailed product specifications with technical details</li>
                <li>• Complete pricing table with products and services</li>
                <li>• Terms and conditions section</li>
                <li>• Professional formatting and styling</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Enhancement Dialogs */}
      {selectedProduct && (
        <>
          <ProductSpecificationsDialog
            product={selectedProduct}
            open={specificationsDialogOpen}
            onOpenChange={setSpecificationsDialogOpen}
          />
          <ProductImagesDialog
            product={selectedProduct}
            open={imagesDialogOpen}
            onOpenChange={setImagesDialogOpen}
          />
        </>
      )}
    </div>
  );
}
