"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { formatDateToDayMonYear } from "@/utils/documentUtils";
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import { ActionButton } from '@/components/ui/ActionButton';
import { FiEye, FiTrash2, FiCopy, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import toast, { Toaster } from 'react-hot-toast';

interface Enquiry {
  id: string;
  name?: string;
  mobile?: string;
  pan?: string;
  email?: string;
  passoutYear?: string;
  technology?: string;
  role?: string;
  totalWorkExperience?: string;
  message: string;
  createdAt?: { seconds: number; nanoseconds: number } | string;
}

export default function EnquiryListPage() {
  const { currentAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [technologyFilter, setTechnologyFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  // Filter options from the candidate enquiry form
  const technologyOptions = [
    { value: "", label: "All Tech." },
    { value: "React", label: "React" },
    { value: "Angular", label: "Angular" },
    { value: "Vue.js", label: "Vue.js" },
    { value: "Node.js", label: "Node.js" },
    { value: "Python", label: "Python" },
    { value: "Java", label: "Java" },
    { value: "C#", label: "C#" },
    { value: "PHP", label: "PHP" },
    { value: "Ruby", label: "Ruby" },
    { value: "Go", label: "Go" },
    { value: "Swift", label: "Swift" },
    { value: "Kotlin", label: "Kotlin" },
    { value: "Flutter", label: "Flutter" },
    { value: "React Native", label: "React Native" },
    { value: "AWS", label: "AWS" },
    { value: "Azure", label: "Azure" },
    { value: "Google Cloud", label: "Google Cloud" },
    { value: "Docker", label: "Docker" },
    { value: "Kubernetes", label: "Kubernetes" },
    { value: "MongoDB", label: "MongoDB" },
    { value: "PostgreSQL", label: "PostgreSQL" },
    { value: "MySQL", label: "MySQL" },
    { value: "Redis", label: "Redis" },
    { value: "Other", label: "Other" },
  ];

  const roleOptions = [
    { value: "", label: "All Roles" },
    { value: "Frontend Developer", label: "Frontend Developer" },
    { value: "Backend Developer", label: "Backend Developer" },
    { value: "Full Stack Developer", label: "Full Stack Developer" },
    { value: "Mobile Developer", label: "Mobile Developer" },
    { value: "DevOps Engineer", label: "DevOps Engineer" },
    { value: "Data Scientist", label: "Data Scientist" },
    { value: "Data Engineer", label: "Data Engineer" },
    { value: "Machine Learning Engineer", label: "Machine Learning Engineer" },
    { value: "UI/UX Designer", label: "UI/UX Designer" },
    { value: "Product Manager", label: "Product Manager" },
    { value: "Project Manager", label: "Project Manager" },
    { value: "QA Engineer", label: "QA Engineer" },
    { value: "Software Architect", label: "Software Architect" },
    { value: "System Administrator", label: "System Administrator" },
    { value: "Database Administrator", label: "Database Administrator" },
    { value: "Security Engineer", label: "Security Engineer" },
    { value: "Business Analyst", label: "Business Analyst" },
    { value: "Technical Lead", label: "Technical Lead" },
    { value: "Team Lead", label: "Team Lead" },
    { value: "Other", label: "Other" },
  ];

  const experienceOptions = [
    { value: "", label: "All Exp." },
    { value: "Fresher", label: "Fresher (0 years)" },
    { value: "1 year", label: "1 year" },
    { value: "2 years", label: "2 years" },
    { value: "3 years", label: "3 years" },
    { value: "4 years", label: "4 years" },
    { value: "5 years", label: "5 years" },
    { value: "6-8 years", label: "6-8 years" },
    { value: "9-12 years", label: "9-12 years" },
    { value: "13+ years", label: "13+ years" },
  ];

  const fetchEnquiries = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError(null);
    } else {
      setIsReloading(true);
    }
      try {
        const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data: Enquiry[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Enquiry[];
        setEnquiries(data);
        setFilteredEnquiries(data);
      if (!showLoading) {
        toast.success('Enquiries refreshed');
      }
      } catch (err: unknown) {
        console.error("Error fetching enquiries:", err);
      if (showLoading) {
        setError("Failed to load enquiries");
      } else {
        toast.error("Failed to refresh enquiries");
      }
      } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        setIsReloading(false);
      }
      }
    };

  useEffect(() => {
    fetchEnquiries(true);
  }, []);

  // Filter enquiries based on search term and filters
  useEffect(() => {
    let filtered = enquiries;

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((enquiry) =>
        enquiry.name?.toLowerCase().includes(searchLower) ||
        enquiry.mobile?.includes(searchTerm) ||
        enquiry.email?.toLowerCase().includes(searchLower) ||
        enquiry.pan?.toLowerCase().includes(searchLower) ||
        enquiry.technology?.toLowerCase().includes(searchLower) ||
        enquiry.role?.toLowerCase().includes(searchLower) ||
        enquiry.message?.toLowerCase().includes(searchLower)
      );
    }

    // Technology filter
    if (technologyFilter) {
      filtered = filtered.filter((enquiry) => enquiry.technology === technologyFilter);
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((enquiry) => enquiry.role === roleFilter);
    }

    // Experience filter
    if (experienceFilter) {
      filtered = filtered.filter((enquiry) => enquiry.totalWorkExperience === experienceFilter);
    }

    // Sort by createdAt (newest first)
    filtered.sort((a, b) => {
      const getDateValue = (enquiry: Enquiry): number => {
        if (!enquiry.createdAt) return 0;
        if (typeof enquiry.createdAt === 'string') {
          return new Date(enquiry.createdAt).getTime();
        }
        // Firestore timestamp object
        return enquiry.createdAt.seconds * 1000 + enquiry.createdAt.nanoseconds / 1000000;
      };
      
      const dateA = getDateValue(a);
      const dateB = getDateValue(b);
      
      // Sort in descending order (newest first)
      return dateB - dateA;
    });

    setFilteredEnquiries(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [enquiries, searchTerm, technologyFilter, roleFilter, experienceFilter]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">Checking permissions...</div>
      </DashboardLayout>
    );
  }

  if (!currentAdmin) {
    if (typeof window !== 'undefined') {
      router.replace('/login');
    }
    return null;
  }

  const totalItems = filteredEnquiries.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTechnologyFilter("");
    setRoleFilter("");
    setExperienceFilter("");
  };

  const openDeleteModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedEnquiry(null);
    setIsDeleting(false);
  };

  const handleDeleteEnquiry = async () => {
    if (!selectedEnquiry) return;
    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, "enquiries", selectedEnquiry.id));

      setEnquiries(prev => prev.filter(enquiry => enquiry.id !== selectedEnquiry.id));
      setFilteredEnquiries(prev => prev.filter(enquiry => enquiry.id !== selectedEnquiry.id));
      toast.success("Enquiry deleted successfully");
      setIsDeleting(false);
      closeDeleteModal();
    } catch (deleteError) {
      console.error("Failed to delete enquiry:", deleteError);
      toast.error("Failed to delete enquiry. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Enquiries', isCurrent: true },
      ]}
    >
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Enquiries"
          backButton={{ href: '/dashboard' }}
          showStats={true}
          showSearch={true}
          showFilter={false}
          headerClassName="px-6 pt-6 mb-0"
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          total={totalItems}
          searchPlaceholder="Search"
          // Custom filters
          showCustomFilters={true}
          technologyFilterValue={technologyFilter}
          onTechnologyFilterChange={setTechnologyFilter}
          technologyFilterOptions={technologyOptions}
          roleFilterValue={roleFilter}
          onRoleFilterChange={setRoleFilter}
          roleFilterOptions={roleOptions}
          experienceFilterValue={experienceFilter}
          onExperienceFilterChange={setExperienceFilter}
          experienceFilterOptions={experienceOptions}
          onClearFilters={clearFilters}
          hasActiveFilters={!!(searchTerm || technologyFilter || roleFilter || experienceFilter)}
          customReloadButton={
            <button
              onClick={() => {
                fetchEnquiries(false);
              }}
              className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-3 py-2 rounded-md flex items-center justify-center transition-colors duration-200"
              title="Reload"
            >
              <FiRefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
            </button>
          }
          actionButtons={[
            {
              label: 'Copy Link',
              icon: <FiCopy className="w-4 h-4" />,
              variant: 'info' as const,
              onClick: () => {
                const currentDomain = window.location.origin;
                const enquiryLink = `${currentDomain}/enquiry/`;
                navigator.clipboard.writeText(enquiryLink);
                toast.success('Enquiry form link copied!');
              }
            }
          ]}
        />
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {enquiries.length === 0 ? "No enquiries found." : "No enquiries match your filters."}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="p-4 space-y-4">
                {paginatedEnquiries.map((enquiry) => (
                  <div key={enquiry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {enquiry.name || "Anonymous"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{enquiry.technology || "No tech specified"}</p>
                      </div>
                      <div className="flex space-x-2">
                        <ActionButton
                          icon={<FiEye className="w-4 h-4" />}
                          title="View Details"
                          colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                          href={`/enquiry/${enquiry.id}`}
                        />
                        <ActionButton
                          icon={<FiTrash2 className="w-4 h-4" />}
                          title="Delete"
                          colorClass="bg-red-100 text-red-600 hover:text-red-900"
                              onClick={() => openDeleteModal(enquiry)}
                          as="button"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Mobile:</span>
                        <p className="text-gray-900">{enquiry.mobile || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="text-gray-900">{enquiry.email || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">PAN:</span>
                        <p className="text-gray-900">{enquiry.pan || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <p className="text-gray-900">{enquiry.role || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Experience:</span>
                        <p className="text-gray-900">{enquiry.totalWorkExperience || "-"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="text-gray-900">
                          {enquiry.createdAt
                            ? formatDateToDayMonYear(
                                typeof enquiry.createdAt === "string"
                                  ? enquiry.createdAt
                                  : new Date(
                                      enquiry.createdAt.seconds * 1000
                                    )
                              )
                            : "-"}
                        </p>
                      </div>
                    </div>
                    
                    {enquiry.message && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-gray-500 text-sm">Message:</span>
                        <p className="text-gray-900 text-sm mt-1 line-clamp-2">{enquiry.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technology
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEnquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {enquiry.name || "Anonymous"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enquiry.mobile || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enquiry.technology || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enquiry.role || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {enquiry.totalWorkExperience || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-3">
                          <ActionButton
                            icon={<FiEye className="w-5 h-5" />}
                            title="View Enquiry Details"
                            colorClass="bg-blue-100 text-blue-600 hover:text-blue-900"
                            href={`/enquiry/${enquiry.id}`}
                          />
                          <ActionButton
                            icon={<FiTrash2 className="w-5 h-5" />}
                            title="Delete"
                            colorClass="bg-red-100 text-red-600 hover:text-red-900"
                            onClick={() => openDeleteModal(enquiry)}
                            as="button"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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
      <Toaster />

      {isDeleteModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Enquiry</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the enquiry from{" "}
              <span className="font-semibold">{selectedEnquiry.name || "Anonymous"}</span>? This action cannot be undone.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mb-6 space-y-2">
              <p><span className="font-medium">Email:</span> {selectedEnquiry.email || "-"}</p>
              <p><span className="font-medium">Mobile:</span> {selectedEnquiry.mobile || "-"}</p>
              {selectedEnquiry.technology && (
                <p><span className="font-medium">Technology:</span> {selectedEnquiry.technology}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEnquiry}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
