"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface Entity {
  id: string;
  name: string;
  code?: string | null;
}

interface LinkEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "customer" | "project" | "supplier";
  onLink: (entityId: string) => Promise<void>;
}

export function LinkEmailDialog({ open, onOpenChange, type, onLink }: LinkEmailDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchEntities();
    } else {
      setSearchTerm("");
      setEntities([]);
    }
  }, [open]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (open) {
        fetchEntities();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
      });
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      let endpoint = "/api/projects";
      if (type === "customer") {
        endpoint = "/api/customers";
      } else if (type === "supplier") {
        endpoint = "/api/suppliers";
      }
      
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (data.customers) {
        setEntities(data.customers);
      } else if (data.projects) {
        setEntities(data.projects);
      } else if (data.suppliers) {
        setEntities(data.suppliers);
      }
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
      toast.error(`Failed to load ${type}s`);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (entityId: string) => {
    try {
      setLinking(entityId);
      await onLink(entityId);
      onOpenChange(false);
    } catch (error) {
      console.error(`Error linking to ${type}:`, error);
      toast.error(`Failed to link to ${type}`);
    } finally {
      setLinking(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Link Email to {type === "customer" ? "Customer" : type === "supplier" ? "Supplier" : "Project"}
          </DialogTitle>
          <DialogDescription>
            Search and select a {type} to link this email thread to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px] rounded-md border p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : entities.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No {type}s found
              </div>
            ) : (
              <div className="space-y-2">
                {entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{entity.name}</div>
                      {entity.code && (
                        <div className="text-xs text-muted-foreground">Code: {entity.code}</div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleLink(entity.id)}
                      disabled={linking === entity.id}
                      size="sm"
                    >
                      {linking === entity.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Linking...
                        </>
                      ) : (
                        "Link"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
