import React from 'react';
import { FiRefreshCw, FiChevronLeft, FiFilter, FiLogIn, FiLogOut, FiCpu, FiUsers, FiClock, FiCheck, FiX } from 'react-icons/fi';
import Link from 'next/link';
import SearchBar from './SearchBar';
import Tooltip from './Tooltip';

interface ActionButton {
  label?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'orange' | 'purple';
  disabled?: boolean;
  hollow?: boolean;
}

interface BackButton {
  href?: string;
  onClick?: () => void;
  label?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface AttendanceData {
  isCheckedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  employeeName?: string;
}

interface TableHeaderProps {
  title?: string;
  total?: number;
  active?: number;
  inactive?: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  dropdown?: React.ReactNode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  actionButtons?: ActionButton[];
  showStats?: boolean;
  showSearch?: boolean;
  backButton?: BackButton;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  showFilter?: boolean;
  // Second filter props
  secondFilterValue?: string;
  onSecondFilterChange?: (value: string) => void;
  secondFilterOptions?: FilterOption[];
  showSecondFilter?: boolean;
  secondFilterLabel?: string;
  headerClassName?: string;
  // Attendance marking props
  showAttendanceMarking?: boolean;
  attendanceData?: AttendanceData;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  isMarkingAttendance?: boolean;
  // Custom filters props
  showCustomFilters?: boolean;
  technologyFilterValue?: string;
  onTechnologyFilterChange?: (value: string) => void;
  technologyFilterOptions?: FilterOption[];
  roleFilterValue?: string;
  onRoleFilterChange?: (value: string) => void;
  roleFilterOptions?: FilterOption[];
  experienceFilterValue?: string;
  onExperienceFilterChange?: (value: string) => void;
  experienceFilterOptions?: FilterOption[];
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  customReloadButton?: React.ReactNode;
  actionButtonsBeforeAttendance?: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  total,
  active,
  inactive,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search',
  searchAriaLabel = 'Search',
  dropdown,
  onRefresh,
  isRefreshing = false,
  actionButtons = [],
  showStats = true,
  showSearch = true,
  backButton,
  filterValue = 'all',
  onFilterChange,
  filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  showFilter = false,
  // Second filter props
  secondFilterValue = 'all',
  onSecondFilterChange,
  secondFilterOptions = [],
  showSecondFilter = false,
  secondFilterLabel = 'Filter',
  headerClassName = 'px-4 sm:px-6 pt-6 pb-6',
  showAttendanceMarking = false,
  attendanceData,
  onCheckIn,
  onCheckOut,
  isMarkingAttendance = false,
  // Custom filters props
  showCustomFilters = false,
  technologyFilterValue = '',
  onTechnologyFilterChange,
  technologyFilterOptions = [],
  roleFilterValue = '',
  onRoleFilterChange,
  roleFilterOptions = [],
  experienceFilterValue = '',
  onExperienceFilterChange,
  experienceFilterOptions = [],
  onClearFilters,
  hasActiveFilters = false,
  customReloadButton,
  actionButtonsBeforeAttendance = false,
}) => {
  const getButtonClasses = (variant: string = 'primary', hollow: boolean = false) => {
    const baseClasses = 'px-2 sm:px-4 py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto';
    
    if (hollow) {
      switch (variant) {
        case 'primary':
          return `${baseClasses} border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white`;
        case 'secondary':
          return `${baseClasses} border border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white`;
        case 'success':
          return `${baseClasses} border border-green-600 text-green-600 hover:bg-green-600 hover:text-white`;
        case 'warning':
          return `${baseClasses} border border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white`;
        case 'danger':
          return `${baseClasses} border border-red-600 text-red-600 hover:bg-red-600 hover:text-white`;
        case 'orange':
          return `${baseClasses} border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white`;
        case 'purple':
          return `${baseClasses} border border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white`;
        case 'info':
          return `${baseClasses} border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white`;
        default:
          return `${baseClasses} border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white`;
      }
    }
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
      case 'secondary':
        return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
      case 'success':
        return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
      case 'warning':
        return `${baseClasses} bg-amber-600 text-white hover:bg-amber-700`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case 'orange':
        return `${baseClasses} bg-orange-400 text-white hover:bg-orange-500`;
      case 'purple':
        return `${baseClasses} bg-purple-600 text-white hover:bg-purple-700`;
      case 'info':
        return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    }
  };

  const getBackButtonClasses = () => {
    return 'px-3 py-2 rounded-full flex items-center gap-2 transition-colors duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300';
  };

  return (
    <div>
      {/* Page Title and Action Buttons */}
      {(title || actionButtons.length > 0 || backButton) && (
        <div className={`flex justify-between items-center ${headerClassName}`}>
          {/* Left Side - Back Button */}
          <div className="flex items-center">
            {backButton && (
              backButton.href ? (
                <Link
                  href={backButton.href}
                  className={getBackButtonClasses()}
                  onClick={backButton.onClick}
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{backButton.label || 'Back'}</span>
                </Link>
              ) : (
                <button
                  onClick={backButton.onClick}
                  className={getBackButtonClasses()}
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{backButton.label || 'Back'}</span>
                </button>
              )
            )}
          </div>

          {/* Center - Title */}
          {title && (
            <div className="flex-1 flex justify-center text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
            </div>
          )}

          {/* Right Side - Action Buttons */}
          <div className={`${actionButtons.length === 1 ? 'flex justify-end' : 'grid grid-cols-2 gap-2'} sm:flex sm:items-center sm:gap-3 sm:flex-wrap sm:justify-end`}>
            {/* Regular Action Buttons - Render before attendance if prop is set */}
            {actionButtonsBeforeAttendance && actionButtons.map((button, index) => {
              const buttonContent = (
                <>
                  {button.icon}
                  {button.label && <span className="hidden sm:inline">{button.label}</span>}
                </>
              );

              if (button.href) {
                return (
                  <Link
                    key={index}
                    href={button.href}
                    className={`${getButtonClasses(button.variant, button.hollow)} ${
                      button.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={button.onClick}
                  >
                    {buttonContent}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={button.onClick}
                  disabled={button.disabled}
                  className={`${getButtonClasses(button.variant, button.hollow)} ${
                    button.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {buttonContent}
                </button>
              );
            })}
            
            {/* Attendance Marking Buttons */}
            {showAttendanceMarking && attendanceData && (
              <>
                {!attendanceData.isCheckedIn ? (
                  <button
                    onClick={onCheckIn}
                    disabled={isMarkingAttendance}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                  >
                    <FiLogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">{isMarkingAttendance ? 'Checking In...' : 'Check In'}</span>
                  </button>
                ) : (
                  <>
                    <div className="px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm font-medium flex items-center gap-2">
                      <FiCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Checked In</span>
                    </div>
                    {!attendanceData.checkOutTime ? (
                      <button
                        onClick={onCheckOut}
                        disabled={isMarkingAttendance}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">{isMarkingAttendance ? 'Checking Out...' : 'Check Out'}</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 bg-red-100 text-red-800 rounded-md text-sm font-medium flex items-center gap-2">
                        <FiCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Checked Out</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Regular Action Buttons - Render after attendance if prop is not set */}
            {!actionButtonsBeforeAttendance && actionButtons.map((button, index) => {
              const buttonContent = (
                <>
                  {button.icon}
                  {button.label && <span className="hidden sm:inline">{button.label}</span>}
                </>
              );

              if (button.href) {
                return (
                  <Link
                    key={index}
                    href={button.href}
                    className={`${getButtonClasses(button.variant, button.hollow)} ${
                      button.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={button.onClick}
                  >
                    {buttonContent}
                  </Link>
                );
              }

              return (
                <button
                  key={index}
                  onClick={button.onClick}
                  disabled={button.disabled}
                  className={`${getButtonClasses(button.variant, button.hollow)} ${
                    button.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {buttonContent}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats and Search Section */}
      {(showStats || showSearch || showFilter || showSecondFilter || showCustomFilters) && (
        <div className="px-4 sm:px-6 pb-6 border-b border-gray-200">
          {/* Mobile: Stack everything vertically, Desktop: Side by side */}
          <div className={`flex flex-col lg:flex-row ${showStats ? 'lg:justify-between' : 'lg:justify-end'} lg:items-center gap-4 mt-4`}>
            {/* Stats Section */}
            {showStats && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {typeof total === 'number' && (
                  <span className="pr-2 py-1 rounded-full">Total: <span className="font-medium">{total}</span></span>
                )}
                {typeof active === 'number' && (
                  <span className="pr-2 py-1 rounded-full text-green-700">Active: <span className="font-medium">{active}</span></span>
                )}
                {typeof inactive === 'number' && (
                  <span className="py-1 rounded-full text-red-700">Inactive: <span className="font-medium">{inactive}</span></span>
                )}
                {dropdown && <span>{dropdown}</span>}
              </div>
            )}

            {/* Search and Controls Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              {/* Custom Filters - Mobile: Stack vertically, Desktop: Side by side */}
              {showCustomFilters && (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {/* Active Filters Display - Mobile Only */}
                  {hasActiveFilters && onClearFilters && (
                    <div className="sm:hidden w-full">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {technologyFilterValue && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            Tech: {technologyFilterValue}
                            <button
                              onClick={() => onTechnologyFilterChange?.('')}
                              className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {roleFilterValue && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            Role: {roleFilterValue}
                            <button
                              onClick={() => onRoleFilterChange?.('')}
                              className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {experienceFilterValue && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                            Exp: {experienceFilterValue}
                            <button
                              onClick={() => onExperienceFilterChange?.('')}
                              className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={onClearFilters}
                        className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}

                  {/* Filter Dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {technologyFilterOptions.length > 0 && onTechnologyFilterChange && (
                      <div className="relative w-full sm:w-32">
                        <select
                          value={technologyFilterValue}
                          onChange={(e) => onTechnologyFilterChange(e.target.value)}
                          className="appearance-none border border-gray-300 rounded-md pl-10 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          {technologyFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiCpu className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}

                    {roleFilterOptions.length > 0 && onRoleFilterChange && (
                      <div className="relative w-full sm:w-36">
                        <select
                          value={roleFilterValue}
                          onChange={(e) => onRoleFilterChange(e.target.value)}
                          className="appearance-none border border-gray-300 rounded-md pl-10 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          {roleFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUsers className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}

                    {experienceFilterOptions.length > 0 && onExperienceFilterChange && (
                      <div className="relative w-full sm:w-32">
                        <select
                          value={experienceFilterValue}
                          onChange={(e) => onExperienceFilterChange(e.target.value)}
                          className="appearance-none border border-gray-300 rounded-md pl-10 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        >
                          {experienceFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiClock className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    )}
                    {customReloadButton}
                  </div>

                  {/* Desktop Clear Filters Button */}
                  {hasActiveFilters && onClearFilters && (
                    <button
                      onClick={onClearFilters}
                      className="hidden sm:block px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
              
              {/* Other Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {onRefresh && (
                  <Tooltip content="Refresh" position="top" color="blue">
                    <button
                      onClick={onRefresh}
                      disabled={isRefreshing}
                      className={`border border-gray-300 p-2 rounded-md transition-all duration-200 ${
                        isRefreshing 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : 'text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      aria-label="Refresh data"
                    >
                      <FiRefreshCw 
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                      />
                    </button>
                  </Tooltip>
                )}
                
                {showFilter && onFilterChange && (
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={filterValue}
                      onChange={(e) => onFilterChange(e.target.value)}
                      className="appearance-none border border-gray-300 rounded-md pl-10 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      {filterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiFilter className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                )}
                
                {showSecondFilter && onSecondFilterChange && (
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={secondFilterValue}
                      onChange={(e) => onSecondFilterChange(e.target.value)}
                      className="appearance-none border border-gray-300 rounded-md pl-10 pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                    >
                      {secondFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiFilter className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                )}
                
                {/* Search Bar - Full width on mobile */}
                {showSearch && (
                  <div className="w-full sm:w-64">
                    <SearchBar
                      value={searchValue}
                      onChange={onSearchChange}
                      placeholder={searchPlaceholder}
                      ariaLabel={searchAriaLabel}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableHeader; 