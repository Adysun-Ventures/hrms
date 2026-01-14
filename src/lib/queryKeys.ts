// Query key factory for consistent cache management
export const queryKeys = {
  // Dashboard specific keys
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
  },
  
  // Employee keys
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.employees.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    self: (id: string) => [...queryKeys.employees.all, 'self', id] as const,
    selfEmployment: (id: string) => [...queryKeys.employees.all, 'self', 'employment', id] as const,
  },
  
  // Employment keys
  employments: {
    all: ['employments'] as const,
    lists: () => [...queryKeys.employments.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.employments.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.employments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employments.details(), id] as const,
    byEmployee: (employeeId: string) => [...queryKeys.employments.all, 'byEmployee', employeeId] as const,
  },
  
  // Salary keys
  salaries: {
    all: ['salaries'] as const,
    lists: () => [...queryKeys.salaries.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.salaries.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.salaries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.salaries.details(), id] as const,
    byEmployee: (employeeId: string) => [...queryKeys.salaries.all, 'byEmployee', employeeId] as const,
  },
  
  // Attendance keys
  attendance: {
    all: ['attendance'] as const,
    lists: () => [...queryKeys.attendance.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.attendance.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.attendance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.attendance.details(), id] as const,
    byEmployee: (employeeId: string) => [...queryKeys.attendance.all, 'byEmployee', employeeId] as const,
    today: (employeeId: string) => [...queryKeys.attendance.all, 'today', employeeId] as const,
  },
  
  // Company keys
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.companies.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
  },
  
  // Admin keys
  admins: {
    all: ['admins'] as const,
    details: () => [...queryKeys.admins.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.admins.details(), id] as const,
    byPhone: (phone: string) => [...queryKeys.admins.all, 'byPhone', phone] as const,
  },
  
  // Enquiry keys
  enquiries: {
    all: ['enquiries'] as const,
    lists: () => [...queryKeys.enquiries.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.enquiries.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.enquiries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.enquiries.details(), id] as const,
    newCount: () => [...queryKeys.enquiries.all, 'newCount'] as const,
  },
  
  // Leave keys
  leaves: {
    all: ['leaves'] as const,
    lists: () => [...queryKeys.leaves.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.leaves.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.leaves.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leaves.details(), id] as const,
    byEmployee: (employeeId: string) => [...queryKeys.leaves.all, 'byEmployee', employeeId] as const,
  },
}; 