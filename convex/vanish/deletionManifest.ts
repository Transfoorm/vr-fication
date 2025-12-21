/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.0 - DELETION MANIFEST                               │
│  /convex/deletionManifest.ts                                              │
│                                                                           │
│  World-class, strategy-aware user deletion infrastructure.                │
│  Every table that references users MUST be registered here.               │
│                                                                           │
│  ENFORCEMENT:                                                             │
│  - Build-time AST verification (scripts/verifyCascadeCoverage.ts)         │
│  - Per-field deletion strategies (delete/anonymize/reassign/preserve)     │
│  - Chunked, idempotent cascade execution                                  │
│  - Complete audit trail with append pattern                               │
│                                                                           │
│  TTT CERTIFIED: 100K users → 10K tables → 1K developers                   │
└───────────────────────────────────────────────────────────────────────────┘ */

/**
 * DELETION STRATEGIES
 *
 * - delete: Permanently remove the document
 * - anonymize: Scrub PII, replace userId with "deleted-user" placeholder
 * - reassign: Transfer ownership to another user (requires policy)
 * - preserve: Keep document unchanged (audit trails, shared resources)
 */
export type DeletionStrategy = 'delete' | 'anonymize' | 'reassign' | 'preserve';

/**
 * Field-level deletion strategy map
 *
 * Example:
 * messages: {
 *   senderId: 'anonymize',     // User sent it, but preserve thread
 *   recipientId: 'preserve'     // Keep intact for recipient
 * }
 */
export type FieldStrategies = Record<string, DeletionStrategy>;

/**
 * Table deletion configuration
 */
export interface TableDeletionConfig {
  /** Field-level strategies for user references */
  fields: FieldStrategies;

  /** Optional: Custom batch size (default: 200) */
  batchSize?: number;

  /** Optional: Index name for user field queries (default: 'by_user') */
  indexName?: string;
}

/**
 * Complete deletion manifest structure
 */
export interface DeletionManifest {
  /** Tables to cascade through with field-level strategies */
  cascade: Record<string, TableDeletionConfig>;

  /** Tables to explicitly preserve (never delete) */
  preserve: string[];

  /** Storage file fields to sweep (e.g., 'avatar', 'attachments') */
  storageFields: Record<string, string[]>;
}

/**
 * 🔥 CANONICAL USER DELETION MANIFEST
 *
 * RULES:
 * 1. Every table with userId references MUST be listed in cascade or preserve
 * 2. Every user-linked field MUST have an explicit strategy
 * 3. Multi-ref tables (multiple user fields) MUST have strategy per field
 * 4. Every user-linked field MUST have .index('by_user', [field]) in schema
 *
 * VANISH LAW:
 * "There is only one identity: the Convex user._id.
 *  All deletions must flow from it.
 *  Clerk authenticates — Convex governs."
 */
export const DELETION_MANIFEST: DeletionManifest = {
  cascade: {
    // ═══════════════════════════════════════════════════════════════
    // 🔥 VANISH STRATEGY: DELETE ALL - No orphans at 100K scale
    // User is warned "Cannot be retrieved" before deletion
    // ═══════════════════════════════════════════════════════════════

    // Identity & Settings
    admin_users_ClerkRegistry: {
      fields: { userId: 'delete' },
      indexName: 'by_user_id',
    },
    settings_account_Genome: {
      fields: { userId: 'delete' },
    },

    // Clients Domain
    clients_contacts_Users: {
      fields: {
        assignedTo: 'delete',
        createdBy: 'delete',
      },
    },

    // Finance Domain
    finance_banking_Statements: {
      fields: { createdBy: 'delete' },
    },

    // Projects Domain
    projects_tracking_Schedule: {
      fields: {
        assignedTo: 'delete',
        createdBy: 'delete',
      },
    },
    projects_tracking_Costs: {
      fields: { createdBy: 'delete' },
    },

    // Productivity Domain
    productivity_email_Index: {
      fields: {
        resolvedBy: 'delete',
        promotedBy: 'delete',
      },
    },
    productivity_email_Accounts: {
      fields: { userId: 'delete' },
    },
    productivity_email_SenderCache: {
      fields: {
        confirmedBy: 'delete',
        userId: 'delete',
      },
    },
    productivity_email_Messages: {
      fields: { createdBy: 'delete' },
    },
    productivity_calendar_Events: {
      fields: { createdBy: 'delete' },
    },
    productivity_bookings_Form: {
      fields: { createdBy: 'delete' },
    },
    productivity_pipeline_Prospects: {
      fields: { createdBy: 'delete' },
    },
  },

  preserve: [
    'admin_users_DeleteLog',    // Immutable audit trail
    // 'billingHistory' // Example: Financial compliance records
  ],

  storageFields: {
    // Table → array of file reference fields
    admin_users: ['avatarUrl', 'brandLogoUrl'],
    // projects: ['attachments', 'thumbnails'],
    // messages: ['fileIds']
  }
} as const;

/**
 * HELPER: Get all tables that should be cascaded
 */
export function getCascadeTables(): string[] {
  return Object.keys(DELETION_MANIFEST.cascade);
}

/**
 * HELPER: Get strategy for a specific field in a table
 */
export function getFieldStrategy(
  table: string,
  field: string
): DeletionStrategy | null {
  const config = DELETION_MANIFEST.cascade[table];
  return config?.fields[field] ?? null;
}

/**
 * HELPER: Check if table should be preserved
 */
export function isPreservedTable(table: string): boolean {
  return DELETION_MANIFEST.preserve.includes(table);
}

/**
 * HELPER: Get storage fields for a table
 */
export function getStorageFields(table: string): string[] {
  return DELETION_MANIFEST.storageFields[table] ?? [];
}

/**
 * HELPER: Get batch size for a table (default: 200)
 */
export function getBatchSize(table: string): number {
  return DELETION_MANIFEST.cascade[table]?.batchSize ?? 200;
}

/**
 * HELPER: Get index name for user field (default: 'by_user')
 */
export function getIndexName(table: string): string {
  return DELETION_MANIFEST.cascade[table]?.indexName ?? 'by_user';
}
