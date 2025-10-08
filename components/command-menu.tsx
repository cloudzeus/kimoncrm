"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Building2,
  Users,
  UserPlus,
  Target,
  Package,
  ShoppingCart,
  FileText,
  Ticket,
  FolderOpen,
  Mail,
  Calendar,
  ClipboardList,
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => unknown) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/companies/new"))}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Create Company
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/contacts/new"))}
          >
            <Users className="mr-2 h-4 w-4" />
            Create Contact
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/leads/new"))}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create Lead
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/opportunities/new"))}
          >
            <Target className="mr-2 h-4 w-4" />
            Create Opportunity
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/products/new"))}
          >
            <Package className="mr-2 h-4 w-4" />
            Create Product
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/quotes/new"))}
          >
            <FileText className="mr-2 h-4 w-4" />
            Create Quote
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/tickets/new"))}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Create Ticket
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/projects/new"))}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Create Project
          </CommandItem>
        </CommandGroup>
        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/companies"))}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Companies
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/contacts"))}
          >
            <Users className="mr-2 h-4 w-4" />
            Contacts
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/leads"))}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Leads
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/opportunities"))}
          >
            <Target className="mr-2 h-4 w-4" />
            Opportunities
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/products"))}
          >
            <Package className="mr-2 h-4 w-4" />
            Products
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/orders"))}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Orders
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/quotes"))}
          >
            <FileText className="mr-2 h-4 w-4" />
            Quotes
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/tickets"))}
          >
            <Ticket className="mr-2 h-4 w-4" />
            Tickets
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/projects"))}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/emails"))}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/calendar"))}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Calendar
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/surveys"))}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Surveys
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
