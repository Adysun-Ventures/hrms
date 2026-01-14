import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface ProfileUpdateData {
  name: string;
  email: string;
  phone?: string;
  mobile?: string;
}

export async function updateUserProfile(
  userId: string, 
  data: ProfileUpdateData, 
  userType: 'admin' | 'employee'
): Promise<void> {
  try {
    const collection = userType === 'admin' ? 'admins' : 'employees';
    const userRef = doc(db, collection, userId);
    
    // Prepare update data based on user type
    const updateData = userType === 'admin' 
      ? {
          name: data.name.trim(),
          email: data.email.trim(),
          mobile: data.mobile?.trim() || data.phone?.trim()
        }
      : {
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || data.mobile?.trim()
        };

    await updateDoc(userRef, updateData);
    console.log(`✅ Profile updated successfully for ${userType}:`, userId);
  } catch (error) {
    console.error(`❌ Error updating ${userType} profile:`, error);
    throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function validateProfileData(data: ProfileUpdateData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate name
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate phone/mobile
  const phone = data.phone || data.mobile;
  const phoneRegex = /^\d{10}$/;
  if (!phone || !phoneRegex.test(phone.replace(/\D/g, ''))) {
    errors.phone = 'Phone number must be exactly 10 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
