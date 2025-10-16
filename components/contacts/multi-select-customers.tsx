"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Customer {
  id: string;
  name: string;
  code: string | null;
  afm: string | null;
}

interface MultiSelectCustomersProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function MultiSelectCustomers({
  selectedIds,
  onChange,
}: MultiSelectCustomersProps) {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
      });
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomers = customers.filter((c) => selectedIds.includes(c.id));

  const toggleCustomer = (customerId: string) => {
    if (selectedIds.includes(customerId)) {
      onChange(selectedIds.filter((id) => id !== customerId));
    } else {
      onChange([...selectedIds, customerId]);
    }
  };

  const removeCustomer = (customerId: string) => {
    onChange(selectedIds.filter((id) => id !== customerId));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, customers.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < customers.length) {
          toggleCustomer(customers[focusedIndex].id);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">
          {selectedIds.length === 0
            ? "Select customers..."
            : `${selectedIds.length} customer${selectedIds.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 z-[10000] mt-1 bg-popover border rounded-md shadow-lg"
          style={{ zIndex: 10000 }}
        >
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder="Search by name, code, or AFM..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : customers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No customers found.
              </div>
            ) : (
              customers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                    index === focusedIndex && "bg-accent",
                    selectedIds.includes(customer.id) && "bg-accent/50"
                  )}
                  onClick={() => toggleCustomer(customer.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedIds.includes(customer.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div>{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {customer.code && <span>Code: {customer.code}</span>}
                      {customer.code && customer.afm && <span> | </span>}
                      {customer.afm && <span>AFM: {customer.afm}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected customers badges */}
      {selectedCustomers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCustomers.map((customer) => (
            <Badge key={customer.id} variant="secondary">
              {customer.name}
              {customer.afm && ` (${customer.afm})`}
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-secondary-foreground/20"
                onClick={() => removeCustomer(customer.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
