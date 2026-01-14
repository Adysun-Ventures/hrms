import { useEffect } from 'react';
import { UseFormSetValue } from 'react-hook-form';

/**
 * Hook to auto-calculate salary breakdown components when annual salary changes
 * 
 * Calculation Logic:
 * 1. Monthly Salary = Annual Salary ÷ 12
 * 2. Basic = 40% of Monthly Salary
 * 3. HRA (House Rent Allowance) = 50% of Basic
 * 4. DA (Dearness Allowance) = 10% of Basic
 * 5. Medical Allowance = Fixed ₹1,250
 * 6. Transport = Fixed ₹1,600
 * 7. PF (Provident Fund) = 12% of Basic (only if includePF is true)
 * 8. Special Allowance = Monthly Salary - (Basic + HRA + DA + Medical + Transport + PF)
 *    This is the balancing figure to ensure total equals monthly salary
 * 
 * @param salary - Annual salary value (watched from form)
 * @param includePF - Whether to include PF in calculations
 * @param setValue - React Hook Form's setValue function
 */
export const useSalaryCalculation = ({
  salary,
  includePF,
  setValue,
}: {
  salary: number | undefined;
  includePF: boolean;
  setValue: UseFormSetValue<any>;
}) => {
  useEffect(() => {
    if (salary && salary > 0) {
      const annualSalary = Number(salary);

      // Calculate monthly salary
      const monthlySalary = Math.round(annualSalary / 12);
      setValue('salaryPerMonth', monthlySalary, { shouldValidate: false, shouldDirty: false });

      // Calculate Basic (40% of monthly salary)
      const basic = Math.round(monthlySalary * 0.40);
      setValue('basic', basic, { shouldValidate: false, shouldDirty: false });

      // Calculate HRA (50% of Basic)
      const hra = Math.round(basic * 0.50);
      setValue('hra', hra, { shouldValidate: false, shouldDirty: false });

      // Calculate DA (10% of Basic)
      const da = Math.round(basic * 0.10);
      setValue('da', da, { shouldValidate: false, shouldDirty: false });

      // Fixed allowances as per Indian standards
      const medicalAllowance = 1250;
      const transport = 1600;
      setValue('medicalAllowance', medicalAllowance, { shouldValidate: false, shouldDirty: false });
      setValue('transport', transport, { shouldValidate: false, shouldDirty: false });

      // Calculate PF (12% of Basic - employer contribution) - only if includePF is true
      if (includePF) {
        const pf = Math.round(basic * 0.12);
        setValue('pf', pf, { shouldValidate: false, shouldDirty: false });
      } else {
        setValue('pf', 0, { shouldValidate: false, shouldDirty: false });
      }

      // Calculate Special Allowance (balancing figure)
      // This ensures: Basic + HRA + DA + Medical + Transport + PF + Special = Monthly Salary
      const calculatedComponents = includePF
        ? basic + hra + da + medicalAllowance + transport
        : basic + hra + da + medicalAllowance + transport - Math.round(basic * 0.12);
      const specialAllowance = Math.max(0, monthlySalary - calculatedComponents);
      setValue('specialAllowance', specialAllowance, { shouldValidate: false, shouldDirty: false });
    }
  }, [salary, setValue, includePF]);
};

