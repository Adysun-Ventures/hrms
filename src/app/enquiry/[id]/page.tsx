"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/config";
import { formatDateToDayMonYear } from "@/utils/documentUtils";
import DashboardLayout from '@/components/layout/DashboardLayout';
import TableHeader from '@/components/ui/TableHeader';
import { FiTrash2 } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

interface Enquiry {
  id: string;
  name?: string;
  mobile?: string;
  email?: string;
  pan?: string;
  passoutYear?: string;
  technology?: string;
  role?: string;
  totalWorkExperience?: string;
  interestedIn?: string;
  message: string;
  createdAt?: { seconds: number; nanoseconds: number } | string;
}

export default function EnquiryViewPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getDoc(doc(db, "enquiries", id))
      .then((docSnap) => {
        if (docSnap.exists()) {
          setEnquiry({ id: docSnap.id, ...docSnap.data() } as Enquiry);
        } else {
          setError("Enquiry not found");
        }
      })
      .catch(() => setError("Failed to load enquiry"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeleteClick = () => {
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!id) {
      toast.error('Enquiry ID not found');
      return;
    }
    
    try {
      setIsDeleting(true);
      toast.loading('Deleting enquiry...', { id: 'delete-enquiry' });
      await deleteDoc(doc(db, "enquiries", id));
      toast.success('Enquiry deleted successfully', { id: 'delete-enquiry' });
      router.push('/dashboard/enquiries');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete enquiry';
      toast.error(errorMessage, { id: 'delete-enquiry' });
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  return (
    <DashboardLayout
      breadcrumbItems={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Enquiries', href: '/dashboard/enquiries' },
        { label: enquiry?.name || 'Anonymous', isCurrent: true },
      ]}
    >
      <Toaster position="top-center" />
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && enquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Enquiry</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the enquiry from{" "}
              <span className="font-semibold">{enquiry.name || "Anonymous"}</span>? This action cannot be undone.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 mb-6 space-y-2">
              <p><span className="font-medium">Email:</span> {enquiry.email || "-"}</p>
              <p><span className="font-medium">Mobile:</span> {enquiry.mobile || "-"}</p>
              {enquiry.technology && (
                <p><span className="font-medium">Technology:</span> {enquiry.technology}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <TableHeader
          title="Enquiry Details"
          backButton={{ onClick: () => router.back(), label: 'Back' }}
          showStats={false}
          showSearch={false}
          showFilter={false}
          headerClassName="px-6 pt-6 mb-0"
          searchValue=""
          onSearchChange={() => {}}
          actionButtons={[
            {
              label: 'Delete',
              icon: <FiTrash2 />,
              variant: 'danger' as const,
              onClick: handleDeleteClick,
              disabled: isDeleting || loading
            }
          ]}
        />
        <div className="px-6 pb-6">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : enquiry ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {/* Name - Always show (required field) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-lg font-semibold text-gray-900">{enquiry.name || 'Anonymous'}</div>
                  <div className="text-sm text-gray-500 mt-2">Name</div>
                </div>
                
                {/* Mobile - Only show if exists */}
                {enquiry.mobile && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.mobile}</div>
                    <div className="text-sm text-gray-500 mt-2">Mobile</div>
                  </div>
                )}
                
                {/* PAN - Only show if exists */}
                {enquiry.pan && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.pan}</div>
                    <div className="text-sm text-gray-500 mt-2">PAN Number</div>
                  </div>
                )}
                
                {/* Passout Year - Only show if exists */}
                {enquiry.passoutYear && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.passoutYear}</div>
                    <div className="text-sm text-gray-500 mt-2">Passout Year</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Interested In - Only show if exists */}
                {enquiry.interestedIn && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.interestedIn}</div>
                    <div className="text-sm text-gray-500 mt-2">Interested In</div>
                  </div>
                )}
                
                {/* Technology - Only show if exists */}
                {enquiry.technology && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.technology}</div>
                    <div className="text-sm text-gray-500 mt-2">Technology</div>
                  </div>
                )}
                
                {/* Role - Only show if exists */}
                {enquiry.role && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.role}</div>
                    <div className="text-sm text-gray-500 mt-2">Role</div>
                  </div>
                )}
                
                {/* Total Work Experience - Only show if exists */}
                {enquiry.totalWorkExperience && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.totalWorkExperience}</div>
                    <div className="text-sm text-gray-500 mt-2">Total Work Experience</div>
                  </div>
                )}
              </div>

              {/* Email - Only show if exists */}
              {enquiry.email && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">{enquiry.email}</div>
                    <div className="text-sm text-gray-500 mt-2">Email</div>
                  </div>
                </div>
              )}

              {/* Submitted On - Only show if exists */}
              {enquiry.createdAt && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">
                      {formatDateToDayMonYear(
                        typeof enquiry.createdAt === "string"
                          ? enquiry.createdAt
                          : new Date(enquiry.createdAt.seconds * 1000)
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Submitted On</div>
                  </div>
                </div>
              )}

              {/* Message - Always show (required field) */}
              {enquiry.message && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-base text-gray-900 whitespace-pre-line">
                    {enquiry.message}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">Message</div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
} 