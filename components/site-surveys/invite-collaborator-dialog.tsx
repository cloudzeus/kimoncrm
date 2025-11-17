"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  expiresAt: z.string().min(1, "Expiration date is required"),
  message: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteCollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteSurveyId: string;
  siteSurveyTitle: string;
}

export function InviteCollaboratorDialog({
  open,
  onOpenChange,
  siteSurveyId,
  siteSurveyTitle,
}: InviteCollaboratorDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      expiresAt: "",
      message: "",
    },
  });

  // Set default expiration to 7 days from now
  const setDefaultExpiration = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const dateTimeLocal = date.toISOString().slice(0, 16);
    form.setValue("expiresAt", dateTimeLocal);
  };

  // Set default expiration when dialog opens
  if (open && !form.getValues("expiresAt")) {
    setDefaultExpiration();
  }

  const onSubmit = async (values: InviteFormValues) => {
    try {
      setLoading(true);

      // Convert local datetime to ISO string
      const expiresAt = new Date(values.expiresAt).toISOString();

      const response = await fetch(`/api/site-surveys/${siteSurveyId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          expiresAt,
          message: values.message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invite");
      }

      toast.success("Invitation sent successfully!", {
        description: `Invite link sent to ${values.email}`,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Collaborator</DialogTitle>
          <DialogDescription>
            Send an invitation to a collaborator to complete Steps 1 & 2 of the
            site survey: <strong>{siteSurveyTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collaborator Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="collaborator@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Expires At *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    The invite link will expire at this date and time
                  </p>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Optional Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal message to the collaborator..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

