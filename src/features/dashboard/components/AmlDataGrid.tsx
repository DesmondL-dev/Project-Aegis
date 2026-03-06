import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Eye, EyeOff } from 'lucide-react';
import { useDataRedaction } from '../hooks/useDataRedaction';

interface KycRecord {
  id: string;
  customerName: string;
  sinNumber: string;
  riskScore: number;
  amount: number;
}

// Deterministic mock data generation — seeded with index to produce
// stable, reproducible records across re-renders without triggering
// referential identity changes in the virtualizer scroll engine.
const generateKycRecords = (): KycRecord[] => {
  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Daniel', 'Sophia', 'William', 'Isabella'];
  const lastNames  = ['Chen', 'Patel', 'Rodriguez', 'Thompson', 'Williams', 'Johnson', 'Martinez', 'Davis', 'Wilson', 'Anderson'];

  return Array.from({ length: 1000 }, (_, i) => {
    const sin = `${String(Math.floor(100 + (i * 7) % 900)).padStart(3, '0')}-${String(Math.floor(100 + (i * 13) % 900)).padStart(3, '0')}-${String(Math.floor(1000 + (i * 17) % 9000)).padStart(4, '0')}`;
    return {
      id:           `KYC-${String(i + 1).padStart(5, '0')}`,
      customerName: `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`,
      sinNumber:    sin,
      riskScore:    Math.round(((i * 37) % 100) * 10) / 10,
      amount:       Math.round(((i * 1031) % 999_000) + 1000),
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

const ROW_HEIGHT_PX = 48;

interface AmlDataGridProps {
  // Callback dispatched on row selection — bubbles the transaction ID up to
  // the parent state machine to hydrate the AuditDrawer context payload.
  onRowClick: (id: string) => void;
}

// AML Data Grid — virtualized KYC record viewer.
// @tanstack/react-virtual reduces the DOM footprint from 1000 nodes to ~12
// visible rows regardless of dataset size, eliminating layout thrash and
// preventing GC pressure from large detached DOM subtrees.
export const AmlDataGrid = ({ onRowClick }: AmlDataGridProps) => {
  const { isRedacted, revealData } = useDataRedaction();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count:           KYC_RECORDS.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize:    () => ROW_HEIGHT_PX,
    overscan:        5, // Pre-render 5 rows outside viewport to eliminate scroll blank-flash
  });

  // SIN masking strategy: expose only the last 4 digits to comply with
  // OWASP A02 — never transmit or render full PII unless explicitly authorized.
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

      {/* Column headers */}
      <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide border-b border-border bg-surface-elevated">
        <span>Record ID</span>
        <span>Customer</span>
        <span>SIN</span>
        <span>Risk Score</span>
        <span className="text-right">Amount (CAD)</span>
      </div>

      {/* Virtualized scroll container — the DOM footprint stays at ~overscan rows
          regardless of total record count, enforcing O(1) DOM node budget. */}
      <div
        ref={scrollContainerRef}
        className="h-[500px] overflow-auto"
      >
        {/* Spacer div sized to the total virtual list height — preserves scrollbar fidelity */}
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const record = KYC_RECORDS[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                role="button"
                tabIndex={0}
                onClick={() => onRowClick(record.id)}
                onKeyDown={(e) => e.key === 'Enter' && onRowClick(record.id)}
                style={{
                  position:  'absolute',
                  top:       0,
                  left:      0,
                  width:     '100%',
                  height:    `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-5 gap-4 items-center px-4 text-sm border-b border-border hover:bg-surface-elevated cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-border-focus"
              >
                <span className="font-mono text-xs text-text-muted">{record.id}</span>
                <span className="text-text-primary truncate">{record.customerName}</span>
                <span className="font-mono text-xs text-text-muted">
                  {isRedacted ? maskSin(record.sinNumber) : record.sinNumber}
                </span>
                <span className={RISK_BAND(record.riskScore)}>{record.riskScore}</span>
                <span className="text-right text-text-primary tabular-nums">
                  ${record.amount.toLocaleString('en-CA')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
