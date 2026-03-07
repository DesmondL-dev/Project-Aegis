import { useQuery } from '@tanstack/react-query';
import { generateKycRecords, type KycRecord } from '../data/kycMockData';

const AML_DATA_QUERY_KEY = ['amlData'] as const;

// Simulated network latency — mimics backend round-trip for AML payload hydration.
const SIMULATED_LATENCY_MS = 1200;

async function fetchAmlData(): Promise<KycRecord[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generateKycRecords());
    }, SIMULATED_LATENCY_MS);
  });
}

// Server-state binding for AML grid payload. Query invalidation / refetch
// available via returned refetch; cache key enables cross-component invalidation.
export function useAmlData() {
  return useQuery({
    queryKey: AML_DATA_QUERY_KEY,
    queryFn: fetchAmlData,
  });
}
