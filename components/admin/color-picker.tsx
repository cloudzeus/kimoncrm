"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "#000000", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#F3F4F6", "#FFFFFF",
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16", "#22C55E", "#10B981",
  "#14B8A6", "#06B6D4", "#0EA5E9", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7",
  "#D946EF", "#EC4899", "#F43F5E", "#64748B", "#475569", "#334155", "#1E293B"
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    if (color.match(/^#[0-9A-F]{6}$/i)) {
      onChange(color);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-start space-x-2", className)}
        >
          <div
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-sm">{value}</span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div>
            <Label htmlFor="color-input">Custom Color</Label>
            <div className="flex space-x-2 mt-1">
              <Input
                id="color-input"
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder="#000000"
                className="font-mono"
              />
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-10 h-10 rounded border cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <Label>Preset Colors</Label>
            <div className="grid grid-cols-7 gap-1 mt-2">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  className={cn(
                    "h-8 w-8 rounded border-2 transition-all hover:scale-110",
                    value === color ? "border-primary ring-2 ring-primary/20" : "border-border"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

