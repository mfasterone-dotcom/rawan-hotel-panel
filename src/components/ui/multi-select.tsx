'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';

export interface Option {
  label: string;
  value: string | number;
}

interface MultiSelectProps {
  options: Option[];
  selected: (string | number)[];
  onChange: (selected: (string | number)[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (item: string | number) => {
    onChange(selected.filter(s => s !== item));
  };

  const handleSelect = (item: string | number) => {
    if (selected.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between min-h-9 h-auto', className)}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className='flex gap-1 flex-wrap'>
            {selected.length === 0 ? (
              <span className='text-muted-foreground'>{placeholder}</span>
            ) : (
              selected.map(item => {
                const option = options.find(opt => opt.value === item);
                return (
                  <Badge variant='secondary' key={item} className='mr-1 mb-1'>
                    {option?.label}
                    <span
                      className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80'
                      role='button'
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleUnselect(item);
                        }
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(item);
                      }}
                    >
                      <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                    </span>
                  </Badge>
                );
              })
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selected.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible',
                    )}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='h-4 w-4'
                    >
                      <path d='M5 12l5 5l10 -10' />
                    </svg>
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
