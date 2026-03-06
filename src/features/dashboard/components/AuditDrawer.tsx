import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText, CheckCircle } from 'lucide-react';
import { auditSchema, type AuditPayload } from '../schemas/auditSchema';

interface AuditDrawerProps {
  isOpen:          boolean;
  onClose:         () => void;
  transactionId:   string | null;
}

// Focusable selector — all interactive elements that participate in the
// Tab cycle within the drawer's focus trap boundary.
const FOCUS_TRAP_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// AuditDrawer — AODA-compliant sliding panel for KYC transaction annotation.
//
// Focus Trap: When the drawer opens, keyboard focus is confined to its interior.
// This prevents screen reader users and keyboard navigators from inadvertently
// interacting with the obscured background content — a WCAG 2.1 SC 2.1.2 requirement.
//
// aria-live="polite": The status region announces form submission outcomes
// without interrupting the current screen reader narration context.
export const AuditDrawer = ({ isOpen, onClose, transactionId }: AuditDrawerProps) => {
  const drawerRef       = useRef<HTMLDivElement>(null);
  const firstFocusRef   = useRef<HTMLButtonElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<AuditPayload>({
    resolver: zodResolver(auditSchema),
  });

  // Focus Trap implementation — intercepts Tab / Shift+Tab keydown events
  // and cycles focus within the drawer boundary when isOpen is true.
  // Teardown: event listener is removed on close or unmount to prevent ghost handlers.
  useEffect(() => {
    if (!isOpen) return;

    // Hydrate focus to the primary close affordance on open
    firstFocusRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const drawer   = drawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUS_TRAP_SELECTOR)
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: wrap from first element back to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: wrap from last element forward to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // History API Hijacking — intercept iOS Safari edge-swipe-to-go-back so the
  // gesture closes the drawer instead of navigating out of the app. When the
  // drawer opens we push a synthetic history entry; the popstate listener
  // invokes onClose() so the drawer dismisses and the user stays in-app.
  // Strict unmount cleanup removes the listener to avoid memory leaks and
  // ghost callbacks after the component tree is deallocated.
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ drawer: 'audit' }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Reset form state on drawer close to prevent stale payload persistence
  // across separate transaction selections.
  useEffect(() => {
    if (!isOpen) {
      reset();
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

        {/* Transaction context */}
        <div className="px-5 py-3 border-b border-border bg-background">
          <p className="text-xs text-text-muted">Transaction ID</p>
          <p className="mt-0.5 text-sm font-mono font-medium text-text-primary">
            {transactionId ?? '—'}
          </p>
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
