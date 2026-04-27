import React from 'react';
import { FiClipboard, FiFile, FiFileText } from 'react-icons/fi';

export type DocumentRole = 'admin' | 'employee';

export type DocumentTemplateKey =
  | 'offer-letter'
  | 'appointment-letter'
  | 'salary-slip'
  | 'relieving-letter'
  | 'increment-letter'
  | 'experience-letter'
  | 'fnf-certificate'
  | 'form-16';

export type DocumentTemplate = {
  key: DocumentTemplateKey;
  title: string;
  description: string;
  /** Route to open document UI for admins */
  adminHref: string;
  /** Route to open document UI for employees */
  employeeHref: string;
  roles: DocumentRole[];
  icon: React.ReactNode;
};

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    key: 'offer-letter',
    title: 'Offer Letter',
    description: 'Generate offer letters',
    adminHref: '/dashboard/documents/v2/offer-letter',
    employeeHref: '/employee/documents/offer-letter',
    roles: ['admin', 'employee'],
    icon: <FiFileText size={24} />,
  },
  {
    key: 'appointment-letter',
    title: 'Appointment Letter',
    description: 'Generate appointment letters',
    adminHref: '/dashboard/documents/v2/appointment-letter',
    employeeHref: '/employee/documents/appointment-letter',
    roles: ['admin', 'employee'],
    icon: <FiFileText size={24} />,
  },
  {
    key: 'salary-slip',
    title: 'Salary Slip',
    description: 'Generate salary slips',
    adminHref: '/dashboard/documents/v2/salary-slip',
    employeeHref: '/employee/documents/salary-slips',
    roles: ['admin', 'employee'],
    icon: <FiFile size={24} />,
  },
  {
    key: 'relieving-letter',
    title: 'Relieving Letter',
    description: 'Generate relieving letters',
    adminHref: '/dashboard/documents/v2/relieving-letter',
    employeeHref: '/employee/documents/relieving-letter',
    roles: ['admin', 'employee'],
    icon: <FiFileText size={24} />,
  },
  {
    key: 'increment-letter',
    title: 'Increment Letter',
    description: 'Generate increment letters',
    adminHref: '/dashboard/documents/v2/increment-letter',
    employeeHref: '/employee/documents/increment-letter',
    roles: ['admin', 'employee'],
    icon: <FiClipboard size={24} />,
  },
  {
    key: 'experience-letter',
    title: 'Experience Letter',
    description: 'Generate experience letters',
    adminHref: '/dashboard/documents/v2/experience-letter',
    employeeHref: '/employee/documents/experience-letter',
    roles: ['admin', 'employee'],
    icon: <FiFileText size={24} />,
  },
  {
    key: 'fnf-certificate',
    title: 'FNF Certificate',
    description: 'Generate full and final settlement certificates',
    adminHref: '/dashboard/documents/v2/fnf-certificate',
    employeeHref: '/employee/documents/fnf-certificate',
    roles: ['admin', 'employee'],
    icon: <FiFileText size={24} />,
  },
  {
    key: 'form-16',
    title: 'Form 16',
    description: 'Generate and manage Form 16 documents',
    adminHref: '/dashboard/documents/v2/form-16',
    employeeHref: '/employee/documents/form-16',
    roles: ['admin'],
    icon: <FiFileText size={24} />,
  },
];

