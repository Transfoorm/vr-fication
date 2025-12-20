/**──────────────────────────────────────────────────────────────────────┐
│  💰 WRAP HOOK - Financial Domain                                       │
│  /src/hooks/useFinancialData.ts                                        │
│                                                                        │
│  WRAP Pattern: { data, computed, actions, flags }                      │
│  Clean API for accessing financial domain data                         │
│  Following FUSE Stack architectural contract                           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * WRAP Hook - Financial Domain
 *
 * Returns structured object following WRAP contract:
 * - data: Raw domain data from FUSE store
 * - computed: Calculated/derived values
 * - actions: Mutations and operations (future)
 * - flags: Status indicators (hydration, loading, etc.)
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useFinancialData();
 * const { accounts, transactions, invoices } = data;
 * const { totalInvoices } = computed;
 * const { isHydrated } = flags;
 * ```
 */
export function useFinancialData() {
  const finances = useFuse((state) => state.finance);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = finances.status === 'hydrated';

  return {
    // DATA: Raw domain data from FUSE store
    data: {
      businessProfile: finances.businessProfile,
      categories: finances.categories,
      accounts: finances.accounts,
      transactions: finances.transactions,
      patterns: finances.patterns,
      customers: finances.customers,
      quotes: finances.quotes,
      invoices: finances.invoices,
      suppliers: finances.suppliers,
      purchases: finances.purchases,
      bills: finances.bills,
      chartOfAccounts: finances.chartOfAccounts,
      fixedAssets: finances.fixedAssets,
      employees: finances.employees,
      payrollRuns: finances.payrollRuns,
    },

    // COMPUTED: Calculated/derived values
    computed: {
      totalAccounts: finances.accounts.length,
      totalTransactions: finances.transactions.length,
      totalCustomers: finances.customers.length,
      totalInvoices: finances.invoices.length,
      totalSuppliers: finances.suppliers.length,
      totalBills: finances.bills.length,
      totalEmployees: finances.employees.length,
      hasData: finances.accounts.length > 0 || finances.transactions.length > 0 || finances.invoices.length > 0,
    },

    // ACTIONS: Mutations and operations
    // Future: Convex mutations wrapped as actions
    actions: {},

    // FLAGS: Status indicators
    flags: {
      isHydrated,
      isOnline: true, // WARP ensures data always available
    },
  };
}

// Type export for components
export type FinancialData = ReturnType<typeof useFinancialData>;
