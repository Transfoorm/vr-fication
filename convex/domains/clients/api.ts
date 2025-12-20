/**──────────────────────────────────────────────────────────────────────┐
│  🔌 CLIENTS DOMAIN API - SRS Layer 4                                  │
│  /convex/domains/clients/api.ts                                        │
│                                                                        │
│  Central export point for client domain Convex functions.              │
│  Aggregates queries and mutations for client management.               │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex (rank-based filtering)   │
└────────────────────────────────────────────────────────────────────────┘ */

// Export queries
export { listClients, getClient } from "./queries";

// Export mutations
export { createClient, updateClient, deleteClient } from "./mutations";
