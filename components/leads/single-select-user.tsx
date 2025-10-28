"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface SingleSelectUserProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  users: User[];
}

export function SingleSelectUser({
  value,
  onChange,
  placeholder = "Select user...",
  disabled = false,
  users,
}: SingleSelectUserProps) {
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

  const selectedUser = users.find((u) => u.id === value);

  const handleSelect = (userId: string) => {
    onChange(userId);
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

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredUsers.length) {
          handleSelect(filteredUsers[focusedIndex].id);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;

  const displayName = (user: User) => {
    return `${user.name || ''}${user.email ? ` (${user.email})` : ''}`.trim();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen(!open);
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">
          {selectedUser ? displayName(selectedUser) : placeholder}
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No users found.
              </div>
            ) : (
              filteredUsers.map((user, index) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                    index === focusedIndex && "bg-accent",
                    value === user.id && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(user.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div>{displayName(user)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

