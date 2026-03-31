'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiEye, FiDollarSign, FiDownload } from 'react-icons/fi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Salary } from '@/types';
import toast, { Toaster } from 'react-hot-toast';
import { formatDateToDayMonYear } from '@/utils/documentUtils';
import { ActionButton } from '@/components/ui/ActionButton';
import SearchBar from '@/components/ui/SearchBar';
import TableHeader from '@/components/ui/TableHeader';
import Pagination from '@/components/ui/Pagination';
import { useSalaries, useDeleteSalary, useSalariesByEmployee } from '@/hooks/useSalaries';
import { getEmployeeNameById, getEmploymentsByEmployee } from '@/utils/firebaseUtils';
import SimpleBreadcrumb from '@/components/ui/SimpleBreadcrumb';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { FaRupeeSign } from "react-icons/fa";
import { pdf } from '@react-pdf/renderer';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import GlobalPDFHeader from '@/components/components/docComponents/docHeader';
import GlobalPDFFooter from '@/components/components/docComponents/docFooter';
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { saveAs } from "file-saver";
import {
  Document as DocxDocument,
  Packer as DocxPacker,
  Paragraph as DocxParagraph,
  TextRun as DocxTextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  AlignmentType as DocxAlignmentType,
  WidthType as DocxWidthType,
  BorderStyle as DocxBorderStyle,
} from "docx";





// Component to handle employee name display with proper Firebase integration
const EmployeeNameDisplay = ({ employeeId }: { employeeId: string }) => {
  const [employeeName, setEmployeeName] = useState<string>('Loading...');

  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (employeeId) {
        try {
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);
        } catch (error) {
          console.error('Error fetching employee name:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeName();
  }, [employeeId]);

  return <span>{employeeName}</span>;
};
const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  heading: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 10 }
});


export default function SalariesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [resolvedEmploymentId, setResolvedEmploymentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const employeeId = searchParams?.get('employeeId') || null;
  const from = searchParams?.get('from') || null;

  // Resolve latest employment id for breadcrumb (avoid Employment list page)
  useEffect(() => {
    if (!employeeId) {
      setResolvedEmploymentId(null);
      return;
    }

    (async () => {
      try {
        const employments = await getEmploymentsByEmployee(employeeId);
        const latest = employments?.[0];
        setResolvedEmploymentId(latest?.id || null);
      } catch (e) {
        console.error('Failed to resolve employmentId for salary breadcrumb:', e);
        setResolvedEmploymentId(null);
      }
    })();
  }, [employeeId]);

  // Use appropriate query based on whether we have an employeeId
  const {
    data: employeeSalaries = [],
    isLoading: isEmployeeSalariesLoading,
    isError: isEmployeeSalariesError,
    error: employeeSalariesError,
    refetch: refetchEmployeeSalaries
  } = useSalariesByEmployee(employeeId || '');

  const {
    data: allSalaries = [],
    isLoading: isAllSalariesLoading,
    isError: isAllSalariesError,
    error: allSalariesError,
    refetch: refetchAllSalaries
  } = useSalaries();

  // Use the appropriate data based on context
  const salaries = employeeId ? employeeSalaries : allSalaries;
  const isLoading = employeeId ? isEmployeeSalariesLoading : isAllSalariesLoading;
  const isError = employeeId ? isEmployeeSalariesError : isAllSalariesError;
  const error = employeeId ? employeeSalariesError : allSalariesError;

  // Debug logging
  console.log('🔍 Debug - Employee ID:', employeeId);
  console.log('🔍 Debug - All Salaries Count:', allSalaries.length);
  console.log('🔍 Debug - Employee Salaries Count:', employeeSalaries.length);
  console.log('🔍 Debug - Final Salaries Count:', salaries.length);
  console.log('🔍 Debug - Is Loading:', isLoading);
  console.log('🔍 Debug - Is Error:', isError);

  // Fetch employee name when employeeId is available
  useEffect(() => {
    const fetchEmployeeName = async () => {
      if (employeeId) {
        try {
          const name = await getEmployeeNameById(employeeId);
          setEmployeeName(name);
        } catch (error) {
          console.error('Error fetching employee name:', error);
          setEmployeeName('Unknown Employee');
        }
      }
    };

    fetchEmployeeName();
  }, [employeeId]);

  // Use mutation for delete operation
  const deleteSalaryMutation = useDeleteSalary();

  // Handle refresh with toast feedback
  const handleRefresh = async () => {
    try {
      console.log('🔄 Manual refresh triggered...');
      
      // Force invalidate all salary queries
      await queryClient.invalidateQueries({ queryKey: ['salaries'] });
      await queryClient.invalidateQueries({ queryKey: ['salaries', 'list'] });
      
      if (employeeId) {
        await queryClient.invalidateQueries({ queryKey: ['salaries', 'byEmployee', employeeId] });
        await refetchEmployeeSalaries();
      } else {
        await refetchAllSalaries();
      }
      
      console.log('✅ Manual refresh completed');
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing salaries:', error);
      toast.error('Failed to refresh data');
    }
  };

  // Handle error state
  if (isError && error) {
    console.error('Salary data error:', error);
    toast.error('Failed to load salary data');
  }
const handleDownload = async (salary: Salary) => {
  try {

    // ===== 1️⃣ Fetch Employee =====
    const empDoc = await getDoc(doc(db, "employees", salary.employeeId));
    const employeeData = empDoc.exists() ? empDoc.data() : {};

    // ===== 2️⃣ Fetch Employment =====
    let employmentData: any = {};

    const empQuery = query(
      collection(db, "employments"),
      where("employeeId", "==", salary.employeeId)
    );

    const empSnap = await getDocs(empQuery);

    if (!empSnap.empty) {
      const rows = empSnap.docs.map(d => d.data());

      rows.sort(
        (a, b) =>
          new Date(b.startDate).getTime() -
          new Date(a.startDate).getTime()
      );

      employmentData = rows[0]; // ✅ latest employment
    }

    // ===== 3️⃣ FINAL MERGED OBJECT =====
    const f: any = {
      ...salary,
      ...employeeData,
      ...employmentData
    };

    console.log(employeeData,employmentData )

    // ===== 4️⃣ SAFE NAME RESOLVER =====
    const employeeName =
      f.employeeNameText ||
      f.employeeName ||
      employeeData?.name ||
      employmentData?.employeeName ||
      "Unknown Employee";

    // ===== Earnings =====
    const earningsData = [
      { label: 'Basic', amount: f.basic || 0 },
      { label: 'HRA', amount: f.hra || 0 },
      { label: 'Conveyance Allowance', amount: f.conveyanceAllowance || 0 },
      { label: 'Other Allowance', amount: f.otherAllowance || 0 },
    ];

    // ===== Deductions =====
    const deductionsData = [
      { label: 'PT', amount: f.ptDeduct || 0 },
      { label: 'Leave Deduction', amount: f.leavesDeductAmt || 0 },
      { label: 'Other Deduction', amount: f.otherDeductions || 0 },
    ];
    const tableBox = {
  width: "100%",
  borderWidth: 0.75,
  borderColor: "#000",
  marginBottom: 10
};
const safeName = employeeName.replace(/\s+/g, "_");
const monthName = getMonthName(f.month);

    // ===== PDF =====
    const blob = await pdf(
      <Document>
        <Page size="A4" style={{
          paddingTop: 18 * 2.83,
          paddingBottom: 18 * 2.83,
          paddingLeft: 10 * 2.83,
          paddingRight: 10 * 2.83,
          fontFamily: "Helvetica",
          fontSize: 9,
          display: "flex",
          flexDirection: "column"
        }}>

          <GlobalPDFHeader />

          <View style={{ borderBottomWidth: 1, marginBottom: 10 }} />

          <Text style={{
            fontSize: 10,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 8
          }}>
            Salary Slip {getMonthName(f.month)} {f.year}
          </Text>

          {/* ===== DETAILS ===== */}
          <View style={ tableBox }>
            {[
              { label: "Employee Name", value: employeeName },
              { label: "Employee ID", value: f.employeeId },
              { label: "Designation", value: f.jobTitle || "-" },
              { label: "Bank Name", value: f.bankName || "-" },
              { label: "Account No", value: f.accountNo || "-" },
              { label: "IFSC Code", value: f.ifscCode || "-" },
              {label:"Pan Number", value: f.panNumber || "-"},
              
              { label: "Leaves", value: f.leavesCount },
              { label: "Work Days", value: f.workDays },
              
            ].map((row, idx) => (
              <View key={row.label} style={{
                flexDirection: "row",
                borderBottomWidth: 0.6

              }}>
                <Text style={{
                  width: "60%",
                  padding: 4,
                  borderRightWidth: 0.6,
                  fontWeight: "bold"
                }}>
                  {row.label}
                </Text>

                <Text style={{ width: "60%", padding: 4 }}>
                  {row.value ?? "-"}
                </Text>
              </View>
            ))}
          </View>

          {/* ===== EARNINGS + DEDUCTIONS ===== */}
          <View style={{ flexDirection: "row", borderWidth: 0.75, marginBottom: 10 }}>

            {/* Earnings */}
            <View style={{ width: "50%", borderRightWidth: 0.75 }}>
              <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderBottomWidth: 0.75 }}>
                <Text style={{ width: "60%", padding: 4, fontWeight: "bold", borderRightWidth: 0.75 }}>Earnings (A)</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>Amount</Text>
              </View>

              {earningsData.map(item => (
                <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.6,borderRightWidth: 0.75 }}>
                  <Text style={{ width: "60%", padding: 4 ,borderRightWidth: 0.75}} wrap={false}>{item.label}</Text>
                  <Text style={{ width: "40%", padding: 4, textAlign: "right" }}> {item.amount}</Text>
                </View>
              ))}

              <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8" }}>
                <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Gross Salary</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
                   {f.grossSalary || f.totalSalary || 0}
                </Text>
              </View>
            </View>

            {/* Deductions */}
            <View style={{ width: "50%" }}>
              <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8", borderBottomWidth: 0.75 ,borderRightWidth: 0.75 }}>
                <Text style={{ width: "60%", padding: 4, fontWeight: "bold",borderRightWidth: 0.75 }}>Deductions (B)</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>Amount</Text>
              </View>

              {deductionsData.map(item => (
                <View key={item.label} style={{ flexDirection: "row", borderBottomWidth: 0.6,borderRightWidth: 0.75 }}>
                  <Text style={{ width: "60%", padding: 4 ,borderRightWidth: 0.75}} wrap={false}>{item.label}</Text>
                  <Text style={{ width: "40%", padding: 4, textAlign: "right" }}> {item.amount}</Text>
                </View>
              ))}

              <View style={{ flexDirection: "row", backgroundColor: "#e8e8e8",marginTop:18.5 }}>
                <Text style={{ width: "60%", padding: 4, fontWeight: "bold" }}>Total Deductions</Text>
                <Text style={{ width: "40%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
                   {f.totalDeduction || 0}
                </Text>
              </View>
            </View>

          </View>

          {/* Net */}
          <View style={{ borderWidth: 0.75, backgroundColor: "#e8e8e8" }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ width: "50%", padding: 4, fontWeight: "bold", borderRightWidth: 0.75 }}>
                Net Salary (A - B)
              </Text>
              <Text style={{ width: "50%", padding: 4, textAlign: "right", fontWeight: "bold" }}>
                 {f.netSalary || f.inhandSalary || 0}
              </Text>
            </View>
          </View>

          <Text style={{ textAlign: "center", marginTop: 10, fontWeight: "bold" }}>
            This document is digitally generated and does not require signature.
          </Text>

          <View style={{ flexGrow: 1 }} />
          <View style={{ borderBottomWidth: 1, marginBottom: 8 }} />

          <GlobalPDFFooter />

        </Page>
      </Document>
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Salary-${safeName}-${monthName}-${f.year}.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("PDF Downloaded");

    // ===== DOCX (Salary Slip) =====
    try {
      const docxSections: DocxParagraph[] | (DocxParagraph | DocxTable)[] = [
        new DocxParagraph({
          children: [
            new DocxTextRun({
              text: `Salary Slip - ${monthName} ${f.year}`,
              bold: true,
            }),
          ],
        }),
        new DocxParagraph({}),
        new DocxTable({
          width: { size: 100, type: DocxWidthType.PERCENTAGE },
          borders: {
            top: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            left: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            right: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            insideHorizontal: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            insideVertical: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
          },
          rows: [
            ...[
              ["Employee Name", employeeName],
              ["Employee ID", f.employeeId],
              ["Designation", f.jobTitle || "-"],
              ["Bank Name", f.bankName || "-"],
              ["Account No", f.accountNo || "-"],
              ["IFSC Code", f.ifscCode || "-"],
              ["Pan Number", f.panNumber || "-"],
              ["Leaves", String(f.leavesCount ?? 0)],
              ["Work Days", String(f.workDays ?? 0)],
            ].map(
              ([label, value]) =>
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [new DocxParagraph({ children: [new DocxTextRun({ text: label, bold: true })] })],
                    }),
                    new DocxTableCell({
                      children: [new DocxParagraph({ text: value || "-" })],
                    }),
                  ],
                })
            ),
          ],
        }),
        new DocxParagraph({}),
        new DocxTable({
          width: { size: 100, type: DocxWidthType.PERCENTAGE },
          borders: {
            top: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            left: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            right: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            insideHorizontal: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            insideVertical: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
          },
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Earnings (A)", bold: true })] })],
                }),
                new DocxTableCell({
                  children: [
                    new DocxParagraph({
                      alignment: DocxAlignmentType.RIGHT,
                      children: [new DocxTextRun({ text: "Amount", bold: true })],
                    }),
                  ],
                }),
              ],
            }),
            ...earningsData.map(
              (e) =>
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [new DocxParagraph({ text: e.label })],
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          alignment: DocxAlignmentType.RIGHT,
                          text: String(e.amount ?? 0),
                        }),
                      ],
                    }),
                  ],
                })
            ),
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Gross Salary", bold: true })] })],
                }),
                new DocxTableCell({
                  children: [
                    new DocxParagraph({
                      alignment: DocxAlignmentType.RIGHT,
                      children: [
                        new DocxTextRun({
                          text: String(f.grossSalary || f.totalSalary || 0),
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new DocxParagraph({}),
        new DocxTable({
          width: { size: 100, type: DocxWidthType.PERCENTAGE },
          borders: {
            top: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            left: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            right: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            insideHorizontal: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            insideVertical: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
          },
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [new DocxParagraph({ children: [new DocxTextRun({ text: "Deductions (B)", bold: true })] })],
                }),
                new DocxTableCell({
                  children: [
                    new DocxParagraph({
                      alignment: DocxAlignmentType.RIGHT,
                      children: [new DocxTextRun({ text: "Amount", bold: true })],
                    }),
                  ],
                }),
              ],
            }),
            ...deductionsData.map(
              (d) =>
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [new DocxParagraph({ text: d.label })],
                    }),
                    new DocxTableCell({
                      children: [
                        new DocxParagraph({
                          alignment: DocxAlignmentType.RIGHT,
                          text: String(d.amount ?? 0),
                        }),
                      ],
                    }),
                  ],
                })
            ),
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [
                    new DocxParagraph({ children: [new DocxTextRun({ text: "Total Deductions", bold: true })] }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new DocxParagraph({
                      alignment: DocxAlignmentType.RIGHT,
                      children: [
                        new DocxTextRun({
                          text: String(f.totalDeduction || 0),
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new DocxParagraph({}),
        new DocxTable({
          width: { size: 100, type: DocxWidthType.PERCENTAGE },
          borders: {
            top: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            bottom: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            left: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            right: { style: DocxBorderStyle.SINGLE, size: 6, color: "000000" },
            insideHorizontal: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
            insideVertical: { style: DocxBorderStyle.SINGLE, size: 4, color: "AAAAAA" },
          },
          rows: [
            new DocxTableRow({
              children: [
                new DocxTableCell({
                  children: [
                    new DocxParagraph({ children: [new DocxTextRun({ text: "Net Salary (A - B)", bold: true })] }),
                  ],
                }),
                new DocxTableCell({
                  children: [
                    new DocxParagraph({
                      alignment: DocxAlignmentType.RIGHT,
                      children: [
                        new DocxTextRun({
                          text: String(f.netSalary || f.inhandSalary || 0),
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];

      const docx = new DocxDocument({
        sections: [
          {
            properties: {},
            children: docxSections,
          },
        ],
      });

      const docxBlob = await DocxPacker.toBlob(docx);
      saveAs(docxBlob, `Salary-${safeName}-${monthName}-${f.year}.docx`);
      toast.success("DOCX Downloaded");
    } catch (e) {
      console.error("DOCX generation failed:", e);
    }

  } catch (error) {
    console.error(error);
    toast.error("PDF download failed");
  }
};



  const handleDeleteClick = (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      toast.loading('Deleting salary...', { id: 'delete-salary' });
      await deleteSalaryMutation.mutateAsync(id);
      setDeleteConfirm(null);
      
      // Invalidate and refetch data after successful deletion
      if (employeeId) {
        // Invalidate employee-specific salaries cache
        queryClient.invalidateQueries({ queryKey: ['salaries', 'employee', employeeId] });
        await refetchEmployeeSalaries();
      } else {
        // Invalidate all salaries cache
        queryClient.invalidateQueries({ queryKey: ['salaries'] });
        await refetchAllSalaries();
      }
      
      toast.success('Salary deleted successfully', { id: 'delete-salary' });
    } catch (error) {
      console.error('Error deleting salary:', error);
      toast.error('Failed to delete salary', { id: 'delete-salary' });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const filteredSalaries = salaries.filter(salary => {
    const matchesSearch = 
      salary.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      salary.employmentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMonth = monthFilter === 'all' || salary.month === parseInt(monthFilter);
    const matchesYear = yearFilter === 'all' || salary.year === parseInt(yearFilter);
    
    const matchesEmployeeId = employeeId ? salary.employeeId === employeeId : true;
    
    return matchesSearch && matchesMonth && matchesYear && matchesEmployeeId;
  });

  // Pagination logic
  const totalItems = filteredSalaries.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSalaries = filteredSalaries.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, yearFilter, employeeId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [{ value: 'all', label: 'All Years' }];
    for (let year = currentYear; year >= currentYear - 10; year--) {
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Employees', href: '/employees' },
        ...(employeeId
          ? [
              { label: employeeName || 'Loading...', href: `/employees/${employeeId}` },
              { label: 'Employment', href: resolvedEmploymentId ? `/employments/${resolvedEmploymentId}` : `/employees/${employeeId}` },
              { label: 'Salary', href: `/salaries?employeeId=${employeeId}&from=employment`, isCurrent: true },
            ]
          : [
              { label: 'Salary', href: '/salaries', isCurrent: true },
            ])
      ]}
    >
      <Toaster position="top-center" />
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Salary"
          total={filteredSalaries.length}
          searchValue={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          searchPlaceholder="Search"
          showStats={false}
          showSearch={true}
          showFilter={true}
          filterValue={monthFilter}
          onFilterChange={setMonthFilter}
          filterOptions={[
            { value: 'all', label: 'All Months' },
            { value: '1', label: 'January' },
            { value: '2', label: 'February' },
            { value: '3', label: 'March' },
            { value: '4', label: 'April' },
            { value: '5', label: 'May' },
            { value: '6', label: 'June' },
            { value: '7', label: 'July' },
            { value: '8', label: 'August' },
            { value: '9', label: 'September' },
            { value: '10', label: 'October' },
            { value: '11', label: 'November' },
            { value: '12', label: 'December' }
          ]}
          showSecondFilter={true}
          secondFilterValue={yearFilter}
          onSecondFilterChange={setYearFilter}
          secondFilterOptions={getYearOptions()}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
          actionButtons={[
            { 
              label: 'Add Salary', 
              icon: <FiPlus />, 
              variant: 'success' as const, 
              href: employeeId
                ? `/salaries/add?employeeId=${employeeId}${from === 'employment' ? '&from=employment' : ''}`
                : '/salaries/add'
            }
          ]}
          backButton={{
            onClick: () => {
              if (employeeId) {
                // If we’re viewing salaries from an employment context and have a resolved employment,
                // go back to that specific Employment Details page. Otherwise go back to the employee.
                if (from === 'employment' && resolvedEmploymentId) {
                  router.push(`/employments/${resolvedEmploymentId}`);
                } else {
                  router.push(`/employees/${employeeId}`);
                }
              } else {
                router.push('/employees');
              }
            },
          }}
          headerClassName="px-6 pt-6 pb-6"
        />

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leaves Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Salary (A)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Deductions (B)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSalaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthName(salary.month)} {salary.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(salary as any).workDays ?? (salary as any).workingDays ?? (salary as any).totalWorkingDays ?? (salary as any).monthDays ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(salary as any).leavesCount ?? (salary as any).totalLeaves ?? '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((salary as any).grossSalary ?? salary.totalSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((salary as any).totalDeduction ?? (salary as any).totalDeductions ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{((salary as any).netSalary ?? salary.inhandSalary ?? 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {deleteConfirm === salary.id ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => confirmDelete(salary.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deleteSalaryMutation.isPending}
                        >
                          {deleteSalaryMutation.isPending ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={deleteSalaryMutation.isPending}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <ActionButton
                          icon={<FiDownload className="w-5 h-5" />}
                          title="Download Salary Details"
                          colorClass="bg-green-100 text-green-600 hover:text-green-900"
                          href={null as any}
                          onClick={()=> handleDownload(salary)}
                        />
                        <ActionButton
                          icon={<FiEye className="w-5 h-5" />}
                          title="View Salary Details"
                          colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                          href={`/salaries/${salary.id}${employeeId ? `?employeeId=${employeeId}` : ''}`}
                        />
                        <ActionButton
                          icon={<FiEdit className="w-5 h-5" />}
                          title="Edit Salary"
                          colorClass="bg-orange-100 text-orange-600 hover:text-orange-900"
                          href={`/salaries/${salary.id}/edit${employeeId ? `?employeeId=${employeeId}` : ''}`}
                        />
                        <ActionButton
                          icon={<FiTrash2 className="w-5 h-5" />}
                          title="Delete Salary"
                          colorClass="bg-red-100 text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(salary.id)}
                          as="button"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSalaries.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <FaRupeeSign className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {employeeId ? 'No salary records found' : 'No salaries found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || monthFilter !== 'all' || yearFilter !== 'all'
                  ? 'Try adjusting your search, month, or year filter.'
                  : 'Get started by adding a salary record.'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
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