export type RecordStatus = 'FLAGGED' | 'REVIEW' | 'CLEAR';

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
export const KYC_RECORDS = generateKycRecords();
