import React, { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ModernCalendar } from '@/components/ui/modern-calendar';
import { cn } from '@/lib/utils';

interface ModernDatePickerProps {
  value?: string | Date | null;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ModernDatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  disabled = false,
}: ModernDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse string (YYYY-MM-DD) or Date to Date object safely
  const selectedDate: Date | undefined = React.useMemo(() => {
    if (!value) return undefined;
    if (value instanceof Date) return isValid(value) ? value : undefined;
    if (typeof value === 'string') {
      if (!value.trim()) return undefined;
      // Handle YYYY-MM-DD
      const parsed = parseISO(value);
      if (isValid(parsed)) return parsed;
      const d = new Date(value);
      return isValid(d) ? d : undefined;
    }
    return undefined;
  }, [value]);

  const handleDateSelect = (d: Date) => {
    // Format to YYYY-MM-DD using local time
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    onChange(dateStr);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors relative pr-8',
            !selectedDate && 'text-slate-400',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-blue-400 shrink-0" />
          <span className="truncate">
            {selectedDate ? format(selectedDate, 'dd MMM yyyy') : placeholder}
          </span>
          {selectedDate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        portal={false}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-auto p-0 border-0 bg-transparent shadow-2xl z-[9999] pointer-events-auto"
      >
        <ModernCalendar
          selected={selectedDate}
          onSelect={handleDateSelect}
          compact
        />
      </PopoverContent>
    </Popover>
  );
}
