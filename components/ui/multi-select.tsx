'use client';

import * as React from 'react';
import { Check, X, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  options: Array<{ id: string; name: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSelect = (itemId: string) => {
    console.log('MultiSelect handleSelect:', { itemId, currentSelected: selected });
    if (selected.includes(itemId)) {
      const newSelected = selected.filter((id) => id !== itemId);
      console.log('Removing item, new selection:', newSelected);
      onChange(newSelected);
    } else {
      const newSelected = [...selected, itemId];
      console.log('Adding item, new selection:', newSelected);
      onChange(newSelected);
    }
  };

  const handleRemove = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter((id) => id !== itemId));
  };

  const selectedItems = options.filter((option) => selected.includes(option.id));
  const filteredOptions = options.filter((option) =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <div className="flex gap-1 flex-wrap flex-1 overflow-hidden">
            {selectedItems.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedItems.slice(0, 2).map((item) => (
                <Badge key={item.id} variant="secondary" className="mr-1">
                  {item.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex"
                    onClick={(e) => handleRemove(e, item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleRemove(e as any, item.id);
                      }
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            )}
            {selectedItems.length > 2 && (
              <Badge variant="secondary">+{selectedItems.length - 2} more</Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-[10000]" align="start" style={{ zIndex: 10000 }}>
        <div className="p-2 border-b">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No items found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
                    onClick={() => handleSelect(option.id)}
                  >
                    <div
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm">{option.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

