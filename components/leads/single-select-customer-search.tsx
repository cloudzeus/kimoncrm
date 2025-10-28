"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Customer {
  id: string;
  name: string;
  code: string | null;
  afm?: string | null;
  email?: string | null;
}

interface SingleSelectCustomerSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  customers: Customer[];
}

export function SingleSelectCustomerSearch({
  value,
  onChange,
  placeholder = "Search by name, AFM, email...",
  disabled = false,
  customers = [],
}: SingleSelectCustomerSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const selectedCustomer = customers.find((c) => c.id === value);

  const handleSelect = (customerId: string) => {
    onChange(customerId);
    setOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
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

    const filteredCustomers = customers.filter((c) => {
      const search = searchTerm.trim();
      return (
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.afm?.trim().toUpperCase().includes(search.toUpperCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.code?.toLowerCase().includes(search.toLowerCase())
      );
    });

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredCustomers.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredCustomers.length) {
          handleSelect(filteredCustomers[focusedIndex].id);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const search = searchTerm.trim();
    if (!search) return true; // Show all if no search term
    return (
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.afm?.trim().toUpperCase().includes(search.toUpperCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase())
    );
  });
  
  // Log filtered results for debugging
  if (searchTerm && filteredCustomers.length === 0) {
    console.log(`[Customer Search] No matches for "${searchTerm}" from ${customers.length} customers`);
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        disabled={disabled}
        className={cn(
          "w-full justify-between",
          !selectedCustomer && "text-muted-foreground"
        )}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        <span className={cn("truncate", !selectedCustomer && "text-muted-foreground")}>
          {selectedCustomer
            ? `${selectedCustomer.name}${selectedCustomer.afm ? ` (AFM: ${selectedCustomer.afm})` : ""}`
            : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-popover text-popover-foreground rounded-md border shadow-md">
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder="Search by name, AFM, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className="h-8"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No results found
              </div>
            ) : (
              filteredCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className={cn(
                    "px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between hover:bg-accent rounded-sm",
                    index === focusedIndex && "bg-accent",
                    value === customer.id && "bg-accent"
                  )}
                  onClick={() => handleSelect(customer.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    {(customer.afm || customer.email) && (
                      <span className="text-xs text-muted-foreground">
                        {customer.afm && `AFM: ${customer.afm}`}
                        {customer.afm && customer.email && " • "}
                        {customer.email && customer.email}
                      </span>
                    )}
                  </div>
                  {value === customer.id && <Check className="h-4 w-4 text-primary" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

