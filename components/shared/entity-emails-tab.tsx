"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Calendar, Loader2, ExternalLink, Link2, Save, Users, FolderKanban, Building2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { fetchContactEmails } from "@/app/actions/contact-emails";
import { LinkEmailDialog } from "@/components/contacts/link-email-dialog";
import { EmailThreadModal } from "@/components/contacts/email-thread-modal";
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
  contact?: { id: string; email: string | null };
}

interface EntityEmailsTabProps {
  contacts: Array<{
    contact: {
      id: string;
      email: string | null;
    };
  }>;
  entityId: string;
  entityType: 'customer' | 'supplier';
}

export function EntityEmailsTab({ contacts, entityId, entityType }: EntityEmailsTabProps) {
  const [loading, setLoading] = useState(false);
  const [allEmailThreads, setAllEmailThreads] = useState<EmailThread[]>([]);
  const [linkCustomerDialogOpen, setLinkCustomerDialogOpen] = useState(false);
  const [linkProjectDialogOpen, setLinkProjectDialogOpen] = useState(false);
  const [linkSupplierDialogOpen, setLinkSupplierDialogOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [savingThreadId, setSavingThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [threadModalOpen, setThreadModalOpen] = useState(false);

  useEffect(() => {
    console.log("EntityEmailsTab - contacts changed:", contacts);
    fetchAllEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  const fetchAllEmails = async () => {
    console.log("=== EntityEmailsTab fetchAllEmails ===");
    console.log("Contacts array:", contacts);
    console.log("Contacts length:", contacts?.length);
    
    if (!contacts || contacts.length === 0) {
      console.log("No contacts to fetch emails for");
      return;
    }

    setLoading(true);
    try {
      const allThreads: EmailThread[] = [];
      
      // Fetch emails for each contact that has an email address
      for (const { contact } of contacts) {
        console.log("Processing contact:", contact);
        if (contact.email) {
          console.log(`Contact has email: ${contact.email}, fetching emails...`);
          try {
            const result = await fetchContactEmails(contact.id);
            console.log(`Email fetch result for contact ${contact.id}:`, result);
            if (result.data?.data) {
              const threads = result.data.data;
              console.log(`Found ${threads.length} email threads for contact ${contact.id}`);
              // Add contact info to each thread
              threads.forEach((thread: any) => {
                thread.contact = { id: contact.id, email: contact.email };
              });
              allThreads.push(...threads);
            }
          } catch (error) {
            console.error(`Error fetching emails for contact ${contact.id}:`, error);
          }
        } else {
          console.log(`Contact ${contact.id} has no email address`);
        }
      }

      // Sort by last message date
      allThreads.sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });

      setAllEmailThreads(allThreads);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCustomerLink = async (customerId: string) => {
    if (!selectedThreadId) return;
    
    try {
      setSavingThreadId(selectedThreadId);
      
      // Find the contact for this thread
      const thread = allEmailThreads.find(t => t.id === selectedThreadId);
      if (!thread?.contact) throw new Error('Contact not found');
      
      const response = await fetch(`/api/contacts/${thread.contact.id}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link email');
      }
      
      toast.success("Email linked to customer successfully");
      await fetchAllEmails();
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
      
      const thread = allEmailThreads.find(t => t.id === selectedThreadId);
      if (!thread?.contact) throw new Error('Contact not found');
      
      const response = await fetch(`/api/contacts/${thread.contact.id}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link email');
      }
      
      toast.success("Email linked to project successfully");
      await fetchAllEmails();
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
      
      const thread = allEmailThreads.find(t => t.id === selectedThreadId);
      if (!thread?.contact) throw new Error('Contact not found');
      
      const response = await fetch(`/api/contacts/${thread.contact.id}/emails/${selectedThreadId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to link email');
      }
      
      toast.success("Email linked to supplier successfully");
      await fetchAllEmails();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allEmailThreads.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          No emails found for contacts associated with this {entityType}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allEmailThreads.map((thread) => (
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
                {thread.contact?.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-orange-400" />
                    <span className="text-xs">{thread.contact.email}</span>
                  </div>
                )}
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
                  <Mail className="h-3 w-3" />
                  <p>+{thread.messages.length - 3} more messages</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Link Dialogs */}
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
          contactId={selectedThread.contact?.id || ""}
        />
      )}
    </div>
  );
}
