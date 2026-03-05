import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginPayload } from '../schemas/loginSchema';
import { useAuthStore } from '../store/useAuthStore';

// Pure Presentation Page implementing the View Layer for Zero-Trust Auth
// Now self-contained with its own viewport mounting container and routing dispatcher
export const LoginForm = () => {
  // Mount the form state machine with Zod resolver for pre-hydration payload validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Trigger validation early to prevent unnecessary submit cycles
  });

  // Hydrate global state machine dispatcher
  const setAuthPayload = useAuthStore((state) => state.setAuthPayload);
  
  // Initialize router navigation dispatcher
  const navigate = useNavigate();

  // Mock authentication dispatcher (To be replaced with actual API call)
  const onSubmit = async (payload: LoginPayload) => {
    // Simulate network latency for UX predictability
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Construct a mock User payload strictly adhering to the AuthState contract
    const mockUser = {
      id: 'usr_mock_001',
      email: payload.email,
      role: 'RISK_MANAGER' as const, // Forcing literal type to satisfy the union requirement
    };

    // Inject mock JWT token and User into the secure state machine
    console.warn('Mock Auth Execution: Hydrating global state with payload.', { token: 'mock_jwt_token_aegis_x19', user: mockUser });
    setAuthPayload('mock_jwt_token_aegis_x19', mockUser);

    // Trigger physical route redirection to the protected dashboard
    // Using 'replace: true' prevents the user from hitting the browser back button to return to the login screen
    navigate('/', { replace: true });
  };

  return (
    // Re-injected the physical centering viewport container
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md p-8 space-y-8 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Aegis Gateway
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Zero-Trust Authentication Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Payload Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Clearance ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-slate-400"
                placeholder="analyst@aegis.bank.com"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Payload Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Passphrase
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                {...register('password')}
                type="password"
                className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:ring-slate-400"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 font-semibold text-white transition-colors rounded-lg bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verifying Payload...' : 'Initialize Session'}
          </button>
        </form>
      </div>
    </div>
  );
};