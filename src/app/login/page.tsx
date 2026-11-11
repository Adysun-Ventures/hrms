
import { useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { useForm } from 'react-hook-form';
import SocialMediaLinks from '@/components/ui/SocialMediaLinks';
import { FiEye, FiEyeOff, FiLock, FiPhone } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';

type LoginFormValues = {
  phone: string;
  password: string;
};

/** Only same-site paths are allowed as post-login redirects (blocks `?redirect=https://evil`). */
const safeRedirect = (fallback: string) => {
  const target = new URLSearchParams(window.location.search).get('redirect') || '';
  return target.startsWith('/') && !target.startsWith('//') && !target.startsWith('/login') ? target : fallback;
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();
  const { signInWithCredentials, logout, currentAdmin, currentEmployee } = useAuth();
  const router = useRouter();
  // Already signed in when the page opens -> straight to the dashboard (was middleware.ts).
  const [homeAtOpen] = useState(() => (currentAdmin ? '/dashboard' : currentEmployee ? '/employee-dashboard' : null));

  const handleLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithCredentials(`+91${data.phone}`, data.password);

      if (result.userType === 'admin' && result.admin?.active) {
        router.replace(safeRedirect('/dashboard'));
        return;
      }
      if (result.userType === 'employee' && result.employee?.status === 'active') {
        router.replace(safeRedirect('/employee-dashboard'));
        return;
      }
      // Signed in but not allowed (e.g. inactive employee): don't leave a session behind.
      await logout();
      setError('Invalid credentials or access denied.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
    setIsLoading(false);
  };

  if (homeAtOpen) return <Navigate to={safeRedirect(homeAtOpen)} replace />;

  const inputClass =
    'block w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-base placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20';

  return (
    <div className="app-shell min-h-screen flex items-center justify-center p-4 bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <a
          href="https://adysunventures.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 mb-6"
        >
          <img src="/adysun-logo.png" alt="Adysun Ventures" width={44} height={44} className="object-contain" />
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-slate-900 tracking-wide">ADYSUN VENTURES</span>
            <span className="text-xs text-slate-500">Inspire. Imagine. Implement.</span>
          </span>
        </a>

        <h1 className="text-lg font-bold text-slate-900">Sign in to HRMS</h1>
        <p className="text-sm text-slate-500 mb-5">Enter your mobile number and password.</p>

        {error && (
          <div role="alert" className="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mobile
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiPhone className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                maxLength={10}
                {...register('phone', {
                  required: 'Mobile number is required',
                  pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit mobile number' },
                  setValueAs: (v: string) => String(v || '').replace(/\D/g, ''),
                })}
                className={inputClass}
                placeholder="10-digit mobile"
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 4, message: 'Password must be at least 4 characters' },
                })}
                className={`${inputClass} pr-10`}
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200">
          <SocialMediaLinks variant="login" />
        </div>
      </div>
    </div>
  );
}
