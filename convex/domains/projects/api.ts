/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PROJECTS DOMAIN API - SRS Layer 4                                 │
│  /convex/domains/projects/api.ts                                       │
│                                                                        │
│  Central export point for project domain Convex functions.             │
│  Aggregates queries and mutations for project management.              │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex (rank-based filtering)   │
└────────────────────────────────────────────────────────────────────────┘ */

// Export queries
export { listProjects, getProject } from "./queries";

// Export mutations
export { createProject, updateProject, deleteProject } from "./mutations";
