'use client';

import { useState, useEffect, useMemo, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { FiCheckCircle, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';
import { FaSyncAlt } from 'react-icons/fa';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmployeeLayout from '@/components/layout/EmployeeLayout';
import { getEmployment, getEmployee, updateEmployment, getEmployees as getEmployeesAuth, checkEmploymentIdUnique, updateEmployeeSelfEmployment } from '@/utils/firebaseUtils';
import { Employment, Employee } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import TableHeader from '@/components/ui/TableHeader';
import CustomDateInput from '@/components/ui/CustomDateInput';
import { useAuth } from '@/context/AuthContext';
import {
  EMPLOYMENT_DESIGNATION_BY_DEPARTMENT,
  EMPLOYMENT_ID_NUMBER_MAX,
  EMPLOYMENT_ID_NUMBER_MIN,
  randomEmploymentIdSuffix,
} from '@/constants/employmentJobOptions';
import { getEmployees as getEmployeesPublic } from '@/utils/documentFunctions';
import {
  PROFESSIONAL_REFERENCE_DIRECTORY,
  PROFESSIONAL_REFERENCE_NAME_OPTIONS,
  buildProfessionalReferencesArray,
} from '@/utils/professionalReferenceEmployment';
import { queryKeys } from '@/lib/queryKeys';
import { FaHandSparkles } from 'react-icons/fa6';
import { FaBroom } from 'react-icons/fa6';

const EMPLOYMENT_PT_DEDUCT = 200;

const calcEmploymentTotalDeduction = (pfAmount: number, otherDeduction: number) =>
  (Number(pfAmount) || 0) + EMPLOYMENT_PT_DEDUCT + (Number(otherDeduction) || 0);

interface EmploymentFormData extends Omit<Employment, 'id' | 'benefits' | 'relievingCtc'> {
  benefits: string | string[];
  relievingCtc?: string; // Form input is string, will be converted to number|null
  whereWereYouEmploid?: string;
  joiningDesignation?: string;
  incrementHikePercentWrtJoiningCtc?: number;
  // PF toggles for Joining/Current salary information
  joiningPfIncluded?: boolean;
  currentPfIncluded?: boolean;
  teamLead?: {
    employeeDocId?: string;
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
  colleague1?: {
    employeeDocId?: string;
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
  colleague3?: {
    employeeDocId?: string;
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
  reportingManagerRef?: {
    employeeDocId?: string;
    name?: string;
    employeeId?: string;
    mobileNo?: string;
    email?: string;
    designation?: string;
    location?: string;
  };
}

export default function EditEmploymentPage({ params }: { params: Promise<{ id: string }> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [breadcrumbEmployeeName, setBreadcrumbEmployeeName] = useState<string>('');
  // NOTE: reverse-sync removed (no sibling input auto-updates)
  const [aiIncrementCount, setAiIncrementCount] = useState(1);
  // Salary breakdown sections removed as requested.
  const [originalEmployment, setOriginalEmployment] = useState<Employment | null>(null);
  const [showIncrementDetails, setShowIncrementDetails] = useState(false);
  const [incrementDeleteIndex, setIncrementDeleteIndex] = useState<number | null>(null);
  const generatedEmploymentIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedIncrementsRef = useRef(false);
  const incrementFormulaBaseRef = useRef<Record<number, string>>({});
  useForm({
  defaultValues: {
    isResignation: false
  }
});


  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserData } = useAuth();
  const { id } = use(params);
  const [employmentOwnerId, setEmploymentOwnerId] = useState<string | null>(null);
  const isEmployeeUser = currentUserData?.userType === 'employee';
  const Layout: any = isEmployeeUser ? EmployeeLayout : DashboardLayout;

  const { register, handleSubmit, formState: { errors, dirtyFields }, reset, watch, setValue, control, getValues } = useForm<EmploymentFormData>({
    defaultValues: {
      workSchedule: 'Office',
      whereWereYouEmploid: 'Registred Corporate Office(Pune)',
    } as Partial<EmploymentFormData>,
  });
  const breadcrumbEmployeeId = watch('employeeId') || originalEmployment?.employeeId || '';
  const generateRandomEmploymentId = async () => {
    const maxAttempts = 30;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const randomNumber = randomEmploymentIdSuffix();
      const candidate = `ADV${randomNumber}`;

      if (generatedEmploymentIdsRef.current.has(candidate)) continue;

      const { isUnique } = await checkEmploymentIdUnique(candidate, id);
      if (!isUnique) continue;

      generatedEmploymentIdsRef.current.add(candidate);
      setValue('employmentId', candidate as any, { shouldValidate: true, shouldDirty: true });
      toast.success('Random Employment ID generated');
      return;
    }

    toast.error('Could not generate unique Employment ID. Try again.');
  };
  // Dynamic increments field array
  const {
    fields: incrementFields,
    append: appendIncrement,
    remove: removeIncrement,
    replace: replaceIncrements,
  } = useFieldArray({
    control,
    name: 'increments',
  });

  const closeIncrementDeleteModal = () => {
    setIncrementDeleteIndex(null);
  };

  const confirmIncrementDelete = () => {
    if (incrementDeleteIndex === null) return;
    removeIncrement(incrementDeleteIndex);
    closeIncrementDeleteModal();
  };

  const handleCleanSection = (section: string) => {
    switch (section) {
      case 'employmentInfo':
        setValue('employmentId', '' as any, { shouldDirty: true });
        setValue('profilePhoto', '' as any, { shouldDirty: true });
        break;
      case 'jobDetails':
        setValue('department', '' as any, { shouldDirty: true });
        setValue('location', '' as any, { shouldDirty: true });
        setValue('workSchedule', '' as any, { shouldDirty: true });
        setValue('whereWereYouEmploid', '' as any, { shouldDirty: true });
        break;
      case 'professionalReference':
        setValue('teamLead.name' as any, '', { shouldDirty: true });
        setValue('teamLead.employeeId' as any, '', { shouldDirty: true });
        setValue('teamLead.mobileNo' as any, '', { shouldDirty: true });
        setValue('teamLead.email' as any, '', { shouldDirty: true });
        setValue('teamLead.designation' as any, '', { shouldDirty: true });
        setValue('teamLead.location' as any, '', { shouldDirty: true });
        setValue('colleague1.name' as any, '', { shouldDirty: true });
        setValue('colleague1.employeeId' as any, '', { shouldDirty: true });
        setValue('colleague1.mobileNo' as any, '', { shouldDirty: true });
        setValue('colleague1.email' as any, '', { shouldDirty: true });
        setValue('colleague1.designation' as any, '', { shouldDirty: true });
        setValue('colleague1.location' as any, '', { shouldDirty: true });
        setValue('colleague3.name' as any, '', { shouldDirty: true });
        setValue('colleague3.employeeId' as any, '', { shouldDirty: true });
        setValue('colleague3.mobileNo' as any, '', { shouldDirty: true });
        setValue('colleague3.email' as any, '', { shouldDirty: true });
        setValue('colleague3.designation' as any, '', { shouldDirty: true });
        setValue('colleague3.location' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.name' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.employeeId' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.mobileNo' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.email' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.designation' as any, '', { shouldDirty: true });
        setValue('reportingManagerRef.location' as any, '', { shouldDirty: true });
        break;
      case 'resignation':
        setValue('isResignation', false as any, { shouldDirty: true });
        setValue('lastWorkingDate', '' as any, { shouldDirty: true });
        setValue('reasonForLeaving', '' as any, { shouldDirty: true });
        break;
      case 'joiningSalary':
        setValue('joiningDate', '' as any, { shouldDirty: true });
        setValue('joiningDesignation', '' as any, { shouldDirty: true });
        setValue('joiningCtc', 0 as any, { shouldDirty: true });
        setValue('joiningVariablePay', 0 as any, { shouldDirty: true });
        setValue('joiningOtherAllowance', 0 as any, { shouldDirty: true });
        setValue('joiningOtherDeduction', 0 as any, { shouldDirty: true });
        setValue('joiningPfIncluded', false as any, { shouldDirty: true });
        break;
      case 'increments':
        replaceIncrements([] as any);
        setShowIncrementDetails(false);
        break;
      case 'currentSalary':
        setValue('jobTitle', '' as any, { shouldDirty: true });
        setValue('salary', 0 as any, { shouldDirty: true });
        setValue('lastSalaryAmount', 0 as any, { shouldDirty: true });
        setValue('currentVariablePay', 0 as any, { shouldDirty: true });
        setValue('currentOtherAllowance', 0 as any, { shouldDirty: true });
        setValue('currentOtherDeduction', 0 as any, { shouldDirty: true });
        setValue('currentPfIncluded', false as any, { shouldDirty: true });
        break;
      case 'bankDetails':
        setValue('bankName', '' as any, { shouldDirty: true });
        setValue('accountNo', '' as any, { shouldDirty: true });
        setValue('ifscCode', '' as any, { shouldDirty: true });
        break;
      default:
        break;
    }
  };

  const compressImageToDataUrl = async (file: File) => {
    // Keep safely under Firestore ~1MB doc limit (base64 grows ~33%).
    const maxDimension = 512;
    const maxBytes = 650_000;

    const readAsDataUrl = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });

    const src = await readAsDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, outW, outH);

    const tryEncode = (mime: string, quality?: number) => canvas.toDataURL(mime, quality);

    // Prefer WebP for smaller output; fall back to JPEG.
    let quality = 0.82;
    let out = tryEncode('image/webp', quality);
    if (!out.startsWith('data:image/webp')) out = tryEncode('image/jpeg', quality);

    // Reduce quality until size is acceptable or we hit a floor.
    while (out.length > maxBytes && quality > 0.35) {
      quality = Number((quality - 0.07).toFixed(2));
      out = out.startsWith('data:image/webp')
        ? tryEncode('image/webp', quality)
        : tryEncode('image/jpeg', quality);
    }

    return out;
  };

  const handleProfilePhotoUpload = async (file: File) => {
    try {
      const compressed = await compressImageToDataUrl(file);
      // Additional guard in case of very large images.
      if (compressed.length > 900_000) {
        toast.error('Profile photo is too large. Please choose a smaller image.');
        return;
      }
      setValue('profilePhoto', compressed as any, { shouldDirty: true, shouldValidate: false });
    } catch (e) {
      console.error('Profile photo upload failed', e);
      toast.error('Could not read profile photo. Try a different image.');
    }
  };

  const joiningCtcValue = watch('joiningCtc');
  const joiningFixedPayValue = watch('joiningFixedPay');
  const isResignation = watch('isResignation');
  const employeeStatusValue = watch('employeeStatus' as any);
  const whereWereYouEmploidValue = watch('whereWereYouEmploid');
  const selectedDepartment = watch('department');
  const designationOptionsByDepartment = EMPLOYMENT_DESIGNATION_BY_DEPARTMENT;
  const derivedLocation =
    whereWereYouEmploidValue === 'Registred Corporate Office(Pune)' ||
    whereWereYouEmploidValue === 'Registred Corporate Office'
      ? 'Pune'
      : whereWereYouEmploidValue === 'Branch Office(Mumbai)' ||
          whereWereYouEmploidValue === 'Branch Office'
        ? 'Mumbai'
        : '';
  const locationValue = watch('location');

  useEffect(() => {
    // Make `location` dependent on the selected employment office.
    if (!derivedLocation) return;
    setValue('location', derivedLocation, { shouldValidate: true, shouldDirty: true });
  }, [derivedLocation, setValue]);

  useEffect(() => {
    if (!isResignation) return;
    if (employeeStatusValue) return;
    setValue('employeeStatus' as any, 'exited', { shouldValidate: false, shouldDirty: false });
  }, [isResignation, employeeStatusValue, setValue]);

  const joiningVariablePayValue = watch('joiningVariablePay');
  const computedJoiningFixedPay = useMemo(() => {
    const ctc = Number(joiningCtcValue ?? 0) || 0;
    const variable = Number(joiningVariablePayValue ?? 0) || 0;
    return Number((ctc - variable).toFixed(2));
  }, [joiningCtcValue, joiningVariablePayValue]);

  useEffect(() => {
    setValue('joiningFixedPay', computedJoiningFixedPay as any, { shouldValidate: false, shouldDirty: false });
  }, [computedJoiningFixedPay, setValue]);

  const currentCtcValue = watch('salary');
  const currentVariablePayValue = watch('currentVariablePay');
  const currentFixedPayValue = watch('currentFixedPay');
  const currentOtherAllowanceManualValue = watch('currentOtherAllowance');
  const currentLastDrawnCtcValue = watch('lastSalaryAmount');

  const computedCurrentFixedPay = useMemo(() => {
    const ctc = Number(currentCtcValue ?? 0) || 0;
    const variable = Number(currentVariablePayValue ?? 0) || 0;
    return Number((ctc - variable).toFixed(2));
  }, [currentCtcValue, currentVariablePayValue]);

  useEffect(() => {
    setValue('currentFixedPay', computedCurrentFixedPay as any, { shouldValidate: false, shouldDirty: false });
  }, [computedCurrentFixedPay, setValue]);

  const joiningMonthlyFixed = (Number(computedJoiningFixedPay ?? 0) || 0) / 12;
  const joiningBasic = joiningMonthlyFixed * 0.5;
  const joiningHra = joiningBasic * 0.4;
  const joiningConveyance = 2000;
  const joiningOtherAllowanceCalculated =
    joiningMonthlyFixed - (joiningBasic + joiningHra + joiningConveyance);
  const joiningOtherAllowanceValue = watch('joiningOtherAllowance') ?? joiningOtherAllowanceCalculated;
  const incrementsValue = watch('increments');

  // Increment rows: Fixed is derived, Other Allowance auto-fills unless edited.
  useEffect(() => {
    const rows: any[] = Array.isArray(incrementsValue) ? incrementsValue : [];
    for (let index = 0; index < incrementFields.length; index += 1) {
      const row = rows[index] || {};
      const ctc = Number(row.incrementedCtc ?? 0) || 0;
      const variable = Number(row.incrementVariablePay ?? 0) || 0;
      const currentFormulaBase = `${ctc}|${variable}`;
      const previousFormulaBase = incrementFormulaBaseRef.current[index];
      const fixed = Number((ctc - variable).toFixed(2));

      setValue(`increments.${index}.incrementFixedPay` as any, fixed, {
        shouldValidate: false,
        shouldDirty: false,
      });

      const monthlyFixed = fixed / 12;
      const basic = monthlyFixed * 0.5;
      const hra = basic * 0.4;
      const conveyance = 2000;
      const other = Number((monthlyFixed - (basic + hra + conveyance)).toFixed(2));

      // Re-sync Other Allowance when CTC/Variable changes; otherwise preserve manual edits.
      if (previousFormulaBase !== currentFormulaBase) {
        setValue(`increments.${index}.incrementOtherAllowance` as any, other, {
          shouldValidate: false,
          shouldDirty: false,
        });
      }

      incrementFormulaBaseRef.current[index] = currentFormulaBase;
    }
  }, [incrementsValue, incrementFields.length, dirtyFields, setValue]);

  useEffect(() => {
    if (!showIncrementDetails) return;
    if (!loading && !hasInitializedIncrementsRef.current && incrementFields.length === 0) {
      hasInitializedIncrementsRef.current = true;
      appendIncrement({
        incrementDate: '',
        incrementedCtc: Number(joiningCtcValue ?? 0) || 0,
        incrementHikePercentWrtJoiningCtc: undefined,
        incrementVariablePay: Number(joiningVariablePayValue ?? 0) || 0,
        incrementFixedPay: Number(joiningFixedPayValue ?? 0) || 0,
        incrementOtherAllowance: undefined,
        incrementOtherDeduction: 0,
        incrementPfIncluded: false,
        previousDesignation: String(watch('joiningDesignation') || watch('jobTitle') || '').trim(),
        newDesignation: '',
      } as any);
    }
  }, [
    showIncrementDetails,
    loading,
    incrementFields.length,
    appendIncrement,
    joiningCtcValue,
    joiningVariablePayValue,
    joiningFixedPayValue,
    joiningOtherAllowanceValue,
  ]);

  useEffect(() => {
    if (!showIncrementDetails || incrementFields.length === 0) return;
    const rows = Array.isArray(incrementsValue) ? incrementsValue : [];
    const firstOldDesignation = String(watch('joiningDesignation') || watch('jobTitle') || '').trim();

    for (let index = 0; index < incrementFields.length; index += 1) {
      const currentOld = String(rows[index]?.previousDesignation || '').trim();
      if (currentOld) continue;

      const fallbackOld =
        index === 0
          ? firstOldDesignation
          : String(rows[index - 1]?.newDesignation || '').trim();

      if (!fallbackOld) continue;
      setValue(`increments.${index}.previousDesignation` as any, fallbackOld as any, {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [showIncrementDetails, incrementFields.length, incrementsValue, setValue, watch]);

  const joiningPfIncluded = watch('joiningPfIncluded') || false;
  const joiningPf = joiningPfIncluded ? Math.min(joiningBasic, 15000) * 0.12 : 0;

  const currentMonthlyFixed = (Number(computedCurrentFixedPay ?? 0) || 0) / 12;
  const currentBasic = currentMonthlyFixed * 0.5;
  const currentHra = currentBasic * 0.4;
  const currentConveyance = 2000;
  const currentPfIncluded = watch('currentPfIncluded') || false;
  const currentPf = currentPfIncluded ? Math.min(currentBasic, 15000) * 0.12 : 0;
  const currentOtherAllowanceCalculated =
    currentMonthlyFixed - (currentBasic + currentHra + currentConveyance);
  const currentOtherAllowanceValue = watch('currentOtherAllowance') ?? currentOtherAllowanceCalculated;

  const joiningGrossSalary =
    joiningBasic + joiningHra + joiningConveyance + (Number(joiningOtherAllowanceValue) || 0);
  const currentGrossSalary =
    currentBasic + currentHra + currentConveyance + (Number(currentOtherAllowanceValue) || 0);
  const joiningOtherDeductionValue = Number(watch('joiningOtherDeduction') ?? 0) || 0;
  const currentOtherDeductionValue = Number(watch('currentOtherDeduction') ?? 0) || 0;
  const joiningTotalDeduction = calcEmploymentTotalDeduction(joiningPf, joiningOtherDeductionValue);
  const currentTotalDeduction = calcEmploymentTotalDeduction(currentPf, currentOtherDeductionValue);
  const joiningNetSalary = joiningGrossSalary - joiningTotalDeduction;
  const currentNetSalary = currentGrossSalary - currentTotalDeduction;

  useEffect(() => {
    if ((dirtyFields as any)?.joiningOtherAllowance) return;
    setValue('joiningOtherAllowance', joiningOtherAllowanceCalculated, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [dirtyFields, joiningOtherAllowanceCalculated, setValue]);

  useEffect(() => {
    if ((dirtyFields as any)?.currentOtherAllowance) return;
    setValue('currentOtherAllowance', currentOtherAllowanceCalculated, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [dirtyFields, currentOtherAllowanceCalculated, setValue]);

  useEffect(() => {
    if ((dirtyFields as any)?.lastSalaryAmount) return;
    setValue('lastSalaryAmount', Number(currentCtcValue ?? 0) || 0, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [dirtyFields, currentCtcValue, setValue]);

  const getIncrementSalaryBreakdown = (increment: any) => {
    const joining = Number(joiningCtcValue ?? 0) || 0;
    const incrementCtc = Number(increment?.incrementedCtc ?? 0) || 0;
    const incrementVariable = Number(increment?.incrementVariablePay ?? 0) || 0;
    const incrementFixed = incrementCtc - incrementVariable;
    const incrementMonthlyFixed = incrementFixed / 12;
    const incrementBasic = incrementMonthlyFixed * 0.5;
    const incrementHra = incrementBasic * 0.4;
    const incrementConveyance = 2000;
    const incrementOtherAllowanceCalculated =
      incrementMonthlyFixed - (incrementBasic + incrementHra + incrementConveyance);
    const incrementOtherAllowance =
      increment?.incrementOtherAllowance != null
        ? Number(increment.incrementOtherAllowance)
        : incrementOtherAllowanceCalculated;
    const incrementGross =
      incrementBasic + incrementHra + incrementConveyance + (Number(incrementOtherAllowance) || 0);
    const incrementPfIncluded = Boolean(increment?.incrementPfIncluded);
    const incrementPf = incrementPfIncluded ? Math.min(incrementBasic, 15000) * 0.12 : 0;
    const incrementOtherDeduction = Number(increment?.incrementOtherDeduction ?? 0) || 0;
    const incrementTotalDeduction = calcEmploymentTotalDeduction(incrementPf, incrementOtherDeduction);
    const incrementNetSalary = incrementGross - incrementTotalDeduction;
    const incrementHikePercent = joining > 0 ? ((incrementCtc - joining) / joining) * 100 : 0;

    return {
      incrementFixed,
      incrementMonthlyFixed,
      incrementBasic,
      incrementHra,
      incrementConveyance,
      incrementOtherAllowance,
      incrementGross,
      incrementPfIncluded,
      incrementPf,
      incrementOtherDeduction,
      incrementTotalDeduction,
      incrementNetSalary,
      incrementHikePercent,
    };
  };

  const getDefaultIncrementVariablePay = (incrementCtc: number) => {
    const ctc = Number(incrementCtc ?? 0) || 0;
    if (ctc >= 1000000 && ctc <= 1400000) return 100000;
    if (ctc >= 800000 && ctc < 1000000) return 70000;
    if (ctc >= 600000 && ctc < 800000) return 60000;
    if (ctc >= 500000 && ctc < 600000) return 50000;
    return 40000;
  };

  const buildNextIncrementRow = (previousIncrement: any | null) => {
    const previousIncrementCtc = Number(previousIncrement?.incrementedCtc ?? joiningCtcValue ?? 0) || 0;
    const currentIncrementCtc = Number(previousIncrement?.incrementedCtc ?? joiningCtcValue ?? 0) || 0;
    const defaultHikePercent =
      previousIncrement?.incrementHikePercentWrtJoiningCtc != null
        ? Number(previousIncrement.incrementHikePercentWrtJoiningCtc)
        : previousIncrementCtc > 0
          ? Number((((currentIncrementCtc - previousIncrementCtc) / previousIncrementCtc) * 100).toFixed(2))
          : 0;

    return {
      incrementDate: '',
      incrementedCtc: currentIncrementCtc,
      incrementHikePercentWrtJoiningCtc: defaultHikePercent,
      incrementVariablePay: getDefaultIncrementVariablePay(currentIncrementCtc),
      incrementFixedPay:
        Number(previousIncrement?.incrementFixedPay ?? joiningFixedPayValue ?? 0) || 0,
      incrementOtherAllowance: undefined,
      incrementPfIncluded:
        previousIncrement?.incrementPfIncluded != null
          ? Boolean(previousIncrement.incrementPfIncluded)
          : false,
      previousDesignation: previousIncrement
        ? String(previousIncrement?.newDesignation || '').trim()
        : String(watch('joiningDesignation') || watch('jobTitle') || '').trim(),
      newDesignation: '',
    };
  };

  const handleAddIncrement = () => {
    if (!showIncrementDetails) {
      setShowIncrementDetails(true);
    }

    const currentIncrements = (getValues('increments') as any[]) || [];
    const previousIncrement =
      currentIncrements.length > 0 ? currentIncrements[currentIncrements.length - 1] : null;

    appendIncrement(buildNextIncrementRow(previousIncrement) as any);
  };

  const handleCreateIncrementsWithAi = () => {
    if (!showIncrementDetails) {
      setShowIncrementDetails(true);
    }

    const count = Math.max(1, Math.min(7, Number(aiIncrementCount) || 1));
    const joining = Number(joiningCtcValue ?? 0) || 0;
    const current = Number(watch('salary') ?? 0) || 0;
    if (joining <= 0) {
      toast.error('Joining CTC must be greater than 0 to create increments.');
      return;
    }
    if (current <= 0) {
      toast.error('FIll Current Salary Information Frist');
      return;
    }
    if (current <= joining) {
      toast.error('Current salary must be greater than Joining CTC for increments.');
      return;
    }

    const currentDate = new Date();
    const joiningDateRaw = watch('joiningDate');
    const parsedJoiningDate = joiningDateRaw ? new Date(joiningDateRaw as any) : null;
    const joiningDate =
      parsedJoiningDate && !Number.isNaN(parsedJoiningDate.getTime())
        ? parsedJoiningDate
        : null;
    const resignationDateRaw = watch('resignationDate') || watch('lastWorkingDate');
    const parsedResignationDate = resignationDateRaw ? new Date(resignationDateRaw as any) : null;
    const endDate =
      parsedResignationDate && !Number.isNaN(parsedResignationDate.getTime())
        ? parsedResignationDate
        : currentDate;
    const rows: any[] = [];

    const toInputDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const getAprilDatesInRange = (start: Date, end: Date): Date[] => {
      const dates: Date[] = [];
      const startMs = start.getTime();
      const endMs = end.getTime();
      for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
        const aprilDate = new Date(year, 3, 1); // April 1st
        const aprilMs = aprilDate.getTime();
        if (aprilMs >= startMs && aprilMs <= endMs) {
          dates.push(aprilDate);
        }
      }
      return dates;
    };

    if (!joiningDate) {
      toast.error('Please select valid joining date first.');
      return;
    }
    if (endDate.getTime() < joiningDate.getTime()) {
      toast.error('Resign/last working date cannot be before joining date.');
      return;
    }

    const aprilDates = getAprilDatesInRange(joiningDate, endDate);
    if (aprilDates.length === 0) {
      toast.error('No April month found between joining date and resign/current date.');
      return;
    }

    const effectiveCount = Math.min(count, aprilDates.length);
    if (effectiveCount < count) {
      toast(`Only ${effectiveCount} April increments possible in selected date range.`, {
        icon: 'ℹ️',
      });
    }

    const selectedAprilDates: Date[] = [];
    if (effectiveCount === 1) {
      selectedAprilDates.push(aprilDates[aprilDates.length - 1]);
    } else {
      for (let i = 0; i < effectiveCount; i += 1) {
        const idx = Math.round((i * (aprilDates.length - 1)) / (effectiveCount - 1));
        selectedAprilDates.push(aprilDates[idx]);
      }
    }

    const ratio = current / joining;
    const buildVariableHikePercents = (): number[] => {
      const isStrictlyAscending = (arr: number[]) =>
        arr.length > 1 && arr.every((v, idx) => idx === 0 || arr[idx - 1] < v);
      const shuffle = (arr: number[]) => {
        const next = [...arr];
        for (let i = next.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [next[i], next[j]] = [next[j], next[i]];
        }
        return next;
      };

      if (count === 1) {
        const onlyPct = ((ratio - 1) * 100);
        return [Number(Math.max(0, onlyPct).toFixed(2))];
      }

      const MIN_FAIR_HIKE = 5;
      const MAX_FAIR_HIKE = 25;

      for (let attempt = 0; attempt < 2000; attempt += 1) {
        const basePercents: number[] = [];
        for (let i = 0; i < count - 1; i += 1) {
          const p = Number((MIN_FAIR_HIKE + Math.random() * (MAX_FAIR_HIKE - MIN_FAIR_HIKE)).toFixed(2));
          basePercents.push(p);
        }

        const productBeforeLast = basePercents.reduce((acc, p) => acc * (1 + p / 100), 1);
        const lastPct = ((ratio / productBeforeLast) - 1) * 100;
        const isDistinctFromOthers = basePercents.every((p) => Math.abs(p - lastPct) > 0.01);

        if (lastPct >= MIN_FAIR_HIKE && lastPct <= MAX_FAIR_HIKE && isDistinctFromOthers) {
          const randomized = shuffle([...basePercents, Number(lastPct.toFixed(2))]);
          if (!isStrictlyAscending(randomized)) {
            return randomized;
          }
        }
      }

      // Guaranteed fallback for any increment count:
      // derive average compound hike and add slight random variation.
      const avgPct = (Math.pow(ratio, 1 / count) - 1) * 100;
      const fallback = Array.from({ length: count }, (_, idx) => {
        const jitter = (Math.random() - 0.5) * 4; // -2..+2
        const adaptiveMin = Math.min(MIN_FAIR_HIKE, avgPct);
        const adaptiveMax = Math.max(MAX_FAIR_HIKE, avgPct);
        const val = Math.max(adaptiveMin, Math.min(adaptiveMax, avgPct + jitter + idx * 0.03));
        return Number(val.toFixed(2));
      });
      const randomized = shuffle(fallback);
      if (!isStrictlyAscending(randomized)) return randomized;
      return randomized.reverse();
    };

    const hikePercents = buildVariableHikePercents();

    let previousSalary = joining;
    let previousIncrement: any = null;
    for (let i = 1; i <= effectiveCount; i += 1) {
      const incrementDate = toInputDate(selectedAprilDates[i - 1]);
      const hikePercent = Number(hikePercents[i - 1] ?? 0);
      const salaryAfterIncrement =
        i === effectiveCount
          ? Number(current.toFixed(2))
          : Number((previousSalary * (1 + hikePercent / 100)).toFixed(2));
      const incrementVariable = getDefaultIncrementVariablePay(salaryAfterIncrement);
      const incrementFixed = Number((salaryAfterIncrement - incrementVariable).toFixed(2));

      const row = {
        incrementDate,
        incrementedCtc: salaryAfterIncrement,
        incrementHikePercentWrtJoiningCtc: hikePercent,
        incrementVariablePay: incrementVariable,
        incrementFixedPay: incrementFixed,
        incrementOtherAllowance: undefined,
        incrementOtherDeduction: 0,
        incrementPfIncluded:
          previousIncrement?.incrementPfIncluded != null
            ? Boolean(previousIncrement.incrementPfIncluded)
            : false,
        previousDesignation: previousIncrement
          ? String(previousIncrement?.newDesignation || '').trim()
          : String(watch('joiningDesignation') || watch('jobTitle') || '').trim(),
        newDesignation: '',
      };

      rows.push(row);
      previousIncrement = row;
      previousSalary = salaryAfterIncrement;
    }

    replaceIncrements(rows as any);
    toast.success('Increment plan generated.');
  };

  // ---------------- PROFESSIONAL REFERENCE (Team Lead / Colleagues) ----------------
  // Professional Reference: dropdown shows saved Name.
  // Dependent fields should be prefilled from stored Professional Reference strings.
  type ProfessionalRefKey = 'teamLead' | 'colleague1' | 'colleague3' | 'reportingManagerRef';

  const professionalRefTeamLeadName = watch('teamLead.name') || '';
  const professionalRefColleague1Name = watch('colleague1.name') || '';
  const professionalRefColleague3Name = watch('colleague3.name') || '';
  const professionalRefReportingManagerName = watch('reportingManagerRef.name') || '';
  const showProfessionalReferenceExtraFields = false;

  const clearProfessionalReferenceFields = (refKey: ProfessionalRefKey) => {
    setValue(`${refKey}.employeeId` as any, '', { shouldDirty: true });
    setValue(`${refKey}.mobileNo` as any, '', { shouldDirty: true });
    setValue(`${refKey}.email` as any, '', { shouldDirty: true });
    setValue(`${refKey}.designation` as any, '', { shouldDirty: true });
    setValue(`${refKey}.location` as any, '', { shouldDirty: true });
  };

  const autoFillProfessionalReferenceFromDirectory = (refKey: ProfessionalRefKey, employeeName: string) => {
    const key = (employeeName ?? '').trim();
    if (!key) {
      clearProfessionalReferenceFields(refKey);
      setValue(`${refKey}.name` as any, '', { shouldDirty: true });
      return;
    }
    const person = PROFESSIONAL_REFERENCE_DIRECTORY[key];
    if (!person) {
      clearProfessionalReferenceFields(refKey);
      setValue(`${refKey}.name` as any, '', { shouldDirty: true });
      return;
    }

    setValue(`${refKey}.employeeId` as any, person.employeeId, { shouldDirty: true });
    setValue(`${refKey}.mobileNo` as any, person.mobileNo, { shouldDirty: true });
    setValue(`${refKey}.email` as any, person.email, { shouldDirty: true });
    setValue(`${refKey}.designation` as any, person.designation, { shouldDirty: true });
    setValue(`${refKey}.location` as any, person.location, { shouldDirty: true });
  };

  useEffect(() => {
    if (!professionalRefTeamLeadName) return;
    autoFillProfessionalReferenceFromDirectory('teamLead', professionalRefTeamLeadName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefTeamLeadName]);

  useEffect(() => {
    if (!professionalRefColleague1Name) return;
    autoFillProfessionalReferenceFromDirectory('colleague1', professionalRefColleague1Name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefColleague1Name]);

  useEffect(() => {
    if (!professionalRefColleague3Name) return;
    autoFillProfessionalReferenceFromDirectory('colleague3', professionalRefColleague3Name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefColleague3Name]);

  useEffect(() => {
    if (!professionalRefReportingManagerName) return;
    autoFillProfessionalReferenceFromDirectory('reportingManagerRef', professionalRefReportingManagerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalRefReportingManagerName]);

  const parseNameAndDesignationFromProfessionalReference = (
    raw?: string
  ): { name: string; designation: string; employeeId: string } => {
    const cleanParsedPersonName = (n: string): string => {
      let t = (n ?? '').trim();
      if (!t) return '';
      if (/^name$/i.test(t)) return '';
      const stripped = t.replace(/^name\s*[-:|]\s*/i, '').trim();
      if (stripped) t = stripped;
      if (/^name$/i.test(t) || /^designation$/i.test(t)) return '';
      return t;
    };

    const s = (raw ?? '').toString().trim();
    if (!s) return { name: '', designation: '', employeeId: '' };

    const normalized = s.replace(/\u2013|\u2014/g, '-');

    const nameLabeled = normalized.match(/\bName\b\s*[-:|]\s*(.+)/i)?.[1]?.trim() || '';
    const designationLabeled =
      normalized.match(/\bDesignation\b\s*[-:|]\s*(.+)/i)?.[1]?.trim() || '';

    const employeeIdMatch =
      normalized.match(/\b(?:Employee\s*Id|Emp\s*Id)\b\s*[-:|]\s*(ADV\d+)/i)?.[1] ||
      normalized.match(/\b(ADV\d+)\b/i)?.[1] ||
      '';

    let name: string;
    let designation: string;

    if (nameLabeled || designationLabeled) {
      name = nameLabeled;
      designation = designationLabeled;
    } else {
      const lines = s.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
      if (lines.length >= 2) {
        name = lines[0];
        designation = lines.slice(1).join(' ');
      } else {
        name = s;
        designation = '';
      }
    }

    return {
      name: cleanParsedPersonName(name),
      designation: designation.trim(),
      employeeId: employeeIdMatch,
    };
  };

  const parseEmailAndMobileFromProfessionalReference = (
    raw?: string
  ): { email: string; mobileNo: string; place: string } => {
    const s = (raw ?? '').toString().trim();
    if (!s) return { email: '', mobileNo: '', place: '' };

    const normalized = s.replace(/\u2013|\u2014/g, '-');

    const emailLabelMatch =
      normalized.match(/\bEmail\b\s*[-:|]\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)?.[1] || null;
    const mobileLabelMatch =
      normalized.match(/\bMobile\b\s*(?:no\b|No\b)?\s*[-:|]\s*(\d{10,13})/i)?.[1] || null;

    const emailMatch =
      emailLabelMatch ||
      normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ||
      '';

    // Mobile numbers may be stored with spaces like: "+91 84840 25370"
    // so we fallback to extracting digits and taking the last 10 digits.
    const allDigits = normalized.replace(/\D/g, '');
    const mobileFromDigits =
      allDigits.length >= 10 ? allDigits.slice(-10) : allDigits.length ? allDigits : '';

    const mobileMatch =
      mobileLabelMatch ||
      normalized.match(/(?:^|[^0-9])(\d{10,13})(?:[^0-9]|$)/)?.[1] ||
      normalized.match(/\b(\d{10,13})\b/)?.[1] ||
      mobileFromDigits ||
      '';

    const placeMatch =
      normalized.match(/\bPlace\b\s*[-:|]\s*([^\n\r]+)/i)?.[1]?.trim() ||
      '';

    let place = placeMatch;
    if (!place) {
      // Fallback for comma-separated format like:
      // "Email - ... , Mobile no - ..., Designation - ..., Pune"
      const withoutContact = normalized
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
        .replace(/\b\d{10,13}\b/g, '')
        .replace(/\bADV\d+\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      const lastToken = withoutContact
        .replace(/\r?\n/g, ',')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(-1)[0];

      if (
        lastToken &&
        lastToken.length <= 20 &&
        /^[A-Za-z ]+$/.test(lastToken) &&
        !/manager|engineer|developer|engineers|sr\\.?/i.test(lastToken)
      ) {
        place = lastToken;
      }
    }

    return { email: emailMatch, mobileNo: mobileMatch, place };
  };

  // Joining salary breakdown UI removed as requested.

  // After loading original employment, capture owner for employee access check
  useEffect(() => {
    if (originalEmployment?.employeeId) {
      setEmploymentOwnerId(originalEmployment.employeeId);
    }
  }, [originalEmployment]);

  // Block employees from editing other employees' employment
  useEffect(() => {
    if (
      currentUserData?.userType === 'employee' &&
      employmentOwnerId &&
      employmentOwnerId !== currentUserData.id
    ) {
      toast.error('You can only edit your own employment.');
      router.push('/employee-dashboard');
    }
  }, [currentUserData, employmentOwnerId, router]);

  // Salary calculations removed as requested.

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Do not fetch all employees here (keeps Edit page lightweight).
        // Professional Reference fields are populated from the saved reference strings.
        setEmployees([]);

        // Fetch employment data
        const employmentData = await getEmployment(id);
        setOriginalEmployment(employmentData);
        if (employmentData?.employeeId) {
          try {
            const employeeData = await getEmployee(employmentData.employeeId);
            setBreadcrumbEmployeeName(employeeData?.name || '');
          } catch {
            setBreadcrumbEmployeeName('');
          }
        } else {
          setBreadcrumbEmployeeName('');
        }

        // Reset form with employment data (excluding audit fields)
        const {
          id: _id,
          createdAt: _createdAt,
          createdBy: _createdBy,
          updatedAt: _updatedAt,
          updatedBy: _updatedBy,
          relievingCtc,
          ...rest
        } = employmentData;

        // Suppress unused variable warnings for destructured audit fields
        void _id; void _createdAt; void _createdBy; void _updatedAt; void _updatedBy;

        const increments =
          employmentData.increments && employmentData.increments.length > 0
            ? employmentData.increments
            : (employmentData.incrementDate ||
               employmentData.newSalary ||
               employmentData.incrementedCtc ||
               employmentData.incrementedInHandCtc)
            ? [
                ({
                  incrementDate: employmentData.incrementDate || '',
                  newSalary: employmentData.newSalary,
                  incrementedCtc: employmentData.incrementedCtc,
                  incrementVariablePay: (employmentData as any).incrementVariablePay,
                  incrementFixedPay: (employmentData as any).incrementFixedPay,
                  incrementOtherAllowance: (employmentData as any).incrementOtherAllowance,
                  incrementPfIncluded: (employmentData as any).incrementPfIncluded,
                  incrementedInHandCtc: employmentData.incrementedInHandCtc,
                } as any),
              ]
            : [];

        setShowIncrementDetails(increments.length > 0);

        const normalizedWorkSchedule =
          rest.workSchedule === 'Office' || rest.workSchedule === 'Remote' || rest.workSchedule === 'Hybrid'
            ? rest.workSchedule
            : 'Office';

        const proRefs = employmentData.professionalReferences || [];
        const ref0 = proRefs[0];
        const ref1 = proRefs[1];
        const ref2 = proRefs[2];
        const ref3 = proRefs[3];
        const ref4 = proRefs[4];

        const teamLeadNameDesig = parseNameAndDesignationFromProfessionalReference(ref0?.nameDesignation);
        const teamLeadEmailMobile = parseEmailAndMobileFromProfessionalReference(ref0?.emailAndMobile);

        const colleague1NameDesig = parseNameAndDesignationFromProfessionalReference(ref1?.nameDesignation);
        const colleague1EmailMobile = parseEmailAndMobileFromProfessionalReference(ref1?.emailAndMobile);

        const colleague3NameDesig = parseNameAndDesignationFromProfessionalReference(ref2?.nameDesignation);
        const colleague3EmailMobile = parseEmailAndMobileFromProfessionalReference(ref2?.emailAndMobile);

        const reportingManagerSource = ref4 || ref3;
        const reportingManagerNameDesig = parseNameAndDesignationFromProfessionalReference(reportingManagerSource?.nameDesignation);
        const reportingManagerEmailMobile = parseEmailAndMobileFromProfessionalReference(reportingManagerSource?.emailAndMobile);

        /** Parsed label junk like "Name" (no real person) is not a valid dropdown value. */
        const hasSubstantiveProRefData = (
          nd: { name: string; designation: string; employeeId: string },
          em: { email: string; mobileNo: string; place: string }
        ) => {
          const trimmedName = (nd.name ?? '').trim();
          const nameIsDirectoryPerson =
            !!trimmedName &&
            !/^name$/i.test(trimmedName) &&
            Boolean(PROFESSIONAL_REFERENCE_DIRECTORY[trimmedName]);
          return (
            nameIsDirectoryPerson ||
            !!(nd.employeeId && nd.employeeId.trim()) ||
            !!(em.email && em.email.trim()) ||
            !!(em.mobileNo && em.mobileNo.trim()) ||
            !!(em.place && em.place.trim())
          );
        };

        const pickDirectoryDropdownName = (
          nd: { name: string; designation: string; employeeId: string }
        ) => {
          const t = (nd.name ?? '').trim();
          if (t && PROFESSIONAL_REFERENCE_DIRECTORY[t]) return t;
          const adv = (nd.employeeId ?? '').trim().toUpperCase();
          if (adv) {
            for (const [personName, info] of Object.entries(PROFESSIONAL_REFERENCE_DIRECTORY)) {
              if (String(info.employeeId).toUpperCase() === adv) return personName;
            }
          }
          return '';
        };

        /** True when Firestore has no usable reference (incl. empty "Name -\nDesignation -" blobs). */
        const isProRefSlotVacant = (
          ref: (typeof proRefs)[number] | undefined,
          nd: { name: string; designation: string; employeeId: string },
          em: { email: string; mobileNo: string; place: string }
        ) => {
          if (!ref) return true;
          const rawNd = String((ref as any).nameDesignation ?? '').trim();
          const rawEm = String((ref as any).emailAndMobile ?? '').trim();
          if (!rawNd && !rawEm) return true;
          return !hasSubstantiveProRefData(nd, em);
        };

        const ref0Vacant = isProRefSlotVacant(ref0, teamLeadNameDesig, teamLeadEmailMobile);
        const ref1Vacant = isProRefSlotVacant(ref1, colleague1NameDesig, colleague1EmailMobile);
        const ref2Vacant = isProRefSlotVacant(ref2, colleague3NameDesig, colleague3EmailMobile);
        const ref4Vacant = isProRefSlotVacant(reportingManagerSource, reportingManagerNameDesig, reportingManagerEmailMobile);

        const emptyProRefForm = {
          name: '',
          employeeDocId: '',
          employeeId: '',
          mobileNo: '',
          email: '',
          designation: '',
          location: '',
        };

        /** When parsed data exists but name not in directory — fill from directory by employee id only. */
        const directoryRowForMerge = (personName: string) =>
          personName && PROFESSIONAL_REFERENCE_DIRECTORY[personName]
            ? PROFESSIONAL_REFERENCE_DIRECTORY[personName]
            : null;

        const rawWhereEmployed =
          (rest as any).whereWereYouEmploid || 'Registred Corporate Office(Pune)';
        const normalizedWhereEmployed =
          rawWhereEmployed === 'Registred Corporate Office' ||
          rawWhereEmployed === 'Registred Corporate Office(Pune)'
            ? 'Registred Corporate Office(Pune)'
            : rawWhereEmployed === 'Branch Office' ||
                rawWhereEmployed === 'Branch Office(Mumbai)'
              ? 'Branch Office(Mumbai)'
              : rawWhereEmployed;

        reset({
          ...rest,
          joiningPfIncluded: Number((rest as any).employerPF ?? (rest as any).pf ?? 0) > 0,
          currentPfIncluded: Number((rest as any).pf ?? 0) > 0,
          workSchedule: normalizedWorkSchedule,
          whereWereYouEmploid: normalizedWhereEmployed,
          relievingCtc: relievingCtc ? relievingCtc.toString() : '',
          benefits: employmentData.benefits?.join(', ') || '',
          increments,
          teamLead: ref0Vacant
            ? { ...emptyProRefForm }
            : (() => {
                const dn = pickDirectoryDropdownName(teamLeadNameDesig);
                const dir = dn ? directoryRowForMerge(dn) : null;
                return {
                  name: dn,
                  employeeDocId: '',
                  employeeId: teamLeadNameDesig.employeeId || dir?.employeeId || '',
                  mobileNo: teamLeadEmailMobile.mobileNo || dir?.mobileNo || '',
                  email: teamLeadEmailMobile.email || dir?.email || '',
                  designation: teamLeadNameDesig.designation || dir?.designation || '',
                  location: teamLeadEmailMobile.place || dir?.location || '',
                };
              })(),
          colleague1: ref1Vacant
            ? { ...emptyProRefForm }
            : (() => {
                const dn = pickDirectoryDropdownName(colleague1NameDesig);
                const dir = dn ? directoryRowForMerge(dn) : null;
                return {
                  name: dn,
                  employeeDocId: '',
                  employeeId: colleague1NameDesig.employeeId || dir?.employeeId || '',
                  mobileNo: colleague1EmailMobile.mobileNo || dir?.mobileNo || '',
                  email: colleague1EmailMobile.email || dir?.email || '',
                  designation: colleague1NameDesig.designation || dir?.designation || '',
                  location: colleague1EmailMobile.place || dir?.location || '',
                };
              })(),
          colleague3: ref2Vacant
            ? { ...emptyProRefForm }
            : (() => {
                const dn = pickDirectoryDropdownName(colleague3NameDesig);
                const dir = dn ? directoryRowForMerge(dn) : null;
                return {
                  name: dn,
                  employeeDocId: '',
                  employeeId: colleague3NameDesig.employeeId || dir?.employeeId || '',
                  mobileNo: colleague3EmailMobile.mobileNo || dir?.mobileNo || '',
                  email: colleague3EmailMobile.email || dir?.email || '',
                  designation: colleague3NameDesig.designation || dir?.designation || '',
                  location: colleague3EmailMobile.place || dir?.location || '',
                };
              })(),
          reportingManagerRef: ref4Vacant
            ? { ...emptyProRefForm }
            : (() => {
                const dn = pickDirectoryDropdownName(reportingManagerNameDesig);
                const dir = dn ? directoryRowForMerge(dn) : null;
                return {
                  name: dn,
                  employeeDocId: '',
                  employeeId: reportingManagerNameDesig.employeeId || dir?.employeeId || '',
                  mobileNo: reportingManagerEmailMobile.mobileNo || dir?.mobileNo || '',
                  email: reportingManagerEmailMobile.email || dir?.email || '',
                  designation: reportingManagerNameDesig.designation || dir?.designation || '',
                  location: reportingManagerEmailMobile.place || dir?.location || '',
                };
              })(),
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, reset, isEmployeeUser]);

  const onSubmit = async (data: EmploymentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      toast.loading('Updating employment...', { id: 'updateEmployment' });

      if ((data as any).isResignation) {
        const resignationDate = String((data as any).resignationDate || '').trim();
        const employeeStatus = String((data as any).employeeStatus || '').trim();
        const lastWorkingDate = String((data as any).lastWorkingDate || '').trim();
        const lastSalaryAmount = Number((data as any).lastSalaryAmount);
        const reasonForLeaving = String((data as any).reasonForLeaving || '').trim();

        if (
          !resignationDate ||
          !employeeStatus ||
          !lastWorkingDate ||
          !(lastSalaryAmount > 0) ||
          !reasonForLeaving
        ) {
          throw new Error(
            'When candidate is resigned, all Resignation Details fields are mandatory.'
          );
        }
      }

      // Check if employment ID is unique (admin only)
      if (!isEmployeeUser) {
        const normalizedEmploymentId = data.employmentId?.trim().toUpperCase();
        const normalizedOriginalEmploymentId = originalEmployment?.employmentId?.trim().toUpperCase();

        if (normalizedEmploymentId && normalizedEmploymentId !== normalizedOriginalEmploymentId) {
          const { isUnique, existingEmployment } = await checkEmploymentIdUnique(normalizedEmploymentId, id);
          if (!isUnique) {
            const conflict = existingEmployment as any;
            const conflictEmploymentId = conflict?.id;
            const conflictEmployeeId = conflict?.employeeId;
            const conflictEndDate = conflict?.endDate;
            const conflictIsResignation = conflict?.isResignation;
            const conflictIsResigned = conflict?.is_resigned;
            const conflictEmploymentStatus = conflict?.employmentStatus;

            throw new Error(
              `Employment ID is already used` +
                `${conflictEmployeeId ? ` (employeeId: ${conflictEmployeeId})` : ''}` +
                `${conflictEmploymentId ? ` (employment record: ${conflictEmploymentId})` : ''}` +
                `${conflictEndDate ? ` (endDate: ${String(conflictEndDate)})` : ''}` +
                `${conflictIsResignation !== null && conflictIsResignation !== undefined ? ` (isResignation: ${String(conflictIsResignation)})` : ''}` +
                `${conflictIsResigned !== null && conflictIsResigned !== undefined ? ` (is_resigned: ${String(conflictIsResigned)})` : ''}` +
                `${conflictEmploymentStatus ? ` (employmentStatus: ${String(conflictEmploymentStatus)})` : ''}`
            );
          }
        }
      }

      // Convert benefits string to array
      const benefitsArray = typeof data.benefits === 'string'
        ? data.benefits.split(',').map(b => b.trim()).filter(b => b !== '')
        : data.benefits;

      // Convert string numbers to actual numbers
      const formattedData: any = {
        ...data,
        employmentId: data.employmentId?.trim().toUpperCase(),
        salary: Number((data as any).salary ?? 0),
        // Last Drawn CTC defaults from Current CTC, but remains editable.
        lastSalaryAmount: Number((data as any).lastSalaryAmount ?? (data as any).salary ?? 0),
        joiningCtc: Number(data.joiningCtc ?? 0),
        inHandCtc: Number(data.inHandCtc ?? 0),
        relievingCtc: Number((data as any).relievingCtc ?? 0),
        salaryPerMonth: Number((data as any).salaryPerMonth ?? 0) || 0,
        basic: Number((data as any).basic ?? 0) || 0,
        da: Number((data as any).da ?? 0) || 0,
        hra: Number((data as any).hra ?? 0) || 0,
        // Store PF independently for Joining vs Current salary.
        // - `employerPF` => Joining PF
        // - `pf` => Current PF
        employerPF: (data as any).joiningPfIncluded
          ? (Math.min(
              (((Number((data as any).joiningFixedPay ?? 0) / 12) * 0.5)),
              15000
            ) * 0.12)
          : 0,
        pf: (data as any).currentPfIncluded
          ? (Math.min(
              (((Number((data as any).currentFixedPay ?? 0) / 12) * 0.5)),
              15000
            ) * 0.12)
          : 0,
        medicalAllowance: Number((data as any).medicalAllowance ?? 0) || 0,
        transport: Number((data as any).transport ?? 0) || 0,
        gratuity: Number((data as any).gratuity ?? 0) || 0,
        totalLeaves: data.totalLeaves !== undefined && data.totalLeaves !== null && data.totalLeaves !== ('' as any)
          ? Number(data.totalLeaves)
          : undefined,
        payableDays: data.payableDays !== undefined && data.payableDays !== null && data.payableDays !== ('' as any)
          ? Number(data.payableDays)
          : undefined,
        additionalAllowance: Number((data as any).additionalAllowance ?? 0) || 0,
        specialAllowance: Number((data as any).specialAllowance ?? 0) || 0,
        joiningFixedPay: Number((data as any).joiningFixedPay ?? 0) || 0,
        joiningVariablePay: Number((data as any).joiningVariablePay ?? 0) || 0,
        currentFixedPay: Number((data as any).currentFixedPay ?? 0) || 0,
        currentVariablePay: Number((data as any).currentVariablePay ?? 0) || 0,
        joiningOtherAllowance: Number((data as any).joiningOtherAllowance ?? 0) || 0,
        currentOtherAllowance: Number((data as any).currentOtherAllowance ?? 0) || 0,
        joiningOtherDeduction: Number((data as any).joiningOtherDeduction ?? 0) || 0,
        currentOtherDeduction: Number((data as any).currentOtherDeduction ?? 0) || 0,
        benefits: benefitsArray,

      };

      // Keep employment resignation fields consistent in Firestore.
      // If Is Resigned is ON -> mark this employment as resigned.
      // If OFF -> mark as working and clear resignation-only fields.
      if (data.isResignation) {
        formattedData.employmentStatus = 'resigned';
        formattedData.is_resigned = true;
        formattedData.employeeStatus = data.employeeStatus || 'exited';
      } else {
        formattedData.employmentStatus = 'working';
        formattedData.is_resigned = false;
        formattedData.resignationDate = '';
        formattedData.lastWorkingDate = '';
        formattedData.reasonForLeaving = '';
        delete (formattedData as any).employeeStatus;
      }

      // `pfIncluded` is UI-only toggle; store the numeric `pf` only.
      delete formattedData.pfIncluded;

      formattedData.professionalReferences = buildProfessionalReferencesArray({
        teamLead: data.teamLead,
        colleague1: data.colleague1,
        colleague3: data.colleague3,
        reportingManagerRef: data.reportingManagerRef,
      });

      // No longer capture lastSalaryDate from UI; remove it from payload to keep schema clean.
      delete formattedData.lastSalaryDate;
      delete formattedData.lastDrawnSalary;

      // Only include optional fields if they have values (not empty strings or undefined)
      if (data.endDate && data.endDate.trim()) {
        formattedData.endDate = data.endDate;
      }
      // employmentId already normalized above
      if (data.joiningDate && data.joiningDate.trim()) {
        formattedData.joiningDate = data.joiningDate;
      }
      if (data.salaryCreditDate && data.salaryCreditDate.trim()) {
        formattedData.salaryCreditDate = data.salaryCreditDate;
      }
      if (data.paymentMode && data.paymentMode.trim()) {
        formattedData.paymentMode = data.paymentMode;
      }
      if (data.jobTitle && data.jobTitle.trim()) {
        formattedData.jobTitle = data.jobTitle;
      }
      if (data.department && data.department.trim()) {
        formattedData.department = data.department;
      }
      if (data.location && data.location.trim()) {
        formattedData.location = data.location;
      }
      if (data.reportingManager && data.reportingManager.trim()) {
        formattedData.reportingManager = data.reportingManager;
      }
      if (data.workSchedule && data.workSchedule.trim()) {
        formattedData.workSchedule = data.workSchedule;
      }
      if (data.whereWereYouEmploid && data.whereWereYouEmploid.trim()) {
        formattedData.whereWereYouEmploid = data.whereWereYouEmploid;
      }

      if (data.reasonForLeaving && data.reasonForLeaving.trim()) {
        formattedData.reasonForLeaving = data.reasonForLeaving.trim();
      }

      // Handle increments array and keep latest values in scalar fields for backward compatibility
      if (data.increments && data.increments.length > 0) {
        formattedData.increments = data.increments.map((inc) => ({
          ...inc,
          incrementedCtc: inc.incrementedCtc != null ? Number(inc.incrementedCtc) : undefined,
          incrementHikePercentWrtJoiningCtc:
            (inc as any).incrementHikePercentWrtJoiningCtc != null
              ? Number((inc as any).incrementHikePercentWrtJoiningCtc)
              : undefined,
          incrementVariablePay:
            (inc as any).incrementVariablePay != null ? Number((inc as any).incrementVariablePay) : undefined,
          incrementFixedPay:
            (inc as any).incrementFixedPay != null ? Number((inc as any).incrementFixedPay) : undefined,
          incrementOtherAllowance:
            (inc as any).incrementOtherAllowance != null
              ? Number((inc as any).incrementOtherAllowance)
              : Number(getIncrementSalaryBreakdown(inc).incrementOtherAllowance) || 0,
          incrementOtherDeduction: Number((inc as any).incrementOtherDeduction ?? 0) || 0,
          incrementPfIncluded: Boolean((inc as any).incrementPfIncluded),
          newSalary: inc.newSalary != null ? Number(inc.newSalary) : undefined,
          incrementedInHandCtc:
            inc.incrementedInHandCtc != null ? Number(inc.incrementedInHandCtc) : undefined,
        }));

        const latest = data.increments[data.increments.length - 1];
        if (latest.incrementDate) {
          formattedData.incrementDate = latest.incrementDate;
        }
        if ((latest as any).incrementVariablePay != null) {
          formattedData.incrementVariablePay = Number((latest as any).incrementVariablePay);
        }
        if ((latest as any).incrementFixedPay != null) {
          formattedData.incrementFixedPay = Number((latest as any).incrementFixedPay);
        }
        formattedData.incrementOtherAllowance =
          (latest as any).incrementOtherAllowance != null
            ? Number((latest as any).incrementOtherAllowance)
            : Number(getIncrementSalaryBreakdown(latest).incrementOtherAllowance) || 0;
        formattedData.incrementPfIncluded = Boolean((latest as any).incrementPfIncluded);
        if (latest.newSalary != null) {
          formattedData.newSalary = Number(latest.newSalary);
        }
        if (latest.incrementedCtc != null) {
          formattedData.incrementedCtc = Number(latest.incrementedCtc);
        }
        if ((latest as any).incrementHikePercentWrtJoiningCtc != null) {
          formattedData.incrementHikePercentWrtJoiningCtc = Number((latest as any).incrementHikePercentWrtJoiningCtc);
        }
        if (latest.incrementedInHandCtc != null) {
          formattedData.incrementedInHandCtc = Number(latest.incrementedInHandCtc);
        }
      } else {
        // If all increments are removed, clear both array + legacy scalar fields
        // so view page does not render increment tables/sections.
        formattedData.increments = [];
        formattedData.incrementDate = '';
        formattedData.newSalary = 0;
        formattedData.incrementedCtc = 0;
        formattedData.incrementedInHandCtc = 0;
        formattedData.incrementHikePercentWrtJoiningCtc = 0;
        formattedData.incrementVariablePay = 0;
        formattedData.incrementFixedPay = 0;
        formattedData.incrementOtherAllowance = 0;
        formattedData.incrementPfIncluded = false;
      }

      if (isEmployeeUser) {
        await updateEmployeeSelfEmployment(currentUserData!.id, id, formattedData);
      } else {
        await updateEmployment(id, formattedData);
      }
      
      // Update localStorage with employment data including profile photo for Header component
      if (isEmployeeUser && formattedData.profilePhoto) {
        try {
          // Store employment data with profile photo for Header access
          localStorage.setItem('employeeEmploymentData', JSON.stringify(formattedData));
          
          // Also store in fullEmployeeData for Header component access
          const fullEmployeeData = localStorage.getItem('fullEmployeeData');
          if (fullEmployeeData) {
            const parsedData = JSON.parse(fullEmployeeData);
            parsedData.profilePhoto = formattedData.profilePhoto;
            localStorage.setItem('fullEmployeeData', JSON.stringify(parsedData));
          }
          
          // Dispatch custom event to notify Header component of profile photo update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('profileUpdated'));
          }
        } catch (error) {
          console.error('Error updating localStorage with employment data:', error);
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: queryKeys.employments.detail(id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.employments.lists() });
      const employeeIdForCache = String(formattedData.employeeId || data.employeeId || '').trim();
      if (employeeIdForCache) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.employments.byEmployee(employeeIdForCache),
        });
      }
      toast.success('Employment updated successfully!', { id: 'updateEmployment' });
      router.push(`/employments/${id}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employment';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'updateEmployment' });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout
        breadcrumbItems={
          isEmployeeUser
            ? [{ label: 'Dashboard', href: '/employee-dashboard' }, { label: 'Employment', isCurrent: true }]
            : [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees', href: '/employees' }, { label: 'Loading...', isCurrent: true }]
        }
      >
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Skeleton for TableHeader */}
          <div className="space-y-6">
            {/* Title and Action Buttons Skeleton */}
            <div className="flex justify-between items-center px-6 py-6">
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
          </div>

          {/* Form Skeleton */}
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, fieldIndex) => (
                      <div key={fieldIndex} className="space-y-2">
                        <div className="bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="bg-gray-200 h-10 w-full rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      breadcrumbItems={
        isEmployeeUser
          ? [
            { label: 'Dashboard', href: '/employee-dashboard' },
            { label: 'Employment', href: `/employments/${id}` },
            { label: 'Edit Employment', isCurrent: true },
          ]
          : [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Employees', href: '/employees' },
            {
              label: breadcrumbEmployeeName || 'Employee',
              ...(breadcrumbEmployeeId ? { href: `/employees/${breadcrumbEmployeeId}` } : {}),
            },
            { label: 'Employment', href: `/employments/${id}` },
            { label: 'Edit Employment', isCurrent: true },
          ]
      }
    >
      <Toaster position="top-center" />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Edit Employment"
          total={0}
          active={0}
          inactive={0}
          searchValue=""
          onSearchChange={() => { }}
          searchPlaceholder=""
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 py-6"
          customReloadButton={
            <button
              type="button"
              onClick={() => router.refresh()}
              className="p-1 rounded-full border border-gray-300 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Reload"
            >
              <FaSyncAlt size={14} />
            </button>
          }
          backButton={{
            href: `/employments/${id}`,
            label: 'Back'
          }}
          actionButtons={[
            {
              label: 'Save',
              icon: <FiCheckCircle />,
              variant: 'success',
              pill: true,
              onClick: () => handleSubmit(onSubmit)()
            }
          ]}
        />

        {error && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 pb-6">
            <input
              type="hidden"
              {...register('employeeId', { required: 'Employee is required' })}
              value={watch('employeeId') || originalEmployment?.employeeId || ''}
            />

            {/* Employment Information */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-blue-500 pl-2">Employment Information</h2>
                <button
                  type="button"
                  onClick={() => handleCleanSection('employmentInfo')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                >
                  <FaBroom className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment ID
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      {...register('employmentId', {
                        required: 'Employment ID is required',
                        pattern: {
                          value: /^ADV\d+$/i,
                          message: 'Employment ID must be in the format ADV<number>',
                        },
                        validate: (value) => {
                          const num = Number(String(value).replace(/^ADV/i, ''));
                          if (!Number.isFinite(num)) return 'Employment ID number is invalid';
                          if (num < EMPLOYMENT_ID_NUMBER_MIN || num > EMPLOYMENT_ID_NUMBER_MAX)
                            return `Employment ID number must be between ${EMPLOYMENT_ID_NUMBER_MIN} and ${EMPLOYMENT_ID_NUMBER_MAX}`;
                          return true;
                        },
                      })}
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="E.g., ADV250 (1–999)"
                    />
                    <button
                      type="button"
                      onClick={generateRandomEmploymentId}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition whitespace-nowrap"
                    >
                      <FiRefreshCw className="w-4 h-4" />
                      Random
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Profile Photo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProfilePhotoUpload(file);
                      }}
                    />
                    {watch('profilePhoto') ? (
                      <img
                        src={String(watch('profilePhoto') || '')}
                        alt="Profile preview"
                        className="h-14 w-14 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                    ) : null}
                  </div>
                </div>

                {/* Joining CTC and In-hand CTC removed from this section */}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-purple-500 pl-2">Job Details</h2>
                <button
                  type="button"
                  onClick={() => handleCleanSection('jobDetails')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                >
                  <FaBroom className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Department
  </label>

  <select
    {...register('department', {
      onChange: () => setValue('jobTitle', '', { shouldDirty: true }),
    })}

    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
  >
    <option value="">Select Department</option>
    <option value="Engineering">Engineering</option>
    <option value="Development">Development</option>
    <option value="Support">Support</option>
    <option value="Human Resources">Human Resources</option>
    <option value="Finance">Finance</option>
    <option value="Sales">Sales</option>
    <option value="Marketing">Marketing</option>
    <option value="Operations">Operations</option>
    <option value="Customer Support">Customer Support</option>
    <option value="IT">IT</option>
    <option value="Admin">Admin</option>
    <option value="Legal">Legal</option>
  </select>
</div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    {...register('location')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select location</option>
                    {derivedLocation ? <option value={derivedLocation}>{derivedLocation}</option> : null}
                    {locationValue && locationValue !== derivedLocation ? (
                      <option value={locationValue}>{locationValue}</option>
                    ) : null}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" >
                    Work Mode
                  </label>
                  <select
                    {...register('workSchedule')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Where Were You Employed?
                  </label>
                  <select
                    {...register('whereWereYouEmploid')}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Registred Corporate Office(Pune)">Registred Corporate Office(Pune)</option>
                    <option value="Branch Office(Mumbai)">Branch Office(Mumbai)</option>
                  </select>
                </div>

                
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-indigo-500 pl-2">
                  Professional Reference
                </h2>
                <button
                  type="button"
                  onClick={() => handleCleanSection('professionalReference')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                >
                  <FaBroom className="w-4 h-4" />
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Team Leader */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Team Leader
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('teamLead.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('teamLead', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Id
                        </label>
                        <input
                          {...register('teamLead.employeeId' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile No
                        </label>
                        <input
                          {...register('teamLead.mobileNo' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...register('teamLead.email' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          {...register('teamLead.designation' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Place
                        </label>
                        <input
                          {...register('teamLead.location' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>
                      </div>
                    </div>
                  </div>

                  {/* Colleague 1 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Colleague 1
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('colleague1.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('colleague1', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Id
                        </label>
                        <input
                          {...register('colleague1.employeeId' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile No
                        </label>
                        <input
                          {...register('colleague1.mobileNo' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...register('colleague1.email' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          {...register('colleague1.designation' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Place
                        </label>
                        <input
                          {...register('colleague1.location' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>
                      </div>
                    </div>
                  </div>

                  {/* Colleague 2 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Colleague 2
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('colleague3.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('colleague3', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Id
                        </label>
                        <input
                          {...register('colleague3.employeeId' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile No
                        </label>
                        <input
                          {...register('colleague3.mobileNo' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...register('colleague3.email' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          {...register('colleague3.designation' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Place
                        </label>
                        <input
                          {...register('colleague3.location' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>
                      </div>
                    </div>
                  </div>

                  
                  {/* Reporting Manager */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 mb-3">
                      Reporting Manager
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <select
                          {...register('reportingManagerRef.name' as const, {
                            onChange: (e) => {
                              autoFillProfessionalReferenceFromDirectory('reportingManagerRef', e.target.value);
                            },
                          })}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        >
                          <option value="">Select</option>
                          {PROFESSIONAL_REFERENCE_NAME_OPTIONS.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={showProfessionalReferenceExtraFields ? 'contents' : 'hidden'}>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Id
                        </label>
                        <input
                          {...register('reportingManagerRef.employeeId' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile No
                        </label>
                        <input
                          {...register('reportingManagerRef.mobileNo' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          {...register('reportingManagerRef.email' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation
                        </label>
                        <input
                          {...register('reportingManagerRef.designation' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Place
                        </label>
                        <input
                          {...register('reportingManagerRef.location' as const)}
                          readOnly
                          className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        />
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-purple-500 pl-2">Resignation Details</h2>
                <button
                  type="button"
                  onClick={() => handleCleanSection('resignation')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                >
                  <FaBroom className="w-4 h-4" />
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Is Resigned?
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('isResignation', !isResignation)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                        ${isResignation ? 'bg-green-500' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                          ${isResignation ? 'translate-x-5' : 'translate-x-1'}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {isResignation ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>

                {isResignation && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                       <span className="text-red-500 mr-1">*</span> Resignation Date
                      </label>
                      <Controller
                        name="resignationDate"
                        control={control}
                        render={({ field }) => (
                          <CustomDateInput
                            name="resignationDate"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select resignation date"
                            className="px-3 py-2"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Employee Status
                      </label>
                      <select
                        {...register('employeeStatus')}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      >
                        <option value="">Select</option>
                        <option value="terminated">Terminated</option>
                        <option value="exited">Exited</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Last Working Date
                      </label>
                      <Controller
                        name="lastWorkingDate"
                        control={control}
                        render={({ field }) => (
                          <CustomDateInput
                            name="lastWorkingDate"
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select last working date"
                            className="px-3 py-2"
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Last Drawn CTC
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('lastSalaryAmount', {
                          min: { value: 0, message: 'CTC must be positive' },
                          valueAsNumber: true,
                        })}
                        value={Number(currentLastDrawnCtcValue ?? 0) || 0}
                        onChange={(e) => {
                          setValue('lastSalaryAmount', Number(e.target.value || 0), {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Auto from Current CTC"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="text-red-500 mr-1">*</span> Reason for Exit
                      </label>
                      <input
                        type="text"
                        {...register('reasonForLeaving')}
                        placeholder="Enter reason for exit"
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      />
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Joining Salary Information (CTC split) */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 border-l-4 border-cyan-500 pl-2">
                  Joining Salary Information
                </h2>
                <div className="flex items-center gap-2">
                  <Controller
                    name="joiningPfIncluded"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium border ${
                          field.value
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <span className="mr-2">Is PF</span>
                        <span
                          className={`h-4 w-8 rounded-full flex items-center ${
                            field.value ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          <span
                            className={`h-3 w-3 bg-white rounded-full transform transition-transform ${
                              field.value ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span className="ml-2 text-[11px]">{field.value ? 'ON' : 'OFF'}</span>
                      </button>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleCleanSection('joiningSalary')}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                  >
                    <FaBroom className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <CustomDateInput
                    name="joiningDateInline"
                    value={watch('joiningDate') || ''}
                    onChange={(value) => setValue('joiningDate', value as any, { shouldValidate: true, shouldDirty: true })}
                    placeholder="Select joining date"
                    className="px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Joining Designation
                  </label>
                  <input
                    type="text"
                    {...register('joiningDesignation', {
                      required: 'Joining Designation is required',
                    })}
                    placeholder="Enter joining designation"
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Joining CTC (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Joining CTC"
                    {...register('joiningCtc', {
                      required: 'Joining CTC is required',
                      min: { value: 0, message: 'Joining CTC must be positive' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.joiningCtc && (
                    <p className="mt-1 text-sm text-red-600">{errors.joiningCtc.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Joining Variable (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Joining Variable"
                    {...register('joiningVariablePay', {
                      required: 'Joining Variable is required',
                      min: { value: 0, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Joining Fixed (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Joining Fixed"
                    {...register('joiningFixedPay', {
                      required: 'Joining Fixed is required',
                      min: { value: 0, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                    value={Number.isFinite(computedJoiningFixedPay) ? computedJoiningFixedPay : 0}
                    readOnly
                    disabled
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Fixed (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Monthly Fixed"
                    value={Number.isFinite(joiningMonthlyFixed) ? joiningMonthlyFixed.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Basic"
                    value={Number.isFinite(joiningBasic) ? joiningBasic.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HRA (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="HRA"
                    value={Number.isFinite(joiningHra) ? joiningHra.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conveyance Allowance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Conveyance Allowance"
                    value={Number.isFinite(joiningConveyance) ? joiningConveyance.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Other Allowance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Other Allowance"
                    {...register('joiningOtherAllowance', {
                      required: 'Joining Other Allowance is required',
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus-border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gross Salary (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Gross Salary"
                    value={Number.isFinite(joiningGrossSalary) ? joiningGrossSalary.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus-border-blue-500 text-black bg-gray-50"
                  />
                </div>

                {joiningPfIncluded && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PF (₹)</label>
                    <input
                      type="number"
                      value={Number.isFinite(joiningPf) ? joiningPf.toFixed(2) : ''}
                      readOnly
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                  </div>
                )}

                <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Deductions</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PT (₹)</label>
                  <input
                    type="number"
                    value={EMPLOYMENT_PT_DEDUCT.toFixed(2)}
                    readOnly
                    disabled
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('joiningOtherDeduction', {
                      min: { value: 0, message: 'Other deduction cannot be negative' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.joiningOtherDeduction && (
                    <p className="mt-1 text-sm text-red-600">{errors.joiningOtherDeduction.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deduction (₹)</label>
                  <input
                    type="number"
                    value={Number.isFinite(joiningTotalDeduction) ? joiningTotalDeduction.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (₹)</label>
                  <input
                    type="number"
                    value={Number.isFinite(joiningNetSalary) ? joiningNetSalary.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Career Progression/Increment Details (CTP) */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 border-l-4 border-purple-500 pl-2">
                  Increment Details
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 p-1.5 rounded-md border border-purple-200 bg-purple-50">
                    <select
                      value={aiIncrementCount}
                      onChange={(e) => setAiIncrementCount(Number(e.target.value) || 1)}
                      className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {Array.from({ length: 7 }, (_, i) => i + 1).map((count) => (
                        <option key={count} value={count}>
                          {count} Increment{count > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleCreateIncrementsWithAi}
                      className="px-3 py-1 text-xs bg-blue-600 text-white border border-blue-700 rounded-md hover:bg-blue-700 inline-flex items-center gap-1.5"
                    >
                      <FaHandSparkles className="w-4 h-4" />
                      Create with AI
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIncrement}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 inline-flex items-center gap-1"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Increment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCleanSection('increments')}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                  >
                    <FaBroom className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>

              {!showIncrementDetails && (
                <p className="text-sm text-gray-500 mb-2">
                  Click &quot;Add Increment&quot; to show increment details.
                </p>
              )}

              {showIncrementDetails && incrementFields.length === 0 && (
                <p className="text-sm text-gray-500 mb-2">
                  No increments added yet. Click &quot;Add Increment&quot; to add the first increment.
                </p>
              )}

              {showIncrementDetails && <div className="space-y-4">
                {incrementFields.map((field, index) => {
                  const currentIncrement = watch(`increments.${index}` as const);
                  const incrementBreakdown = getIncrementSalaryBreakdown(currentIncrement);
                  const rowCtc = Number((currentIncrement as any)?.incrementedCtc ?? 0) || 0;
                  const rowVariable = Number((currentIncrement as any)?.incrementVariablePay ?? 0) || 0;
                  const computedIncrementFixed = Number((rowCtc - rowVariable).toFixed(2));
                  return (
                  <div
                    key={field.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">
                        Increment {index + 1}
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setValue(
                              `increments.${index}.incrementPfIncluded` as any,
                              !incrementBreakdown.incrementPfIncluded,
                              { shouldDirty: true }
                            );
                          }}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                            incrementBreakdown.incrementPfIncluded
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <span className="mr-2">Is PF</span>
                          <span
                            className={`h-4 w-8 rounded-full flex items-center ${
                              incrementBreakdown.incrementPfIncluded ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          >
                            <span
                              className={`h-3 w-3 bg-white rounded-full transform transition-transform ${
                                incrementBreakdown.incrementPfIncluded ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </span>
                          <span className="ml-2 text-[11px]">{incrementBreakdown.incrementPfIncluded ? 'ON' : 'OFF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncrementDeleteIndex(index)}
                          className="border border-gray-300 rounded-md p-2 w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 hover:text-red-900"
                          title={`Delete Increment ${index + 1}`}
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Increment Date
                        </label>
                        <Controller
                          name={`increments.${index}.incrementDate` as const}
                          control={control}
                          rules={{ required: 'Increment Date is required' }}
                          render={({ field }) => (
                            <CustomDateInput
                              name={`increments.${index}.incrementDate`}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select increment date"
                              className="px-3 py-2"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span>
                          {index === 0
                            ? 'Hike % WRT Joining CTC'
                            : index === 1
                              ? 'Hike % WRT Increment 1'
                              : 'Hike % WRT Previous Increment'}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`increments.${index}.incrementHikePercentWrtJoiningCtc` as any, {
                            required: 'Hike % is required',
                            min: { value: 0, message: 'Hike % must be positive' },
                            valueAsNumber: true,
                            onChange: (e) => {
                              const previousCtc =
                                index > 0
                                  ? Number((watch(`increments.${index - 1}.incrementedCtc` as any) as any) ?? 0) || 0
                                  : Number(joiningCtcValue ?? 0) || 0;
                              const hike = Number(e?.target?.value ?? 0);
                              if (!Number.isFinite(hike) || previousCtc <= 0) return;
                              const nextIncrementCtc = previousCtc * (1 + hike / 100);
                              setValue(
                                `increments.${index}.incrementedCtc` as any,
                                Number(nextIncrementCtc.toFixed(2)),
                                { shouldValidate: true, shouldDirty: true }
                              );
                            },
                          })}
                          placeholder="Enter hike %"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> Increment CTC (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`increments.${index}.incrementedCtc` as const, {
                            required: 'Increment CTC is required',
                            min: { value: 0, message: 'Increment CTC must be positive' },
                            valueAsNumber: true,
                            onChange: (e) => {
                              const ctc = Number(e?.target?.value ?? 0) || 0;
                              const variable = getDefaultIncrementVariablePay(ctc);
                              setValue(`increments.${index}.incrementVariablePay` as any, Number(variable.toFixed(2)), {
                                shouldDirty: true,
                                shouldValidate: false,
                              });
                              const previousCtc =
                                index > 0
                                  ? Number(watch(`increments.${index - 1}.incrementedCtc` as any) ?? 0) || 0
                                  : Number(joiningCtcValue ?? 0) || 0;
                              if (previousCtc > 0) {
                                const hikePercent = ((ctc - previousCtc) / previousCtc) * 100;
                                setValue(
                                  `increments.${index}.incrementHikePercentWrtJoiningCtc` as any,
                                  Number(hikePercent.toFixed(2)),
                                  { shouldDirty: true, shouldValidate: false }
                                );
                              }
                            },
                          })}
                          placeholder="Increment CTC"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> Increment Variable (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`increments.${index}.incrementVariablePay` as any, {
                            required: 'Increment Variable is required',
                            min: { value: 0, message: 'Amount must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Increment Variable"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> Increment Fixed (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`increments.${index}.incrementFixedPay` as any, {
                            required: 'Increment Fixed is required',
                            min: { value: 0, message: 'Amount must be positive' },
                            valueAsNumber: true,
                          })}
                          placeholder="Increment Fixed"
                        value={Number.isFinite(computedIncrementFixed) ? computedIncrementFixed : 0}
                        readOnly
                        disabled
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Increment Monthly Fixed (₹)
                        </label>
                        <input
                          type="number"
                          value={Number.isFinite(incrementBreakdown.incrementMonthlyFixed) ? incrementBreakdown.incrementMonthlyFixed.toFixed(2) : ''}
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Basic (₹)
                        </label>
                        <input
                          type="number"
                          value={Number.isFinite(incrementBreakdown.incrementBasic) ? incrementBreakdown.incrementBasic.toFixed(2) : ''}
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          HRA (₹)
                        </label>
                        <input
                          type="number"
                          value={Number.isFinite(incrementBreakdown.incrementHra) ? incrementBreakdown.incrementHra.toFixed(2) : ''}
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Conveyance Allowance (₹)
                        </label>
                        <input
                          type="number"
                          value={Number.isFinite(incrementBreakdown.incrementConveyance) ? incrementBreakdown.incrementConveyance.toFixed(2) : ''}
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> Other Allowance (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          {...register(`increments.${index}.incrementOtherAllowance` as any, {
                            required: 'Increment Other Allowance is required',
                            valueAsNumber: true,
                          })}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gross Salary (₹)
                        </label>
                        <input
                          type="number"
                          value={Number.isFinite(incrementBreakdown.incrementGross) ? incrementBreakdown.incrementGross.toFixed(2) : ''}
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {incrementBreakdown.incrementPfIncluded && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">PF (₹)</label>
                          <input
                            type="number"
                            value={Number.isFinite(incrementBreakdown.incrementPf) ? incrementBreakdown.incrementPf.toFixed(2) : ''}
                            readOnly
                            className="w-full p-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}

                      <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Deductions</h4>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PT (₹)</label>
                        <input
                          type="number"
                          value={EMPLOYMENT_PT_DEDUCT.toFixed(2)}
                          readOnly
                          disabled
                          className="w-full p-2 border rounded-md bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`increments.${index}.incrementOtherDeduction` as any, {
                            min: { value: 0, message: 'Other deduction cannot be negative' },
                            valueAsNumber: true,
                          })}
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Deduction (₹)</label>
                        <input
                          type="number"
                          value={
                            Number.isFinite(incrementBreakdown.incrementTotalDeduction)
                              ? incrementBreakdown.incrementTotalDeduction.toFixed(2)
                              : ''
                          }
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (₹)</label>
                        <input
                          type="number"
                          value={
                            Number.isFinite(incrementBreakdown.incrementNetSalary)
                              ? incrementBreakdown.incrementNetSalary.toFixed(2)
                              : ''
                          }
                          readOnly
                          className="w-full p-2 border rounded-md bg-gray-50"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> Old Designation
                        </label>
                        <input
                          type="text"
                          {...register(`increments.${index}.previousDesignation` as const, {
                            required: 'Old Designation is required',
                          })}
                          placeholder="E.g., Software Developer"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          <span className="text-red-500 mr-1">*</span> New Designation
                        </label>
                        <input
                          type="text"
                          {...register(`increments.${index}.newDesignation` as const, {
                            required: 'New Designation is required',
                          })}
                          placeholder="E.g., Senior Software Developer"
                          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )})}
              </div>}
            </div>

            {/* Current Salary Information (CTC split) */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 border-l-4 border-green-500 pl-2">
                  Current Salary Information
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const latestIncrement =
                        incrementFields.length > 0
                          ? (watch(`increments.${incrementFields.length - 1}` as any) as any)
                          : null;
                      if (!latestIncrement) return;
                      setValue('salary', Number(latestIncrement.incrementedCtc ?? 0) || 0, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                      setValue(
                        'currentVariablePay',
                        Number(latestIncrement.incrementVariablePay ?? 0) || 0,
                        { shouldValidate: true, shouldDirty: true }
                      );
                      setValue(
                        'currentOtherAllowance',
                        Number(latestIncrement.incrementOtherAllowance ?? 0) || 0,
                        { shouldValidate: false, shouldDirty: true }
                      );
                      setValue('currentPfIncluded', Boolean(latestIncrement.incrementPfIncluded), {
                        shouldValidate: false,
                        shouldDirty: true,
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Last Increment
                  </button>
                  <Controller
                    name="currentPfIncluded"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-medium border ${
                          field.value
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }`}
                      >
                        <span className="mr-2">Is PF</span>
                        <span
                          className={`h-4 w-8 rounded-full flex items-center ${
                            field.value ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          <span
                            className={`h-3 w-3 bg-white rounded-full transform transition-transform ${
                              field.value ? 'translate-x-4' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span className="ml-2 text-[11px]">{field.value ? 'ON' : 'OFF'}</span>
                      </button>
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleCleanSection('currentSalary')}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                  >
                    <FaBroom className="w-4 h-4" />
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Designation
                  </label>
                  <input
                    type="text"
                    placeholder="Enter designation"
                    {...register('jobTitle', {
                      required: 'Designation is required',
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.jobTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.jobTitle.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Current CTC (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Current CTC"
                    {...register('salary', {
                      required: 'Current CTC is required',
                      min: { value: 0, message: 'Current CTC must be positive' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.salary && (
                    <p className="mt-1 text-sm text-red-600">{errors.salary.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Variable (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Variable"
                    {...register('currentVariablePay', {
                      required: 'Current Variable is required',
                      min: { value: 0, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Fixed (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Fixed"
                    {...register('currentFixedPay', {
                      required: 'Current Fixed is required',
                      min: { value: 0, message: 'Amount must be positive' },
                      valueAsNumber: true,
                    })}
                    value={Number.isFinite(computedCurrentFixedPay) ? computedCurrentFixedPay : 0}
                    readOnly
                    disabled
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Fixed (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Monthly Fixed"
                    value={Number.isFinite(currentMonthlyFixed) ? currentMonthlyFixed.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Basic (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Basic"
                    value={Number.isFinite(currentBasic) ? currentBasic.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HRA (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="HRA"
                    value={Number.isFinite(currentHra) ? currentHra.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conveyance Allowance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Conveyance Allowance"
                    value={Number.isFinite(currentConveyance) ? currentConveyance.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Other Allowance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Other Allowance"
                    {...register('currentOtherAllowance', {
                      required: 'Current Other Allowance is required',
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gross Salary (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Gross Salary"
                    value={Number.isFinite(currentGrossSalary) ? currentGrossSalary.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                  />
                </div>

                {currentPfIncluded && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PF (₹)</label>
                    <input
                      type="number"
                      value={Number.isFinite(currentPf) ? currentPf.toFixed(2) : ''}
                      readOnly
                      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-gray-50"
                    />
                  </div>
                )}

                <div className="md:col-span-4 mt-2 pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Deductions</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PT (₹)</label>
                  <input
                    type="number"
                    value={EMPLOYMENT_PT_DEDUCT.toFixed(2)}
                    readOnly
                    disabled
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Deduction (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('currentOtherDeduction', {
                      min: { value: 0, message: 'Other deduction cannot be negative' },
                      valueAsNumber: true,
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.currentOtherDeduction && (
                    <p className="mt-1 text-sm text-red-600">{errors.currentOtherDeduction.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Deduction (₹)</label>
                  <input
                    type="number"
                    value={Number.isFinite(currentTotalDeduction) ? currentTotalDeduction.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (₹)</label>
                  <input
                    type="number"
                    value={Number.isFinite(currentNetSalary) ? currentNetSalary.toFixed(2) : ''}
                    readOnly
                    className="w-full p-2 border rounded-md text-black bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="bg-white p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-800 border-l-4 border-blue-500 pl-2">Salary Account and Bank Details</h2>
                <button
                  type="button"
                  onClick={() => handleCleanSection('bankDetails')}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm rounded-full border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50"
                >
                  <FaBroom className="w-4 h-4" />
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter bank name"
                    {...register('bankName', {
                      required: 'Bank name is required'
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> Account No.
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    {...register('accountNo', {
                      required: 'Account number is required',
                      pattern: {
                        value: /^\d{9,18}$/,
                        message: 'Please enter a valid account number'
                      }
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                  {errors.accountNo && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNo.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="text-red-500 mr-1">*</span> IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., HDFC0000001 (11 characters)"
                    maxLength={11}
                    {...register('ifscCode', {
                      required: 'IFSC code is required',
                      setValueAs: (value) => String(value || '').trim().toUpperCase(),
                      pattern: {
                        value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                        message: 'Invalid IFSC format. Must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0000001)'
                      }
                    })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black uppercase"
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.ifscCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.ifscCode.message}</p>
                  )}
                  {/* <p className="mt-1 text-xs text-gray-500">
                    Format: BANK0BRANCH (e.g., HDFC0000001, SBIN0001234).
                    <a
                      href="https://www.rbi.org.in/Scripts/bs_viewcontent.aspx?Id=2009"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      Find IFSC Code
                    </a>
                  </p> */}
                </div>

              </div>
            </div>


            {/* Form Buttons */}
            <div className="flex justify-between items-center gap-4 px-6 py-3">
              <Link
                href={`/employments/${id}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FiX size={16} />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                <FiCheckCircle />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>

        {incrementDeleteIndex !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={closeIncrementDeleteModal}
          >
            <div
              className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeIncrementDeleteModal}
                aria-label="Close delete popup"
                className="absolute top-4 right-4 h-8 w-8 rounded-full border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center"
              >
                <FiX className="w-4 h-4" />
              </button>

              <h2 className="text-base font-semibold text-gray-900">
                Delete Increment {incrementDeleteIndex + 1}
              </h2>
              <p className="mt-3 text-sm text-gray-700">
                Are you sure you want to delete this increment?
              </p>
              <p className="mt-2 text-sm text-gray-700">
                This action cannot be undone.
              </p>

              <div className="mt-6 flex items-end justify-between gap-3">
                <button
                  type="button"
                  onClick={closeIncrementDeleteModal}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 inline-flex items-center gap-2"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmIncrementDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 