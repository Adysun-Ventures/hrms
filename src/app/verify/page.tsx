'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

export default function VerifyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const phoneNumber = searchParams?.get('phone');
  const verificationId = searchParams?.get('verificationId');
  
  const { verifyOTP } = useAuth();
  
  // Set focus on the first input field when component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);
  
  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1); // Take only the first character
    setOtp(newOtp);
    
    // If a digit was entered and there's a next input, focus on it
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty and backspace is pressed, move to previous input
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } 
    // Handle left arrow key
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } 
    // Handle right arrow key
    else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!verificationId) {
      setError('Verification session expired. Please try again.');
      toast.error('Verification session expired. Please try again.');
      return;
    }

    const otpValue = otp.join('');
    
    // Check if OTP is complete
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      toast.error('Please enter all 6 digits of the verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      toast.loading('Verifying code...', { id: 'verifyingOtp' });
      
      const result = await verifyOTP(verificationId, otpValue);
      
      // Check if user is an admin
      if (result.admin && result.admin.active) {
        toast.success('Admin verification successful!', { id: 'verifyingOtp' });
      router.push('/dashboard');
      } else {
        setError('Access denied. Only admins can access this system.');
        toast.error('Access denied. Only admins can access this system.', { id: 'verifyingOtp' });
        setIsLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'Invalid verification code');
      toast.error(error.message || 'Invalid verification code', { id: 'verifyingOtp' });
      setIsLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content contains only digits
    if (!/^\d+$/.test(pastedData)) return;
    
    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });
    
    setOtp(newOtp);
    
    // Focus on the appropriate input after paste
    if (digits.length < 6) {
      inputRefs.current[digits.length]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Toaster position="top-center" />
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
          <p className="mt-2 text-gray-600">
            Enter the verification code sent to your phone
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mb-4">
              Verification Code
            </label>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  value={otp[index]}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black"
                  aria-label={`digit ${index + 1} of verification code`}
                />
              ))}
            </div>
            
            {phoneNumber && (
              <p className="mt-4 text-sm text-gray-600">
                We sent a verification code to +91 {phoneNumber}
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
              disabled={isLoading}
            >
              Change phone number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 