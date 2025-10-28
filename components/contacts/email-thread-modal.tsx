"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Mail, Calendar, Reply, Forward, Send, Loader2, 
  Building2, FolderKanban, User as UserIcon, Clock,
  Paperclip, ExternalLink
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fetchContactEmails } from "@/app/actions/contact-emails";
import { LinkEmailDialog } from "./link-email-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  contentType: string;
  contentBytes: string;
}

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
  attachments?: EmailAttachment[];
}

interface EmailThread {
  id: string;
  subject: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  messages: EmailMessage[];
  company?: { id: string; name: string };
  customer?: { id: string; name: string };
  supplier?: { id: string; name: string };
  project?: { id: string; name: string };
  contact?: { id: string; email: string | null };
  externalId?: string;
}

interface EmailThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thread: EmailThread | null;
  contactId: string;
}

export function EmailThreadModal({ open, onOpenChange, thread, contactId }: EmailThreadModalProps) {
  const [replying, setReplying] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [actionType, setActionType] = useState<'reply' | 'forward' | null>(null);
  const [fullThread, setFullThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && thread) {
      console.log("EmailThreadModal - thread:", thread);
      console.log("EmailThreadModal - messages:", thread.messages);
      
      // If thread has no messages, fetch full details
      if (!thread.messages || thread.messages.length === 0) {
        fetchFullThread();
      } else {
        setFullThread(thread);
      }
    }
  }, [open, thread]);

  const fetchFullThread = async () => {
    if (!thread) return;
    
    try {
      setLoading(true);
      // Use externalId if available (Office 365 thread ID), otherwise use internal ID
      const threadIdentifier = thread.externalId || thread.id;
      console.log("Fetching thread with identifier:", threadIdentifier);
      
      const response = await fetch(`/api/contacts/${contactId}/emails/${threadIdentifier}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("EmailThreadModal - fetched full thread:", data.data);
        console.log("Messages count:", data.data.messages?.length || 0);
        setFullThread(data.data);
      } else {
        console.error("Failed to fetch thread:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching full thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayThread = fullThread || thread;

  if (!thread || !displayThread) return null;

  console.log("EmailThreadModal - displayThread:", displayThread);
  console.log("EmailThreadModal - displayMessages:", displayThread.messages);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReply = () => {
    setActionType('reply');
    setReplying(true);
  };

  const handleForward = () => {
    setActionType('forward');
    setForwarding(true);
  };

  const handleSaveAttachment = (attachment: EmailAttachment, entityType: 'customer' | 'supplier', entityId?: string) => {
    // TODO: Prompt user for customer/supplier selection if entityId is not provided
    // For now, just save to the provided entity
    if (!entityId) {
      toast.error(`No ${entityType} associated with this email`);
      return;
    }

    console.log(`Saving attachment ${attachment.name} to ${entityType} ${entityId}`);
    // TODO: Implement API call to save attachment
    toast.info(`Saving attachment to ${entityType}...`);
  };

  const handleSend = async () => {
    if (!actionType) return;

    try {
      setSending(true);
      
      // Get the first message ID for reply
      const firstMessage = displayThread.messages && displayThread.messages.length > 0 
        ? displayThread.messages[0] 
        : null;
      
      if (actionType === 'reply' && firstMessage) {
        const response = await fetch(`/api/contacts/${contactId}/emails/${displayThread.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId: firstMessage.id,
            content: replyContent,
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Reply sent successfully');
        } else {
          toast.error(`Failed to send reply: ${data.error}`);
        }
      } else {
        // TODO: Implement forward
        toast.error('Forward functionality not yet implemented');
      }
      
      // Reset state
      setReplyContent("");
      setForwardTo("");
      setReplying(false);
      setForwarding(false);
      setActionType(null);
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(`Failed to send email`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {displayThread.subject || "Email Thread"}
          </DialogTitle>
          <DialogDescription>
            Email thread details
          </DialogDescription>
        </DialogHeader>
        
        {/* Email Associations */}
        {(displayThread.customer || displayThread.supplier || displayThread.project) && (
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            {displayThread.customer && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Customer: {displayThread.customer.name}
              </Badge>
            )}
            {displayThread.supplier && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Supplier: {displayThread.supplier.name}
              </Badge>
            )}
            {displayThread.project && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <FolderKanban className="h-3 w-3" />
                Project: {displayThread.project.name}
              </Badge>
            )}
          </div>
        )}

        <div className="flex flex-col h-full">
          {/* Actions */}
          <div className="flex gap-2 mb-4 pb-4 border-b">
            <Button onClick={handleReply} variant="outline" size="sm">
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
            <Button onClick={handleForward} variant="outline" size="sm">
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Office 365
            </Button>
          </div>

          {/* Reply/Forward Area */}
          {replying || forwarding ? (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-3">
                {forwarding ? (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Forward to:
                    </label>
                    <Select value={forwardTo} onValueChange={setForwardTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select user or email" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user1">John Doe (john@example.com)</SelectItem>
                        <SelectItem value="user2">Jane Smith (jane@example.com)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {forwarding ? 'Additional message:' : 'Your reply:'}
                  </label>
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={forwarding ? 'Add any additional notes...' : 'Type your reply...'}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSend} disabled={sending || (forwarding && !forwardTo)}>
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {forwarding ? 'Forward' : 'Send Reply'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReplying(false);
                      setForwarding(false);
                      setReplyContent("");
                      setForwardTo("");
                      setActionType(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4" style={{ maxHeight: "calc(90vh - 300px)" }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
            <div className="space-y-4">
              {displayThread.messages && displayThread.messages.length > 0 ? (
                displayThread.messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 ${
                    index === 0 ? 'bg-muted/50' : 'bg-background'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">
                            {message.fromName || message.fromEmail}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {message.fromEmail}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1 ml-12">
                        {Array.isArray(message.toList) && message.toList.length > 0 && (
                          <div>
                            <span className="font-medium">To:</span>{" "}
                            {message.toList.map((to: any) => to.emailAddress?.address || to).join(', ')}
                          </div>
                        )}
                        {Array.isArray(message.ccList) && message.ccList.length > 0 && (
                          <div>
                            <span className="font-medium">CC:</span>{" "}
                            {message.ccList.map((cc: any) => cc.emailAddress?.address || cc).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(message.receivedAt)}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="ml-12 mt-3">
                    <div
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: message.bodyHtml || message.bodyText || '' }}
                    />
                  </div>

                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="ml-12 mt-4 pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Attachments ({message.attachments.length})</span>
                      </div>
                      <div className="space-y-2">
                        {message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/30">
                            <div className="flex items-center gap-2 flex-1">
                              <Paperclip className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{attachment.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {(attachment.size / 1024).toFixed(2)} KB
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                  Save
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSaveAttachment(attachment, 'customer', displayThread.customer?.id)}>
                                  <Building2 className="h-4 w-4 mr-2 text-green-600" /> Save to Customer
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSaveAttachment(attachment, 'supplier', displayThread.supplier?.id)}>
                                  <Building2 className="h-4 w-4 mr-2 text-orange-600" /> Save to Supplier
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <p>No messages in this thread</p>
                  <p className="text-xs mt-2">The email thread has no messages yet</p>
                </div>
              )}
            </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
