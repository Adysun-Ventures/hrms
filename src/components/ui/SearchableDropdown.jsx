'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown, FiSearch, FiX } from 'react-icons/fi';

/**
 * SearchableDropdown Component
 * A reusable dropdown component with search functionality and multi-select support
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of option objects with { id, name, employeeId, ... }
 * @param {string|Array} props.value - Currently selected value(s)
 * @param {Function} props.onChange - Callback when selection changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label for the dropdown
 * @param {Array} props.searchFields - Fields to search in (e.g., ['name', 'employeeId'])
 * @param {Function} props.renderOption - Custom render function for options
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.multiSelect - Enable multi-select mode
 */
const SearchableDropdown = ({
    options = [],
    value = '',
    onChange,
    placeholder = 'Select an option',
    label = '',
    searchFields = ['name', 'employeeId'],
    renderOption = null,
    className = '',
    name = '',
    multiSelect = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Normalize value to always work with arrays internally for multi-select
    const selectedValues = multiSelect
        ? (Array.isArray(value) ? value : (value ? [value] : []))
        : [];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search term
    const filteredOptions = options.filter((option) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return searchFields.some((field) => {
            const fieldValue = option[field];
            return fieldValue && String(fieldValue).toLowerCase().includes(searchLower);
        });
    });

    // Get selected option display text
    const getSelectedText = () => {
        if (multiSelect) {
            if (selectedValues.length === 0) return placeholder;
            if (selectedValues.length === 1) {
                const selected = options.find((opt) => opt.name === selectedValues[0]);
                return selected ? `${selected.name}${selected.employeeId ? ` (${selected.employeeId})` : ''}` : placeholder;
            }
            return `${selectedValues.length} employees selected`;
        } else {
            if (!value) return placeholder;
            const selected = options.find((opt) => opt.name === value || opt.id === value);
            if (!selected) return placeholder;

            if (selected.employeeId) {
                return `${selected.name} (${selected.employeeId})`;
            }
            return selected.name;
        }
    };

    // Handle option selection
    const handleSelect = (option) => {
        if (multiSelect) {
            const isSelected = selectedValues.includes(option.name);
            let newValues;

            if (isSelected) {
                newValues = selectedValues.filter(v => v !== option.name);
            } else {
                newValues = [...selectedValues, option.name];
            }

            onChange({ target: { name, value: newValues } });
        } else {
            onChange({ target: { name, value: option.name } });
            setIsOpen(false);
            setSearchTerm('');
        }
    };

    // Remove a selected item (multi-select only)
    const handleRemoveItem = (itemToRemove, e) => {
        e.stopPropagation();
        const newValues = selectedValues.filter(v => v !== itemToRemove);
        onChange({ target: { name, value: newValues } });
    };

    // Check if an option is selected
    const isOptionSelected = (option) => {
        if (multiSelect) {
            return selectedValues.includes(option.name);
        }
        return value === option.name;
    };

    // Default option renderer
    const defaultRenderOption = (option) => (
        <div className="flex items-center gap-2">
            {multiSelect && (
                <input
                    type="checkbox"
                    checked={isOptionSelected(option)}
                    onChange={(e) => {
                        e.stopPropagation();
                        handleSelect(option);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
            )}
            <div className="flex flex-col flex-1">
                <span className="font-medium text-black">{option.name}
                    {option.employeeId && (
                        <span className="pl-2 text-xs text-gray-500">({option.employeeId})</span>
                    )}</span>
            </div>
        </div>
    );

    const optionRenderer = renderOption || defaultRenderOption;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && (
                <label className="block mb-2 text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Dropdown Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full min-h-[48px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer flex items-center justify-between"
            >
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {multiSelect && selectedValues.length > 0 ? (
                        selectedValues.map((selectedValue) => {
                            const selectedOption = options.find(opt => opt.name === selectedValue);
                            return (
                                <span
                                    key={selectedValue}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                                >
                                    {selectedOption?.name}
                                    {selectedOption?.employeeId && ` (${selectedOption.employeeId})`}
                                    <FiX
                                        size={14}
                                        className="cursor-pointer hover:text-blue-900"
                                        onClick={(e) => handleRemoveItem(selectedValue, e)}
                                    />
                                </span>
                            );
                        })
                    ) : (
                        <span className={value || selectedValues.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                            {getSelectedText()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                    <FiChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''
                            }`}
                    />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or ID..."
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-60">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => handleSelect(option)}
                                    className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${isOptionSelected(option) ? 'bg-blue-100' : ''
                                        }`}
                                >
                                    {optionRenderer(option)}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-500">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;
