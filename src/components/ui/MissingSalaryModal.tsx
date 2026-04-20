import React from 'react';
import { FiX } from 'react-icons/fi';

type MissingSalaryRow = {
  id: string;
  label: string;
  value: string;
};

type MissingSalaryPrimaryAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

interface MissingSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  summary?: React.ReactNode;
  rows?: MissingSalaryRow[];
  emptyMessage?: string;
  cancelText?: string;
  primaryAction?: MissingSalaryPrimaryAction;
}

export default function MissingSalaryModal({
  isOpen,
  onClose,
  title = 'Missing Salaries',
  summary,
  rows = [],
  emptyMessage = 'No Missing Salaries ✅',
  cancelText = 'Cancel',
  primaryAction,
}: MissingSalaryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 relative max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close missing salaries popup"
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center"
        >
          <FiX className="w-4 h-4" />
        </button>

        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {summary ? <p className="mt-1 text-xs text-gray-500">{summary}</p> : null}

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-gray-700">{emptyMessage}</p>
        ) : (
          <div className="mt-4 space-y-2 text-sm text-gray-800">
            {rows.map((row) => (
              <p key={row.id}>
                <span className="font-medium">{row.label}</span> {'\u2192'} {row.value}
              </p>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FiX className="w-4 h-4" />
            {cancelText}
          </button>

          {primaryAction ? (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className={
                primaryAction.className ||
                'border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }
            >
              {primaryAction.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
