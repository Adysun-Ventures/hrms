'use client';

import { useState, useRef } from 'react';
import { FiX, FiUpload, FiDownload, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { parseCSV, validateBulkEmployees, bulkCreateEmployees, ValidationError } from '@/utils/bulkUploadUtils';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      setValidationErrors([]);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/templates/employee-bulk-upload-template.csv';
    link.download = 'employee-bulk-upload-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template downloaded successfully');
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    try {
      setIsUploading(true);
      setIsValidating(true);
      toast.loading('Validating CSV file...', { id: 'bulk-upload' });

      // Parse CSV
      const employees = await parseCSV(file);
      
      if (employees.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      // Validate all employees
      const validationResult = await validateBulkEmployees(employees);
      
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        toast.error(`Validation failed: ${validationResult.errors.length} errors found`, { id: 'bulk-upload' });
        setIsValidating(false);
        return;
      }

      // All validation passed, proceed with bulk creation
      toast.loading('Creating employees...', { id: 'bulk-upload' });
      
      const result = await bulkCreateEmployees(employees);
      
      if (result.success) {
        toast.success(`Successfully created ${result.createdCount} employees!`, { id: 'bulk-upload' });
        onSuccess();
        handleClose();
      } else {
        setValidationErrors(result.errors);
        toast.error(result.message, { id: 'bulk-upload' });
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV file';
      toast.error(errorMessage, { id: 'bulk-upload' });
    } finally {
      setIsUploading(false);
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationErrors([]);
    setIsUploading(false);
    setIsValidating(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Employees</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
        

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">CSV Template</h3>
              <p className="text-sm text-gray-600">Download the template with required fields</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              <FiDownload className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isUploading}
              >
                <FiUpload className="w-4 h-4" />
                Choose File
              </button>
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-medium text-red-900">
                  Validation Errors ({validationErrors.length})
                </h3>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800">
                    <span className="font-medium">Row {error.row}:</span> {error.field} - {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {(isValidating || isUploading) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FiLoader className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm text-blue-800">
                  {isValidating ? 'Validating CSV file...' : 'Creating employees...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FiCheckCircle className="w-4 h-4" />
                Upload & Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
