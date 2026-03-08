import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, Users, DollarSign, ShieldAlert, AlertCircle, RefreshCw, Settings, Download } from 'lucide-react';
import { ErrorBoundary } from '../../../core/errors/ErrorBoundary';
import { RequireRole } from '../../auth/components/RequireRole';
import { AmlDataGrid } from './AmlDataGrid';
import { AmlDataGridSkeleton } from './AmlDataGridSkeleton';
import { AuditDrawer } from './AuditDrawer';
import { useAmlData } from '../hooks/useAmlData';
import { useFilteredAmlRecords, type ActiveFilter } from '../hooks/useFilteredAmlRecords';

export type { ActiveFilter };

interface KpiCardProps {
  label:    string;
  value:    string;
  delta:    string;
  positive: boolean;
  icon:     React.ReactNode;
  filterKey: ActiveFilter;
  isActive: boolean;
  onToggle: (key: ActiveFilter) => void;
}

// AODA / WCAG 2.1 AA: toggle control as button role; aria-pressed for toggle state; keyboard activation via Enter/Space.
const getFilterAriaLabel = (label: string, _filterKey: ActiveFilter, isActive: boolean): string => {
  const action = isActive ? 'Clear filter and show all' : `Filter by ${label}`;
  return `${label}. ${action}. ${isActive ? 'Selected' : 'Not selected'}.`;
};

const KpiCard = ({ label, value, delta, positive, icon, filterKey, isActive, onToggle }: KpiCardProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle(filterKey);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      aria-label={getFilterAriaLabel(label, filterKey, isActive)}
      onClick={() => onToggle(filterKey)}
      onKeyDown={handleKeyDown}
      className={`flex flex-col gap-3 p-4 rounded-xl border bg-surface hover:bg-surface-elevated transition-all text-left cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
        ${isActive
          ? 'border-cyan-500 ring-2 ring-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
          : 'border-border'
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</span>
        <div className="p-1.5 rounded-lg bg-background text-text-muted">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        <p className={`mt-1 text-xs font-medium ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {delta}
        </p>
      </div>
    </div>
  );
};

const KPI_DATASET: Omit<KpiCardProps, 'isActive' | 'onToggle'>[] = [
  {
    label:    'High Risk Accounts',
    value:    '247',
    delta:    '+12 vs. last 30 days',
    positive: false,
    icon:     <AlertTriangle className="w-4 h-4" />,
    filterKey: 'HIGH_RISK',
  },
  {
    label:    'Active KYC Profiles',
    value:    '1,000',
    delta:    '+38 newly onboarded',
    positive: true,
    icon:     <Users className="w-4 h-4" />,
    filterKey: 'KYC',
  },
  {
    label:    'Flagged Transactions',
    value:    '$4.2M',
    delta:    '-8.3% vs. prior period',
    positive: true,
    icon:     <DollarSign className="w-4 h-4" />,
    filterKey: 'FLAGGED',
  },
  {
    label:    'AML Alerts Open',
    value:    '31',
    delta:    '+5 escalated today',
    positive: false,
    icon:     <ShieldAlert className="w-4 h-4" />,
    filterKey: 'ALERTS',
  },
];

// ARIA Live Region: human-readable filter state for screen reader state mutation feedback.
const getLiveAnnouncement = (activeFilter: ActiveFilter): string => {
  const prefix = 'Data grid updated. Currently showing ';
  const scope =
    activeFilter === 'ALL'
      ? 'all accounts.'
      : activeFilter === 'HIGH_RISK'
        ? 'high risk accounts.'
        : activeFilter === 'KYC'
          ? 'active KYC profiles.'
          : activeFilter === 'FLAGGED'
            ? 'flagged transactions.'
            : activeFilter === 'ALERTS'
              ? 'AML alerts open.'
              : 'all accounts.';
  return prefix + scope;
};

// Isolated child component: the only correct pattern to trigger an ErrorBoundary is to throw
// from a component that is a *child* of that boundary — never from the boundary's own render scope.
// This component exists solely as a chaos engineering probe; it has no state and no side effects.
const ChaosTrigger = (): never => {
  throw new Error('Simulated Network Drop: Secondary nodes unreachable.');
};

// Critical state fallback — query failure surface with retry CTA for query invalidation.
const AmlDataErrorFallback = ({ onRetry }: { onRetry: () => void }) => (
  <div
    className="rounded-xl border border-red-500/30 bg-slate-900/90 p-8 flex flex-col items-center justify-center gap-4 min-h-[320px]"
    role="alert"
  >
    <AlertCircle className="w-12 h-12 text-red-500" aria-hidden />
    <p className="text-red-400 font-medium text-center">
      Failed to load AML data. Check connection and try again.
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Retry
    </button>
  </div>
);

// Primary protected view — owns AuditDrawer state machine and global filter state.
// Filter selection intercepts raw data and passes only the filtered slice to AmlDataGrid.
export const DashboardView = () => {
  const [isDrawerOpen,   setIsDrawerOpen]   = useState<boolean>(false);
  const [selectedTxId,   setSelectedTxId]   = useState<string | null>(null);
  const [activeFilter,   setActiveFilter]   = useState<ActiveFilter>('ALL');
  // Chaos engineering toggle: render-phase crash to demonstrate ErrorBoundary and graceful degradation.
  const [simulateCrash,  setSimulateCrash] = useState<boolean>(false);

  const { data, isLoading, isError, refetch } = useAmlData();
  const rawRecords = useMemo(() => data ?? [], [data]);
  const filteredRecords = useFilteredAmlRecords(rawRecords, activeFilter);

  const handleFilterToggle = useCallback((key: ActiveFilter) => {
    setActiveFilter((prev) => (prev === key ? 'ALL' : key));
  }, []);

  const handleRowClick = useCallback((id: string) => {
    setSelectedTxId(id);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedTxId(null), 300);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col gap-6">
      {/* Screen reader announcer: polite live region for filter state changes; sr-only keeps it off-screen. */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {getLiveAnnouncement(activeFilter)}
      </div>
      {/* Admin-only actions — RBAC: ANALYST cannot see or interact; DOM cloaking via RequireRole. */}
      <RequireRole allowedRoles={['ADMIN']}>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Administrator actions">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <Settings className="w-4 h-4" />
            System Settings
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-border text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </RequireRole>

      {/* KPI Row — isolated blast radius; failure in one boundary does not unmount the other. */}
      <ErrorBoundary>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" role="group" aria-label="Dashboard filter toggles">
          {KPI_DATASET.map((kpi) => (
            <KpiCard
              key={kpi.label}
              {...kpi}
              isActive={activeFilter === kpi.filterKey}
              onToggle={handleFilterToggle}
            />
          ))}
        </div>
      </ErrorBoundary>

      {/* AML Data Grid — async payload; loading skeleton, error fallback, or filtered grid; contained failure surface. */}
      <ErrorBoundary onReset={() => setSimulateCrash(false)}>
        {/* ChaosTrigger is mounted as a true child of this ErrorBoundary — the boundary's class-based
            componentDidCatch lifecycle intercepts the throw and activates the fallback UI correctly. */}
        {simulateCrash && <ChaosTrigger />}
        {isLoading && <AmlDataGridSkeleton />}
        {isError && <AmlDataErrorFallback onRetry={handleRetry} />}
        {!isLoading && !isError && (
          <AmlDataGrid
            onRowClick={handleRowClick}
            records={filteredRecords}
            onSimulateCrash={() => setSimulateCrash(true)}
          />
        )}
      </ErrorBoundary>

      <AuditDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        transactionId={selectedTxId}
        sinNumber={selectedTxId ? filteredRecords.find((r) => r.id === selectedTxId)?.sinNumber ?? null : null}
      />
    </div>
  );
};
