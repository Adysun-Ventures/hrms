'use client';

import { useState, useEffect } from 'react';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { FiCalendar } from 'react-icons/fi';

interface CustomDateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  min?: string;
  max?: string;
}

export default function CustomDateInput({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  required = false,
  disabled = false,
  name,
  min,
  max
}: CustomDateInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const safeName = String(name || 'date').replace(/[^a-zA-Z0-9_-]/g, '-');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateToDayMonYear(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
    if (newValue) {
      setDisplayValue(formatDateToDayMonYear(newValue));
    } else {
      setDisplayValue('');
    }
  };

  const handleDisplayClick = () => {
    if (!disabled) {
      setIsDatePickerOpen(true);
      // Focus the hidden input
      const hiddenInput = document.getElementById(`hidden-${safeName}`) as HTMLInputElement;
      if (hiddenInput) {
        hiddenInput.focus();
        // Best-effort: open the native date picker when supported.
        // (Some browsers require focus + showPicker for consistent behavior.)
        (hiddenInput as any).showPicker?.();
      }
    }
  };

  return (
    <div className="relative">
      {/* Display input (read-only) */}
      <input
        type="text"
        value={displayValue}
        onClick={handleDisplayClick}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${className}`}
        readOnly
        required={required}
        disabled={disabled}
      />
      
      {/* Calendar icon */}
      <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
      
      {/* Hidden date input for actual date picker */}
      <input
        id={`hidden-${safeName}`}
        type="date"
        value={value || ''}
        onChange={handleDateChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        onClick={handleDisplayClick}
        onFocus={handleDisplayClick}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        onBlur={() => setIsDatePickerOpen(false)}
      />
    </div>
  );
} 