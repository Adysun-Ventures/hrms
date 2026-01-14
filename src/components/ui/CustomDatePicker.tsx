'use client';

import React, { useState, useEffect } from 'react';
import { FiCalendar, FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface CustomDatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
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
  const dayScrollRef = React.useRef<HTMLDivElement>(null);
  const monthScrollRef = React.useRef<HTMLDivElement>(null);
  const yearScrollRef = React.useRef<HTMLDivElement>(null);

  // Track if we're programmatically scrolling to prevent conflicts
  const isProgrammaticScroll = React.useRef(false);

  // Log component initialization
  console.log('🔄 CustomDatePicker: Component initialized', {
    value: value?.toISOString(),
    selectedDay,
    selectedMonth,
    selectedYear,
    isOpen
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
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
    console.log('📅 handleDayChange called', { day, selectedDay, isChange: day !== selectedDay });
    if (day !== selectedDay) {
      console.log('✅ Setting new day', { from: selectedDay, to: day });
      setSelectedDay(day);
      updateDate(day, selectedMonth, selectedYear);
    } else {
      console.log('⏭️ Day unchanged, skipping update');
    }
  };

  const handleMonthChange = (month: number) => {
    console.log('📅 handleMonthChange called', { month, selectedMonth, isChange: month !== selectedMonth });
    if (month !== selectedMonth) {
      console.log('✅ Setting new month', { from: selectedMonth, to: month });
      setSelectedMonth(month);
      // Adjust day if it exceeds the new month's days
      const maxDays = daysInMonth(month, selectedYear);
      const newDay = Math.min(selectedDay, maxDays);
      console.log('📊 Adjusting day for new month', { oldDay: selectedDay, newDay, maxDays });
      setSelectedDay(newDay);
      updateDate(newDay, month, selectedYear);
    } else {
      console.log('⏭️ Month unchanged, skipping update');
    }
  };

  const handleYearChange = (year: number) => {
    console.log('📅 handleYearChange called', { year, selectedYear, isChange: year !== selectedYear });
    if (year !== selectedYear) {
      console.log('✅ Setting new year', { from: selectedYear, to: year });
      setSelectedYear(year);
      // Adjust day if it exceeds the new month's days (for February in leap years)
      const maxDays = daysInMonth(selectedMonth, year);
      const newDay = Math.min(selectedDay, maxDays);
      console.log('📊 Adjusting day for new year', { oldDay: selectedDay, newDay, maxDays });
      setSelectedDay(newDay);
      updateDate(newDay, selectedMonth, year);
    } else {
      console.log('⏭️ Year unchanged, skipping update');
    }
  };

  const updateDate = (day: number, month: number, year: number) => {
    const newDate = new Date(year, month, day);
    console.log('🔄 updateDate called', { day, month, year, newDate: newDate.toISOString() });
    onChange?.(newDate);
  };

  // Function to scroll selected item to center
  const scrollToCenter = (containerRef: React.RefObject<HTMLDivElement | null>, selectedIndex: number) => {
    console.log('🎯 scrollToCenter called', { selectedIndex, hasRef: !!containerRef.current });
    if (containerRef.current) {
      const container = containerRef.current;
      const itemHeight = 40; // Height of each item
      const containerHeight = 128; // Height of scroll container (h-32 = 128px)
      const centerPosition = (containerHeight - itemHeight) / 2;
      const scrollPosition = (selectedIndex * itemHeight) - centerPosition;
      const finalScrollPosition = Math.max(0, scrollPosition);
      
      console.log('📏 Scroll calculations', { 
        itemHeight, 
        containerHeight, 
        centerPosition, 
        scrollPosition, 
        finalScrollPosition 
      });
      
      // Mark as programmatic scroll to prevent conflicts
      isProgrammaticScroll.current = true;
      
      // Use instant scroll instead of smooth to prevent glitches
      container.scrollTop = finalScrollPosition;
      console.log('✅ Scrolled to position', { scrollTop: container.scrollTop });
      
      // Reset flag after a short delay
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 100);
    } else {
      console.log('❌ Container ref not available');
    }
  };

  // Effect to center selected items when dropdown opens
  React.useEffect(() => {
    console.log('🔧 useEffect triggered', { isOpen, selectedDay, selectedMonth, selectedYear });
    if (isOpen) {
      console.log('📂 Dropdown opened, scheduling scroll operations');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        console.log('⏰ Scroll timeout executed');
        const days = getDaysArray(selectedMonth, selectedYear);
        const dayIndex = days.indexOf(selectedDay);
        console.log('📅 Day scroll info', { days: days.length, selectedDay, dayIndex });
        if (dayIndex !== -1) {
          scrollToCenter(dayScrollRef, dayIndex);
        } else {
          console.log('❌ Day index not found');
        }
        
        console.log('📅 Month scroll info', { selectedMonth });
        scrollToCenter(monthScrollRef, selectedMonth);
        
        const years = getYearsArray();
        const yearIndex = years.indexOf(selectedYear);
        console.log('📅 Year scroll info', { years: years.length, selectedYear, yearIndex });
        if (yearIndex !== -1) {
          scrollToCenter(yearScrollRef, yearIndex);
        } else {
          console.log('❌ Year index not found');
        }
      }, 100);
    } else {
      console.log('📂 Dropdown closed');
    }
  }, [isOpen, selectedDay, selectedMonth, selectedYear]); // Include all dependencies to prevent stale closures

  // Sync internal state with external value prop
  React.useEffect(() => {
    if (value) {
      const newDay = value.getDate();
      const newMonth = value.getMonth();
      const newYear = value.getFullYear();
      
      console.log('🔄 Syncing with external value', { 
        externalValue: value.toISOString(),
        currentState: { selectedDay, selectedMonth, selectedYear },
        newState: { newDay, newMonth, newYear }
      });
      
      if (newDay !== selectedDay) setSelectedDay(newDay);
      if (newMonth !== selectedMonth) setSelectedMonth(newMonth);
      if (newYear !== selectedYear) setSelectedYear(newYear);
    }
  }, [value]); // Only depend on external value

  const formatDisplayDate = () => {
    if (!value) return placeholder;
    const day = value.getDate().toString().padStart(2, '0');
    const month = (value.getMonth() + 1).toString().padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>, type: 'day' | 'month' | 'year') => {
    // Skip if this is a programmatic scroll
    if (isProgrammaticScroll.current) {
      console.log('⏭️ Skipping scroll handler - programmatic scroll');
      return;
    }

    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const itemHeight = 40; // Height of each item
    const selectedIndex = Math.round(scrollTop / itemHeight);
    
    console.log('🔄 handleScroll called', { 
      type, 
      scrollTop, 
      itemHeight, 
      selectedIndex,
      currentTimeout: (target as any).scrollTimeout,
      isProgrammatic: isProgrammaticScroll.current
    });
    
    // Debounce the scroll handler to prevent excessive updates
    clearTimeout((target as any).scrollTimeout);
    (target as any).scrollTimeout = setTimeout(() => {
      console.log('⏰ Scroll debounce timeout executed', { type, selectedIndex });
      if (type === 'day') {
        const days = getDaysArray(selectedMonth, selectedYear);
        if (days[selectedIndex]) {
          console.log('📅 Day scroll selection', { selectedIndex, day: days[selectedIndex] });
          handleDayChange(days[selectedIndex]);
        } else {
          console.log('❌ Day not found at index', { selectedIndex, daysLength: days.length });
        }
      } else if (type === 'month') {
        if (months[selectedIndex]) {
          console.log('📅 Month scroll selection', { selectedIndex, month: months[selectedIndex] });
          handleMonthChange(selectedIndex);
        } else {
          console.log('❌ Month not found at index', { selectedIndex, monthsLength: months.length });
        }
      } else if (type === 'year') {
        const years = getYearsArray();
        if (years[selectedIndex]) {
          console.log('📅 Year scroll selection', { selectedIndex, year: years[selectedIndex] });
          handleYearChange(years[selectedIndex]);
        } else {
          console.log('❌ Year not found at index', { selectedIndex, yearsLength: years.length });
        }
      }
    }, 150); // Debounce delay
  };

  return (
    <div className={`relative ${className}`}>
      {/* Display Field */}
      <div
        className={`
          flex items-center justify-between w-full px-3 py-2 
          border border-gray-300 rounded-md cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
        `}
        onClick={() => {
          console.log('🖱️ Dropdown toggle clicked', { currentIsOpen: isOpen, disabled });
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`${!value ? 'text-gray-500' : 'text-gray-900'}`}>
          {formatDisplayDate()}
        </span>
        <FiCalendar className="w-4 h-4 text-gray-400" />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="p-4">
            <div className="text-center text-sm font-medium text-gray-700 mb-3">
              Select Date
            </div>
            
            <div className="flex gap-4">
              {/* Day Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Day</div>
                                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                    <div 
                      ref={dayScrollRef}
                      className="h-32 overflow-y-auto scrollbar-hide"
                      onScroll={(e) => handleScroll(e, 'day')}
                    >
                      {getDaysArray(selectedMonth, selectedYear).map((day) => (
                        <div
                          key={day}
                          className={`
                            h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                            ${selectedDay === day ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                            hover:bg-blue-50
                          `}
                          onClick={() => {
                            console.log('🖱️ Day clicked', { day, selectedDay });
                            handleDayChange(day);
                          }}
                        >
                          {day.toString().padStart(2, '0')}
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Month Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Month</div>
                                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                    <div 
                      ref={monthScrollRef}
                      className="h-32 overflow-y-auto scrollbar-hide"
                      onScroll={(e) => handleScroll(e, 'month')}
                    >
                      {months.map((month, index) => (
                        <div
                          key={month}
                          className={`
                            h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                            ${selectedMonth === index ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                            hover:bg-blue-50
                          `}
                          onClick={() => {
                            console.log('🖱️ Month clicked', { month, index, selectedMonth });
                            handleMonthChange(index);
                          }}
                        >
                          {month}
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

              {/* Year Column */}
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-500 mb-2 text-center">Year</div>
                                  <div className="relative">
                    <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 h-10 bg-blue-100 rounded pointer-events-none z-10"></div>
                    <div 
                      ref={yearScrollRef}
                      className="h-32 overflow-y-auto scrollbar-hide"
                      onScroll={(e) => handleScroll(e, 'year')}
                    >
                      {getYearsArray().map((year) => (
                        <div
                          key={year}
                          className={`
                            h-10 flex items-center justify-center text-sm cursor-pointer relative z-20
                            ${selectedYear === year ? 'text-blue-600 font-medium bg-blue-100' : 'text-gray-600'}
                            hover:bg-blue-50
                          `}
                          onClick={() => {
                            console.log('🖱️ Year clicked', { year, selectedYear });
                            handleYearChange(year);
                          }}
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* Action Buttons */}
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

export default CustomDatePicker; 