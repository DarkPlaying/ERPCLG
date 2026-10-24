import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModernCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  markedDates?: string[]; // array of 'YYYY-MM-DD'
  compact?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const nowYear = new Date().getFullYear();
const YEARS = Array.from({ length: 31 }, (_, i) => 2015 + i);

export function ModernCalendar({
  selected,
  onSelect,
  className,
  markedDates = [],
  compact = false,
}: ModernCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => selected || today);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const selectedYearRef = useRef<HTMLButtonElement | null>(null);
  const selectedMonthRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selected) {
      setCurrentMonth(selected);
    }
  }, [selected]);

  useEffect(() => {
    if (showYearDropdown && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: 'center' });
    }
  }, [showYearDropdown]);

  useEffect(() => {
    if (showMonthDropdown && selectedMonthRef.current) {
      selectedMonthRef.current.scrollIntoView({ block: 'center' });
    }
  }, [showMonthDropdown]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    if (onSelect) onSelect(now);
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasMark: boolean;
      dateKey: string;
    }> = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const key = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: !!selected && d.toDateString() === selected.toDateString(),
        hasMark: markedDates.includes(key),
        dateKey: key,
      });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(year, month, i);
      const key = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: !!selected && d.toDateString() === selected.toDateString(),
        hasMark: markedDates.includes(key),
        dateKey: key,
      });
    }

    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const key = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: !!selected && d.toDateString() === selected.toDateString(),
        hasMark: markedDates.includes(key),
        dateKey: key,
      });
    }

    return days;
  }, [year, month, today, selected, markedDates]);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        'w-[350px] max-w-full rounded-2xl border border-border bg-card p-5 my-1 text-foreground shadow-lg transition-all duration-200 select-none pointer-events-auto',
        className
      )}
    >
      {/* Header - Pure Black & White */}
      <div className="flex items-center justify-between pb-4 border-b border-border gap-2">
        <div className="flex items-center gap-2">
          {/* Pure Monochrome Icon */}
          <div className="p-2 rounded-xl bg-foreground text-background shrink-0 shadow-xs">
            <CalendarIcon className="h-4 w-4" />
          </div>

          {/* Quick Month & Year Dropdown Selectors */}
          <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1 rounded-xl border border-border shadow-xs relative">
            {/* Month Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowMonthDropdown((prev) => !prev);
                  setShowYearDropdown(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <span>{compact ? MONTH_NAMES[month].slice(0, 3) : MONTH_NAMES[month]}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showMonthDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-popover border border-border shadow-2xl p-1 z-50 custom-scrollbar text-popover-foreground"
                >
                  {MONTH_NAMES.map((name, idx) => {
                    const isSelected = idx === month;
                    const isCurrent = idx === new Date().getMonth() && year === nowYear;
                    return (
                      <button
                        key={name}
                        ref={isSelected ? selectedMonthRef : null}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setCurrentMonth(new Date(year, idx, 1));
                          setShowMonthDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors my-0.5',
                          isSelected
                            ? 'bg-foreground text-background font-bold shadow-xs'
                            : isCurrent
                            ? 'text-foreground bg-muted font-semibold'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span>{name}</span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.5 rounded font-bold uppercase',
                              isSelected ? 'bg-background text-foreground' : 'bg-muted text-foreground'
                            )}
                          >
                            Now
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <span className="text-muted-foreground text-xs font-bold">/</span>

            {/* Year Button + Dropdown */}
            <div className="relative">
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => {
                  setShowYearDropdown((prev) => !prev);
                  setShowMonthDropdown(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                <span>{year}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showYearDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-popover border border-border shadow-2xl p-1 z-50 custom-scrollbar text-popover-foreground"
                >
                  {YEARS.map((y) => {
                    const isSelected = y === year;
                    const isCurrent = y === nowYear;
                    return (
                      <button
                        key={y}
                        ref={isSelected ? selectedYearRef : null}
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => {
                          setCurrentMonth(new Date(y, month, 1));
                          setShowYearDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors my-0.5',
                          isSelected
                            ? 'bg-foreground text-background font-bold shadow-xs'
                            : isCurrent
                            ? 'text-foreground bg-muted font-semibold'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span>{y}</span>
                        {isCurrent && (
                          <span
                            className={cn(
                              'text-[9px] px-1 py-0.5 rounded font-bold uppercase',
                              isSelected ? 'bg-background text-foreground' : 'bg-muted text-foreground'
                            )}
                          >
                            Now
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleJumpToToday}
            className="h-8 px-2.5 text-xs font-semibold text-foreground bg-muted/60 hover:bg-muted border border-border rounded-lg active:scale-95"
            title="Go to Today"
          >
            Today
          </Button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="h-8 w-8 rounded-lg border border-border bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleNextMonth}
            aria-label="Next month"
            className="h-8 w-8 rounded-lg border border-border bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-xs"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers - Pure Monochrome */}
      <div className="grid grid-cols-7 gap-1.5 pt-3.5 pb-1.5 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid - Pure Black & White */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {calendarDays.map((cell) => {
          const dayNum = cell.date.getDate();

          return (
            <button
              key={cell.dateKey + cell.isCurrentMonth}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (onSelect) onSelect(cell.date);
              }}
              className={cn(
                'relative flex flex-col items-center justify-center h-9 w-9 mx-auto rounded-xl text-xs transition-all duration-150 active:scale-95 font-medium',
                !cell.isCurrentMonth && 'text-muted-foreground/35 hover:text-muted-foreground',
                cell.isCurrentMonth && 'text-foreground hover:bg-muted hover:text-foreground',
                cell.isToday && !cell.isSelected && 'border border-foreground font-bold text-foreground bg-muted/40',
                cell.isSelected &&
                  'bg-foreground text-background font-bold shadow-md scale-105 z-10'
              )}
            >
              <span>{dayNum}</span>

              {/* Event indicator dot */}
              {cell.hasMark && (
                <span
                  className={cn(
                    'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                    cell.isSelected ? 'bg-background' : 'bg-foreground'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Footer - Pure Monochrome */}
      {selected && (
        <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 text-foreground font-medium">
            <Sparkles className="h-3.5 w-3.5 text-foreground" /> Selected Date:
          </span>
          <span className="font-semibold text-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md border border-border">
            {selected.toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  );
}
