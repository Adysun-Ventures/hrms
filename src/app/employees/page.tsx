'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiBriefcase, FiDollarSign, FiX } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import TableHeader from '@/components/ui/TableHeader';
import { useEmployees, useDeleteEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { useEmployments, useEmploymentsByEmployee } from '@/hooks/useEmployments';
import { useSalariesByEmployee } from '@/hooks/useSalaries';
import Pagination from '@/components/ui/Pagination';
import { FaBan, FaCheck, FaRupeeSign, FaSyncAlt, FaTimes } from "react-icons/fa";
import { FaRegSquarePlus } from 'react-icons/fa6';
import { FaHandSparkles } from 'react-icons/fa6';
import Link from 'next/link';
import { addEmployee, getAdminDataForAudit } from '@/utils/firebaseUtils';
import { toTitleCase } from '@/utils/stringUtils';



const EmploymentWorkingStatusBadge = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);
  const employment = employments[0];
  const isResigned = employment?.isResignation === true;

  const outcome = isResigned ? employment?.employeeStatus : undefined;
  const label = isResigned
    ? outcome === 'terminated'
      ? 'Terminated'
      : outcome === 'exited'
        ? 'Exited'
        : 'Resigned'
    : 'Working';

  const icon = isResigned
    ? outcome === 'terminated'
      ? <FaBan className="mr-1.5" />
      : outcome === 'exited'
        ? <FaTimes className="mr-1.5" />
        : <FaTimes className="mr-1.5" />
    : <FaCheck className="mr-1.5" />;

  const colorClass = isResigned
    ? outcome === 'terminated'
      ? 'text-red-500'
      : outcome === 'exited'
        ? 'text-orange-500'
        : 'text-orange-500'
    : 'text-green-500';

  const showLastWorkingDate = isResigned && (outcome === 'terminated' || outcome === 'exited');
  const lastWorkingDateText = showLastWorkingDate && employment?.lastWorkingDate
    ? formatDateToDayMonYear(employment.lastWorkingDate)
    : '';

  return (
    <span className="inline-flex justify-center w-full">
      <span className="h-8 overflow-hidden flex flex-col items-center justify-center leading-[12px]">
        <span className={`inline-flex items-center text-sm font-normal ${colorClass}`}>
          {icon}
          {label}
        </span>
        {lastWorkingDateText ? (
          <span className="text-[10px] text-gray-500 leading-[12px] -mt-0.5">
            {lastWorkingDateText}
          </span>
        ) : null}
      </span>
    </span>
  );
};



const EmploymentStatusBadge = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  const employment = employments[0];

  if (!employment) {
    return <span className="text-gray-400">-</span>;
  }

  const isResigned = employment.isResignation === true;

  return (
    <span
      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-normal rounded-full ${
        isResigned
          ? 'bg-red-100 text-red-800'
          : 'bg-green-100 text-green-800'
      }`}
    >
      {isResigned ? 'Resigned' : 'Active'}
    </span>
  );
};


// Component to display employee ID from employment record
const EmployeeIdDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];
  console.log(employment)

 if (!employment || !employment.employmentId) {
  return (
    <Link href={`/employments/add?employeeId=${employeeId}`}>
      <span className="text-gray-400">Add Employment</span>
    </Link>
  );
}


  return <span>{employment.employmentId}</span>;
};

// Component to display joining date from employment record
const JoiningDateDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment || !employment.joiningDate) {
    return (
      <Link href={`/employments/add?employeeId=${employeeId}`}>
        <span className="text-gray-400">Add Joining Date</span>
      </Link>
    );
  }

  return <span>{formatDateToDayMonYear(employment.joiningDate)}</span>;
   // Debug log to check joining date value
  
};


// Component to display Current CTC from Employment "Current Salary Information"
const CurrentPackageDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];

  if (!employment) {
    return <span className="text-gray-400">-</span>;
  }

  // Current CTC should come from employment current salary info.
  // Prefer explicit current CTC field (`salary`), then derive from current fixed + variable.
  const currentPackage =
    Number((employment as any).salary ?? 0) ||
    (Number((employment as any).currentFixedPay ?? 0) + Number((employment as any).currentVariablePay ?? 0));

  if (!currentPackage) {
    return <span className="text-gray-400">-</span>;
  }

  const lpa = Number(currentPackage) / 100000;
  const lpaText = Number.isFinite(lpa)
    ? (Number.isInteger(lpa) ? lpa.toFixed(0) : lpa.toFixed(1))
    : '-';

  return (
    <span>
      {lpaText !== '-' ? (
        <>
          {lpaText} <span className="text-gray-500">LPA</span>
        </>
      ) : (
        <span className="text-gray-400">-</span>
      )}
    </span>
  );
};

// Component to display total salary credits from salary records
const TotalSalaryCreditsDisplay = ({ employeeId }: { employeeId: string }) => {
  const { data: salaries = [] } = useSalariesByEmployee(employeeId);

  if (!salaries || salaries.length === 0) {
    return <span className="text-gray-400">-</span>;
  }

  // Display total salary credits count for now
  return <span>{salaries.length}</span>;

  // if (!salaries || salaries.length === 0) {
  //   return <span className="text-gray-400">-</span>;
  // }

  // // Sum up all totalSalary values from salary records
  // const totalCredits = salaries.reduce((total, salary) => {
  //   return total + (salary.totalSalary || 0);
  // }, 0);

  // if (totalCredits === 0) {
  //   return <span className="text-gray-400">-</span>;
  // }

  // return (
  //   <span>
  //     {new Intl.NumberFormat('en-IN', {
  //       style: 'currency',
  //       currency: 'INR'
  //     }).format(totalCredits)}
  //   </span>
  // );
};
interface SalaryActionButtonProps {
  employeeId: string;
}

const SalaryActionButton = ({ employeeId }: SalaryActionButtonProps) => {
  const { data: salaries = [] } = useSalariesByEmployee(employeeId);

  const hasSalary = salaries.length > 0;
  const salaryHref = hasSalary
    ? `/salaries?employeeId=${employeeId}`
    : `/salaries/add?employeeId=${employeeId}`;

  return (
    <ActionButton
      icon={<FaRupeeSign className="w-5 h-5" />}
      title={hasSalary ? "View Salaries" : "Add Salary"}
      colorClass={
        hasSalary
          ? "bg-purple-100 text-purple-600 hover:text-purple-900"
          : "bg-gray-100 text-gray-400 hover:text-gray-600"
      }
      href={salaryHref}
    />
  );
};



// Component to handle employment navigation
const EmploymentActionButton = ({ employeeId }: { employeeId: string }) => {
  const { data: employments = [] } = useEmploymentsByEmployee(employeeId);

  // Get the first (and only) employment
  const employment = employments[0];
  const hasEmployment = Boolean(employment);
  
  return (
    <ActionButton
      icon={<FiBriefcase className="w-5 h-5" />}
      title={hasEmployment ? "View Employment" : "Add Employment"}
      colorClass={
        hasEmployment
          ? "bg-green-100 text-green-600 hover:text-green-900"
          : "bg-gray-100 text-gray-400 hover:text-gray-600"
      }
      href={hasEmployment ? `/employments/${employment.id}` : `/employments/add?employeeId=${employeeId}`}
    />
  );
};

const EmployeeStatusToggle = ({
  employeeId,
  status,
  onToggle,
  isToggling,
}: {
  employeeId: string;
  status?: string;
  onToggle: (employeeId: string, nextStatus: 'active' | 'inactive') => void;
  isToggling: boolean;
}) => {
  const normalized: 'active' | 'inactive' = status === 'inactive' ? 'inactive' : 'active';
  const next: 'active' | 'inactive' = normalized === 'active' ? 'inactive' : 'active';

  return (
    <button
      type="button"
      onClick={() => onToggle(employeeId, next)}
      disabled={isToggling}
      className={`px-2 py-0.5 inline-flex text-xs leading-5 font-normal rounded-full transition-opacity ${
        isToggling ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'
      } ${
        normalized === 'active'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-200 text-gray-800'
      }`}
      title={`Click to set ${next}`}
    >
      {normalized === 'active' ? 'Active' : 'Inactive'}
    </button>
  );
};

export default function EmployeesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  // Default dropdown selection should show the dropdown name (placeholder).
  const [filterValue, setFilterValue] = useState('all');
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState('all');
  const [createAiOpen, setCreateAiOpen] = useState(false);
  const [createAiText, setCreateAiText] = useState('');
  const [createAiError, setCreateAiError] = useState<string | null>(null);
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('all');
  const [isCreatingAiEmployee, setIsCreatingAiEmployee] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortConfig, setSortConfig] = useState<{
  key: 'name' | 'joiningDate';
  direction: 'asc' | 'desc';
}>({
  key: 'name',
  direction: 'asc'
});
const [joiningDateMap, setJoiningDateMap] = useState<Record<string, number>>({});
const [employmentByEmployeeId, setEmploymentByEmployeeId] = useState<Record<string, any>>({});



  // Use Tanstack Query for employee data
  const {
    data: employees = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useEmployees();

  // Use mutation for delete operation
  const deleteEmployeeMutation = useDeleteEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing employees:', error);
      toast.error('Failed to refresh data');
    }
  };

  const generatePasswordFromMobile = (mobile?: string) => {
    const digits = String(mobile || '').replace(/\D/g, '');
    if (digits.length !== 10) return '';
    return `${digits.slice(-5)}@@##`;
  };

  const handleCreateWithAi = async () => {
    const text = createAiText.trim();
    if (!text) {
      setCreateAiError('Please paste employee details first.');
      return;
    }

    setIsCreatingAiEmployee(true);
    setCreateAiError(null);
    toast.loading('Creating employee with AI...', { id: 'create-employee-ai' });

    try {
      // Same parsing behavior as Add Employee page.
      const csvParts = text.split(',').map((part) => part.trim());
      let parsed: any;

      if (csvParts.length === 8 || csvParts.length === 9) {
        parsed = {
          fullName: csvParts[0],
          dateOfBirth: csvParts[1],
          homeTown: csvParts[2],
          mobile: csvParts[3],
          email: csvParts[4],
          currentAddress: csvParts[5],
          permanentAddress: csvParts[6],
          aadharNumber: csvParts[7],
          panCard: csvParts[8] || '',
        };
      } else {
        const response = await fetch('/api/parse-employee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to parse employee details');
        }
        parsed = payload;
      }

      const cleanMobile = String(parsed?.mobile || '').replace(/\D/g, '').slice(-10);
      const password = generatePasswordFromMobile(cleanMobile);
      if (!password) throw new Error('Mobile must be 10 digits to generate password');

      const { adminId, currentTimestamp } = getAdminDataForAudit();

      const employeeDataWithAudit: any = {
        name: toTitleCase(String(parsed?.fullName || parsed?.name || '').trim()),
        phone: cleanMobile,
        password,
        dateOfBirth: String(parsed?.dateOfBirth || '').trim(),
        homeTown: String(parsed?.homeTown || '').trim(),
        email: String(parsed?.email || '').trim(),
        currentAddress: String(parsed?.currentAddress || '').trim(),
        permanentAddress: String(parsed?.permanentAddress || '').trim(),
        aadharCard: String(parsed?.aadharNumber || '').replace(/\s+/g, ''),
        panCard: String(parsed?.panCard || '').trim().toUpperCase(),
        status: 'active',
        employeeType: 'external',
        is_resigned: false,
        employmentStatus: 'working',
        createdAt: currentTimestamp,
        createdBy: adminId,
        updatedAt: currentTimestamp,
        updatedBy: adminId,
      };

      const created = await addEmployee(employeeDataWithAudit);
      toast.success('Employee created successfully!', { id: 'create-employee-ai' });
      setCreateAiOpen(false);
      setCreateAiText('');
      router.push(`/employees/${created.id}`);
    } catch (err: any) {
      const message = err?.message || 'Failed to create employee with AI';
      setCreateAiError(message);
      toast.error(message, { id: 'create-employee-ai' });
    } finally {
      setIsCreatingAiEmployee(false);
    }
  };

  // Handle error state
  if (isError && error) {
    console.error('Employee data error:', error);
    toast.error('Failed to load employee data');
  }

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      toast.loading('Deleting employee...', { id: 'delete-employee' });
      await deleteEmployeeMutation.mutateAsync(id);
      setDeleteConfirm(null);
      toast.success('Employee deleted successfully', { id: 'delete-employee' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast.error('Failed to delete employee', { id: 'delete-employee' });
    }
  };

  const handleToggleStatus = async (employeeId: string, nextStatus: 'active' | 'inactive') => {
    try {
      toast.loading('Updating status...', { id: `status-${employeeId}` });
      await updateEmployeeMutation.mutateAsync({ id: employeeId, data: { status: nextStatus } as any });
      toast.success(`Status set to ${nextStatus}`, { id: `status-${employeeId}` });
    } catch (error) {
      console.error('Error updating employee status:', error);
      toast.error('Failed to update status', { id: `status-${employeeId}` });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };
 const handleSort = (key: 'name' | 'joiningDate') => {
  setSortConfig(prev => ({
    key,
    direction:
      prev.key === key && prev.direction === 'asc'
        ? 'desc'
        : 'asc'
  }));
};

const { data: employments = [] } = useEmployments(); // all employments

useEffect(() => {
  const map: Record<string, number> = {};
  const byEmployee: Record<string, any> = {};

  employments.forEach(emp => {
    map[emp.employeeId] = new Date(emp.joiningDate || 0).getTime();
    // keep latest record per employee (best-effort)
    if (!byEmployee[emp.employeeId]) {
      byEmployee[emp.employeeId] = emp;
      return;
    }
    const prev = byEmployee[emp.employeeId];
    const prevTs = new Date(prev.joiningDate || prev.startDate || 0).getTime();
    const nextTs = new Date(emp.joiningDate || emp.startDate || 0).getTime();
    if (nextTs >= prevTs) byEmployee[emp.employeeId] = emp;
  });

  setJoiningDateMap(map);
  setEmploymentByEmployeeId(byEmployee);
}, [employments]);


  const filteredEmployees = employees
    .filter(employee => {
      const q = searchTerm.trim().toLowerCase();
      const emp = employmentByEmployeeId[employee.id];

      const searchable = [
        // employee core
        employee.id,
        employee.name,
        employee.email,
        employee.phone,
        employee.status,
        employee.employeeType,
        employee.employmentStatus,
        // employment related
        emp?.employmentId,
        emp?.joiningDate,
        emp?.startDate,
        emp?.jobTitle,
        emp?.designation,
        emp?.department,
        emp?.location,
        emp?.panNumber,
        emp?.bankName,
        emp?.accountNo,
        emp?.ifscCode,
        emp?.salary,
        emp?.ctc,
        emp?.incrementedCtc,
        emp?.joiningCtc,
      ]
        .filter((v) => v !== null && v !== undefined && v !== '')
        .join(' ')
        .toLowerCase();

      const matchesSearch = q.length === 0 ? true : searchable.includes(q);
      
      const matchesStatusFilter = 
        !filterValue || filterValue === 'all' || 
        (filterValue === 'active' && employee.status === 'active') ||
        (filterValue === 'inactive' && employee.status === 'inactive');
      
      const isResigned = emp?.isResignation === true;
      const employeeOutcome = String(emp?.employeeStatus || '').toLowerCase().trim();
      const normalizedOutcome =
        employeeOutcome === 'terminated' ? 'terminated' : employeeOutcome === 'exited' ? 'exited' : 'exited';

      const matchesEmploymentStatusFilter =
        !employmentStatusFilter || employmentStatusFilter === 'all' ||
        (employmentStatusFilter === 'working' && !isResigned) ||
        (employmentStatusFilter === 'terminated' && isResigned && normalizedOutcome === 'terminated') ||
        (employmentStatusFilter === 'exited' && isResigned && normalizedOutcome === 'exited');

      const normalizedEmployeeType = (employee.employeeType || 'internal').toLowerCase();
      const matchesEmployeeTypeFilter =
        !employeeTypeFilter || employeeTypeFilter === 'all' || normalizedEmployeeType === employeeTypeFilter;
      
      return matchesSearch && matchesStatusFilter && matchesEmploymentStatusFilter && matchesEmployeeTypeFilter;
    })
    .sort((a, b) => {
  if (sortConfig.key === 'name') {
    const nameA = a.name?.toLowerCase() || '';
    const nameB = b.name?.toLowerCase() || '';

    return sortConfig.direction === 'asc'
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  }

 if (sortConfig.key === 'joiningDate') {
  const dateA = joiningDateMap[a.id] || 0;
  const dateB = joiningDateMap[b.id] || 0;

  return sortConfig.direction === 'asc'
    ? dateA - dateB
    : dateB - dateA;
}
  return 0;
});


  const total = filteredEmployees.length;
  const active = filteredEmployees.filter(e => e.status === 'active').length;
  const inactive = filteredEmployees.filter(e => e.status === 'inactive').length;

  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
  

  


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Skeleton for TableHeader */}
          <div className="space-y-6">
            {/* Title and Action Buttons Skeleton */}
            <div className="flex justify-between items-center px-6 pt-6 mb-6">
              <div className="flex items-center">
                <div className="bg-gray-200 h-10 w-20 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-gray-200 h-8 w-32 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-gray-200 h-10 w-32 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Stats and Search Skeleton */}
            <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-gray-200 h-10 w-10 rounded animate-pulse"></div>
            <div className="bg-gray-200 h-10 w-64 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="overflow-x-auto">
            <div className="min-w-full divide-y divide-gray-200">
              <div className="bg-gray-50 px-6 py-3">
                <div className="flex space-x-6">
                  <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-16 rounded animate-pulse"></div>
                  <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center space-x-6">
                      <div className="bg-gray-200 h-4 w-32 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-24 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-4 w-28 rounded animate-pulse"></div>
                      <div className="bg-gray-200 h-6 w-16 rounded-full animate-pulse"></div>
                      <div className="flex items-center space-x-2 ml-auto">
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                        <div className="bg-gray-200 h-8 w-8 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      allowedUserTypes={['admin']}
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', isCurrent: true }
      ]}
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Employees"
          total={total}
          active={active}
          inactive={inactive}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          searchAriaLabel="Search employees"
          showSearch={true}
          showFilter={true}
          filterValue={filterValue}
          onFilterChange={setFilterValue}
          filterOptions={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          filterOptGroupLabel=""
          showFilterIcon={false}
          showSecondFilter={true}
          secondFilterValue={employmentStatusFilter}
          onSecondFilterChange={setEmploymentStatusFilter}
          secondFilterOptions={[
            { value: 'all', label: 'All' },
            { value: 'working', label: 'Working' },
            { value: 'terminated', label: 'Terminated' },
            { value: 'exited', label: 'Exited' }
          ]}
          secondFilterLabel=""
          secondFilterOptGroupLabel=""
          showSecondFilterIcon={false}
          showCustomFilters={true}
          technologyFilterValue={employeeTypeFilter}
          onTechnologyFilterChange={(v) => setEmployeeTypeFilter(v as any)}
          technologyFilterOptions={[
            { value: 'all', label: 'All' },
            { value: 'external', label: 'External' },
            { value: 'internal', label: 'Internal' }
          ]}
          technologyFilterOptGroupLabel=""
          showTechnologyFilterIcon={false}
          backButton={{ href: '/dashboard' }}
          customReloadButton={
            <button
              type="button"
              onClick={handleRefresh}
              className="p-1 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FaSyncAlt size={14} />
            </button>
          }
          actionButtons={[
            {
              label: 'Create with AI',
              icon: <FaHandSparkles />,
              variant: 'info' as const,
              pill: true,
              onClick: () => {
                setCreateAiError(null);
                setCreateAiOpen(true);
              },
            },
            {
              label: 'Create Employee',
              href: '/employees/add',
              icon: <FaRegSquarePlus />,
              variant: 'success' as const,
              pill: true,
            }
          ]}
          headerClassName="px-6 pt-6 mb-0"
        />

        {createAiOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setCreateAiOpen(false)}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-xl p-6 relative max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setCreateAiOpen(false)}
                aria-label="Close create with ai popup"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center"
              >
                <FiX className="w-4 h-4" />
              </button>

              <h2 className="text-base font-semibold text-gray-900">Auto Fill Employee Details</h2>
              <p className="mt-1 text-xs text-gray-500">
                Paste employee details (comma-separated or free text) and generate the employee with AI.
              </p>

              <div className="mt-4 space-y-3">
                <textarea
                  value={createAiText}
                  onChange={(e) => setCreateAiText(e.target.value)}
                  placeholder="Paste employee details (supports comma-separated or free text)"
                  className="w-full min-h-40 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                {createAiError ? <p className="text-sm text-red-600">{createAiError}</p> : null}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCreateAiOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCreateWithAi();
                  }}
                  disabled={isCreatingAiEmployee}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaHandSparkles className="w-4 h-4" />
                  {isCreatingAiEmployee ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isError ? (
          <div className="p-8 text-center text-red-500">
            <p>Failed to load employees. Please try refreshing the page.</p>
            <button 
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm && filterValue === 'all' && employmentStatusFilter === 'all' && 'No employees match your search'}
            {searchTerm && filterValue === 'active' && employmentStatusFilter === 'all' && 'No active employees match your search'}
            {searchTerm && filterValue === 'inactive' && employmentStatusFilter === 'all' && 'No inactive employees match your search'}
            {searchTerm && employmentStatusFilter === 'working' && 'No working employees match your search'}
            {searchTerm && employmentStatusFilter === 'resigned' && 'No resigned employees match your search'}
            {!searchTerm && filterValue === 'active' && employmentStatusFilter === 'all' && 'No active employees found'}
            {!searchTerm && filterValue === 'inactive' && employmentStatusFilter === 'all' && 'No inactive employees found'}
            {!searchTerm && employmentStatusFilter === 'working' && 'No working employees found'}
            {!searchTerm && employmentStatusFilter === 'resigned' && 'No resigned employees found'}
            {!searchTerm && filterValue === 'all' && employmentStatusFilter === 'all' && 'No employees found. Add your first employee!'}
            {!searchTerm && filterValue !== 'all' && employmentStatusFilter !== 'all' && 'No employees match the selected filters'}
          </div>
        ) : (
          <div className="overflow-x-auto px-6">
            <table className="min-w-full divide-y divide-gray-200 table-fixed border border-gray-300">
              <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[8%]">
                    SR. No
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[15%]">
  <div
  role="button"
  tabIndex={0}
  onClick={() => handleSort('name')}
  className="flex items-center justify-center gap-1 cursor-pointer select-none"
>
  Name
  {sortConfig.key === 'name' && (
    <span className="text-xs">
      {sortConfig.direction === 'asc' ? '▲' : '▼'}
    </span>
  )}
</div>
</th>


                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                    Emp ID
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
  <div
    role="button"
    tabIndex={0}
    onClick={() => handleSort('joiningDate')}
    className="flex items-center justify-center gap-1 cursor-pointer select-none"
  >
    DOJ
    {sortConfig.key === 'joiningDate' && (
      <span className="text-xs">
        {sortConfig.direction === 'asc' ? '▲' : '▼'}
      </span>
    )}
  </div>
</th>


                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[12%]">
                    Curr. CTC
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[12%]">
                    Total Sal.
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[8%]">
                    Status
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                    EMP. Type
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[10%]">
                    Emp. Status
                  </th>
                  <th className="px-6 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap w-[11%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.map((employee, idx) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{startIndex + idx + 1}</div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <EmployeeIdDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <JoiningDateDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <CurrentPackageDisplay employeeId={employee.id} />
                      </div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <TotalSalaryCreditsDisplay employeeId={employee.id} />
                      </div>
                    </td>
                   <td className="px-6 py-2 whitespace-nowrap text-center">
                      <EmployeeStatusToggle
                        employeeId={employee.id}
                        status={(employee as any).status}
                        onToggle={handleToggleStatus}
                        isToggling={updateEmployeeMutation.isPending}
                      />
                    </td>

                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <span
                        className={`text-sm font-normal ${
                          (employee.employeeType || 'internal') === 'internal'
                            ? 'text-blue-500'
                            : 'text-orange-500'
                        }`}
                      >
                        {(employee.employeeType || 'internal')
                          .charAt(0)
                          .toUpperCase() +
                          (employee.employeeType || 'internal').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <EmploymentWorkingStatusBadge employeeId={employee.id} />
                    </td>

                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      {deleteConfirm === employee.id ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => confirmDelete(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={cancelDelete}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-3">
                          <ActionButton
                            icon={<FiEye className="w-5 h-5" />}
                            title="View Employee Details"
                            colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                            href={`/employees/${employee.id}`}
                          />
                          <EmploymentActionButton employeeId={employee.id} />
                          <SalaryActionButton employeeId={employee.id} />


                          <ActionButton
                            icon={<FiEdit className="w-5 h-5" />}
                            title="Edit"
                            colorClass="bg-amber-100 text-amber-600 hover:text-amber-900"
                            href={`/employees/${employee.id}/edit`}
                          />
                          <ActionButton
                            icon={<FiTrash2 className="w-5 h-5" />}
                            title="Delete"
                            colorClass="bg-red-100 text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(employee.id)}
                            as="button"
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 