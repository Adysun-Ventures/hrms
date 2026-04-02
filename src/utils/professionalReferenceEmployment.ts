/**
 * Fixed directory + Firestore serialization for Employment Professional References
 * (shared by Add / Edit employment pages).
 */
export const PROFESSIONAL_REFERENCE_DIRECTORY: Record<
  string,
  { employeeId: string; mobileNo: string; email: string; designation: string; location: string }
> = {
  'Viraj Kadam': {
    employeeId: 'ADV09',
    mobileNo: '8806431723',
    email: 'viraj.kadam@adysunventures.com',
    designation: 'Project Manager',
    location: 'Pune',
  },
  'Rohit Kore': {
    employeeId: 'ADV66',
    mobileNo: '8484025370',
    email: 'rohit.kore@adysunventures.com',
    designation: 'Sr. Software Engg',
    location: 'Pune',
  },
  'Nagesh Chavan': {
    employeeId: 'ADV47',
    mobileNo: '9834187607',
    email: 'nagesh.chavan@adysunventures.com',
    designation: 'Sr. Software Developer',
    location: 'Pune',
  },
  'Niranjan Kapase': {
    employeeId: 'ADV49',
    mobileNo: '7058370509',
    email: 'niranjan.kapase@adysunventures.com',
    designation: 'Sr. Backend Engg',
    location: 'Pune',
  },
};

/** Names shown in Professional Reference dropdowns (Add/Edit employment). */
export const PROFESSIONAL_REFERENCE_NAME_OPTIONS = [
  'Viraj Kadam',
  'Rohit Kore',
  'Nagesh Chavan',
  'Niranjan Kapase',
] as const;

export function hydrateRefFromDirectory(ref: any): any {
  const name = (ref?.name ?? '').toString().trim();
  const person = name ? PROFESSIONAL_REFERENCE_DIRECTORY[name] : undefined;
  if (!name || !person) return ref;
  return {
    ...ref,
    employeeId: ref?.employeeId?.trim?.() ? ref.employeeId : person.employeeId,
    mobileNo: ref?.mobileNo?.trim?.() ? ref.mobileNo : person.mobileNo,
    email: ref?.email?.trim?.() ? ref.email : person.email,
    designation: ref?.designation?.trim?.() ? ref.designation : person.designation,
    location: ref?.location?.trim?.() ? ref.location : person.location,
  };
}

export function toProfessionalReference(ref: any) {
  const hasAny =
    ref &&
    (ref.name?.trim() ||
      ref.employeeId?.trim() ||
      ref.mobileNo?.trim() ||
      ref.email?.trim() ||
      ref.designation?.trim() ||
      ref.location?.trim());

  if (!hasAny) {
    return { nameDesignation: '', emailAndMobile: '', natureOfAssociation: '' };
  }

  const name = ref?.name?.trim() || '';
  const designation = ref?.designation?.trim() || '';
  const employeeId = ref?.employeeId?.trim() || '';
  const email = ref?.email?.trim() || '';
  const mobileNo = ref?.mobileNo?.trim() || '';
  const place = ref?.location?.trim() || '';

  const nameDesignationLines = [
    `Name - ${name}`,
    `Designation - ${designation}`,
    employeeId ? `Employee Id - ${employeeId}` : null,
  ].filter(Boolean);

  const emailMobileLines = [
    `Email - ${email}`,
    `Mobile no - ${mobileNo}`,
    place ? `Place - ${place}` : null,
  ].filter(Boolean);

  return {
    nameDesignation: nameDesignationLines.join('\n'),
    emailAndMobile: emailMobileLines.join('\n'),
    natureOfAssociation: '',
  };
}

export function buildProfessionalReferencesArray(data: {
  teamLead?: any;
  colleague1?: any;
  colleague3?: any;
  reportingManagerRef?: any;
}) {
  return [
    toProfessionalReference(hydrateRefFromDirectory(data.teamLead)),
    toProfessionalReference(hydrateRefFromDirectory(data.colleague1)),
    toProfessionalReference(hydrateRefFromDirectory(data.colleague3)),
    toProfessionalReference(hydrateRefFromDirectory(data.reportingManagerRef)),
  ];
}
