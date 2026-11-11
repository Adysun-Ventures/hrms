import React from 'react';
import { FiRefreshCw, FiChevronLeft, FiFilter, FiCpu, FiX } from 'react-icons/fi';
import Link from '@/lib/link';
import SearchBar from './SearchBar';
import Tooltip from './Tooltip';
import { useAuth } from '@/context/AuthContext';

interface ActionButton {
  label?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'orange' | 'purple';
  disabled?: boolean;
  hollow?: boolean;
  pill?: boolean;
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

interface TableHeaderProps {
  title?: string;
  total?: number;
  active?: number;
  inactive?: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchContainerClassName?: string;
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
  showFilterIcon?: boolean;
  filterOptGroupLabel?: string;
  // Second filter props
  secondFilterValue?: string;
  onSecondFilterChange?: (value: string) => void;
  secondFilterOptions?: FilterOption[];
  showSecondFilter?: boolean;
  secondFilterLabel?: string;
  showSecondFilterIcon?: boolean;
  secondFilterOptGroupLabel?: string;
  secondFilterContainerClassName?: string;
  // Third filter props
  thirdFilterValue?: string;
  onThirdFilterChange?: (value: string) => void;
  thirdFilterOptions?: FilterOption[];
  showThirdFilter?: boolean;
  showThirdFilterIcon?: boolean;
  headerClassName?: string;
  // Custom filters props
  showCustomFilters?: boolean;
  technologyFilterValue?: string;
  onTechnologyFilterChange?: (value: string) => void;
  technologyFilterOptions?: FilterOption[];
  showTechnologyFilterIcon?: boolean;
  technologyFilterOptGroupLabel?: string;
  customReloadButton?: React.ReactNode;
  /** Optional custom content rendered in the right action area (before actionButtons). */
  rightSlot?: React.ReactNode;
  totalLabel?: string;
  stackTotalStat?: boolean;
  extraStatLabel?: string;
  extraStatValue?: number;
  stackExtraStat?: boolean;
  extraStatValuePrefix?: React.ReactNode;
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
  searchContainerClassName,
  dropdown,
  onRefresh,
  isRefreshing = false,
  actionButtons = [],
  showStats = true,
  showSearch = false,
  backButton,
  filterValue = 'all',
  onFilterChange,
  filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ],
  showFilter = false,
  showFilterIcon = true,
  filterOptGroupLabel,
  // Second filter props
  secondFilterValue = 'all',
  onSecondFilterChange,
  secondFilterOptions = [],
  showSecondFilter = false,
  secondFilterLabel = 'Filter',
  showSecondFilterIcon = true,
  secondFilterOptGroupLabel,
  secondFilterContainerClassName,
  // Third filter props
  thirdFilterValue = 'all',
  onThirdFilterChange,
  thirdFilterOptions = [],
  showThirdFilter = false,
  showThirdFilterIcon = true,
  headerClassName = 'px-4 sm:px-6 pt-6 pb-6',
  // Custom filters props
  showCustomFilters = false,
  technologyFilterValue = '',
  onTechnologyFilterChange,
  technologyFilterOptions = [],
  showTechnologyFilterIcon = true,
  technologyFilterOptGroupLabel,
  customReloadButton,
  rightSlot,
  totalLabel = 'Total',
  stackTotalStat = false,
  extraStatLabel,
  extraStatValue,
  stackExtraStat = false,
  extraStatValuePrefix = null,
}) => {
  const { currentUserData, isEmployeeExited } = useAuth();
  const isExitedEmployeeUser = currentUserData?.userType === 'employee' && isEmployeeExited;
  const writeActionPattern = /\b(add|create|edit|update|delete|remove)\b/i;
  const visibleActionButtons = isExitedEmployeeUser
    ? actionButtons.filter((button) => {
        const text = `${button.label || ''} ${button.href || ''}`.toLowerCase();
        return !writeActionPattern.test(text);
      })
    : actionButtons;

  const getButtonClasses = (variant: string = 'primary', hollow: boolean = false, pill: boolean = false) => {
    const shapeClass = pill ? 'rounded-full' : 'rounded-md';
    const baseClasses = `px-2 sm:px-4 py-2 ${shapeClass} flex items-center justify-center gap-1 sm:gap-2 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto`;
    
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
        return `${baseClasses} bg-orange-600 text-white hover:bg-orange-700`;
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
      {(title || visibleActionButtons.length > 0 || backButton) && (
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>
                {customReloadButton}
              </div>
            </div>
          )}

          {/* Right Side - Action Buttons */}
          <div className={`${visibleActionButtons.length === 1 ? 'flex justify-end' : 'grid grid-cols-2 gap-2'} sm:flex sm:items-center sm:gap-3 sm:flex-wrap sm:justify-end`}>
            {rightSlot}
            {visibleActionButtons.map((button, index) => {
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
                    className={`${
                      button.disabled
                        ? 'px-2 sm:px-4 py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto bg-gray-300 text-gray-500 cursor-not-allowed'
                        : getButtonClasses(button.variant, button.hollow, button.pill)
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
                  className={`${
                    button.disabled
                      ? 'px-2 sm:px-4 py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base w-full sm:w-auto bg-gray-300 text-gray-500 cursor-not-allowed'
                      : getButtonClasses(button.variant, button.hollow, button.pill)
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
      {(showStats || showSearch || showFilter || showSecondFilter || showThirdFilter || showCustomFilters) && (
        <div className="px-4 sm:px-6 pb-6">
          {/* Mobile: Stack everything vertically, Desktop: Side by side */}
          <div className={`flex flex-col lg:flex-row ${showStats ? 'lg:justify-between' : 'lg:justify-end'} lg:items-center gap-4 mt-4`}>
            {/* Stats Section */}
            {showStats && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {typeof total === 'number' && (
                  stackTotalStat ? (
                    <span className="pr-2 py-1 rounded-full inline-flex flex-col items-center leading-tight">
                      <span className="font-medium text-gray-900">{total}</span>
                      <span className="text-gray-500">{totalLabel}</span>
                    </span>
                  ) : (
                    <span className="pr-2 py-1 rounded-full">{totalLabel}: <span className="font-medium">{total}</span></span>
                  )
                )}
                {typeof extraStatValue === 'number' && extraStatLabel && (
                  stackExtraStat ? (
                    <span className="pr-2 py-1 rounded-full inline-flex flex-col items-center leading-tight">
                      <span className="font-medium text-gray-900 inline-flex items-center">
                        {extraStatValuePrefix}
                        {extraStatValue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-500">{extraStatLabel}</span>
                    </span>
                  ) : (
                    <span className="pr-2 py-1 rounded-full">
                      {extraStatLabel}: <span className="font-medium inline-flex items-center">{extraStatValuePrefix}{extraStatValue.toLocaleString('en-IN')}</span>
                    </span>
                  )
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
                  {/* Filter Dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                    {technologyFilterOptions.length > 0 && onTechnologyFilterChange && (
                      <div className="relative w-full sm:w-32">
                        <select
                          value={technologyFilterValue}
                          onChange={(e) => onTechnologyFilterChange(e.target.value)}
                          className={`appearance-none border border-gray-300 rounded-md ${showTechnologyFilterIcon ? 'pl-10' : 'pl-3'} pr-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full`}
                        >
                          {technologyFilterOptGroupLabel ? (
                            <optgroup label={technologyFilterOptGroupLabel}>
                              {technologyFilterOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </optgroup>
                          ) : (
                            technologyFilterOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))
                          )}
                        </select>
                        {showTechnologyFilterIcon && (
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiCpu className="w-4 h-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Other Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {showFilter && onFilterChange && (
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={filterValue}
                      onChange={(e) => onFilterChange(e.target.value)}
                      className={`appearance-none border border-gray-300 rounded-md ${showFilterIcon ? 'pl-10' : 'pl-3'} ${filterValue !== 'all' ? 'pr-14' : 'pr-8'} py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto`}
                    >
                      {filterOptGroupLabel ? (
                        <optgroup label={filterOptGroupLabel}>
                          {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        filterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                    {showFilterIcon && (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    {filterValue !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onFilterChange('all')}
                        className="absolute inset-y-0 right-7 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label="Clear filter"
                        title="Clear filter"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {showSecondFilter && onSecondFilterChange && (
                  <div className={`relative w-full ${secondFilterContainerClassName || 'sm:w-auto'}`}>
                    <select
                      value={secondFilterValue}
                      onChange={(e) => onSecondFilterChange(e.target.value)}
                      className={`appearance-none border border-gray-300 rounded-md ${showSecondFilterIcon ? 'pl-10' : 'pl-3'} ${secondFilterValue !== 'all' ? 'pr-14' : 'pr-8'} py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto`}
                    >
                      {secondFilterOptGroupLabel ? (
                        <optgroup label={secondFilterOptGroupLabel}>
                          {secondFilterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        secondFilterOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))
                      )}
                    </select>
                    {showSecondFilterIcon && (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    {secondFilterValue !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onSecondFilterChange('all')}
                        className="absolute inset-y-0 right-7 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label={`Clear ${secondFilterLabel}`}
                        title={`Clear ${secondFilterLabel}`}
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                {showThirdFilter && onThirdFilterChange && (
                  <div className="relative w-full sm:w-auto">
                    <select
                      value={thirdFilterValue}
                      onChange={(e) => onThirdFilterChange(e.target.value)}
                      className={`appearance-none border border-gray-300 rounded-md ${showThirdFilterIcon ? 'pl-10' : 'pl-3'} ${thirdFilterValue !== 'all' ? 'pr-14' : 'pr-8'} py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto`}
                    >
                      {thirdFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {showThirdFilterIcon && (
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiFilter className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    {thirdFilterValue !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onThirdFilterChange('all')}
                        className="absolute inset-y-0 right-7 flex items-center text-gray-500 hover:text-gray-700"
                        aria-label="Clear filter"
                        title="Clear filter"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Search Bar - Full width on mobile */}
                {showSearch && (
                  <div className={`w-full ${searchContainerClassName || 'sm:w-64'}`}>
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