import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { loginSchema, type LoginPayload } from '../schemas/loginSchema';
import { useAuthStore } from '../store/useAuthStore';

// Cryptographic Handshake phase — derived state for Vault Zero-Trust submission UX.
// Zod schema validation is the gate; no phase transition without a valid payload.
type HandshakePhase = 'idle' | 'verifying' | 'issuing' | 'secured';

const HANDSHAKE_STEPS: { phase: HandshakePhase; label: string }[] = [
  { phase: 'verifying', label: '[ Verifying 2FA Integrity... ]' },
  { phase: 'issuing',   label: '[ Issuing JWT Payload... ]' },
  { phase: 'secured',   label: '[ Connection Secured. ]' },
];

// Prevent race conditions via async sleep — deterministic sequential await
// eliminates multiple-setTimeout closure traps.
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Pure Presentation Page implementing the View Layer for Zero-Trust Auth
// Self-contained with its own viewport mounting container and routing dispatcher.
export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Trigger validation early to prevent unnecessary submit cycles
  });

  const performMockLogin = useAuthStore((state) => state.performMockLogin);
  const navigate = useNavigate();
  const [handshakePhase, setHandshakePhase] = useState<HandshakePhase>('idle');

  // Orchestrate cryptographic handshake sequence.
  // Invoked only after Zod validation clears — no animation without a clean payload.
  // Sequential await pattern guarantees strict phase ordering without closure traps.
  const onSubmit = async (payload: LoginPayload) => {
    setHandshakePhase('verifying');
    await sleep(500);

    setHandshakePhase('issuing');
    await sleep(500);

    setHandshakePhase('secured');
    await sleep(500);

    // Hydrate auth store and dispatch router — post-handshake teardown of the Vault gate.
    performMockLogin(payload.email);
    await sleep(200);
    navigate('/', { replace: true });
  };

  const inHandshake = handshakePhase !== 'idle';
  const currentLabel =
    HANDSHAKE_STEPS.find((s) => s.phase === handshakePhase)?.label ?? '';

  return (
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
          {inHandshake ? (
            // Vault overlay — solid high-contrast panel replaces form during handshake.
            // No backdrop-blur to preserve razor-sharp terminal typography.
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ease: 'linear', duration: 0.3 }}
              className="flex flex-col items-center justify-center min-h-[240px] rounded-lg border border-slate-700 bg-slate-950"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={handshakePhase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ ease: 'linear', duration: 0.25 }}
                  className="flex items-center gap-3"
                >
                  {/* Bloomberg-terminal cursor block — blink signals active processing */}
                  <span
                    className={
                      handshakePhase === 'secured'
                        ? 'animate-pulse text-teal-400 text-base leading-none'
                        : 'animate-pulse text-slate-400 text-base leading-none'
                    }
                  >
                    █
                  </span>
                  <span
                    className={
                      handshakePhase === 'secured'
                        ? 'font-mono text-sm tracking-widest text-teal-400 drop-shadow-[0_0_6px_rgba(45,212,191,0.7)]'
                        : 'font-mono text-sm tracking-widest text-slate-300'
                    }
                  >
                    {currentLabel}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : (
            <>
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
                    autoComplete="username"
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
                    autoComplete="current-password"
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
            </>
          )}
        </form>
      </div>
    </div>
  );
};
