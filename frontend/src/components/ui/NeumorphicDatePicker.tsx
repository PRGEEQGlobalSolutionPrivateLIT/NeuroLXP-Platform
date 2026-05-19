'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  hint?: string;
}

type ViewMode = 'days' | 'months' | 'years';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS_PER_PAGE = 12;

function parseYmd(ymd: string): Date | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildCalendarDays(view: Date): { date: Date; inMonth: boolean }[] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = first.getDay();
  const days: { date: Date; inMonth: boolean }[] = [];
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  for (let i = 0; i < 42; i++) {
    const cell = new Date(gridStart);
    cell.setDate(gridStart.getDate() + i);
    days.push({ date: cell, inMonth: cell.getMonth() === view.getMonth() });
  }
  return days;
}

function yearPageStart(year: number) {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

export function NeumorphicDatePicker({
  label = 'Date of Birth',
  value,
  onChange,
  min,
  max,
  disabled,
  className,
  hint,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('days');
  const [yearPage, setYearPage] = useState(0);

  const selected = parseYmd(value);
  const minDate = min ? parseYmd(min) : null;
  const maxDate = max ? parseYmd(max) : null;
  const today = useMemo(() => new Date(), []);

  const minYear = minDate?.getFullYear() ?? today.getFullYear() - 100;
  const maxYear = maxDate?.getFullYear() ?? today.getFullYear();

  const [viewMonth, setViewMonth] = useState(() => selected ?? today);

  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [value, selected]);

  useEffect(() => {
    if (open) setYearPage(yearPageStart((selected ?? viewMonth).getFullYear()));
  }, [open, selected, viewMonth]);

  useEffect(() => {
    if (!open) setViewMode('days');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const displayText = selected
    ? selected.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Select date of birth';

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const isDisabledDay = (d: Date) => {
    const t = dayStart(d);
    if (minDate && t < dayStart(minDate)) return true;
    if (maxDate && t > dayStart(maxDate)) return true;
    return false;
  };

  const isDisabledMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    if (minDate && last.getTime() < dayStart(minDate)) return true;
    if (maxDate && first.getTime() > dayStart(maxDate)) return true;
    return false;
  };

  const isDisabledYear = (year: number) => year < minYear || year > maxYear;

  const pickDay = (d: Date) => {
    if (isDisabledDay(d)) return;
    onChange(toYmd(d));
    setOpen(false);
  };

  const pickMonth = (month: number) => {
    if (isDisabledMonth(viewMonth.getFullYear(), month)) return;
    setViewMonth(new Date(viewMonth.getFullYear(), month, 1));
    setViewMode('days');
  };

  const pickYear = (year: number) => {
    if (isDisabledYear(year)) return;
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setViewMode('months');
  };

  const goToday = () => {
    if (isDisabledDay(today)) return;
    onChange(toYmd(today));
    setViewMonth(today);
    setViewMode('days');
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const headerPrev = () => {
    if (viewMode === 'days') setViewMonth((v) => addMonths(v, -1));
    else if (viewMode === 'months') setViewMonth((v) => new Date(v.getFullYear() - 1, v.getMonth(), 1));
    else setYearPage((p) => Math.max(yearPageStart(minYear), p - YEARS_PER_PAGE));
  };

  const headerNext = () => {
    if (viewMode === 'days') setViewMonth((v) => addMonths(v, 1));
    else if (viewMode === 'months') setViewMonth((v) => new Date(v.getFullYear() + 1, v.getMonth(), 1));
    else setYearPage((p) => Math.min(yearPageStart(maxYear), p + YEARS_PER_PAGE));
  };

  const yearOptions = useMemo(() => {
    const start = Math.max(minYear, yearPage);
    const end = Math.min(maxYear, yearPage + YEARS_PER_PAGE - 1);
    const list: number[] = [];
    for (let y = start; y <= end; y++) list.push(y);
    return list;
  }, [yearPage, minYear, maxYear]);

  const canPrev =
    viewMode === 'years'
      ? yearPage > yearPageStart(minYear)
      : viewMode === 'months'
        ? viewMonth.getFullYear() > minYear
        : true;

  const canNext =
    viewMode === 'years'
      ? yearPage + YEARS_PER_PAGE <= yearPageStart(maxYear)
      : viewMode === 'months'
        ? viewMonth.getFullYear() < maxYear
        : true;

  const headerTitle =
    viewMode === 'years' ? (
      <span className="neo-calendar-title">
        {yearPage} – {Math.min(yearPage + YEARS_PER_PAGE - 1, maxYear)}
      </span>
    ) : viewMode === 'months' ? (
      <button type="button" className="neo-calendar-title-btn" onClick={() => setViewMode('years')}>
        {viewMonth.getFullYear()}
      </button>
    ) : (
      <CalendarTitleSplit
        month={MONTHS[viewMonth.getMonth()]}
        year={viewMonth.getFullYear()}
        onMonthClick={() => setViewMode('months')}
        onYearClick={() => {
          setYearPage(yearPageStart(viewMonth.getFullYear()));
          setViewMode('years');
        }}
      />
    );

  return (
    <div ref={rootRef} className={clsx('relative space-y-0', className)}>
      {label && <label className="neo-field-label">{label}</label>}

      <div className={clsx('neo-date-field neo-inset', disabled && 'pointer-events-none opacity-60')}>
        <button
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          className="neo-date-trigger"
          aria-label="Open date picker"
          aria-expanded={open}
        >
          <Calendar className="h-5 w-5 text-[var(--neo-primary)]" strokeWidth={2} />
        </button>
        <button
          type="button"
          className="neo-date-input-wrap flex-1 cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
        >
          <span
            className={clsx(
              'neo-date-display pointer-events-none block w-full',
              value ? 'text-[var(--neo-text)]' : 'text-[var(--neo-muted)]',
            )}
          >
            {displayText}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="neo-calendar-popover"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <CalendarHeader
              canPrev={canPrev}
              canNext={canNext}
              viewMode={viewMode}
              onPrev={headerPrev}
              onNext={headerNext}
              title={headerTitle}
            />

            {viewMode === 'days' && (
              <>
                <div className="neo-calendar-weekdays">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="neo-calendar-weekday">
                      {d}
                    </span>
                  ))}
                </div>

                <div className="neo-calendar-grid">
                  {days.map(({ date, inMonth }) => {
                    const selectedDay = selected && isSameDay(date, selected);
                    const isToday = isSameDay(date, today);
                    const dis = isDisabledDay(date);
                    return (
                      <button
                        key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                        type="button"
                        disabled={dis}
                        onClick={() => pickDay(date)}
                        className={clsx(
                          'neo-calendar-day',
                          !inMonth && 'neo-calendar-day--muted',
                          selectedDay && 'neo-calendar-day--selected',
                          isToday && !selectedDay && 'neo-calendar-day--today',
                          dis && 'neo-calendar-day--disabled',
                        )}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="neo-calendar-footer">
                  <button type="button" className="neo-calendar-footer-btn" onClick={clear}>
                    Clear
                  </button>
                  <button type="button" className="neo-calendar-footer-btn neo-calendar-footer-btn--primary" onClick={goToday}>
                    Today
                  </button>
                </div>
              </>
            )}

            {viewMode === 'months' && (
              <div className="neo-calendar-picker-grid">
                {MONTHS_SHORT.map((name, i) => {
                  const dis = isDisabledMonth(viewMonth.getFullYear(), i);
                  const active = viewMonth.getMonth() === i;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={dis}
                      onClick={() => pickMonth(i)}
                      className={clsx(
                        'neo-calendar-picker-cell',
                        active && 'neo-calendar-picker-cell--selected',
                        dis && 'neo-calendar-day--disabled',
                      )}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === 'years' && (
              <div className="neo-calendar-picker-grid neo-calendar-picker-grid--years">
                {yearOptions.map((year) => {
                  const dis = isDisabledYear(year);
                  const active = viewMonth.getFullYear() === year;
                  return (
                    <button
                      key={year}
                      type="button"
                      disabled={dis}
                      onClick={() => pickYear(year)}
                      className={clsx(
                        'neo-calendar-picker-cell',
                        active && 'neo-calendar-picker-cell--selected',
                        dis && 'neo-calendar-day--disabled',
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode !== 'days' && (
              <div className="neo-calendar-footer neo-calendar-footer--picker">
                <button
                  type="button"
                  className="neo-calendar-footer-btn"
                  onClick={() => setViewMode(viewMode === 'years' ? 'months' : 'days')}
                >
                  Back
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {hint && <p className="mt-1.5 text-xs text-[var(--neo-muted)]">{hint}</p>}
    </div>
  );
}

function CalendarTitleSplit({
  month,
  year,
  onMonthClick,
  onYearClick,
}: {
  month: string;
  year: number;
  onMonthClick: () => void;
  onYearClick: () => void;
}) {
  return (
    <div className="neo-calendar-title-split">
      <button type="button" className="neo-calendar-title-btn" onClick={onMonthClick}>
        {month}
      </button>
      <span className="neo-calendar-title-sep">,</span>
      <button type="button" className="neo-calendar-title-btn" onClick={onYearClick}>
        {year}
      </button>
    </div>
  );
}

function CalendarHeader({
  canPrev,
  canNext,
  viewMode,
  onPrev,
  onNext,
  title,
}: {
  canPrev: boolean;
  canNext: boolean;
  viewMode: ViewMode;
  onPrev: () => void;
  onNext: () => void;
  title: ReactNode;
}) {
  return (
    <div className="neo-calendar-header">
      <button
        type="button"
        className="neo-calendar-nav"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label={viewMode === 'years' ? 'Previous years' : viewMode === 'months' ? 'Previous year' : 'Previous month'}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {title}
      <button
        type="button"
        className="neo-calendar-nav"
        onClick={onNext}
        disabled={!canNext}
        aria-label={viewMode === 'years' ? 'Next years' : viewMode === 'months' ? 'Next year' : 'Next month'}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
