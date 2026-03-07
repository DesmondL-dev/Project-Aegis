import { useMemo } from 'react';
import type { KycRecord } from '../data/kycMockData';

export type ActiveFilter = 'ALL' | 'HIGH_RISK' | 'KYC' | 'FLAGGED' | 'ALERTS';

function filterRecordsImpl(records: KycRecord[], activeFilter: ActiveFilter): KycRecord[] {
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
}

// Domain filter for AML grid — single source of truth for predicate applied to raw dataset.
export function useFilteredAmlRecords(
  records: KycRecord[],
  activeFilter: ActiveFilter
): KycRecord[] {
  return useMemo(
    () => filterRecordsImpl(records, activeFilter),
    [records, activeFilter]
  );
}
