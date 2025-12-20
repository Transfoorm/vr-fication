/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FINANCE DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: banking, invoicing, expenses, payroll, accounting
 * Route: /app/domains/finance/*
 * Backend: /convex/domains/finance/
 * Access: Captain+ (org-scoped)
 *
 * ADP/PRISM Compliant: Full coordination fields for WARP preloading
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FinanceData {
  // Business setup
  businessProfile: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  // Banking
  accounts: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  patterns: Record<string, unknown>[];
  // Income
  customers: Record<string, unknown>[];
  quotes: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  // Expense
  suppliers: Record<string, unknown>[];
  purchases: Record<string, unknown>[];
  bills: Record<string, unknown>[];
  // Accounting
  chartOfAccounts: Record<string, unknown>[];
  fixedAssets: Record<string, unknown>[];
  // Payroll
  employees: Record<string, unknown>[];
  payrollRuns: Record<string, unknown>[];
}

export interface FinanceSlice extends FinanceData {
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface FinanceActions {
  hydrateFinance: (data: Partial<FinanceData>, source?: ADPSource) => void;
  clearFinance: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialFinanceState: FinanceSlice = {
  // Business setup
  businessProfile: null,
  categories: [],
  // Banking
  accounts: [],
  transactions: [],
  patterns: [],
  // Income
  customers: [],
  quotes: [],
  invoices: [],
  // Expense
  suppliers: [],
  purchases: [],
  bills: [],
  // Accounting
  chartOfAccounts: [],
  fixedAssets: [],
  // Payroll
  employees: [],
  payrollRuns: [],
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createFinanceSlice: StateCreator<
  FinanceSlice & FinanceActions,
  [],
  [],
  FinanceSlice & FinanceActions
> = (set) => ({
  ...initialFinanceState,

  hydrateFinance: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateFinance');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`💰 FUSE: Finance domain hydrated via ${source}`, {
        accounts: data.accounts?.length || 0,
        transactions: data.transactions?.length || 0,
        customers: data.customers?.length || 0,
        invoices: data.invoices?.length || 0,
      });
    }
    fuseTimer.end('hydrateFinance', start);
  },

  clearFinance: () => {
    const start = fuseTimer.start('clearFinance');
    set(initialFinanceState);
    fuseTimer.end('clearFinance', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type FinanceStore = FinanceSlice & FinanceActions;
