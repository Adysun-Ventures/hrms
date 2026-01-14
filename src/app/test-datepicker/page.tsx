'use client';

import React, { useState } from 'react';
import DatePickerDropdown from '@/components/ui/DatePickerDropdown';

export default function TestDatePickerPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [minDate] = useState(new Date(1990, 0, 1));
  const [maxDate] = useState(new Date(2030, 11, 31));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Custom Date Picker Demo</h1>
        
        <div className="space-y-6">
          {/* Basic Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <DatePickerDropdown
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Choose a date"
            />
          </div>

          {/* Date Picker with Min/Max Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date with Range (1990-2030)
            </label>
            <DatePickerDropdown
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Choose a date"
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>

          {/* Disabled Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disabled Date Picker
            </label>
            <DatePickerDropdown
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Disabled"
              disabled={true}
            />
          </div>

          {/* Display Selected Date */}
          {selectedDate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Date:</h3>
              <p className="text-blue-800">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Clear Button */}
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(undefined)}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 