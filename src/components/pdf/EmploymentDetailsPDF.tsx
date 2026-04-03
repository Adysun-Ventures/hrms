import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { Employment, Employee, ProfessionalReference, EmploymentIncrement } from '@/types';

// Ensure common glyphs (including Indian Rupee ₹) render correctly.
// This mirrors the approach used in your other PDF components.
Font.register({
  family: 'Calibri',
  fonts: [
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
    },
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://db.onlinewebfonts.com/t/267bd6adfcf4ef37a3fb97092614dda1.ttf',
      fontStyle: 'italic',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Calibri',
    fontSize: 10,
    lineHeight: 1.35,
  },

  // 1) Outer padding (space from page edges)
  outerPadding: {
    padding: 24,
  },

  // 2) Bordered container
  borderedContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB', // Tailwind gray-200
    borderRadius: 6,
    padding: 0,
  },

  // 3) Inner padding inside the border
  innerPadding: {
    padding: 16,
  },

  title: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: '#111827' },

  heading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },

  section: {
    marginBottom: 16,
  },

  sectionTight: {
    marginBottom: 12,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 8,
  },

  cardGrid4: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  cardItem: {
    width: '25%',
    paddingRight: 8,
    marginBottom: 10,
  },

  valueText: {
    fontSize: 11,
    fontWeight: 600,
    color: '#111827',
  },

  labelText: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 1,
  },

  table: {
    borderWidth: 1,
    borderColor: '#374151', // matches border-gray-800 vibe
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },

  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6', // gray-100
  },

  tableRow: {
    flexDirection: 'row',
  },

  cellHeader: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontWeight: 'bold',
    fontSize: 9.5,
    color: '#111827',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  cellData: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9.5,
    color: '#111827',
    borderRightWidth: 1,
    borderRightColor: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  cellLast: { borderRightWidth: 0 },

  cellText: { color: '#111827' },

  // Column width helpers (percentages)
  w40: { width: '40%' },
  w60: { width: '60%' },
  w25: { width: '25%' },
  w20: { width: '20%' },
  w30: { width: '30%' },
  w18: { width: '18%' },
  w22: { width: '22%' },
  w16: { width: '16%' },
  w14: { width: '14%' },
  w15: { width: '15%' },
  w17: { width: '17%' },
  w10: { width: '10%' },
  w9: { width: '9%' },
});

type EmploymentDetailsPDFProps = {
  employment: Employment;
  employee?: Employee | null;
};

const nbsp = '\u00a0';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

function parseNameAndDesignation(raw?: string): { name: string; designation: string } {
  const s = (raw ?? '').toString().trim();
  if (!s) return { name: nbsp, designation: nbsp };

  // Prefer newline-separated values: "Name\nDesignation"
  const lines = s.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const nameLine = lines.find((l) => /\bName\b\s*[-:|]/i.test(l));
    const designationLine = lines.find((l) => /\bDesignation\b\s*[-:|]/i.test(l));

    if (nameLine || designationLine) {
      const extractedName = (nameLine || lines[0] || '').replace(/\bName\b\s*[-:|]\s*/i, '').trim();
      const extractedDesignation = (designationLine || lines[1] || '')
        .replace(/\bDesignation\b\s*[-:|]\s*/i, '')
        .trim();

      return {
        name: extractedName || nbsp,
        designation: extractedDesignation || nbsp,
      };
    }

    return {
      name: lines[0] || nbsp,
      designation: lines.slice(1).join(' ') || nbsp,
    };
  }

  const normalized = s.replace(/\u2013|\u2014/g, '-');

  const nameLabeled = normalized.match(/\bName\b\s*[-:|]\s*(.+)/i)?.[1]?.trim() || '';
  const designationLabeled = normalized.match(/\bDesignation\b\s*[-:|]\s*(.+)/i)?.[1]?.trim() || '';
  if (nameLabeled || designationLabeled) {
    return { name: nameLabeled || nbsp, designation: designationLabeled || nbsp };
  }

  const dashMatch = normalized.match(/^(.+?)\s*-\s*(.+)$/);
  if (dashMatch) {
    return { name: dashMatch[1].trim(), designation: dashMatch[2].trim() || nbsp };
  }

  const pipeMatch = normalized.match(/^(.+?)\s*\|\s*(.+)$/);
  if (pipeMatch) {
    return { name: pipeMatch[1].trim(), designation: pipeMatch[2].trim() || nbsp };
  }

  const slashMatch = normalized.match(/^(.+?)\s*\/\s*(.+)$/);
  if (slashMatch) {
    return { name: slashMatch[1].trim(), designation: slashMatch[2].trim() || nbsp };
  }

  return { name: s || nbsp, designation: nbsp };
}

function parseEmailAndMobile(raw?: string): { email: string; mobile: string } {
  const s = (raw ?? '').toString().trim();
  if (!s) return { email: nbsp, mobile: nbsp };

  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const emailLine = lines.find((l) => /^Email\b/i.test(l)) || '';
  const mobileLine = lines.find((l) => /^Mobile\b/i.test(l)) || '';

  const emailExtracted = emailLine ? emailLine.replace(/^Email\b\s*[-:|]\s*/i, '').trim() : '';
  const mobileExtracted = mobileLine ? mobileLine.replace(/^Mobile\b\s*(?:no\s*)?[-:|]\s*/i, '').trim() : '';

  const emailFallbackAnywhere =
    s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';

  const email = (emailExtracted || emailFallbackAnywhere).trim();

  // Normalize mobile to digits-only and take last 10 digits
  const mobileDigits = mobileExtracted.replace(/\D/g, '');
  const mobile = mobileDigits ? (mobileDigits.length >= 10 ? mobileDigits.slice(-10) : mobileDigits) : '';

  return { email: email || nbsp, mobile: mobile || nbsp };
}

function parseProfessionalReferenceEmployeeId(raw?: string): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return nbsp;

  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/\bEmployee\s*Id\b\s*[-:|]\s*(.+)$/i);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v) return v;
    }
  }

  const anyAdv = s.match(/\b(ADV\d+)\b/i);
  return anyAdv?.[1] ?? nbsp;
}

function parseProfessionalReferencePlace(raw?: string): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return nbsp;

  const lines = s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^Place\b\s*[-:|]\s*(.+)$/i);
    if (m?.[1]) {
      const v = m[1].trim();
      if (v) return v;
    }
  }

  return nbsp;
}

function whereEmployedRaw(employment: any): string {
  const raw = employment?.whereWereYouEmploid || employment?.whereWereYouEmployed || employment?.whereWereYouEmployd || '';
  const s = String(raw).trim();
  if (!s) return '-';

  const key = s.toLowerCase();
  if (key === 'registred corporate office' || key === 'registered corporate office') {
    return 'Registred Corporate Office(Pune)';
  }
  if (key === 'branch office') {
    return 'Branch Office(Mumbai)';
  }
  return s;
}

function whereWereYouEmployedAddressLines(employment: any): string[] {
  const raw = employment?.whereWereYouEmploid || employment?.whereWereYouEmployed || employment?.whereWereYouEmployd || '';
  const s = String(raw).trim();
  const key = s.toLowerCase();

  const isPune =
    key.includes('pune') ||
    key.includes('registred corporate office') ||
    key.includes('registered corporate office') ||
    key.includes('head office');
  const isMumbai =
    key.includes('mumbai') ||
    key.includes('branch office') ||
    key.includes('thane');

  if (isPune) {
    return [
      'Adysun Ventures Pvt. Ltd.',
      'Workplex, S no 47, Near Bhapkar Petrol Pump, Pune, Maharashtra - 411009',
      'Pune Office (Head Office)',
    ];
  }

  if (isMumbai) {
    return [
      'Adysun Ventures Pvt. Ltd.',
      'A2, 704, Kanchanpushp Society Kavesar, Thane West, Thane, Maharashtra - 400607',
      'Mumbai Office',
    ];
  }

  return [nbsp];
}

function formatEmploymentTypeValue(employment: Employment): string | null {
  const employmentType = (employment.employmentType ?? '').trim();
  const contractType = (employment.contractType ?? '').trim();

  const hasEmploymentType = employmentType !== '' && employmentType !== '-';
  const hasContractType = contractType !== '' && contractType !== '-';

  if (!hasEmploymentType && !hasContractType) return null;

  const rawValue = hasEmploymentType ? employmentType : contractType;
  return rawValue.includes('-')
    ? rawValue
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : rawValue.charAt(0).toUpperCase() + rawValue.slice(1);
}

function formatPeriodOfEmployment(employment: Employment): string {
  const joiningText = employment.joiningDate
    ? formatDateToDayMonYear(employment.joiningDate)
    : employment.startDate
      ? formatDateToDayMonYear(employment.startDate)
      : '-';

  const isResigned =
    employment.isResignation === true ||
    (employment as any).employmentStatus === 'resigned';

  const resignText = isResigned
    ? employment.resignationDate
      ? formatDateToDayMonYear(employment.resignationDate)
      : employment.lastWorkingDate
        ? formatDateToDayMonYear(employment.lastWorkingDate)
        : '-'
    : 'Present';

  return `${joiningText} to ${resignText}`;
}

function getIncrementDetails(employment: Employment): EmploymentIncrement[] {
  const arr = employment.increments;
  if (Array.isArray(arr) && arr.length > 0) return arr;

  const incrementDate = String(employment.incrementDate ?? '').trim();
  const newSalary = employment.newSalary != null ? Number(employment.newSalary) : 0;
  const incrementedCtc = employment.incrementedCtc != null ? Number(employment.incrementedCtc) : 0;
  const incrementedInHandCtc =
    employment.incrementedInHandCtc != null ? Number(employment.incrementedInHandCtc) : 0;

  const hasAny =
    Boolean(incrementDate) || newSalary > 0 || incrementedCtc > 0 || incrementedInHandCtc > 0;

  if (!hasAny) return [];

  return [
    {
      incrementDate: employment.incrementDate,
      newSalary: employment.newSalary,
      incrementedCtc: employment.incrementedCtc,
      incrementedInHandCtc: employment.incrementedInHandCtc,
    },
  ];
}

function formatMultilineLines(lines: string[]) {
  return lines.map((line, idx) => (
    <Text key={idx} break>
      {line}
    </Text>
  ));
}

export default function EmploymentDetailsPDF({ employment }: EmploymentDetailsPDFProps) {
  const periodText = formatPeriodOfEmployment(employment);
  const whereAddressLines = whereWereYouEmployedAddressLines(employment);
  const employmentTypeValue = formatEmploymentTypeValue(employment);
  const increments = getIncrementDetails(employment);
  const hasIncrementDetails = increments.length > 0;

  // Salary summary calculations (must match existing Employment page)
  const joiningAnnual = Number(employment.joiningCtc || 0);
  // PF is stored independently for Joining vs Current salary:
  // - `employerPF` => Joining PF
  // - `pf` => Current PF
  // Backward compatible fallback: if `employerPF` is missing, reuse `pf` for joining.
  const currentPfAmount = Number(employment.pf ?? 0);
  const joiningPfAmount = Number((employment as any).employerPF ?? employment.pf ?? 0);
  const includeJoiningPf = joiningPfAmount > 0;
  const includeCurrentPf = currentPfAmount > 0;

  const joiningInHand =
    joiningAnnual > 0
      ? (() => {
          const joiningMonthly = Math.round(joiningAnnual / 12);
          const joiningBasic = Math.round(joiningMonthly * 0.4);
          const joiningPfMonthly = includeJoiningPf
            ? Math.round(Math.min(joiningBasic, 15000) * 0.12)
            : 0;
          return joiningMonthly - joiningPfMonthly;
        })()
      : 0;

  const currentAnnual = Number(employment.salary || 0);
  const currentInHand = Number((employment as any).inHandCtc || 0);
  // This column in the salary summary represents Current PF.
  const isPf = includeCurrentPf ? 'Yes' : 'No';

  // Joining salary breakdown (must match existing Employment page)
  const joiningMonthly = joiningAnnual > 0 ? Math.round(joiningAnnual / 12) : 0;
  const joiningBasic = joiningMonthly > 0 ? Math.round(joiningMonthly * 0.4) : 0;
  const joiningDA = joiningBasic > 0 ? Math.round(joiningBasic * 0.1) : 0;
  const joiningHRA = joiningBasic > 0 ? Math.round(joiningBasic * 0.5) : 0;
  const pfAmount = joiningPfAmount;
  const pfIncluded = pfAmount > 0;
  const joiningPF =
    pfIncluded && joiningBasic > 0 ? Math.round(Math.min(joiningBasic, 15000) * 0.12) : 0;
  const joiningMedicalAllowance = joiningMonthly > 0 ? 1250 : 0;
  const joiningTransportAllowance = joiningMonthly > 0 ? 1600 : 0;
  const joiningCalculated =
    joiningBasic + joiningHRA + joiningDA + joiningMedicalAllowance + joiningTransportAllowance;
  const joiningSpecial = joiningMonthly > 0 ? Math.max(0, joiningMonthly - joiningCalculated) : 0;

  // Current salary breakdown (must match existing Employment page)
  const annualSalary = Number(employment.salary || 0);
  const monthlySalary = Number((employment as any).salaryPerMonth || 0);
  const basic = Number(employment.basic || 0);
  const da = Number(employment.da || 0);
  const hra = Number(employment.hra || 0);
  const pf = Number(employment.pf || 0);
  const additionalAllowance = Number(employment.additionalAllowance || 0);
  const specialAllowance = Number(employment.specialAllowance || 0);

  const resignationDateText = employment.resignationDate
    ? formatDateToDayMonYear(employment.resignationDate)
    : '-';
  const lastWorkingDateText = employment.lastWorkingDate
    ? formatDateToDayMonYear(employment.lastWorkingDate)
    : '-';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1 -> 4: Outer padding -> border -> inner padding -> content */}
        <View style={styles.outerPadding}>
          <View style={styles.borderedContainer}>
            <View style={styles.innerPadding}>
              <Text style={styles.title}>Employment Details</Text>

              {/* Where Were You Employed & Address */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Where Were You Employed &amp; Address</Text>

                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cellHeader, styles.w40]}>
                      <Text style={styles.cellText}>Where Were You Employed</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w60, styles.cellLast]}>
                      <Text style={styles.cellText}>Address</Text>
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={[styles.cellData, styles.w40]}>
                      <Text style={styles.cellText}>{whereEmployedRaw(employment as any)}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w60, styles.cellLast]}>
                      {formatMultilineLines(whereAddressLines)}
                    </View>
                  </View>
                </View>
              </View>

              {/* Employment Details table */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Employment Details</Text>

                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cellHeader, styles.w25]}>
                      <Text style={styles.cellText}>Period Of Employment</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w20]}>
                      <Text style={styles.cellText}>Department</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w25]}>
                      <Text style={styles.cellText}>Employee Id</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w30, styles.cellLast]}>
                      <Text style={styles.cellText}>Designation</Text>
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={[styles.cellData, styles.w25]}>
                      <Text style={styles.cellText}>{periodText}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w20]}>
                      <Text style={styles.cellText}>{employment.department || nbsp}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w25]}>
                      <Text style={styles.cellText}>{employment.employmentId || nbsp}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w30, styles.cellLast]}>
                      <Text style={styles.cellText}>
                        {employment.jobTitle || employment.designation || nbsp}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Salary Summary */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Salary Summary</Text>

                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cellHeader, styles.w20]}>
                      <Text style={styles.cellText}>Joining CTC</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w20]}>
                      <Text style={styles.cellText}>Joining In Hand</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w20]}>
                      <Text style={styles.cellText}>Current CTC</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w20]}>
                      <Text style={styles.cellText}>Current In Hand</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w20, styles.cellLast]}>
                      <Text style={styles.cellText}>Is PF</Text>
                    </View>
                  </View>

                  <View style={styles.tableRow}>
                    <View style={[styles.cellData, styles.w20]}>
                      <Text style={styles.cellText}>{joiningAnnual > 0 ? formatCurrency(joiningAnnual) : '-'}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w20]}>
                      <Text style={styles.cellText}>
                        {joiningInHand > 0 ? formatCurrency(Math.round(joiningInHand)) : '-'}
                      </Text>
                    </View>
                    <View style={[styles.cellData, styles.w20]}>
                      <Text style={styles.cellText}>{currentAnnual > 0 ? formatCurrency(currentAnnual) : '-'}</Text>
                    </View>
                    <View style={[styles.cellData, styles.w20]}>
                      <Text style={styles.cellText}>
                        {currentInHand > 0 ? formatCurrency(currentInHand) : '-'}
                      </Text>
                    </View>
                    <View style={[styles.cellData, styles.w20, styles.cellLast]}>
                      <Text style={styles.cellText}>{isPf}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Professional Reference */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Professional Reference</Text>

                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cellHeader, styles.w18]}>
                      <Text style={styles.cellText}>{nbsp}</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w22]}>
                      <Text style={styles.cellText}>Name</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w16]}>
                      <Text style={styles.cellText}>Employee ID</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w15]}>
                      <Text style={styles.cellText}>Email</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w9]}>
                      <Text style={styles.cellText}>Mobile no</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w10]}>
                      <Text style={styles.cellText}>Designation</Text>
                    </View>
                    <View style={[styles.cellHeader, styles.w10, styles.cellLast]}>
                      <Text style={styles.cellText}>Place</Text>
                    </View>
                  </View>

                  {([0, 1, 2, 3] as const).map((idx) => {
                    const role =
                      idx === 0
                        ? 'Team Leader'
                        : idx === 1
                          ? 'Colleague 1'
                          : idx === 2
                            ? 'Colleague 2'
                            : 'Reporting Manager';

                    const ref = employment.professionalReferences?.[idx] as ProfessionalReference | undefined;
                    const nd = parseNameAndDesignation(ref?.nameDesignation);
                    const em = parseEmailAndMobile(ref?.emailAndMobile);
                    const refEmployeeId = parseProfessionalReferenceEmployeeId(ref?.nameDesignation);
                    const refPlace = parseProfessionalReferencePlace(ref?.emailAndMobile);

                    return (
                      <View key={idx} style={styles.tableRow}>
                        <View style={[styles.cellData, styles.w18]}>
                          <Text style={styles.cellText}>{role}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w22]}>
                          <Text style={styles.cellText}>{nd.name}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w16]}>
                          <Text style={styles.cellText}>{refEmployeeId}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w15]}>
                          <Text style={styles.cellText}>{em.email}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w9]}>
                          <Text style={styles.cellText}>{em.mobile}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w10]}>
                          <Text style={styles.cellText}>{nd.designation}</Text>
                        </View>
                        <View style={[styles.cellData, styles.w10, styles.cellLast]}>
                          <Text style={styles.cellText}>{refPlace}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Employment Information */}
              <View style={styles.section}>
                <Text style={styles.heading}>Employment Information</Text>

                <View style={styles.cardGrid4}>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.employmentId || '-'}</Text>
                    <Text style={styles.labelText}>Employment ID</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>
                      {employment.joiningDate
                        ? formatDateToDayMonYear(employment.joiningDate)
                        : employment.startDate
                          ? formatDateToDayMonYear(employment.startDate)
                          : '-'}
                    </Text>
                    <Text style={styles.labelText}>Joining Date</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>
                      {employment.joiningCtc
                        ? formatCurrency(employment.joiningCtc)
                        : employment.salary
                          ? formatCurrency(employment.salary)
                          : '-'}
                    </Text>
                    <Text style={styles.labelText}>Joining CTC</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>
                      {employment.inHandCtc ? formatCurrency(employment.inHandCtc) : '-'}
                    </Text>
                    <Text style={styles.labelText}>In-hand CTC</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Job Details */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Job Details</Text>

                <View style={styles.cardGrid4}>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.jobTitle || '-'}</Text>
                    <Text style={styles.labelText}>Designation</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.department || '-'}</Text>
                    <Text style={styles.labelText}>Department</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.location || '-'}</Text>
                    <Text style={styles.labelText}>Location</Text>
                  </View>

                  {employmentTypeValue ? (
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{employmentTypeValue}</Text>
                    </View>
                  ) : null}

                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.workSchedule || '-'}</Text>
                    <Text style={styles.labelText}>Work Mode</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{whereEmployedRaw(employment as any)}</Text>
                    <Text style={styles.labelText}>Where Were You Employed?</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Resignation Information (only if resigned) */}
              {employment.isResignation ? (
                <View style={styles.sectionTight}>
                  <Text style={styles.heading}>Resignation Information</Text>

                  <View style={styles.cardGrid4}>
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{resignationDateText}</Text>
                      <Text style={styles.labelText}>Resignation Date</Text>
                    </View>
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>
                        {employment.lastDrawnSalary ? formatCurrency(employment.lastDrawnSalary) : '-'}
                      </Text>
                      <Text style={styles.labelText}>Last Drawn In Hand</Text>
                    </View>
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>
                        {employment.lastSalaryAmount ? formatCurrency(employment.lastSalaryAmount) : '-'}
                      </Text>
                      <Text style={styles.labelText}>Last Drawn CTC</Text>
                    </View>
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{lastWorkingDateText}</Text>
                      <Text style={styles.labelText}>Last Working Date</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {employment.isResignation ? <View style={styles.divider} /> : null}

              {/* Increment Details (only if exists) */}
              {hasIncrementDetails ? (
                <View style={styles.sectionTight}>
                  <Text style={styles.heading}>Increment Details</Text>

                  {increments.map((inc, index) => (
                    <View key={inc.id || index} style={{ marginBottom: 12 }}>
                      <Text style={{ fontSize: 8.5, fontWeight: 'bold', color: '#6B7280', marginBottom: 6 }}>
                        Increment {index + 1}
                      </Text>

                      <View style={styles.cardGrid4}>
                        <View style={styles.cardItem}>
                          <Text style={styles.labelText}>Increment Date</Text>
                          <Text style={styles.valueText}>
                            {inc.incrementDate ? formatDateToDayMonYear(inc.incrementDate) : '-'}
                          </Text>
                        </View>
                        <View style={styles.cardItem}>
                          <Text style={styles.labelText}>Incremented Salary</Text>
                          <Text style={styles.valueText}>{inc.newSalary ? formatCurrency(inc.newSalary) : '-'}</Text>
                        </View>
                        <View style={styles.cardItem}>
                          <Text style={styles.labelText}>Incremented CTC</Text>
                          <Text style={styles.valueText}>
                            {inc.incrementedCtc ? formatCurrency(inc.incrementedCtc) : '-'}
                          </Text>
                        </View>
                        <View style={styles.cardItem}>
                          <Text style={styles.labelText}>Incremented In-hand CTC</Text>
                          <Text style={styles.valueText}>
                            {inc.incrementedInHandCtc ? formatCurrency(inc.incrementedInHandCtc) : '-'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.divider} />

              {/* Joining Salary Information */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Joining Salary Information</Text>

                <View style={styles.cardGrid4}>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningAnnual > 0 ? formatCurrency(joiningAnnual) : '-'}</Text>
                    <Text style={styles.labelText}>Joining Salary per annum</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningMonthly > 0 ? formatCurrency(joiningMonthly) : '-'}</Text>
                    <Text style={styles.labelText}>Joining Salary Per Month</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningBasic > 0 ? formatCurrency(joiningBasic) : '-'}</Text>
                    <Text style={styles.labelText}>Joining Basic</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningDA > 0 ? formatCurrency(joiningDA) : '-'}</Text>
                    <Text style={styles.labelText}>Joining DA (Dearness Allowance)</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningHRA > 0 ? formatCurrency(joiningHRA) : '-'}</Text>
                    <Text style={styles.labelText}>Joining HRA (House Rent Allowance)</Text>
                  </View>
                  {pfIncluded ? (
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{joiningPF > 0 ? formatCurrency(joiningPF) : '-'}</Text>
                      <Text style={styles.labelText}>Joining PF (Provident Fund)</Text>
                    </View>
                  ) : null}
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{joiningSpecial > 0 ? formatCurrency(joiningSpecial) : '-'}</Text>
                    <Text style={styles.labelText}>Joining Special Allowance</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Current Salary Information */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Current Salary Information</Text>

                <View style={styles.cardGrid4}>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{annualSalary > 0 ? formatCurrency(annualSalary) : '-'}</Text>
                    <Text style={styles.labelText}>Current Salary per annum</Text>
                  </View>

                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>
                      {monthlySalary > 0
                        ? formatCurrency(monthlySalary)
                        : annualSalary > 0
                          ? formatCurrency(annualSalary / 12)
                          : '-'}
                    </Text>
                    <Text style={styles.labelText}>Current Salary per month</Text>
                  </View>

                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{basic > 0 ? formatCurrency(basic) : '-'}</Text>
                    <Text style={styles.labelText}>Current Basic</Text>
                  </View>

                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{da > 0 ? formatCurrency(da) : '-'}</Text>
                    <Text style={styles.labelText}>Current DA (Dearness Allowance)</Text>
                  </View>

                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{hra > 0 ? formatCurrency(hra) : '-'}</Text>
                    <Text style={styles.labelText}>Current HRA (House Rent Allowance)</Text>
                  </View>

                  {pf > 0 ? (
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{formatCurrency(pf)}</Text>
                      <Text style={styles.labelText}>PF (Provident Fund)</Text>
                    </View>
                  ) : null}

                  {additionalAllowance > 0 ? (
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{formatCurrency(additionalAllowance)}</Text>
                      <Text style={styles.labelText}>Additional Allowance</Text>
                    </View>
                  ) : null}

                  {specialAllowance > 0 ? (
                    <View style={styles.cardItem}>
                      <Text style={styles.valueText}>{formatCurrency(specialAllowance)}</Text>
                      <Text style={styles.labelText}>Current Special Allowance</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              {/* Bank Details */}
              <View style={styles.sectionTight}>
                <Text style={styles.heading}>Salary Account Details</Text>

                <View style={styles.cardGrid4}>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.bankName || '-'}</Text>
                    <Text style={styles.labelText}>Bank Name</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.accountNo || '-'}</Text>
                    <Text style={styles.labelText}>Account Number</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.ifscCode || '-'}</Text>
                    <Text style={styles.labelText}>IFSC Code</Text>
                  </View>
                  <View style={styles.cardItem}>
                    <Text style={styles.valueText}>{employment.panNumber || '-'}</Text>
                    <Text style={styles.labelText}>PAN Number</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

