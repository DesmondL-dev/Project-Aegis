import { useState, useCallback } from 'react';
import { AlertTriangle, Users, DollarSign, ShieldAlert } from 'lucide-react';
import { AmlDataGrid } from './AmlDataGrid';
import { AuditDrawer } from './AuditDrawer';

interface KpiCardProps {
  label:    string;
  value:    string;
  delta:    string;
  positive: boolean;
  icon:     React.ReactNode;
}

// KPI Card — stateless display unit for top-level risk metrics.
// Each card renders a single aggregated payload from the upstream analytics pipeline.
const KpiCard = ({ label, value, delta, positive, icon }: KpiCardProps) => (
  <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors">
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

const KPI_DATASET: KpiCardProps[] = [
  {
    label:    'High Risk Accounts',
    value:    '247',
    delta:    '+12 vs. last 30 days',
    positive: false,
    icon:     <AlertTriangle className="w-4 h-4" />,
  },
  {
    label:    'Active KYC Profiles',
    value:    '1,000',
    delta:    '+38 newly onboarded',
    positive: true,
    icon:     <Users className="w-4 h-4" />,
  },
  {
    label:    'Flagged Transactions',
    value:    '$4.2M',
    delta:    '-8.3% vs. prior period',
    positive: true,
    icon:     <DollarSign className="w-4 h-4" />,
  },
  {
    label:    'AML Alerts Open',
    value:    '31',
    delta:    '+5 escalated today',
    positive: false,
    icon:     <ShieldAlert className="w-4 h-4" />,
  },
];

// Primary protected view — owns the AuditDrawer state machine.
// Drawer open/close and selected transaction ID are co-located here
// to enforce single-source-of-truth for the annotation workflow.
export const DashboardView = () => {
  const [isDrawerOpen,  setIsDrawerOpen]  = useState<boolean>(false);
  const [selectedTxId,  setSelectedTxId]  = useState<string | null>(null);

  // Stable callback reference — prevents AmlDataGrid from re-rendering
  // on every DashboardView state update due to prop referential instability.
  const handleRowClick = useCallback((id: string) => {
    setSelectedTxId(id);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Preserve selectedTxId briefly so the drawer exit animation completes
    // before the transaction context payload is cleared from the title bar.
    setTimeout(() => setSelectedTxId(null), 300);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row — aggregated risk metrics payload */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {KPI_DATASET.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* AML Data Grid — virtualized KYC transaction surface */}
      <AmlDataGrid onRowClick={handleRowClick} />

      {/* AuditDrawer — mounted at this boundary to keep drawer state scoped
          to the dashboard feature module, not the root layout. */}
      <AuditDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        transactionId={selectedTxId}
      />
    </div>
  );
};
