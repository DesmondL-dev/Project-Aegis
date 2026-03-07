import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText, CheckCircle, Lock, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { RequireRole } from '../../auth/components/RequireRole';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useFocusTrap } from '../../../core/hooks/useFocusTrap';
import { useDrawerHistory } from '../../../core/hooks/useDrawerHistory';
import { auditSchema, type AuditPayload } from '../schemas/auditSchema';
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
  const role = useAuthStore((state) => state.user?.role);
  const [isRevealed, setIsRevealed] = useState(false);
  const drawerRef     = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(drawerRef, isOpen, onClose, { firstFocusRef });
  useDrawerHistory(isOpen, onClose);

  const {
    register,
    handleSubmit,
    reset,
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
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-text-muted" />
            <h2 className="text-sm font-semibold text-text-primary">Audit Annotation</h2>
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
            <textarea
              id="audit-notes"
              {...register('notes')}
              rows={8}
              placeholder="Document the rationale for this transaction review. All input is HTML-sanitized before persistence."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[16px] md:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-focus transition-colors"
            />
            {errors.notes && (
              <p className="text-xs text-red-500">{errors.notes.message}</p>
            )}
            <p className="text-xs text-text-muted text-right">Max 1,000 characters</p>
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
            <div className="flex flex-wrap gap-2" role="group" aria-label="Administrator account actions">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
              >
                <Lock className="w-4 h-4" />
                Freeze Account
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <RotateCcw className="w-4 h-4" />
                Initiate Recovery
              </button>
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
              disabled={isSubmitting}
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
