'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, FileText, ShoppingCart, Ticket, FolderOpen, Plus, FileSearch } from 'lucide-react';
import { CompanyStats } from './company-stats';
import { RFPTab } from './rfp-tab';
import { QuotesTab } from './quotes-tab';
import { OrdersTab } from './orders-tab';
import { TicketsTab } from './tickets-tab';
import { ProjectsTab } from './projects-tab';
import { NewTicketDialog } from './new-ticket-dialog';

interface B2BDashboardProps {
  userId: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    website: string | null;
    vatId: string | null;
    supportContracts: Array<{
      id: string;
      name: string;
      sla: {
        id: string;
        name: string;
        responseTimeHours: number;
        resolutionTimeHours: number;
      };
      isActive: boolean;
      endDate: string | null;
    }>;
  };
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    jobTitle: string | null;
    department: string | null;
  };
}

export function B2BDashboard({ userId, company, contact }: B2BDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const activeSupportContracts = company.supportContracts.filter(contract => 
    contract.isActive && (!contract.endDate || new Date(contract.endDate) > new Date())
  );

  return (
    <div className="space-y-6">
      {/* Company Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{company.name}</CardTitle>
                <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                  {company.vatId && (
                    <span>VAT: {company.vatId}</span>
                  )}
                  {company.email && (
                    <span>Company Email: {company.email}</span>
                  )}
                  {company.phone && (
                    <span>Company Phone: {company.phone}</span>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">Contact: </span>
                  {contact.firstName} {contact.lastName}
                  {contact.jobTitle && (
                    <span className="text-muted-foreground"> • {contact.jobTitle}</span>
                  )}
                  {contact.department && (
                    <span className="text-muted-foreground"> • {contact.department}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {activeSupportContracts.length} Active Support Contract{activeSupportContracts.length !== 1 ? 's' : ''}
              </Badge>
              <Button onClick={() => setIsNewTicketOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                NEW TICKET
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <CompanyStats companyId={company.id} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>OVERVIEW</span>
          </TabsTrigger>
          <TabsTrigger value="rfps" className="flex items-center space-x-2">
            <FileSearch className="h-4 w-4" />
            <span>RFPS</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>QUOTES</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>ORDERS</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center space-x-2">
            <Ticket className="h-4 w-4" />
            <span>TICKETS</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center space-x-2">
            <FolderOpen className="h-4 w-4" />
            <span>PROJECTS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SUPPORT CONTRACTS</CardTitle>
              </CardHeader>
              <CardContent>
                {activeSupportContracts.length > 0 ? (
                  <div className="space-y-3">
                    {activeSupportContracts.map((contract) => (
                      <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{contract.name}</p>
                          <p className="text-sm text-muted-foreground">
                            SLA: {contract.sla.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Response: {contract.sla.responseTimeHours}h | Resolution: {contract.sla.resolutionTimeHours}h
                          </p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active support contracts</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QUICK ACTIONS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsNewTicketOpen(true)}
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setActiveTab('rfps')}
                >
                  <FileSearch className="h-4 w-4 mr-2" />
                  Submit RFP
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Request Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rfps">
          <RFPTab companyId={company.id} contactId={contact.id} />
        </TabsContent>

        <TabsContent value="quotes">
          <QuotesTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="tickets">
          <TicketsTab companyId={company.id} />
        </TabsContent>

        <TabsContent value="projects">
          <ProjectsTab companyId={company.id} />
        </TabsContent>
      </Tabs>

      {/* New Ticket Dialog */}
      <NewTicketDialog 
        isOpen={isNewTicketOpen}
        onClose={() => setIsNewTicketOpen(false)}
        companyId={company.id}
        contactId={contact.id}
        supportContracts={activeSupportContracts}
      />
    </div>
  );
}
