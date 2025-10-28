"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface MultiSelectContactsProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  contacts?: Contact[];
}

export function MultiSelectContacts({
  selectedIds,
  onChange,
  placeholder = "Select contacts...",
  disabled = false,
  contacts = [],
}: MultiSelectContactsProps) {
  const [open, setOpen] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>(contacts);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedContacts = allContacts.filter((c) => selectedIds.includes(c.id));

  const handleToggle = (contactId: string) => {
    if (selectedIds.includes(contactId)) {
      onChange(selectedIds.filter((id) => id !== contactId));
    } else {
      onChange([...selectedIds, contactId]);
    }
  };

  const handleRemove = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== contactId));
  };

  const filteredContacts = searchTerm
    ? allContacts.filter((c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allContacts;

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-10"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedContacts.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                selectedContacts.map((contact) => (
                  <Badge
                    key={contact.id}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {contact.name}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRemove(contact.id, e as any);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => handleRemove(contact.id, e)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search contacts..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>No contacts found.</CommandEmpty>
              <CommandGroup>
                {filteredContacts.map((contact) => {
                  const isSelected = selectedIds.includes(contact.id);
                  return (
                    <CommandItem
                      key={contact.id}
                      value={contact.id}
                      onSelect={() => handleToggle(contact.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{contact.name}</span>
                        {contact.email && (
                          <span className="text-sm text-muted-foreground">
                            {contact.email}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
