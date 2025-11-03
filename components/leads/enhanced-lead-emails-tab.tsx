"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Mail, 
  Loader2, 
  Link2, 
  Search, 
  Eye, 
  User, 
  Clock, 
  ChevronDown,
  ChevronUp,
  X,
  Users,
  Send,
  RefreshCw,
} from "lucide-react";
import { LeadEmailComposeDialog } from "./lead-email-compose-dialog";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface EmailMessage {
  id: string;
  subject: string | null;
  fromEmail: string;
  fromName: string | null;
  toEmail: string | null;
  ccEmail: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  receivedAt: string;
}

interface EmailThread {
  id: string;
  subject: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  messages: EmailMessage[];
  leadId: string | null;
}

interface LeadEmailsTabProps {
  leadId: string;
  leadNumber: string;
  leadContacts: Array<{ email: string | null }>;
  ownerEmail?: string | null;
  assigneeEmail?: string | null;
}

export function EnhancedLeadEmailsTab({ 
  leadId, 
  leadNumber, 
  leadContacts,
  ownerEmail,
  assigneeEmail 
}: LeadEmailsTabProps) {
  const [loading, setLoading] = useState(false);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<any>(null);
  const [linkingThreadId, setLinkingThreadId] = useState<string | null>(null);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [leadTitle, setLeadTitle] = useState("");

  const fetchEmails = async () => {
    setLoading(true);
    try {
      console.log("Fetching emails for lead:", leadId, "Lead number:", leadNumber);
      const res = await fetch(`/api/leads/${leadId}/emails/search`);
      const data = await res.json();
      console.log("Email search response:", data);
      setEmailThreads(data.threads || []);
      setSearchCriteria(data.searchCriteria);
      if (data.leadTitle) {
        setLeadTitle(data.leadTitle);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [leadId]);

  const linkEmailToLead = async (threadId: string) => {
    setLinkingThreadId(threadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/emails/${threadId}/link`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Email linked to lead successfully");
        fetchEmails(); // Refresh the list
      } else {
        toast.error("Failed to link email");
      }
    } catch (error) {
      console.error("Error linking email:", error);
      toast.error("An error occurred");
    } finally {
      setLinkingThreadId(null);
    }
  };

  const viewEmail = (message: EmailMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const toggleThread = (threadId: string) => {
    setExpandedThreadId(expandedThreadId === threadId ? null : threadId);
  };

  const highlightLeadNumber = (text: string | null) => {
    if (!text || !leadNumber) return text;
    
    // Highlight lead number if it appears in the text
    const regex = new RegExp(`(${leadNumber})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 font-semibold">$1</mark>');
  };

  const parseRecipients = (recipientString: string | null) => {
    if (!recipientString) return [];
    
    // Parse email addresses from string (format could be "email@domain.com" or "Name <email@domain.com>")
    const emails = recipientString.split(/[,;]/).map(r => r.trim()).filter(Boolean);
    return emails;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header with Compose Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">EMAIL COMMUNICATIONS</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setComposeDialogOpen(true)}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            COMPOSE EMAIL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmails}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search Info */}
      {searchCriteria && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase">SEARCH CRITERIA</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Lead Number:</span>
              <Badge variant="outline">{searchCriteria.leadNumber || "-"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Email Addresses:</span>
              <Badge variant="secondary">{searchCriteria.emailAddresses?.length || 0} found</Badge>
            </div>
            {searchCriteria.emailAddresses && searchCriteria.emailAddresses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {searchCriteria.emailAddresses.map((email: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold uppercase">
          EMAIL THREADS ({emailThreads.length})
        </h3>
        <Button onClick={fetchEmails} size="sm" variant="outline" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {/* No Emails */}
      {!loading && emailThreads.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No emails found matching this lead's criteria</p>
            <p className="text-xs mt-2">
              Search includes: Lead number (<strong>{leadNumber}</strong>), contact emails, owner and assignee
            </p>
          </div>
        </Card>
      )}

      {/* Email Threads List */}
      {!loading && emailThreads.length > 0 && (
        <div className="space-y-3">
          {emailThreads.map((thread) => {
            const isExpanded = expandedThreadId === thread.id;
            const hasLeadNumber = thread.subject?.toLowerCase().includes(leadNumber.toLowerCase());
            
            return (
              <Card key={thread.id} className={`${hasLeadNumber ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="p-4">
                  {/* Thread Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span 
                          className="font-medium flex-1"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightLeadNumber(thread.subject) || '<em>No Subject</em>' 
                          }}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                        </Badge>
                        {thread.leadId === leadId && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Linked
                          </Badge>
                        )}
                        {hasLeadNumber && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                            Contains {leadNumber}
                          </Badge>
                        )}
                      </div>
                      
                      {thread.messages && thread.messages.length > 0 && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            <span className="font-medium">From:</span>
                            <span>{thread.messages[0].fromName || thread.messages[0].fromEmail}</span>
                          </div>
                          {thread.messages[0].toEmail && (
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5" />
                              <span className="font-medium">To:</span>
                              <div className="flex flex-wrap gap-1">
                                {parseRecipients(thread.messages[0].toEmail).map((email, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {email}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {thread.lastMessageAt && formatDate(thread.lastMessageAt)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {thread.messages && thread.messages.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleThread(thread.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {thread.leadId !== leadId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => linkEmailToLead(thread.id)}
                          disabled={linkingThreadId === thread.id}
                        >
                          {linkingThreadId === thread.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Link2 className="h-4 w-4 mr-2" />
                              Link
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Messages */}
                  {isExpanded && thread.messages && (
                    <div className="mt-4 space-y-2 border-t pt-4">
                      {thread.messages.map((message) => (
                        <Card key={message.id} className="p-3 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 text-sm space-y-1">
                              <div className="font-medium">{message.fromName || message.fromEmail}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(message.receivedAt)}
                              </div>
                              {message.bodyText && (
                                <p className="text-xs mt-2 line-clamp-2 text-muted-foreground">
                                  {message.bodyText.substring(0, 150)}...
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewEmail(message)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Compose Email Dialog */}
      <LeadEmailComposeDialog
        open={composeDialogOpen}
        onOpenChange={setComposeDialogOpen}
        leadId={leadId}
        leadNumber={leadNumber}
        leadTitle={leadTitle}
        onEmailSent={fetchEmails}
      />

      {/* Email View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-8">
                <DialogTitle className="text-lg">
                  {selectedMessage?.subject || "No Subject"}
                </DialogTitle>
                <DialogDescription className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">From:</span>
                    <span>{selectedMessage?.fromName || selectedMessage?.fromEmail}</span>
                  </div>
                  {selectedMessage?.toEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">To:</span>
                      <span>{selectedMessage.toEmail}</span>
                    </div>
                  )}
                  {selectedMessage?.ccEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">Cc:</span>
                      <span>{selectedMessage.ccEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">Date:</span>
                    <span>{selectedMessage?.receivedAt && formatDate(selectedMessage.receivedAt)}</span>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          <ScrollArea className="max-h-[calc(90vh-250px)] pr-4">
            {selectedMessage?.bodyHtml ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
              />
            ) : selectedMessage?.bodyText ? (
              <pre className="whitespace-pre-wrap text-sm font-sans">
                {selectedMessage.bodyText}
              </pre>
            ) : (
              <p className="text-muted-foreground text-sm">No content available</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

