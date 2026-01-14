# Adysun HRMS - Codebase Patterns Reference

## 🎯 **Overview**

This document serves as the comprehensive reference for all UI patterns, design systems, component structures, backend patterns, and coding conventions used in the Adysun HRMS project. Use this as your guide to ensure perfect consistency when implementing new features or modifying existing ones.

---

## 🎨 **Design System & UI Patterns**

### **Color Scheme - Orange Theme**
```css
/* Primary Orange Gradients */
bg-gradient-to-r from-orange-600 to-orange-700     /* Hero sections */
bg-gradient-to-br from-orange-50 to-orange-100     /* Light backgrounds */
bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200  /* Section backgrounds */
bg-gradient-to-r from-orange-900/95 to-orange-800/95  /* Dark overlays */

/* Text Colors */
text-orange-600    /* Primary orange text */
text-orange-700    /* Hover states */
text-orange-300    /* Light text on dark backgrounds */

/* Neutral Colors */
text-gray-900      /* Primary headings */
text-gray-700      /* Body text */
text-gray-600      /* Secondary text */
text-gray-500      /* Subtle text */
bg-white           /* Card backgrounds */
bg-gray-50         /* Light backgrounds */
```

### **Typography Scale**
```css
/* Hero/Page Title */
h1: text-5xl md:text-6xl lg:text-7xl (48px - 72px)

/* Section Titles */
h2: text-4xl md:text-5xl (36px - 48px)

/* Subsection Titles */
h3: text-3xl md:text-4xl (30px - 36px)

/* Component Titles */
h4: text-xl (20px) - **Standard for all component titles**

/* Body Text */
p: text-lg (18px) - **Standard for all descriptions**

/* Small Text */
span: text-sm (14px) - **Standard for subtitles and badges**

/* Font Weights */
font-bold      /* Headings and important text */
font-semibold  /* Subheadings and emphasis */
font-medium    /* Subtitles and badges */
/* Normal */   /* Body text */
```

### **Spacing System**
```css
/* Section Spacing */
py-16 (64px)   /* Small sections */
py-20 (80px)   /* Medium sections - **Standard** */
py-24 (96px)   /* Large sections */

/* Component Spacing */
p-8 (32px)     /* Card padding - **Standard for all cards** */
gap-8 (32px)   /* Grid gaps - **Standard for all grids** */
mb-6 (24px)    /* Margin between elements - **Standard spacing** */

/* Section Margins */
mb-20 (80px)   /* Section headers - **Standard for section titles** */
mt-20 (80px)   /* Content margins - **Standard for content after titles** */
```

### **Icon Sizing System**
```css
/* Standard Icon Container */
.w-20.h-20 (80px × 80px) - **Standard for all icon containers**

/* Icon Content */
[&_*]:w-8 [&_*]:h-8 (32px × 32px) - **Standard for icon content**

/* Button Icons */
.w-6.h-6 (24px × 24px) - **Standard for button icons**

/* Icon Backgrounds */
bg-gradient-to-br from-orange-400 to-orange-600  /* Orange gradients */
```

### **Animation Patterns**
```css
/* Hover Effects */
hover:scale-110      /* Icon scale on hover */
hover:-translate-y-1 /* Card lift on hover */
hover:-translate-y-2 /* Tech stack card lift */
hover:shadow-xl      /* Enhanced hover shadows */

/* Transitions */
transition-all duration-300  /* Standard transition */
transition-colors duration-200  /* Color transitions */

/* Focus States */
focus:ring-4 focus:ring-orange-300  /* Orange focus ring */
```

---

## 🧩 **Component Architecture**

### **Website Components**

#### **FeatureCard Component**
```typescript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant?: 'light' | 'dark';
  className?: string;
}

// Usage Pattern
<FeatureCard
  icon={<Users />}
  title="Expert Team"
  description="Our experienced team brings deep domain knowledge."
  variant="light"
/>
```

#### **BenefitCard Component**
```typescript
interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// Standard Structure
<div className="text-center group">
  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-200">
    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
      <span className="text-white [&_*]:w-8 [&_*]:h-8">{icon}</span>
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors">
      {title}
    </h3>
    <p className="text-lg text-gray-700 leading-relaxed">
      {description}
    </p>
  </div>
</div>
```

#### **CTAButton Component**
```typescript
interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

// Standard Classes
const baseClasses = "inline-flex items-center px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300";
const primaryClasses = "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl";
const secondaryClasses = "bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white";
```

#### **HeroSection Component**
```typescript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  description?: string;
  backgroundImage?: string;
  variant?: 'dark' | 'gradient' | 'image';
  actions?: Array<{
    text: string;
    href: string;
    variant: 'primary' | 'secondary' | 'outline';
  }>;
  className?: string;
}

// Image Variant Pattern
<section className="relative w-screen h-screen bg-cover bg-center bg-no-repeat">
  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} />
  <div className="container mx-auto py-10 relative h-full flex items-center">
    <div className="text-left max-w-2xl">
      <span className="text-white text-2xl md:text-3xl block mb-6 font-light">{title}</span>
      <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold m-0 mb-8 leading-tight">
        <span className="text-orange-500">{subtitle.split(':')[0]}: </span>
        <span className="font-normal">{subtitle.split(':')[1] || subtitle}</span>
      </h2>
      <div className="w-24 h-px bg-white opacity-30 my-10" />
      {description && (
        <p className="text-white mb-10 max-w-3xl text-lg md:text-xl leading-relaxed opacity-90">
          {description}
        </p>
      )}
    </div>
  </div>
</section>
```

### **Dashboard Components**

#### **DashboardLayout Component**
```typescript
interface DashboardLayoutProps {
  children: ReactNode;
  breadcrumbItems?: BreadcrumbItem[];
  showBreadcrumb?: boolean;
  allowedUserTypes?: ('admin' | 'employee')[];
}

// Standard Structure
<AuthGuard allowedUserTypes={allowedUserTypes}>
  <div className="min-h-screen bg-gray-50">
    <Sidebar />
    <Header />
    <main className="pt-16 lg:pl-64 min-h-screen">
      <div className="p-4 md:p-6">
        {showBreadcrumb && breadcrumbItems.length > 0 && (
          <SimpleBreadcrumb items={breadcrumbItems} className="mb-4" />
        )}
        {children}
      </div>
    </main>
  </div>
</AuthGuard>
```

#### **TableHeader Component**
```typescript
interface TableHeaderProps {
  title?: string;
  total?: number;
  active?: number;
  inactive?: number;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  actionButtons?: ActionButton[];
  showStats?: boolean;
  showSearch?: boolean;
  backButton?: BackButton;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  showFilter?: boolean;
  headerClassName?: string;
}

// Standard Button Classes
const getButtonClasses = (variant: string = 'primary') => {
  const baseClasses = 'px-2 sm:px-4 py-2 rounded-md flex items-center justify-center gap-1 sm:gap-2 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto';
  
  switch (variant) {
    case 'primary': return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
    case 'secondary': return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
    case 'success': return `${baseClasses} bg-green-600 text-white hover:bg-green-700`;
    case 'warning': return `${baseClasses} bg-amber-600 text-white hover:bg-amber-700`;
    case 'danger': return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    case 'orange': return `${baseClasses} bg-orange-400 text-white hover:bg-orange-500`;
    default: return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700`;
  }
};
```

#### **Button Component**
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// Size Classes
const sizeClasses = {
  small: 'min-h-[44px] min-w-[44px] px-4 py-2 text-sm touch-manipulation',
  medium: 'min-h-[44px] min-w-[44px] px-6 py-3 text-base touch-manipulation',
  large: 'min-h-[48px] min-w-[48px] px-8 py-4 text-lg touch-manipulation'
};

// Variant Classes
const variantClasses = {
  primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-xl',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  outline: 'bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white',
  ghost: 'bg-transparent text-orange-600 hover:bg-orange-50'
};
```

---

## 📝 **Form Patterns & Validation**

### **React Hook Form Pattern**
```typescript
// Standard Form Setup
const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
  defaultValues: {
    status: 'active',
    // ... other defaults
  }
});

// Form Submission Pattern
const onSubmit = async (data: FormData) => {
  try {
    setIsSubmitting(true);
    setError(null);
    toast.loading('Processing...', { id: 'form-submit' });

    // Validation
    if (data.panCard && data.panCard.trim()) {
      if (!validatePANFormat(data.panCard)) {
        throw new Error('Please enter a valid PAN number (e.g., ABCDE1234F)');
      }
      const panExists = await checkPANExistsAnywhere(data.panCard.toUpperCase());
      if (panExists) {
        throw new Error('This PAN number is already registered.');
      }
    }

    // Get audit data
    const { adminId, currentTimestamp } = getAdminDataForAudit();

    // Prepare data with audit fields
    const dataWithAudit = {
      ...data,
      panCard: data.panCard ? data.panCard.toUpperCase() : undefined,
      createdAt: currentTimestamp,
      createdBy: adminId,
      updatedAt: currentTimestamp,
      updatedBy: adminId,
    };

    await submitFunction(dataWithAudit);
    toast.success('Success!', { id: 'form-submit' });
    router.push('/success-page');
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit';
    setError(errorMessage);
    toast.error(errorMessage, { id: 'form-submit' });
    setIsSubmitting(false);
  }
};
```

### **Form Field Pattern**
```typescript
// Standard Input Field
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    <span className="text-red-500 mr-1">*</span> Field Name
  </label>
  <input
    type="text"
    placeholder="Enter field value"
    {...register('fieldName', {
      required: 'Field is required',
      minLength: {
        value: 2,
        message: 'Field must be at least 2 characters'
      },
      maxLength: {
        value: 50,
        message: 'Field cannot exceed 50 characters'
      }
    })}
    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
  />
  {errors.fieldName && (
    <p className="mt-1 text-sm text-red-600">{errors.fieldName.message}</p>
  )}
</div>
```

### **Form Section Pattern**
```typescript
// Section Structure
<div className="bg-gray-100 p-4 mb-4 rounded-lg">
  <h2 className="text-lg font-semibold text-gray-800 mb-2 border-l-4 border-blue-500 pl-2">
    Section Title
  </h2>
  
  <div className="bg-white p-4 rounded-lg mb-4">
    <h3 className="text-md font-medium text-gray-700 mb-3 border-l-2 border-green-500 pl-2">
      Subsection Title
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Form fields */}
    </div>
  </div>
</div>
```

---

## 🔥 **Backend & Data Patterns**

### **Firebase Integration**

#### **Query Pattern**
```typescript
// Standard Firestore Query
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const q = query(
      collection(db, 'employees'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};
```

#### **CRUD Operations Pattern**
```typescript
// Add Document
export const addEmployee = async (employeeData: Omit<Employee, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'employees'), employeeData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

// Update Document
export const updateEmployee = async (id: string, employeeData: Partial<Employee>): Promise<void> => {
  try {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, employeeData);
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Delete Document
export const deleteEmployee = async (id: string): Promise<void> => {
  try {
    const employeeRef = doc(db, 'employees', id);
    await deleteDoc(employeeRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};
```

### **Tanstack Query Hooks**

#### **Query Hook Pattern**
```typescript
// Standard Query Hook
export const useEmployees = (filters?: string) => {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: getEmployees,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

// Detail Query Hook
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => getEmployee(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

#### **Mutation Hook Pattern**
```typescript
// Standard Mutation Hook
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
    },
  });
};
```

#### **Query Key Factory**
```typescript
export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.employees.lists(), { filters: filters || 'all' }] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
  },
  // ... other entities
};
```

### **Authentication Pattern**
```typescript
// Auth Context Pattern
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeUser | null>(null);
  const [currentUserData, setCurrentUserData] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  // Session restoration
  useEffect(() => {
    const restoreSessions = () => {
      try {
        const adminSessionId = localStorage.getItem('adminSessionId');
        const adminData = localStorage.getItem('adminData');
        
        if (adminSessionId && adminData) {
          const adminUser = JSON.parse(adminData);
          setCurrentAdmin(adminUser);
          setCurrentEmployee(null);
          setCurrentUserData(adminUser);
        }
      } catch (error) {
        console.error('Error restoring sessions:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };
    restoreSessions();
  }, []);

  // ... rest of auth logic
};
```

### **Data Validation Patterns**

#### **PAN Validation**
```typescript
export const validatePANFormat = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const checkPANExistsAnywhere = async (pan: string): Promise<boolean> => {
  try {
    const [enquiriesExists, employeesExists] = await Promise.all([
      checkPANExistsInEnquiries(pan),
      checkPANExistsInEmployees(pan)
    ]);
    return enquiriesExists || employeesExists;
  } catch (error) {
    console.error('Error checking PAN existence:', error);
    throw error;
  }
};
```

#### **Phone Validation**
```typescript
export const checkUserByPhone = async (phoneNumber: string) => {
  try {
    const cleanPhone = phoneNumber.replace(/^\+91/, '');
    
    // Check admins
    const adminQuery = query(collection(db, 'admins'), where('mobile', '==', cleanPhone));
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      const adminDoc = adminSnapshot.docs[0];
      return { ...adminDoc.data(), id: adminDoc.id, userType: 'admin' };
    }
    
    // Check employees
    const employeeQuery = query(collection(db, 'employees'), where('phone', '==', cleanPhone));
    const employeeSnapshot = await getDocs(employeeQuery);
    
    if (!employeeSnapshot.empty) {
      const employeeDoc = employeeSnapshot.docs[0];
      return { ...employeeDoc.data(), id: employeeDoc.id, userType: 'employee' };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking user by phone:', error);
    throw error;
  }
};
```

---

## 🎨 **Styling Conventions**

### **Tailwind CSS Patterns**

#### **Container Patterns**
```css
/* Standard Container */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Card Container */
bg-white rounded-lg shadow-sm overflow-hidden

/* Section Container */
py-20 bg-gradient-to-br from-orange-50 to-orange-100
```

#### **Grid Patterns**
```css
/* Standard Grid */
grid grid-cols-1 md:grid-cols-3 gap-8

/* Form Grid */
grid grid-cols-1 md:grid-cols-4 gap-4

/* Responsive Grid */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
```

#### **Button Patterns**
```css
/* Primary Button */
bg-orange-600 text-white hover:bg-orange-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl

/* Secondary Button */
bg-white text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300

/* Outline Button */
bg-transparent text-orange-600 border-2 border-orange-600 hover:bg-orange-600 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300
```

#### **Form Field Patterns**
```css
/* Input Field */
w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black

/* Label */
block text-sm font-medium text-gray-700 mb-1

/* Error Message */
mt-1 text-sm text-red-600

/* Required Indicator */
text-red-500 mr-1
```

#### **Card Patterns**
```css
/* Standard Card */
bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6

/* Interactive Card */
bg-white rounded-lg shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 p-6 cursor-pointer

/* Gradient Card */
bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-orange-200
```

### **Responsive Design Patterns**
```css
/* Mobile First Approach */
/* Base styles for mobile */
text-base

/* Small devices (640px+) */
sm:text-lg

/* Medium devices (768px+) */
md:text-xl

/* Large devices (1024px+) */
lg:text-2xl

/* Extra large devices (1280px+) */
xl:text-3xl
```

### **Animation Patterns**
```css
/* Standard Transitions */
transition-all duration-300
transition-colors duration-200
transition-transform duration-300

/* Hover Effects */
hover:scale-105
hover:-translate-y-1
hover:shadow-xl
hover:bg-orange-700

/* Focus States */
focus:outline-none focus:ring-4 focus:ring-orange-300
focus:ring-2 focus:ring-blue-500 focus:border-blue-500
```

---

## 🛣️ **Routing & Navigation**

### **Next.js App Router Patterns**

#### **Page Structure**
```typescript
// Standard Page Component
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function PageName() {
  const { currentUserData } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!currentUserData) {
      router.push('/login');
      return;
    }
  }, [currentUserData, router]);

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Page Name', isCurrent: true }
      ]}
    >
      {/* Page content */}
    </DashboardLayout>
  );
}
```

#### **Dynamic Routes**
```typescript
// Dynamic Route Page
interface PageParams {
  params: Promise<{ id: string }>;
}

export default function DynamicPage({ params }: PageParams) {
  const { id } = use(params);
  
  // Use Tanstack Query for data fetching
  const { data, isLoading, isError } = useEntity(id);
  
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;
  
  return (
    <DashboardLayout>
      {/* Page content */}
    </DashboardLayout>
  );
}
```

### **Middleware Pattern**
```typescript
// Authentication Middleware
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  const adminSessionId = request.cookies.get('adminSessionId')?.value;
  const employeeSessionId = request.cookies.get('employeeSessionId')?.value;
  const isAuthenticated = adminSessionId || employeeSessionId;
  
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  if (isAuthenticated && pathname === '/login') {
    if (adminSessionId) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (employeeSessionId) {
      return NextResponse.redirect(new URL('/employee-dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### **Breadcrumb Pattern**
```typescript
interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
  employeeId?: string;
}

// Usage
<DashboardLayout
  breadcrumbItems={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Employees', href: '/employees' },
    { label: 'Employee Details', isCurrent: true }
  ]}
>
```

---

## 📊 **Data Display Patterns**

### **Table Patterns**
```typescript
// Standard Table Structure
<div className="bg-white rounded-lg shadow-sm overflow-hidden">
  <TableHeader
    title="Table Title"
    total={data.length}
    active={activeCount}
    inactive={inactiveCount}
    searchValue={searchTerm}
    onSearchChange={setSearchTerm}
    actionButtons={[
      {
        label: 'Add New',
        href: '/add',
        icon: <FiPlus />,
        variant: 'primary'
      }
    ]}
  />
  
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Column Name
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {item.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### **Statistics Card Pattern**
```typescript
// Statistics Display
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center">
      <div className="p-2 bg-blue-100 rounded-lg">
        <FiUsers className="w-6 h-6 text-blue-600" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">Total Employees</p>
        <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
      </div>
    </div>
  </div>
</div>
```

---

## 🔧 **Error Handling Patterns**

### **Toast Notifications**
```typescript
import toast from 'react-hot-toast';

// Success
toast.success('Operation completed successfully!');

// Error
toast.error('Something went wrong!');

// Loading
toast.loading('Processing...', { id: 'operation' });
toast.success('Completed!', { id: 'operation' });

// Custom
toast.custom((t) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
    <p>Custom message</p>
  </div>
));
```

### **Error Boundaries**
```typescript
// Error Display Pattern
{error && (
  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
    <p>{error}</p>
  </div>
)}

// Loading States
{isLoading && (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)}
```

---

## 🎯 **Best Practices Summary**

### **Component Creation Checklist**
- [ ] Use TypeScript interfaces for all props
- [ ] Follow established naming conventions
- [ ] Use design tokens for consistent styling
- [ ] Implement proper error handling
- [ ] Add loading states where appropriate
- [ ] Use Tanstack Query for data fetching
- [ ] Follow responsive design patterns
- [ ] Include proper accessibility attributes

### **Form Implementation Checklist**
- [ ] Use React Hook Form for form management
- [ ] Implement proper validation
- [ ] Add audit fields (createdAt, createdBy, etc.)
- [ ] Use toast notifications for feedback
- [ ] Handle loading and error states
- [ ] Follow established field patterns
- [ ] Use consistent styling classes

### **Data Management Checklist**
- [ ] Use Tanstack Query for all data operations
- [ ] Implement proper query key structure
- [ ] Add appropriate cache invalidation
- [ ] Handle loading and error states
- [ ] Use consistent error handling patterns
- [ ] Implement proper TypeScript typing
- [ ] Follow established CRUD patterns

### **Styling Checklist**
- [ ] Use established color palette (orange theme)
- [ ] Follow typography scale
- [ ] Use consistent spacing system
- [ ] Implement proper responsive design
- [ ] Use standard animation patterns
- [ ] Follow component styling conventions
- [ ] Maintain accessibility standards

---

## 🚀 **Quick Reference**

### **Common Imports**
```typescript
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import { useAuth } from '@/context/AuthContext';
```

### **Common Class Combinations**
```css
/* Card */
bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6

/* Button Primary */
bg-orange-600 text-white hover:bg-orange-700 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl

/* Input Field */
w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black

/* Container */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Section */
py-20 bg-gradient-to-br from-orange-50 to-orange-100
```

### **Common Patterns**
```typescript
// Form submission with validation
const onSubmit = async (data) => {
  try {
    setIsSubmitting(true);
    toast.loading('Processing...', { id: 'submit' });
    
    // Validation and processing
    await submitFunction(data);
    
    toast.success('Success!', { id: 'submit' });
    router.push('/success');
  } catch (error) {
    toast.error(error.message, { id: 'submit' });
    setIsSubmitting(false);
  }
};

// Data fetching with Tanstack Query
const { data, isLoading, isError } = useQuery({
  queryKey: queryKeys.entity.list(),
  queryFn: getEntities,
  staleTime: 2 * 60 * 1000,
});

// Authentication check
useEffect(() => {
  if (!currentUserData) {
    router.push('/login');
  }
}, [currentUserData, router]);
```

---

**Remember**: Consistency is key! Always refer to this document when implementing new features or modifying existing ones to ensure perfect alignment with the established patterns and conventions.
