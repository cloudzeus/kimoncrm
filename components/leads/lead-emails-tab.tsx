"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Loader2, Link2, Search } from "lucide-react";
import { toast } from "sonner";

interface EmailMessage {
  id: string;
  subject: string | null;
  fromEmail: string;
  fromName: string | null;
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

export function LeadEmailsTab({ 
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

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/emails/search`);
      const data = await res.json();
      setEmailThreads(data.threads || []);
      setSearchCriteria(data.searchCriteria);
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

  return (
    <div className="space-y-4">
      {/* Search Info */}
      {searchCriteria && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Search Criteria</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Lead Number: {searchCriteria.leadNumber || "-"}</div>
            <div>Email Addresses: {searchCriteria.emailAddresses?.length || 0} found</div>
          </div>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold">Email Threads</h3>
        <Button onClick={fetchEmails} size="sm" variant="outline">
          Refresh
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
            <p>No emails found matching this lead's criteria</p>
            <p className="text-xs mt-2">Search includes: Lead number, contact emails, owner and assignee</p>
          </div>
        </Card>
      )}

      {/* Email Threads List */}
      {!loading && emailThreads.length > 0 && (
        <div className="space-y-2">
          {emailThreads.map((thread) => (
            <Card key={thread.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {thread.subject || "No Subject"}
                    </span>
                    <Badge variant="secondary">
                      {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                    </Badge>
                    {thread.leadId === leadId && (
                      <Badge className="bg-green-100 text-green-800">
                        Linked
                      </Badge>
                    )}
                  </div>
                  {thread.messages && thread.messages.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      <div>From: {thread.messages[0].fromName || thread.messages[0].fromEmail}</div>
                      <div>
                        {thread.lastMessageAt && (
                          new Date(thread.lastMessageAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

