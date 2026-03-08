import { create } from 'zustand';

// Elevate freeze status to global store for cross-component RBAC enforcement.
// Single source of truth for transaction lockout state; enables Zero-Trust
// state-machine semantics across the SPA (e.g. list view can reflect frozen rows).
interface AuditState {
  /** Map of transactionId -> frozen; undefined/false = not frozen. */
  frozenRecords: Record<string, boolean>;
  /** Toggle freeze for a given transaction; idempotent flip for lock/unlock. */
  toggleFreeze: (transactionId: string) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  frozenRecords: {},
  toggleFreeze: (transactionId) =>
    set((state) => ({
      frozenRecords: {
        ...state.frozenRecords,
        [transactionId]: !state.frozenRecords[transactionId],
      },
    })),
}));
