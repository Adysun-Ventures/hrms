import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  disabled?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  disabled = false
}) => {
  if (!isOpen) return null;
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'warning':
        return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'info':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      default:
        return 'bg-red-100 text-red-600 border-red-200';
    }
  };
  
  const getButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className={`p-4 rounded-t-lg border-b ${getVariantClasses()}`}>
          <div className="flex items-center">
            <FiAlertTriangle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={disabled}
            className={`px-4 py-2 text-white rounded-md ${getButtonClasses()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
