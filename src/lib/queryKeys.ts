// Query key factory for consistent cache management
export const queryKeys = {
  
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
  
  
  
  
  
}; 