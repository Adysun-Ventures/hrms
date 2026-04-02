import React from 'react';
import { FiClipboard, FiFile, FiFileText } from 'react-icons/fi';

export type DocumentRole = 'admin' | 'employee';

export type DocumentTemplateKey =
  | 'offer-letter'
  | 'joining-letter'
  | 'salary-slip'
  | 'relieving-letter'
  | 'increment-letter'
  | 'experience-letter';

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
    key: 'joining-letter',
    title: 'Joining Letter',
    description: 'Generate joining letters',
    adminHref: '/dashboard/documents/v2/joining-letter',
    employeeHref: '/employee/documents/joining-letter',
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
];

