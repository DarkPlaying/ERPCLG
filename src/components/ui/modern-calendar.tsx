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
const YEARS = Array.from({ length: 31 }, (_, i) => 2015 + i); // 2015 to 2045 scrollable range

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

  // Sync current month when selected date changes externally
  useEffect(() => {
    if (selected) {
      setCurrentMonth(selected);
    }
  }, [selected]);

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

  // Calendar matrix calculation
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

    // Preceding month days
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

    // Current month days
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

    // Trailing next month days to fill 35 or 42 cells
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
        'w-[350px] max-w-full rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl p-5 my-1 text-white shadow-2xl transition-all duration-200 select-none pointer-events-auto',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
          {/* Quick Month & Year Dropdown Selectors */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 shadow-inner relative">
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
                <span>{compact ? MONTH_NAMES[month].slice(0, 3) : MONTH_NAMES[month]}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showMonthDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 custom-scrollbar"
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
                <span>{year}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showYearDropdown && (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-1.5 w-36 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 custom-scrollbar"
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
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleJumpToToday}
            className="h-8 px-2.5 text-xs font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg active:scale-95"
            title="Go to Today"
          >
            Today
          </Button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="h-8 w-8 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleNextMonth}
            aria-label="Next month"
            className="h-8 w-8 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1.5 pt-3.5 pb-1.5 text-center">
        {WEEKDAYS.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'text-[11px] font-semibold tracking-wider uppercase',
              idx === 0 || idx === 6 ? 'text-blue-400' : 'text-slate-400'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
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
                'relative flex flex-col items-center justify-center h-9 w-9 mx-auto rounded-xl text-xs transition-all duration-150 active:scale-95',
                !cell.isCurrentMonth && 'text-slate-600 hover:text-slate-400',
                cell.isCurrentMonth && 'text-slate-200 hover:bg-slate-800/80 hover:text-white',
                cell.isToday && !cell.isSelected && 'ring-1 ring-blue-500/70 font-semibold text-blue-300 bg-blue-500/10',
                cell.isSelected &&
                  'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 scale-105 z-10'
              )}
            >
              <span>{dayNum}</span>

              {/* Event indicator dot */}
              {cell.hasMark && (
                <span
                  className={cn(
                    'absolute bottom-1 h-1 w-1 rounded-full',
                    cell.isSelected ? 'bg-white' : 'bg-blue-400'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Footer */}
      {selected && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Sparkles className="h-3 w-3 text-amber-400" /> Selected Date:
          </span>
          <span className="font-medium text-slate-200">
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
