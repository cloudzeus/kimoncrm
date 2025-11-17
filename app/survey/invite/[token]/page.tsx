"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Building2 } from "lucide-react";

export default function SurveyInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invite, setInvite] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/survey/invite/${token}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Invalid invite link");
      }

      const data = await response.json();
      setInvite(data.invite);
      setEmail(data.invite.invitedEmail);
    } catch (error) {
      console.error("Error validating invite:", error);
      toast.error(
        error instanceof Error ? error.message : "Invalid or expired invite link"
      );
      // Redirect after a delay
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`/api/survey/invite/${token}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      toast.success("Access granted! Redirecting...");
      
      // Redirect to collaborator survey page
      router.push(data.redirectUrl);
    } catch (error) {
      console.error("Error authenticating:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to authenticate"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-sm text-gray-600">Validating invite link...</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invite Link</CardTitle>
            <CardDescription>
              This invite link is invalid or has expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8">
          <div className="mx-auto mb-4 w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl sm:text-2xl">Site Survey Invitation</CardTitle>
          <CardDescription className="text-sm sm:text-base mt-2">
            You've been invited to complete a site survey
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="mb-6 space-y-3 sm:space-y-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Survey:</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{invite.siteSurvey.title}</p>
            </div>
            {invite.siteSurvey.description && (
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-xs sm:text-sm text-gray-600">{invite.siteSurvey.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Customer:</p>
              <p className="text-xs sm:text-sm text-gray-600">{invite.siteSurvey.customer.name}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Link expires:</p>
              <p className="text-xs sm:text-sm text-gray-600">
                {new Date(invite.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={submitting}
                className="mt-2 min-h-[48px] sm:min-h-[40px] text-base sm:text-sm"
                autoComplete="email"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Must match the invited email address
              </p>
            </div>

            <div>
              <Label htmlFor="name" className="text-sm font-medium">Your Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={submitting}
                className="mt-2 min-h-[48px] sm:min-h-[40px] text-base sm:text-sm"
                autoComplete="name"
              />
            </div>

            <Button
              type="submit"
              className="w-full min-h-[48px] sm:min-h-[44px] text-base sm:text-sm font-medium"
              disabled={submitting || !email.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 sm:h-4 sm:w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Mail className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                  Access Survey
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

