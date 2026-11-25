import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { fmtDashDate, isISODate, parseFlexibleDate, todayISO } from '../lib/format.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Generates a convenient range of years for bank statement records
const YEARS = (() => {
  const current = new Date().getFullYear();
  const list = [];
  for (let y = current - 15; y <= current + 5; y++) list.push(y);
  return list;
})();

const pad = n => String(n).padStart(2, '0');
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

/**
 * Reusable, dependency-free accessible DatePicker component.
 * Allows both typed input in flexible formats (e.g. 01-Feb-2021, 2021-02-08)
 * and an interactive calendar popup with quick month/year jumps.
 */
export default function DatePicker({
  id: propId,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'dd-mmm-yyyy',
  required = false,
  disabled = false,
  className = '',
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}) {
  const autoId = useId();
  const inputId = propId || autoId;

  // Local text input state for natural typing
  const [text, setText] = useState(() => (value && isISODate(value) ? fmtDashDate(value) : (value || '')));
  const [open, setOpen] = useState(false);

  // Sync text if external value changes (e.g. statement loaded, seeded, or reset)
  useEffect(() => {
    setText(value && isISODate(value) ? fmtDashDate(value) : (value || ''));
  }, [value]);

  // Calendar view navigation state
  const initialDate = useMemo(() => {
    if (value && isISODate(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  // Update view when calendar opens
  const openCalendar = () => {
    if (disabled) return;
    if (value && isISODate(value)) {
      const [y, m, d] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    } else {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
    setOpen(true);
  };

  const closeCalendar = () => setOpen(false);

  const containerRef = useRef(null);

  // Dismiss popup on click outside or Escape
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeCalendar();
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeCalendar();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Handle typing inside text input
  function handleInputChange(e) {
    const val = e.target.value;
    setText(val);
  }

  function handleInputBlur(e) {
    const raw = text.trim();
    if (!raw) {
      onChange('');
      setText('');
    } else {
      const parsedIso = parseFlexibleDate(raw);
      if (parsedIso) {
        onChange(parsedIso);
        setText(fmtDashDate(parsedIso));
      } else {
        onChange(raw);
      }
    }
    if (onBlur) onBlur(e);
  }

  // Handle month/year shifts
  function prevMonth() {
    setViewMonth(m => {
      if (m === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function nextMonth() {
    setViewMonth(m => {
      if (m === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  // Generate 42 days grid for the view
  const daysGrid = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ y, m, d, iso: toIso(y, m, d), isCurrentMonth: false });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      cells.push({ y: viewYear, m: viewMonth, d, iso: toIso(viewYear, viewMonth, d), isCurrentMonth: true });
    }

    // 3. Next month leading days (fill up to 42 cells)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ y, m, d, iso: toIso(y, m, d), isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  function selectDate(iso) {
    onChange(iso);
    setText(fmtDashDate(iso));
    closeCalendar();
  }

  const today = todayISO();

  return (
    <div className={`datepicker-wrapper ${className}`} ref={containerRef}>
      <div className="datepicker-input-group">
        <input
          type="text"
          id={inputId}
          name={name}
          value={text}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          autoComplete="off"
          className="datepicker-input"
        />
        <button
          type="button"
          className="datepicker-toggle-btn"
          onClick={open ? closeCalendar : openCalendar}
          disabled={disabled}
          title={open ? 'Close calendar' : 'Open calendar picker'}
          aria-label={open ? 'Close calendar' : 'Open calendar picker'}
          tabIndex={-1}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="datepicker-popup" role="dialog" aria-modal="false" aria-label="Choose date">
          <div className="datepicker-header">
            <button type="button" className="datepicker-nav-btn" onClick={prevMonth} title="Previous month" aria-label="Previous month">
              ‹
            </button>
            <div className="datepicker-selectors">
              <select
                className="datepicker-select"
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                aria-label="Select month"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>{name}</option>
                ))}
              </select>
              <select
                className="datepicker-select"
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                aria-label="Select year"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" className="datepicker-nav-btn" onClick={nextMonth} title="Next month" aria-label="Next month">
              ›
            </button>
          </div>

          <div className="datepicker-weekdays" aria-hidden="true">
            {WEEKDAYS.map(w => (
              <span key={w} className="datepicker-weekday">{w}</span>
            ))}
          </div>

          <div className="datepicker-grid" role="grid">
            {daysGrid.map(cell => {
              const isSelected = value === cell.iso;
              const isToday = today === cell.iso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  className={`datepicker-day ${!cell.isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => selectDate(cell.iso)}
                  title={cell.iso}
                  aria-label={`${cell.d} ${MONTH_NAMES[cell.m]} ${cell.y}`}
                  aria-selected={isSelected}
                >
                  {cell.d}
                </button>
              );
            })}
          </div>

          <div className="datepicker-footer">
            <button type="button" className="datepicker-action-btn" onClick={() => selectDate(today)}>
              Today
            </button>
            {!required && (
              <button
                type="button"
                className="datepicker-action-btn secondary"
                onClick={() => {
                  onChange('');
                  setText('');
                  closeCalendar();
                }}
              >
                Clear
              </button>
            )}
            <button type="button" className="datepicker-action-btn secondary" onClick={closeCalendar}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
