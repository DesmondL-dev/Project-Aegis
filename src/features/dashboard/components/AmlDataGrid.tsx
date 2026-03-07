import { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useDataRedaction } from '../hooks/useDataRedaction';
import { maskAccount, maskSin } from '../utils/dataRedaction';
import { RequireRole } from '../../auth/components/RequireRole';

type RecordStatus = 'FLAGGED' | 'REVIEW' | 'CLEAR';

export interface KycRecord {
  id:           string;
  customerName: string;
  email:        string;
  sinNumber:    string;
  riskScore:    number;
  amount:       number;
  status:       RecordStatus;
  date:         string;
}

// Deterministic mock data generation — seeded with index to produce
// stable, reproducible records across re-renders without triggering
// referential identity changes in the virtualizer scroll engine.
export const generateKycRecords = (): KycRecord[] => {
  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Daniel', 'Sophia', 'William', 'Isabella'];
  const lastNames  = ['Chen', 'Patel', 'Rodriguez', 'Thompson', 'Williams', 'Johnson', 'Martinez', 'Davis', 'Wilson', 'Anderson'];
  const statuses: RecordStatus[] = ['FLAGGED', 'REVIEW', 'CLEAR'];

  return Array.from({ length: 1000 }, (_, i) => {
    const sin         = `${String(Math.floor(100 + (i * 7) % 900)).padStart(3, '0')}-${String(Math.floor(100 + (i * 13) % 900)).padStart(3, '0')}-${String(Math.floor(1000 + (i * 17) % 9000)).padStart(4, '0')}`;
    const firstName   = firstNames[i % firstNames.length];
    const lastName    = lastNames[(i * 3) % lastNames.length];
    const name        = `${firstName} ${lastName}`;
    const emailHandle = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const day         = String(((i * 3) % 28) + 1).padStart(2, '0');
    const month       = String(((i * 7) % 12) + 1).padStart(2, '0');
    return {
      id:           `KYC-${String(i + 1).padStart(5, '0')}`,
      customerName: name,
      email:        `${emailHandle}@aegis.bank.com`,
      sinNumber:    sin,
      riskScore:    Math.round(((i * 37) % 100) * 10) / 10,
      amount:       Math.round(((i * 1031) % 999_000) + 1000),
      status:       statuses[i % 3],
      date:         `2025-${month}-${day}`,
    };
  });
};

// Memoized outside component scope — the dataset is static per mount and must
// not be regenerated on re-renders to preserve virtualizer scroll state integrity.
const KYC_RECORDS = generateKycRecords();

const RISK_BAND = (score: number): string => {
  if (score >= 75) return 'text-red-500 font-semibold';
  if (score >= 40) return 'text-amber-500 font-semibold';
  return 'text-green-500';
};

// Status badge — semantic colour coding for the three AML risk states.
const STATUS_BADGE: Record<RecordStatus, string> = {
  FLAGGED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REVIEW:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CLEAR:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const MD_BREAKPOINT_PX = 768;

// Estimated row heights used for getTotalSize() on initial render before
// measureElement populates actual sizes (Dynamic Height Measurement).
const ESTIMATE_DESKTOP_PX = 52;
const ESTIMATE_MOBILE_PX  = 260; // Conservative estimate for fully populated card

interface AmlDataGridProps {
  // Callback dispatched on row selection — bubbles the transaction ID up to
  // the parent state machine to hydrate the AuditDrawer context payload.
  onRowClick: (id: string) => void;
  // Optional data source — when provided (e.g. filtered from DashboardView),
  // grid renders this slice; otherwise falls back to internal static dataset.
  records?: KycRecord[];
}

// Viewport detection — keeps estimateSize in sync with the active layout mode.
const useIsTabletOrLarger = (): boolean => {
  const [isTabletOrLarger, setIsTabletOrLarger] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= MD_BREAKPOINT_PX : true
  );

  useEffect(() => {
    const mql     = window.matchMedia(`(min-width: ${MD_BREAKPOINT_PX}px)`);
    const handler = () => setIsTabletOrLarger(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isTabletOrLarger;
};

// AML Data Grid — virtualized KYC record viewer with Table-to-Card responsive degradation.
//
// Virtual Windowing: only rows intersecting the viewport (plus overscan) are mounted.
// The virtualizer computes a sliding window of indices; DOM is limited to that window
// instead of N rows, preventing O(n) node count and keeping layout/paint cost constant.
//
// DOM Node Recycling: as the user scrolls, the same physical DOM nodes are reused for
// newly visible items; the virtualizer assigns content by index and repositions nodes
// via transform. No unbounded growth of row elements — fixed pool, stable memory.
//
// Layout Thrashing Prevention: getTotalSize() is driven by measured heights (see below).
// Measurement is delegated to measureElement + ResizeObserver; the virtualizer batches
// size updates and recalculates scroll extent without synchronous reflows in the hot path.
//
// Dynamic Height Measurement: the outermost row wrapper uses `ref={virtualizer.measureElement}`
// paired with `data-index` so the virtualizer's internal ResizeObserver maps each rendered
// DOM node back to its virtual item and recalculates getTotalSize() with actual heights.
// This eliminates layout clipping when a fixed estimate is smaller than the card's content.
export const AmlDataGrid = ({ onRowClick, records: recordsProp }: AmlDataGridProps) => {
  const role = useAuthStore((state) => state.user?.role);
  const { isRedacted, revealData } = useDataRedaction();
  const isTabletOrLarger           = useIsTabletOrLarger();
  const scrollContainerRef         = useRef<HTMLDivElement>(null);
  const dataSource                 = recordsProp ?? KYC_RECORDS;

  const virtualizer = useVirtualizer({
    count:            dataSource.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize:     () => isTabletOrLarger ? ESTIMATE_DESKTOP_PX : ESTIMATE_MOBILE_PX,
    overscan:         5,
  });

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Grid header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
        <h3 className="text-sm font-semibold text-text-primary">KYC Transaction Records</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{dataSource.length.toLocaleString()} records</span>
          <RequireRole allowedRoles={['ADMIN']}>
            <button
              onClick={revealData}
              title={isRedacted ? 'Reveal sensitive data (30s window)' : 'Data exposed — auto-redaction active'}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border text-text-muted hover:text-text-primary hover:bg-background transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              {isRedacted ? (
                <><Eye className="w-3.5 h-3.5" /> Reveal SIN</>
              ) : (
                <><EyeOff className="w-3.5 h-3.5" /> Auto-redacting</>
              )}
            </button>
          </RequireRole>
        </div>
      </div>

      {/* Column headers — hidden on mobile; desktop tabular semantics preserved for md+ */}
      <div className="hidden md:grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide border-b border-border bg-surface-elevated">
        <span>Record ID</span>
        <span>Customer</span>
        <span>SIN</span>
        <span>Status</span>
        <span>Risk</span>
        <span className="text-right">Amount (CAD)</span>
      </div>

      {/* Virtualized scroll container — ref is the scroll anchor for TanStack Virtual's physics engine. */}
      <div ref={scrollContainerRef} className="h-[500px] overflow-auto">
        {/* Total height spacer: getTotalSize() yields the sum of measured/estimated row heights;
            absolute-positioned children are laid out inside this box to preserve scroll extent
            and prevent layout thrashing from variable-height rows (desktop vs mobile cards). */}
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const record       = dataSource[virtualRow.index];
            const handleActivate = () => onRowClick(record.id);

            return (
              /* Row node: absolute + translateY(virtualRow.start) — required by TanStack Virtual
                 so the engine can stack recycled DOM nodes in document order while preserving
                 correct scroll position. measureElement + data-index feed the size cache for
                 getTotalSize(); no fixed height here to allow dynamic card/row measurement. */
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                role="button"
                tabIndex={0}
                onClick={handleActivate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleActivate();
                  }
                }}
                style={{
                  position:  'absolute',
                  top:       0,
                  left:      0,
                  width:     '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-inset focus:z-10 active:scale-[0.98]"
              >
                {/* ── Desktop (md+): high-density tabular row ── */}
                <div className="hidden md:grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 items-center px-4 py-3 text-sm border-b border-border hover:bg-surface-elevated">
                  <span className="font-mono text-xs text-text-muted">{maskAccount(record.id, role)}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-text-primary truncate text-xs font-medium">{record.customerName}</span>
                    <span className="text-text-muted truncate text-xs">{record.email}</span>
                  </div>
                  <span className="font-mono text-xs text-text-muted">
                    {maskSin(record.sinNumber, role ?? 'ANALYST', !isRedacted)}
                  </span>
                  <span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[record.status]}`}>
                      {record.status}
                    </span>
                  </span>
                  <span className={`text-xs ${RISK_BAND(record.riskScore)}`}>{record.riskScore}</span>
                  <span className="text-right text-text-primary tabular-nums text-xs">
                    ${record.amount.toLocaleString('en-CA')}
                  </span>
                </div>

                {/* ── Mobile: self-contained Data Card ──
                    flex-col with gap-3 guarantees each field occupies its own
                    horizontal lane — eliminates squishing and overlap entirely.
                    flex justify-between on each row aligns label left / value right. */}
                <div className="md:hidden mx-3 my-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface hover:bg-surface-elevated shadow-sm">
                  {/* Card header — name + status badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{record.customerName}</p>
                      <p className="text-xs text-text-muted mt-0.5">{record.email}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[record.status]}`}>
                      {record.status}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100 dark:border-slate-800 mb-3" />

                  {/* Key-value rows — flex justify-between for clean left/right alignment */}
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Record ID</span>
                      <span className="font-mono text-xs text-text-primary">{maskAccount(record.id, role)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">SIN</span>
                      <span className="font-mono text-xs text-text-muted">
                        {maskSin(record.sinNumber, role ?? 'ANALYST', !isRedacted)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Risk Score</span>
                      <span className={`text-xs font-medium ${RISK_BAND(record.riskScore)}`}>{record.riskScore}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Amount (CAD)</span>
                      <span className="text-sm font-semibold text-text-primary tabular-nums">
                        ${record.amount.toLocaleString('en-CA')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">Date</span>
                      <span className="text-xs text-text-primary">{record.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
