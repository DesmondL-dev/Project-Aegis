import { useState, useCallback, useMemo } from 'react';
import { AlertTriangle, Users, DollarSign, ShieldAlert } from 'lucide-react';
import { AmlDataGrid, generateKycRecords, type KycRecord } from './AmlDataGrid';
import { AuditDrawer } from './AuditDrawer';

// Master filter state — drives both KPI card active styling and grid data slice (master-detail linking).
export type ActiveFilter = 'ALL' | 'HIGH_RISK' | 'KYC' | 'FLAGGED' | 'ALERTS';

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

// KPI Card — interactive toggle; event delegation via onToggle.
// Active state: sharp ring + border for selected filter; click again resets to ALL.
const KpiCard = ({ label, value, delta, positive, icon, filterKey, isActive, onToggle }: KpiCardProps) => (
  <button
    type="button"
    onClick={() => onToggle(filterKey)}
    className={`flex flex-col gap-3 p-4 rounded-xl border bg-surface hover:bg-surface-elevated transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
      isActive
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
  </button>
);

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

// Derived state: filter predicate applied to raw dataset; single source of truth for grid payload.
const filterRecords = (records: KycRecord[], activeFilter: ActiveFilter): KycRecord[] => {
  if (activeFilter === 'ALL') return records;
  switch (activeFilter) {
    case 'HIGH_RISK':
      return records.filter((r) => r.riskScore >= 75);
    case 'KYC':
      return records.filter((r) => r.status === 'REVIEW');
    case 'FLAGGED':
      return records.filter((r) => r.status === 'FLAGGED');
    case 'ALERTS':
      return records.filter((r) => r.status !== 'CLEAR');
    default:
      return records;
  }
};

// Primary protected view — owns AuditDrawer state machine and global filter state.
// Filter selection intercepts raw data and passes only the filtered slice to AmlDataGrid.
export const DashboardView = () => {
  const [isDrawerOpen,   setIsDrawerOpen]   = useState<boolean>(false);
  const [selectedTxId,   setSelectedTxId]   = useState<string | null>(null);
  const [activeFilter,   setActiveFilter]   = useState<ActiveFilter>('ALL');

  const rawRecords = useMemo(() => generateKycRecords(), []);
  const filteredRecords = useMemo(
    () => filterRecords(rawRecords, activeFilter),
    [rawRecords, activeFilter]
  );

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

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row — interactive filter toggles; active card drives grid data slice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DATASET.map((kpi) => (
          <KpiCard
            key={kpi.label}
            {...kpi}
            isActive={activeFilter === kpi.filterKey}
            onToggle={handleFilterToggle}
          />
        ))}
      </div>

      {/* AML Data Grid — receives filtered payload; virtualizer reacts to length change */}
      <AmlDataGrid onRowClick={handleRowClick} records={filteredRecords} />

      <AuditDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        transactionId={selectedTxId}
      />
    </div>
  );
};
