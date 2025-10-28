"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OneDriveAccessCardProps {
  type: "tenant" | "user";
}

export function OneDriveAccessCard({ type }: OneDriveAccessCardProps) {
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/microsoft/onedrive?type=${type}&action=open`);
      const data = await response.json();

      if (data.success && data.webUrl) {
        // Use a new window with SSO
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          // Redirect to the OneDrive URL
          newWindow.location.href = data.webUrl;
          toast.success(`Opening ${type === "tenant" ? "Tenant" : "My"} OneDrive...`);
        } else {
          throw new Error("Could not open new window. Please allow popups.");
        }
      } else {
        throw new Error(data.message || "Failed to open OneDrive");
      }
    } catch (error) {
      console.error("OneDrive access error:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to open OneDrive. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isTenant = type === "tenant";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isTenant ? (
            <Shield className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
          {isTenant ? "Tenant OneDrive" : "My OneDrive"}
        </CardTitle>
        <CardDescription>
          {isTenant
            ? "Access organization OneDrive files and folders"
            : "Access your personal OneDrive files"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {isTenant
            ? "Browse and manage files in the organization's OneDrive storage."
            : "View and manage your personal OneDrive files and folders."}
        </p>
        <Button
          onClick={handleOpen}
          className="w-full"
          variant={isTenant ? "default" : "outline"}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open {isTenant ? "Tenant" : "My"} OneDrive
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
