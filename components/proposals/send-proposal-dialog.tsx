"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SendProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  proposalTitle: string;
  customerName: string;
  primaryContactEmail?: string;
  onSuccess?: () => void;
}

export function SendProposalDialog({
  open,
  onOpenChange,
  proposalId,
  proposalTitle,
  customerName,
  primaryContactEmail,
  onSuccess,
}: SendProposalDialogProps) {
  const [emails, setEmails] = useState<string[]>(primaryContactEmail ? [primaryContactEmail] : []);
  const [newEmail, setNewEmail] = useState('');
  const [subject, setSubject] = useState(`ΠΡΟΤΑΣΗ: ${proposalTitle}`);
  const [message, setMessage] = useState(
    `Αγαπητέ/ή ${customerName},\n\nΣας αποστέλλουμε την τεχνική πρόταση για το έργο "${proposalTitle}".\n\nΠαρακαλούμε εξετάστε την πρόταση και επικοινωνήστε μαζί μας για οποιαδήποτε διευκρίνιση.\n\nΜε εκτίμηση`
  );
  const [includeWordDoc, setIncludeWordDoc] = useState(true);
  const [includePdf, setIncludePdf] = useState(false);
  const [sending, setSending] = useState(false);

  const addEmail = () => {
    if (!newEmail) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Μη έγκυρη διεύθυνση email');
      return;
    }
    
    if (emails.includes(newEmail)) {
      toast.error('Το email υπάρχει ήδη στη λίστα');
      return;
    }
    
    setEmails([...emails, newEmail]);
    setNewEmail('');
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      toast.error('Προσθέστε τουλάχιστον έναν παραλήπτη');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/proposals/${proposalId}/send-to-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmails: emails,
          subject,
          message,
          includeWordDoc,
          includePdf,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send proposal');
      }

      const data = await response.json();
      toast.success(data.message || 'Η πρόταση στάλθηκε επιτυχώς');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error sending proposal:', error);
      toast.error(error.message || 'Σφάλμα κατά την αποστολή της πρότασης');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="uppercase">Αποστολή Πρότασης στον Πελάτη</DialogTitle>
          <DialogDescription>
            Αποστολή της τεχνικής πρότασης μέσω email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipients */}
          <div className="space-y-2">
            <Label className="uppercase">Παραλήπτες</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
              />
              <Button type="button" onClick={addEmail} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="uppercase">Θέμα</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Θέμα email"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="uppercase">Μήνυμα</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Περιεχόμενο email"
              rows={8}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="uppercase">Συνημμένα</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wordDoc"
                  checked={includeWordDoc}
                  onCheckedChange={(checked) => setIncludeWordDoc(checked as boolean)}
                />
                <label
                  htmlFor="wordDoc"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Συμπερίληψη Word Document (.docx)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pdf"
                  checked={includePdf}
                  onCheckedChange={(checked) => setIncludePdf(checked as boolean)}
                />
                <label
                  htmlFor="pdf"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Συμπερίληψη PDF (αν υπάρχει)
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Ακύρωση
          </Button>
          <Button
            onClick={handleSend}
            disabled={sending || emails.length === 0}
          >
            {sending ? 'Αποστολή...' : 'Αποστολή Πρότασης'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

