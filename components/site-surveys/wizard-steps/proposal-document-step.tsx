"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BuildingData } from "../comprehensive-infrastructure-wizard";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Building2, User, Phone, Mail, MapPin } from "lucide-react";

interface ProposalDocumentStepProps {
  buildings: BuildingData[];
  onComplete: () => void;
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
}: ProposalDocumentStepProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          building: buildings[0], // Use first building for now
          companyDetails,
          customerDetails,
          products: [], // Will be populated from the infrastructure data
          services: []  // Will be populated from the infrastructure data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate proposal');
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
    let categories = new Set<string>();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <FileText className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold">Generate Technical Proposal</h2>
        </div>
        <p className="text-muted-foreground">
          Create a professional Word document with your infrastructure proposal
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

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerateProposal}
          disabled={isGenerating}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate Proposal Document
            </>
          )}
        </Button>
      </div>

      {/* Document Preview Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="pt-6">
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
    </div>
  );
}
