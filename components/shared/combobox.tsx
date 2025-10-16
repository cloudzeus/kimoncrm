"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No option found.",
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [focusedIndex, setFocusedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  
  const handleChange = onChange || onValueChange;

  const selectedOption = options.find((option) => option.value === value);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Handle click outside to close
  React.useEffect(() => {
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

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
        break;
      case "Enter":
        event.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case "Escape":
        setOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelect = (optionValue: string) => {
    const newValue = optionValue === value ? "" : optionValue;
    handleChange?.(newValue);
    setOpen(false);
    setSearchTerm("");
    setFocusedIndex(-1);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setFocusedIndex(-1);
  };

  const handleToggle = () => {
    setOpen(!open);
    if (!open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
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
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleInputChange}
              className="mb-2"
              onKeyDown={handleKeyDown}
            />
          </div>
          <div 
            ref={listRef}
            className="max-h-60 overflow-auto"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {emptyText}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-accent",
                    index === focusedIndex && "bg-accent",
                    value === option.value && "bg-accent"
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}