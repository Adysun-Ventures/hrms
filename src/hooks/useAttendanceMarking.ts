import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTodayAttendance, useMarkAttendanceCheckIn, useMarkAttendanceCheckOut } from '@/hooks/useAttendance';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import toast from 'react-hot-toast';

export const useAttendanceMarking = () => {
  const { currentUserData } = useAuth();
  const [employmentId, setEmploymentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Attendance hooks
  const {
    data: todayAttendance = {
      isCheckedIn: false,
      isCheckedOut: false,
      checkInTime: null,
      checkOutTime: null,
      checkInTimestamp: null,
      status: null,
      totalHours: 0
    },
    isLoading: todayAttendanceLoading,
    isError: todayError,
    error: todayErrorData
  } = useTodayAttendance(currentUserData?.id || '');

  const checkInMutation = useMarkAttendanceCheckIn();
  const checkOutMutation = useMarkAttendanceCheckOut();

  // Fetch employment ID on mount
  useEffect(() => {
    const fetchEmploymentId = async () => {
      if (!currentUserData?.id) return;

      try {
        const employmentQuery = query(
          collection(db, 'employments'),
          where('employeeId', '==', currentUserData.id)
        );
        const employmentSnapshot = await getDocs(employmentQuery);

        if (!employmentSnapshot.empty) {
          setEmploymentId(employmentSnapshot.docs[0].id);
        }
      } catch (error) {
        console.error('Error fetching employment ID:', error);
      }
    };

    fetchEmploymentId();
  }, [currentUserData?.id]);

  // Handle errors
  useEffect(() => {
    if (todayError && todayErrorData) {
      console.error('Today attendance error:', todayErrorData);
      toast.error('Failed to load today\'s attendance');
    }
  }, [todayError, todayErrorData]);

  // Real-time updates for today's attendance hours
  useEffect(() => {
    // Only run interval when checked in but not checked out
    if (!todayAttendance.isCheckedIn || todayAttendance.isCheckedOut) {
      return;
    }

    // Update immediately on mount/change
    setCurrentTime(new Date());

    // Update every 60 seconds for real-time updates
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, [todayAttendance.isCheckedIn, todayAttendance.isCheckedOut]);

  // Helper function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (timeString: string | undefined): string => {
    if (!timeString) return '--';

    try {
      // If it's already in 12-hour format, return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString;
      }

      // If it's in 24-hour format (HH:MM), convert to 12-hour
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
      }

      return timeString;
    } catch {
      return timeString;
    }
  };

  // Helper function to calculate real-time hours from checkInTimestamp
  const calculateRealtimeHours = (checkInTimestamp: any): number => {
    if (!checkInTimestamp) return 0;

    try {
      // Convert Firestore timestamp to Date
      let checkInDate: Date;
      if (checkInTimestamp && typeof checkInTimestamp === 'object') {
        // Firestore Timestamp object
        if ('toDate' in checkInTimestamp && typeof checkInTimestamp.toDate === 'function') {
          checkInDate = checkInTimestamp.toDate();
        } else if ('seconds' in checkInTimestamp) {
          // Firestore Timestamp with seconds property
          checkInDate = new Date(checkInTimestamp.seconds * 1000);
        } else {
          checkInDate = new Date(checkInTimestamp as any);
        }
      } else {
        checkInDate = new Date(checkInTimestamp as any);
      }

      // Calculate difference in hours
      const diffMs = currentTime.getTime() - checkInDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Round to 2 decimal places
      return Math.max(0, Math.round(diffHours * 100) / 100);
    } catch (error) {
      console.error('Error calculating real-time hours:', error);
      return 0;
    }
  };

  // Calculate total hours for today if checked in
  const calculateTodayHours = (): number => {
    if (!todayAttendance?.isCheckedIn || !todayAttendance?.checkInTimestamp) {
      return 0;
    }

    if (todayAttendance.isCheckedOut && todayAttendance.totalHours) {
      return todayAttendance.totalHours;
    }

    // Calculate real-time hours
    return calculateRealtimeHours(todayAttendance.checkInTimestamp);
  };

  const handleCheckIn = async () => {
    try {
      if (!currentUserData?.id) {
        throw new Error('Employee ID not found.');
      }

      // Get employment ID for the employee
      let empId = employmentId;
      
      if (!empId) {
        const employmentQuery = query(
          collection(db, 'employments'),
          where('employeeId', '==', currentUserData.id)
        );
        const employmentSnapshot = await getDocs(employmentQuery);

        if (employmentSnapshot.empty) {
          throw new Error('No employment record found for this employee.');
        }

        empId = employmentSnapshot.docs[0].id;
        setEmploymentId(empId);
      }

      // Mark attendance check-in
      await checkInMutation.mutateAsync({
        employeeId: currentUserData.id,
        employmentId: empId
      });

      toast.success('Check-in successful!');
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-in failed. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    try {
      if (!currentUserData?.id) {
        throw new Error('Employee ID not found.');
      }

      // Mark attendance check-out
      await checkOutMutation.mutateAsync(currentUserData.id);

      toast.success('Check-out successful!');
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error(error instanceof Error ? error.message : 'Check-out failed. Please try again.');
    }
  };

  return {
    // Data
    todayAttendance,
    todayAttendanceLoading,
    employmentId,
    currentTime,
    
    // Mutations
    checkInMutation,
    checkOutMutation,
    
    // Functions
    handleCheckIn,
    handleCheckOut,
    calculateTodayHours,
    calculateRealtimeHours,
    formatTimeTo12Hour
  };
};

