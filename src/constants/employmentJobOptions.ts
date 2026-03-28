/**
 * Shared department → designation options for Add / Edit employment flows.
 * Keep in sync with any document generators that duplicate these lists.
 */
export const EMPLOYMENT_DESIGNATION_BY_DEPARTMENT: Record<string, string[]> = {
  Engineering: ['Software Developer', 'Senior Software Developer', 'Lead Developer'],
  Development: [
    'Junior Developer',
    'Software Developer',
    'Senior Software Developer',
    'Development Lead',
    'Engineering Manager',
  ],
  Support: [
    'Support Associate',
    'Senior Support Associate',
    'Technical Support Engineer',
    'Support Lead',
    'Customer Support Manager',
  ],
  /** Add Employment uses label "HR" */
  HR: ['HR Executive', 'HR Manager', 'Talent Acquisition Specialist'],
  /** Edit Employment uses label "Human Resources" */
  'Human Resources': ['HR Executive', 'HR Manager', 'Talent Acquisition Specialist'],
  Finance: ['Accountant', 'Senior Accountant', 'Finance Manager'],
  Sales: ['Sales Executive', 'Senior Sales Executive', 'Sales Manager'],
  Marketing: ['Marketing Executive', 'Senior Marketing Executive', 'Marketing Manager'],
  Operations: ['Operations Executive', 'Senior Operations Executive', 'Operations Manager'],
  'Customer Support': ['Support Executive', 'Senior Support Executive', 'Support Manager'],
  IT: ['System Administrator', 'IT Support Engineer', 'IT Manager'],
  Admin: ['Admin Executive', 'Admin Manager', 'Office Administrator'],
  Legal: ['Legal Associate', 'Senior Legal Associate', 'Legal Manager'],
};

/** Employment ID suffix after `ADV`: allowed range for Add / Edit employment */
export const EMPLOYMENT_ID_NUMBER_MIN = 1;
export const EMPLOYMENT_ID_NUMBER_MAX = 999;

/** Uniform random integer in [EMPLOYMENT_ID_NUMBER_MIN, EMPLOYMENT_ID_NUMBER_MAX] */
export function randomEmploymentIdSuffix(): number {
  return (
    Math.floor(Math.random() * (EMPLOYMENT_ID_NUMBER_MAX - EMPLOYMENT_ID_NUMBER_MIN + 1)) +
    EMPLOYMENT_ID_NUMBER_MIN
  );
}
