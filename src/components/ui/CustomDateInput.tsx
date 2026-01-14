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
}

export default function CustomDateInput({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  required = false,
  disabled = false,
  name
}: CustomDateInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      const hiddenInput = document.getElementById(`hidden-${name}`) as HTMLInputElement;
      if (hiddenInput) {
        hiddenInput.focus();
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
        id={`hidden-${name}`}
        type="date"
        value={value || ''}
        onChange={handleDateChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        required={required}
        disabled={disabled}
        onBlur={() => setIsDatePickerOpen(false)}
      />
    </div>
  );
} 