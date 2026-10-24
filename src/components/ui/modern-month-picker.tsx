import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernMonthPickerProps {
  value?: string; // "YYYY-MM" format
  onChange: (monthStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const nowYear = new Date().getFullYear();
const YEARS = Array.from({ length: 31 }, (_, i) => 2015 + i); // 2015 to 2045 scrollable range

export function ModernMonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className,
  disabled = false,
}: ModernMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const selectedYearRef = useRef<HTMLButtonElement | null>(null);
  const selectedMonthRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll to selected year when dropdown opens
  useEffect(() => {
    if (showYearDropdown && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: 'center' });
    }
  }, [showYearDropdown]);

  // Auto-scroll to selected month when dropdown opens
  useEffect(() => {
    if (showMonthDropdown && selectedMonthRef.current) {
      selectedMonthRef.current.scrollIntoView({ block: 'center' });
    }
  }, [showMonthDropdown]);

  // Parse YYYY-MM
  const { currentYear, currentMonthIndex, formattedLabel } = React.useMemo(() => {
    const now = new Date();
    if (!value || !value.includes('-')) {
      return {
        currentYear: now.getFullYear(),
        currentMonthIndex: now.getMonth(),
        formattedLabel: placeholder,
      };
    }
    const [yStr, mStr] = value.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    if (isNaN(y) || isNaN(m) || m < 0 || m > 11) {
      return {
        currentYear: now.getFullYear(),
        currentMonthIndex: now.getMonth(),
        formattedLabel: placeholder,
      };
    }
    return {
      currentYear: y,
      currentMonthIndex: m,
      formattedLabel: `${MONTH_NAMES_FULL[m]}, ${y}`,
    };
  }, [value, placeholder]);

  const [viewYear, setViewYear] = useState<number>(currentYear);

  // Keep viewYear synced when value changes externally
  useEffect(() => {
    setViewYear(currentYear);
  }, [currentYear]);

  const handleSelectMonth = (monthIdx: number, targetYear = viewYear) => {
    const monthFormatted = String(monthIdx + 1).padStart(2, '0');
    onChange(`${targetYear}-${monthFormatted}`);
    setOpen(false);
  };

  const handleQuickMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mIdx = parseInt(e.target.value, 10);
    handleSelectMonth(mIdx, viewYear);
  };

  const handleQuickYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newY = parseInt(e.target.value, 10);
    setViewYear(newY);
    if (value && currentMonthIndex >= 0) {
      const monthFormatted = String(currentMonthIndex + 1).padStart(2, '0');
      onChange(`${newY}-${monthFormatted}`);
    }
  };

  const handleSelectThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setViewYear(y);
    onChange(`${y}-${m}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors h-9',
            !value && 'text-slate-400',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="truncate">{formattedLabel}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        portal={false}
        onPointerDown={(e) => e.stopPropagation()}
        className="w-[340px] max-w-full p-5 my-1 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl z-[9999] text-white backdrop-blur-xl pointer-events-auto select-none"
      >
        {/* Header with Quick Month & Year Dropdown Selectors and Steppers */}
        <div className="flex items-center justify-between pb-4 mb-3.5 border-b border-slate-800 gap-2">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setViewYear((y) => y - 1)}
            aria-label="Previous year"
            className="h-8.5 w-8.5 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Quick Month and Year Dropdown Controls */}
          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-inner relative">
            {/* Month Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowMonthDropdown((prev) => !prev);
                  setShowYearDropdown(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg text-slate-100 hover:text-blue-400 hover:bg-slate-700/50 transition-colors"
              >
                <span>{MONTH_NAMES_SHORT[currentMonthIndex]}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showMonthDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 custom-scrollbar"
                >
                  {MONTH_NAMES_FULL.map((name, idx) => {
                    const isSelected = idx === currentMonthIndex;
                    const isCurrent = idx === new Date().getMonth() && viewYear === nowYear;
                    return (
                      <button
                        key={name}
                        ref={isSelected ? selectedMonthRef : null}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          handleSelectMonth(idx, viewYear);
                          setShowMonthDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors my-0.5',
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : isCurrent
                            ? 'text-blue-300 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <span>{name}</span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.5 rounded font-bold uppercase',
                              isSelected ? 'bg-blue-700 text-white' : 'bg-blue-500/30 text-blue-300'
                            )}
                          >
                            Current
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <span className="text-slate-500 text-xs font-bold">/</span>

            {/* Year Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowYearDropdown((prev) => !prev);
                  setShowMonthDropdown(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-700/50 transition-colors"
              >
                <span>{viewYear}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showYearDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 custom-scrollbar"
                >
                  {YEARS.map((y) => {
                    const isSelected = y === viewYear;
                    const isCurrent = y === nowYear;
                    return (
                      <button
                        key={y}
                        ref={isSelected ? selectedYearRef : null}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setViewYear(y);
                          if (value && currentMonthIndex >= 0) {
                            const monthFormatted = String(currentMonthIndex + 1).padStart(2, '0');
                            onChange(`${y}-${monthFormatted}`);
                          }
                          setShowYearDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors my-0.5',
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : isCurrent
                            ? 'text-blue-300 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        <span>{y}</span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.5 rounded font-bold uppercase',
                              isSelected ? 'bg-blue-700 text-white' : 'bg-blue-500/30 text-blue-300'
                            )}
                          >
                            Current
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setViewYear((y) => y + 1)}
            aria-label="Next year"
            className="h-8.5 w-8.5 rounded-lg border border-slate-700/80 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 12-Month Interactive Grid */}
        <div className="grid grid-cols-3 gap-2.5 py-1.5">
          {MONTH_NAMES_SHORT.map((mName, idx) => {
            const isSelected =
              value &&
              viewYear === currentYear &&
              idx === currentMonthIndex;
            const now = new Date();
            const isCurrentMonth =
              now.getFullYear() === viewYear && now.getMonth() === idx;

            return (
              <button
                key={mName}
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => handleSelectMonth(idx)}
                className={cn(
                  'h-11 rounded-xl text-xs font-medium transition-all duration-150 border flex items-center justify-center gap-1.5 active:scale-95 shadow-sm',
                  isSelected
                    ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-lg shadow-blue-500/30 scale-[1.02]'
                    : isCurrentMonth
                    ? 'border-blue-500/50 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 font-semibold'
                    : 'border-slate-800/80 bg-slate-800/40 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                )}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                <span>{mName}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Quick Action */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex justify-between items-center text-xs px-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleSelectThisMonth}
            className="h-7.5 px-3 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg active:scale-95"
          >
            This month
          </Button>
          <span className="text-xs text-slate-400 font-medium">
            {MONTH_NAMES_FULL[currentMonthIndex]} {viewYear}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
