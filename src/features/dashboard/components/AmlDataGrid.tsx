import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, EyeOff } from 'lucide-react';
import { useDataRedaction } from '../hooks/useDataRedaction';

type RecordStatus = 'FLAGGED' | 'REVIEW' | 'CLEAR';

interface KycRecord {
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
const generateKycRecords = (): KycRecord[] => {
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
// Dynamic Height Measurement: the outermost row wrapper uses `ref={virtualizer.measureElement}`
// paired with `data-index` so the virtualizer's internal ResizeObserver maps each rendered
// DOM node back to its virtual item and recalculates getTotalSize() with actual heights.
// This eliminates the layout clipping that occurs when a fixed height is smaller than
// the card's rendered content.
export const AmlDataGrid = ({ onRowClick }: AmlDataGridProps) => {
  const { isRedacted, revealData } = useDataRedaction();
  const isTabletOrLarger           = useIsTabletOrLarger();
  const scrollContainerRef         = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count:            KYC_RECORDS.length,
    getScrollElement: () => scrollContainerRef.current,
    // estimateSize seeds getTotalSize() before measureElement populates actuals.
    estimateSize:     () => isTabletOrLarger ? ESTIMATE_DESKTOP_PX : ESTIMATE_MOBILE_PX,
    overscan:         5,
  });

  // SIN masking strategy: expose only the last 4 digits (OWASP A02).
  const maskSin = useMemo(
    () => (sin: string) => `***-***-${sin.slice(-4)}`,
    []
  );

  /* throw new Error("Simulated DOM Crash"); */
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Grid header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
        <h3 className="text-sm font-semibold text-text-primary">KYC Transaction Records</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{KYC_RECORDS.length.toLocaleString()} records</span>
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

      {/* Virtualized scroll container */}
      <div ref={scrollContainerRef} className="h-[500px] overflow-auto">
        {/* Spacer — sized by getTotalSize() which updates as measureElement reports actual heights */}
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const record       = KYC_RECORDS[virtualRow.index];
            const handleActivate = () => onRowClick(record.id);

            return (
              // Measurement wrapper — NO fixed height.
              // `ref={virtualizer.measureElement}` + `data-index` constitute the
              // DOM Mapping contract: the virtualizer's ResizeObserver uses data-index
              // to look up the virtual item and update its measured size in the
              // internal size cache, driving accurate scroll total recalculation.
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                role="button"
                tabIndex={0}
                onClick={handleActivate}
                onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                style={{
                  position:  'absolute',
                  top:       0,
                  left:      0,
                  width:     '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-focus active:scale-[0.98]"
              >
                {/* ── Desktop (md+): high-density tabular row ── */}
                <div className="hidden md:grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 items-center px-4 py-3 text-sm border-b border-border hover:bg-surface-elevated">
                  <span className="font-mono text-xs text-text-muted">{record.id}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-text-primary truncate text-xs font-medium">{record.customerName}</span>
                    <span className="text-text-muted truncate text-xs">{record.email}</span>
                  </div>
                  <span className="font-mono text-xs text-text-muted">
                    {isRedacted ? maskSin(record.sinNumber) : record.sinNumber}
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
                      <span className="font-mono text-xs text-text-primary">{record.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wide">SIN</span>
                      <span className="font-mono text-xs text-text-muted">
                        {isRedacted ? maskSin(record.sinNumber) : record.sinNumber}
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
