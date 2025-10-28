"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Calendar, ExternalLink, Link2, Save, Loader2, Users, FolderKanban, Building2, CheckCircle2, MessageSquare } from "lucide-react";
import { fetchContactEmails } from "@/app/actions/contact-emails";
import { LinkEmailDialog } from "./link-email-dialog";
import { EmailThreadModal } from "./email-thread-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmailMessage {
  id: string;
  subject: string | null;
  fromEmail: string;
  fromName: string | null;
  toList: any;
  ccList: any;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
  isRead: boolean;
}

interface EmailThread {
  id: string;
  subject: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  messages: EmailMessage[];
  company?: { id: string; name: string };
  project?: { id: string; name: string };
}

interface ContactEmailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactEmail: string | null;
}

interface ApiResponse {
  success: boolean;
  data: EmailThread[];
  source?: 'database' | 'office365';
}

export function ContactEmailsModal({ open, onOpenChange, contactId, contactEmail }: ContactEmailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [savingThreadId, setSavingThreadId] = useState<string | null>(null);
  const [emailSource, setEmailSource] = useState<'database' | 'office365' | 'unknown'>('unknown');
  const [linkCustomerDialogOpen, setLinkCustomerDialogOpen] = useState(false);
  const [linkProjectDialogOpen, setLinkProjectDialogOpen] = useState(false);
  const [linkSupplierDialogOpen, setLinkSupplierDialogOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [threadModalOpen, setThreadModalOpen] = useState(false);

  const fetchEmails = async () => {
    if (!open || !contactEmail) return;

    try {
      setLoading(true);
      
      // Use server action to fetch emails
      const result = await fetchContactEmails(contactId);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setEmailThreads(result.data.data || []);
        setEmailSource((result.data.source || 'database') as 'database' | 'office365' | 'unknown');
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && contactId) {
      fetchEmails();
    }
  }, [open, contactId]);

  const handleLinkToCustomer = (threadId: string) => {
    setSelectedThreadId(threadId);
    setLinkCustomerDialogOpen(true);
  };

  const handleLinkToProject = (threadId: string) => {
    setSelectedThreadId(threadId);
    setLinkProjectDialogOpen(true);
  };

  const handleLinkToSupplier = (threadId: string) => {
    setSelectedThreadId(threadId);
    setLinkSupplierDialogOpen(true);
  };

  // Check if thread ID is a temporary Office 365 ID (starts with AAMk)
  const isTemporaryThread = (threadId: string) => {
    return threadId.startsWith('AAMk') || threadId.startsWith('temp-');
  };

  const handleCustomerLink = async (customerId: string) => {
    if (!selectedThreadId) return;
    
    try {
      setSavingThreadId(selectedThreadId);
      
      console.log("Linking email:", {
        contactId,
        threadId: selectedThreadId,
        customerId,
        url: `/api/contacts/${contactId}/emails/${selectedThreadId}/link`
      });
      
      // TODO: Create API endpoint to link email thread to customer
      const response = await fetch(`/api/contacts/${contactId}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to link email');
      }
      
      toast.success("Email linked to customer successfully");
      
      // Refresh emails to show updated association
      await fetchEmails();
    } catch (error) {
      console.error("Error linking to customer:", error);
      toast.error("Failed to link email to customer");
      throw error;
    } finally {
      setSavingThreadId(null);
    }
  };

  const handleProjectLink = async (projectId: string) => {
    if (!selectedThreadId) return;
    
    try {
      setSavingThreadId(selectedThreadId);
      
      // TODO: Create API endpoint to link email thread to project
      const response = await fetch(`/api/contacts/${contactId}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link email');
      }
      
      toast.success("Email linked to project successfully");
      
      // Refresh emails to show updated association
      await fetchEmails();
    } catch (error) {
      console.error("Error linking to project:", error);
      toast.error("Failed to link email to project");
      throw error;
    } finally {
      setSavingThreadId(null);
    }
  };

  const handleSupplierLink = async (supplierId: string) => {
    if (!selectedThreadId) return;
    
    try {
      setSavingThreadId(selectedThreadId);
      
      const response = await fetch(`/api/contacts/${contactId}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link email');
      }
      
      toast.success("Email linked to supplier successfully");
      
      // Refresh emails to show updated association
      await fetchEmails();
    } catch (error) {
      console.error("Error linking to supplier:", error);
      toast.error("Failed to link email to supplier");
      throw error;
    } finally {
      setSavingThreadId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return "";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            EMAIL THREADS
            {emailSource === 'office365' && (
              <Badge variant="outline" className="ml-2 text-xs">
                Live from Office 365
              </Badge>
            )}
          </DialogTitle>
                  <DialogDescription>
          Email threads associated with this contact: {contactEmail}
        </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" style={{ maxHeight: "calc(85vh - 120px)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : emailThreads.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">No email threads found for this contact.</p>
              <p className="text-xs text-muted-foreground mb-3">
                Searched for emails from/to: <span className="font-mono text-blue-600 dark:text-blue-400">{contactEmail}</span>
              </p>
              {emailSource === 'office365' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected to Office 365
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {emailThreads.map((thread) => (
                <div
                  key={thread.id}
                  className="border border-border/60 rounded-lg p-4 hover:bg-muted/30 hover:border-border transition-all shadow-sm hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setSelectedThread(thread);
                    setThreadModalOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-2">
                        <Mail className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <h3 className="font-semibold text-sm flex-1">
                          {thread.subject || "No Subject"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-blue-400" />
                          {thread.lastMessageAt && formatDate(thread.lastMessageAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-purple-400" />
                          <span>{thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {thread.company && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-green-600" />
                          {thread.company.name}
                        </Badge>
                      )}
                      {thread.project && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <FolderKanban className="h-3 w-3 text-blue-600" />
                          {thread.project.name}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8">
                            <Save className="h-3 w-3 mr-1" />
                            Link
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleLinkToCustomer(thread.id)}
                            disabled={savingThreadId === thread.id}
                          >
                            <Users className="h-4 w-4 mr-2 text-green-600" />
                            Link to Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLinkToProject(thread.id)}
                            disabled={savingThreadId === thread.id}
                          >
                            <FolderKanban className="h-4 w-4 mr-2 text-blue-600" />
                            Link to Project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleLinkToSupplier(thread.id)}
                            disabled={savingThreadId === thread.id}
                          >
                            <Building2 className="h-4 w-4 mr-2 text-orange-600" />
                            Link to Supplier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Show latest messages */}
                  {thread.messages && thread.messages.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {thread.messages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className="bg-muted/30 border border-border/50 rounded p-3 text-xs hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-orange-500" />
                                <span className="font-medium text-foreground">{message.fromName || message.fromEmail}</span>
                              </div>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-muted-foreground">
                                {Array.isArray(message.toList) && message.toList.length > 0
                                  ? message.toList[0]?.emailAddress?.address || "Unknown"
                                  : "Unknown"}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(message.receivedAt)}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2 pl-5">
                            {truncateText(message.bodyText || message.bodyHtml, 150)}
                          </p>
                        </div>
                      ))}
                      {thread.messages.length > 3 && (
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                          <CheckCircle2 className="h-3 w-3" />
                          <p>+{thread.messages.length - 3} more messages</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>

      {/* Link Dialogs - Outside main dialog to ensure proper z-index */}
      <LinkEmailDialog
        open={linkCustomerDialogOpen}
        onOpenChange={setLinkCustomerDialogOpen}
        type="customer"
        onLink={handleCustomerLink}
      />
      <LinkEmailDialog
        open={linkProjectDialogOpen}
        onOpenChange={setLinkProjectDialogOpen}
        type="project"
        onLink={handleProjectLink}
      />
      <LinkEmailDialog
        open={linkSupplierDialogOpen}
        onOpenChange={setLinkSupplierDialogOpen}
        type="supplier"
        onLink={handleSupplierLink}
      />

      {/* Email Thread Modal */}
      {selectedThread && (
        <EmailThreadModal
          open={threadModalOpen}
          onOpenChange={setThreadModalOpen}
          thread={selectedThread}
          contactId={contactId}
        />
      )}
    </>
  );
}
