'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiCalendar } from 'react-icons/fi';

interface DatePickerDropdownProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePickerDropdown: React.FC<DatePickerDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(value?.getDate() || 1);
  const [selectedMonth, setSelectedMonth] = useState<number>(value?.getMonth() || 0);
  const [selectedYear, setSelectedYear] = useState<number>(value?.getFullYear() || new Date().getFullYear());
  
  // Refs for scroll containers
  const dayScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const yearScrollRef = useRef<HTMLDivElement>(null);
  
  // Track scroll limits for visual feedback
  const [dayScrollLimit, setDayScrollLimit] = useState<'none' | 'top' | 'bottom'>('none');
  const [monthScrollLimit, setMonthScrollLimit] = useState<'none' | 'top' | 'bottom'>('none');
  const [yearScrollLimit, setYearScrollLimit] = useState<'none' | 'top' | 'bottom'>('none');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getDaysArray = (month: number, year: number) => {
    const daysCount = daysInMonth(month, year);
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };

  const getYearsArray = () => {
    const currentYear = new Date().getFullYear();
    const startYear = minDate?.getFullYear() || currentYear - 50;
    const endYear = maxDate?.getFullYear() || currentYear + 10;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  };

  const handleDayChange = (day: number) => {
    const maxDays = daysInMonth(selectedMonth, selectedYear);
    const validDay = Math.max(1, Math.min(day, maxDays));
    
    if (validDay !== selectedDay) {
      console.log('📅 Day change', { requested: day, valid: validDay, maxDays });
      setSelectedDay(validDay);
      updateDate(validDay, selectedMonth, selectedYear);
    }
  };

  const handleMonthChange = (month: number) => {
    const validMonth = Math.max(0, Math.min(month, 11)); // 0-11 for months
    
    if (validMonth !== selectedMonth) {
      console.log('📅 Month change', { requested: month, valid: validMonth });
      setSelectedMonth(validMonth);
      // Adjust day if it exceeds the new month's days
      const maxDays = daysInMonth(validMonth, selectedYear);
      const newDay = Math.min(selectedDay, maxDays);
      setSelectedDay(newDay);
      updateDate(newDay, validMonth, selectedYear);
    }
  };

  const handleYearChange = (year: number) => {
    const years = getYearsArray();
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const validYear = Math.max(minYear, Math.min(year, maxYear));
    
    if (validYear !== selectedYear) {
      console.log('📅 Year change', { requested: year, valid: validYear, minYear, maxYear });
      setSelectedYear(validYear);
      // Adjust day if it exceeds the new month's days (for February in leap years)
      const maxDays = daysInMonth(selectedMonth, validYear);
      const newDay = Math.min(selectedDay, maxDays);
      setSelectedDay(newDay);
      updateDate(newDay, selectedMonth, validYear);
    }
  };

  const updateDate = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day);
    onChange?.(newDate);
  };

  // Function to scroll selected item to center
  const scrollToCenter = (containerRef: React.RefObject<HTMLDivElement | null>, selectedIndex: number, maxIndex: number) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const itemHeight = 40; // Height of each item
      const containerHeight = 128; // Height of scroll container (h-32 = 128px)
      const paddingHeight = 176; // Height of top/bottom padding (h-44 = 176px)
      const centerPosition = (containerHeight - itemHeight) / 2;
      
      // Clamp selectedIndex to valid range
      const clampedIndex = Math.max(0, Math.min(selectedIndex, maxIndex));
      const scrollPosition = (paddingHeight + (clampedIndex * itemHeight)) - centerPosition;
      
      // Clamp scroll position to valid range
      const maxScrollTop = (maxIndex + 1) * itemHeight + paddingHeight - containerHeight;
      const finalScrollTop = Math.max(0, Math.min(scrollPosition, maxScrollTop));
      
      // Use instant scroll for smooth positioning
      container.scrollTop = finalScrollTop;
      
      console.log('🎯 Scroll to center', { 
        selectedIndex,
        clampedIndex,
        maxIndex,
        itemHeight, 
        containerHeight, 
        paddingHeight,
        centerPosition, 
        scrollPosition,
        maxScrollTop,
        finalScrollTop
      });
    }
  };

  // Effect to center selected items when dropdown opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        console.log('🔄 Centering items when dropdown opens');
        
        // Center Day
        const days = getDaysArray(selectedMonth, selectedYear);
        const dayIndex = days.indexOf(selectedDay);
        console.log('📅 Day centering', { selectedDay, dayIndex, totalDays: days.length });
        if (dayIndex !== -1) {
          scrollToCenter(dayScrollRef, dayIndex, days.length - 1);
        }
        
        // Center Month
        console.log('📅 Month centering', { selectedMonth, totalMonths: months.length });
        scrollToCenter(monthScrollRef, selectedMonth, months.length - 1);
        
        // Center Year
        const years = getYearsArray();
        const yearIndex = years.indexOf(selectedYear);
        console.log('📅 Year centering', { selectedYear, yearIndex, totalYears: years.length });
        if (yearIndex !== -1) {
          scrollToCenter(yearScrollRef, yearIndex, years.length - 1);
        }
      }, 100);
    }
  }, [isOpen, selectedDay, selectedMonth, selectedYear]);

  // Sync internal state with external value prop
  useEffect(() => {
    if (value) {
      const newDay = value.getDate();
      const newMonth = value.getMonth();
      const newYear = value.getFullYear();
      
      if (newDay !== selectedDay) setSelectedDay(newDay);
      if (newMonth !== selectedMonth) setSelectedMonth(newMonth);
      if (newYear !== selectedYear) setSelectedYear(newYear);
    }
  }, [value]);

  const formatDisplayDate = () => {
    if (!value) return placeholder;
    const day = value.getDate().toString().padStart(2, '0');
    const month = (value.getMonth() + 1).toString().padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display Field - matches screenshot exactly */}
      <div
        className={`
          flex items-center justify-between w-full px-3 py-2 
          border border-gray-300 rounded-md cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${!value ? 'text-gray-500' : 'text-gray-900'}`}>
          {formatDisplayDate()}
        </span>
        <FiCalendar className="w-4 h-4 text-gray-400" />
      </div>

      {/* Dropdown - matches screenshot exactly */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-4">
            {/* Title - matches screenshot */}
            <div className="text-center text-sm font-medium text-gray-700 mb-3">
              Select Date
            </div>
            
            {/* Three columns layout - matches screenshot */}
            <div className="flex gap-4">
              {/* Debug info */}
              <div className="absolute top-0 left-0 bg-red-500 p-1 text-xs z-50">
                Day: {selectedDay}, Month: {selectedMonth}, Year: {selectedYear}
                <br />
                Limits: Day({dayScrollLimit}), Month({monthScrollLimit}), Year({yearScrollLimit})
              </div>
              {/* Day Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Day</div>
                <div className="relative">
                  {/* Highlight box - matches screenshot */}
                  <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                  <div 
                    ref={dayScrollRef}
                    className="h-32 overflow-y-auto scrollbar-hide"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const scrollTop = target.scrollTop;
                      const itemHeight = 40;
                      const paddingHeight = 176;
                      const containerHeight = 128;
                      
                      // Calculate max scroll position
                      const days = getDaysArray(selectedMonth, selectedYear);
                      const maxScrollTop = (days.length - 1) * itemHeight + paddingHeight - containerHeight;
                      
                      // Prevent scrolling beyond limits
                      if (scrollTop < 0) {
                        target.scrollTop = 0;
                        setDayScrollLimit('top');
                      } else if (scrollTop > maxScrollTop) {
                        target.scrollTop = maxScrollTop;
                        setDayScrollLimit('bottom');
                      } else {
                        setDayScrollLimit('none');
                      }
                      
                      console.log('🔄 Day scroll', { scrollTop, maxScrollTop, clamped: target.scrollTop, limit: dayScrollLimit });
                    }}
                  >
                    {/* Add padding to center items properly */}
                    <div className="h-44"></div> {/* Top padding */}
                    {getDaysArray(selectedMonth, selectedYear).map((day) => (
                      <div
                        key={day}
                        className={`
                          h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                          ${selectedDay === day ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                          ${day === 1 ? 'border-l-2 border-blue-200' : ''}
                          ${day === daysInMonth(selectedMonth, selectedYear) ? 'border-r-2 border-blue-200' : ''}
                          hover:bg-blue-50
                        `}
                        onClick={() => handleDayChange(day)}
                      >
                        {day.toString().padStart(2, '0')}
                      </div>
                    ))}
                    <div className="h-44"></div> {/* Bottom padding */}
                  </div>
                </div>
              </div>

              {/* Month Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Month</div>
                <div className="relative">
                  {/* Highlight box - matches screenshot */}
                  <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                  <div 
                    ref={monthScrollRef}
                    className="h-32 overflow-y-auto scrollbar-hide"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const scrollTop = target.scrollTop;
                      const itemHeight = 40;
                      const paddingHeight = 176;
                      const containerHeight = 128;
                      
                      // Calculate max scroll position (12 months - 1 = 11)
                      const maxScrollTop = 11 * itemHeight + paddingHeight - containerHeight;
                      
                      // Prevent scrolling beyond limits
                      if (scrollTop < 0) {
                        target.scrollTop = 0;
                        setMonthScrollLimit('top');
                      } else if (scrollTop > maxScrollTop) {
                        target.scrollTop = maxScrollTop;
                        setMonthScrollLimit('bottom');
                      } else {
                        setMonthScrollLimit('none');
                      }
                      
                      console.log('🔄 Month scroll', { scrollTop, maxScrollTop, clamped: target.scrollTop, limit: monthScrollLimit });
                    }}
                  >
                    {/* Add padding to center items properly */}
                    <div className="h-44"></div> {/* Top padding */}
                    {months.map((month, index) => (
                      <div
                        key={month}
                        className={`
                          h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                          ${selectedMonth === index ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                          ${index === 0 ? 'border-l-2 border-blue-200' : ''}
                          ${index === 11 ? 'border-r-2 border-blue-200' : ''}
                          hover:bg-blue-50
                        `}
                        onClick={() => handleMonthChange(index)}
                      >
                        {month}
                      </div>
                    ))}
                    <div className="h-44"></div> {/* Bottom padding */}
                  </div>
                </div>
              </div>

              {/* Year Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Year</div>
                <div className="relative">
                  {/* Highlight box - matches screenshot */}
                  <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                  <div 
                    ref={yearScrollRef}
                    className="h-32 overflow-y-auto scrollbar-hide"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const scrollTop = target.scrollTop;
                      const itemHeight = 40;
                      const paddingHeight = 176;
                      const containerHeight = 128;
                      
                      // Calculate max scroll position
                      const years = getYearsArray();
                      const maxScrollTop = (years.length - 1) * itemHeight + paddingHeight - containerHeight;
                      
                      // Prevent scrolling beyond limits
                      if (scrollTop < 0) {
                        target.scrollTop = 0;
                        setYearScrollLimit('top');
                      } else if (scrollTop > maxScrollTop) {
                        target.scrollTop = maxScrollTop;
                        setYearScrollLimit('bottom');
                      } else {
                        setYearScrollLimit('none');
                      }
                      
                      console.log('🔄 Year scroll', { scrollTop, maxScrollTop, clamped: target.scrollTop, limit: yearScrollLimit });
                    }}
                  >
                    {/* Add padding to center items properly */}
                    <div className="h-44"></div> {/* Top padding */}
                    {getYearsArray().map((year, index) => (
                      <div
                        key={year}
                        className={`
                          h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                          ${selectedYear === year ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                          ${index === 0 ? 'border-l-2 border-blue-200' : ''}
                          ${index === getYearsArray().length - 1 ? 'border-r-2 border-blue-200' : ''}
                          hover:bg-blue-50
                        `}
                        onClick={() => handleYearChange(year)}
                      >
                        {year}
                      </div>
                    ))}
                    <div className="h-44"></div> {/* Bottom padding */}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - matches screenshot exactly */}
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DatePickerDropdown; 