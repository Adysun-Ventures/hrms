import { getAdminDataForAudit } from '@/utils/firebaseUtils';

export const useAuditTrail = () => {
  const getAuditFields = () => {
    const { adminId, currentTimestamp } = getAdminDataForAudit();
    return {
      updatedAt: currentTimestamp,
      updatedBy: adminId,
    };
  };

  const getCreateAuditFields = () => {
    const { adminId, currentTimestamp } = getAdminDataForAudit();
    return {
      createdAt: currentTimestamp,
      createdBy: adminId,
      updatedAt: currentTimestamp,
      updatedBy: adminId,
    };
  };

  return {
    getAuditFields,
    getCreateAuditFields,
  };
}; 