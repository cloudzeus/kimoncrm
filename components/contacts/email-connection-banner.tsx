"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { getEmailConnectionStatus } from "@/app/actions/email-connect";
import { toast } from "sonner";

export function EmailConnectionBanner() {
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    try {
      const status = await getEmailConnectionStatus();
      setHasToken(status.hasToken || false);
      if (status.expiresAt) {
        setExpiresAt(new Date(status.expiresAt));
      }
    } catch (error) {
      console.error("Error checking email connection:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Redirect to the same endpoint used for Microsoft login
      // This will trigger the Microsoft OAuth flow
      window.location.href = '/api/auth/signin/microsoft-entra-id';
    } catch (error) {
      console.error("Error connecting email:", error);
      toast.error("Failed to initiate email connection");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Alert className="mb-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle>Checking email connection...</AlertTitle>
        <AlertDescription>
          Please wait while we verify your email account connection.
        </AlertDescription>
      </Alert>
    );
  }

  if (hasToken) {
    return (
      <Alert className="mb-4 border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">Email Connected</AlertTitle>
        <AlertDescription className="text-green-600">
          Your email account is connected and ready to use.
          {expiresAt && (
            <span className="block mt-1 text-xs">
              Token expires: {expiresAt.toLocaleDateString()}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">Email Not Connected</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span className="text-amber-600">
          Connect your Microsoft Office 365 email to view contact emails.
        </span>
        <Button
          onClick={handleConnect}
          disabled={connecting}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          {connecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Connect Email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
