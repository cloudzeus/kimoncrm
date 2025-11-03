"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  X, 
  UserCheck, 
  Users, 
  Building2, 
  UserCog, 
  Shield,
  Mail,
  Tag,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Recipient {
  id: string;
  name: string | null;
  email: string;
  role: "owner" | "assignee" | "participant" | "contact" | "admin" | "manager" | "employee";
  checked: boolean;
}

interface LeadEmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadNumber: string;
  leadTitle: string;
  prefilledContact?: any;
  customerId?: string | null;
  customerName?: string | null;
  onEmailSent?: () => void;
}

export function LeadEmailComposeDialog({
  open,
  onOpenChange,
  leadId,
  leadNumber,
  leadTitle,
  prefilledContact,
  customerId,
  customerName,
  onEmailSent,
}: LeadEmailComposeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState(`[${leadNumber}] `);
  const [body, setBody] = useState("");
  const [ccMyself, setCcMyself] = useState(true);
  const [signature, setSignature] = useState("");
  const [loadingSignature, setLoadingSignature] = useState(false);

  // Fetch available recipients and signature
  useEffect(() => {
    if (open) {
      fetchRecipients();
      fetchSignature();
      // Pre-fill subject with lead number for tagging
      setSubject(`[${leadNumber}] `);
    }
  }, [open, leadId, leadNumber]);

  // Update recipients when prefilledContact changes
  useEffect(() => {
    if (open && prefilledContact && recipients.length > 0) {
      // Check the contact if it exists in recipients
      setRecipients(prev =>
        prev.map(r => 
          r.email === prefilledContact.email 
            ? { ...r, checked: true } 
            : r
        )
      );
    }
  }, [open, prefilledContact, recipients.length]);

  const fetchRecipients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/email-recipients`);
      if (!res.ok) throw new Error("Failed to fetch recipients");
      
      const data = await res.json();
      const fetchedRecipients = data.recipients || [];

      // If prefilledContact exists and has email, ensure it's in the list
      if (prefilledContact && prefilledContact.email) {
        const contactExists = fetchedRecipients.some((r: Recipient) => r.email === prefilledContact.email);
        if (!contactExists) {
          fetchedRecipients.push({
            id: `prefilled-${prefilledContact.id}`,
            name: prefilledContact.name,
            email: prefilledContact.email,
            role: "contact" as const,
            checked: true,
          });
        }
      }

      setRecipients(fetchedRecipients);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast.error("Failed to load recipients");
    } finally {
      setLoading(false);
    }
  };

  const fetchSignature = async () => {
    setLoadingSignature(true);
    try {
      const res = await fetch('/api/user/email-signature');
      if (res.ok) {
        const data = await res.json();
        if (data.signature) {
          setSignature(data.signature);
        }
      }
    } catch (error) {
      console.error("Error fetching signature:", error);
    } finally {
      setLoadingSignature(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setRecipients(prev =>
      prev.map(r => (r.id === id ? { ...r, checked: !r.checked } : r))
    );
  };

  const toggleAllInCategory = (role: Recipient["role"]) => {
    const categoryRecipients = recipients.filter(r => r.role === role);
    const allChecked = categoryRecipients.every(r => r.checked);
    
    setRecipients(prev =>
      prev.map(r => (r.role === role ? { ...r, checked: !allChecked } : r))
    );
  };

  const handleSend = async () => {
    const selectedRecipients = recipients.filter(r => r.checked);
    
    if (selectedRecipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!body.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);
    try {
      // Combine body with signature
      const fullBody = signature 
        ? `${body.trim()}\n\n${signature}`
        : body.trim();

      const res = await fetch(`/api/leads/${leadId}/emails/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedRecipients.map(r => ({
            email: r.email,
            name: r.name,
          })),
          subject: subject.trim(),
          body: fullBody,
          ccMyself,
          metadata: {
            leadId,
            leadNumber,
            leadTitle,
            customerId: customerId || null,
            customerName: customerName || null,
            tags: [
              leadNumber, 
              `lead-${leadId}`, 
              customerId ? `customer-${customerId}` : null,
              "crm-outbound"
            ].filter(Boolean),
          },
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to send email");
      }

      toast.success("Email sent successfully and linked to lead");
      onEmailSent?.();
      onOpenChange(false);
      
      // Reset form
      setSubject(`[${leadNumber}] `);
      setBody("");
      setRecipients(prev => prev.map(r => ({ ...r, checked: false })));
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const getRoleIcon = (role: Recipient["role"]) => {
    switch (role) {
      case "owner":
      case "assignee":
        return <UserCheck className="h-4 w-4" />;
      case "participant":
        return <Users className="h-4 w-4" />;
      case "contact":
        return <Building2 className="h-4 w-4" />;
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "manager":
        return <UserCog className="h-4 w-4" />;
      case "employee":
        return <Users className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: Recipient["role"]) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "assignee":
        return "bg-blue-100 text-blue-800";
      case "participant":
        return "bg-cyan-100 text-cyan-800";
      case "contact":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "manager":
        return "bg-orange-100 text-orange-800";
      case "employee":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const groupedRecipients = recipients.reduce((acc, recipient) => {
    if (!acc[recipient.role]) {
      acc[recipient.role] = [];
    }
    acc[recipient.role].push(recipient);
    return acc;
  }, {} as Record<string, Recipient[]>);

  const selectedCount = recipients.filter(r => r.checked).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            COMPOSE EMAIL FOR LEAD
          </DialogTitle>
          <DialogDescription>
            Send an email to involved parties. Email will be automatically tagged and linked to this lead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Lead & Customer Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{leadNumber}</Badge>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium truncate">{leadTitle}</span>
              </div>
              {customerName && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{customerName}</span>
                </div>
              )}
              {prefilledContact && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-blue-500" />
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">{prefilledContact.name} ({prefilledContact.email})</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipients Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                RECIPIENTS ({selectedCount} selected)
              </Label>
            </div>

            <ScrollArea className="h-[200px] border rounded-md p-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedRecipients).map(([role, roleRecipients]) => (
                    <div key={role} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role as Recipient["role"])}
                          <span className="text-sm font-medium uppercase">
                            {role.replace("_", " ")}s
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {roleRecipients.length}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAllInCategory(role as Recipient["role"])}
                          className="text-xs h-7"
                        >
                          {roleRecipients.every(r => r.checked) ? "Deselect All" : "Select All"}
                        </Button>
                      </div>
                      <div className="space-y-1 ml-6">
                        {roleRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleRecipient(recipient.id)}
                          >
                            <Checkbox
                              checked={recipient.checked}
                              onCheckedChange={() => toggleRecipient(recipient.id)}
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-sm">{recipient.name || "No Name"}</span>
                                <span className="text-xs text-muted-foreground">{recipient.email}</span>
                              </div>
                              <Badge className={cn("text-xs", getRoleBadgeColor(recipient.role))}>
                                {role.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {recipients.length === 0 && !loading && (
                    <div className="text-center text-muted-foreground py-4">
                      No recipients available
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator />

          {/* Email Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="subject" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                SUBJECT
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={`[${leadNumber}] Enter subject...`}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lead number tag is required for automatic mailbox scanning
              </p>
            </div>

            <div>
              <Label htmlFor="body">MESSAGE</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message..."
                rows={8}
                className="mt-1"
              />
              {signature && (
                <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                  <span className="text-muted-foreground">Signature will be appended:</span>
                  <div className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {signature}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="ccMyself"
                checked={ccMyself}
                onCheckedChange={(checked) => setCcMyself(checked as boolean)}
              />
              <Label htmlFor="ccMyself" className="text-sm cursor-pointer">
                Send a copy to myself
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 items-center">
            <span>Tags:</span>
            <Badge variant="outline" className="text-xs">{leadNumber}</Badge>
            <Badge variant="outline" className="text-xs">lead-{leadId.slice(0, 8)}</Badge>
            {customerId && <Badge variant="outline" className="text-xs">customer-{customerId.slice(0, 8)}</Badge>}
            <Badge variant="outline" className="text-xs">crm-outbound</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || selectedCount === 0}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

