'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { FiEye, FiEyeOff, FiLock, FiPhone } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import SocialMediaLinks from '@/components/ui/SocialMediaLinks';

type LoginFormValues = {
  phone: string;
  password: string;
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const { signInWithCredentials } = useAuth();
  const router = useRouter();

  const handleLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Debug: Form data submitted:', data);
      
      const formattedPhoneNumber = `+91${data.phone}`;
      console.log('🔍 Debug: Formatted phone number:', formattedPhoneNumber);
      
      toast.loading('Verifying credentials...', { id: 'login' });
      
      const result = await signInWithCredentials(formattedPhoneNumber, data.password);
      
      if (result.userType === 'admin' && result.admin && result.admin.active) {
        toast.success('Admin login successful!', { id: 'login' });
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/dashboard';
        router.push(redirectTo);
      } else if (result.userType === 'employee' && result.employee && result.employee.status === 'active') {
        toast.success('Employee login successful!', { id: 'login' });
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/employee-dashboard';
        router.push(redirectTo);
      } else {
        setError('Invalid credentials or access denied.');
        toast.error('Invalid credentials or access denied.', { id: 'login' });
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'login' });
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/login-bg-network.png')" }}
    >
      <div className="absolute inset-0 bg-slate-900/45" />
      <Toaster position="top-center" />
      <div className="max-w-md w-full space-y-6 sm:space-y-8 p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-white/60 relative z-10">
        <div className="text-center">
          {/* Logo, Company Name and Slogan */}
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <a 
              href="https://adysunventures.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center transition-colors cursor-pointer hover:opacity-80"
            >
              <Image
                src="/adysun-logo.png"
                alt="Adysun Ventures Logo"
                width={40}
                height={40}
                className="object-contain mr-2 sm:mr-3 sm:w-[50px] sm:h-[50px]"
                priority
              />
              <div className="flex flex-col items-start">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  ADYSUN VENTURES
                </span>
                <span className="text-sm sm:text-base text-gray-700 font-medium">
                  Inspire. Imagine. Implement.
                </span>
              </div>
            </a>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">HRMS Portal</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Enter your credentials to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md">
            {error}
          </div>
        )}

        <form 
          onSubmit={handleSubmit(handleLoginSubmit)}
          className="mt-6 sm:mt-8 space-y-4 sm:space-y-6"
        >
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                onKeyPress={(e) => {
                  // Only allow numbers
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                onPaste={(e) => {
                  // Prevent paste of non-numeric content
                  const pastedText = e.clipboardData.getData('text');
                  if (!/^[0-9]+$/.test(pastedText)) {
                    e.preventDefault();
                  }
                }}
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Please enter a valid 10-digit phone number'
                  }
                })}
                className="py-2.5 sm:py-3 pl-10 pr-3 sm:pr-4 block w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                placeholder="Enter mobile"
              />
            </div>
            {errors.phone && (
              <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 4,
                    message: 'Password must be at least 4 characters'
                  }
                })}
                className="py-2.5 sm:py-3 pl-10 pr-10 block w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-black text-base"
                placeholder="Enter password"
              />
              <span
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-500" />
                )}
              </span>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

        {/* Social Media Links */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <SocialMediaLinks variant="login" />
        </div>
      </div>
    </div>
  );
} 