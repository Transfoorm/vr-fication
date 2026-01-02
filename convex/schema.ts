import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY DOMAIN (S.I.D. Phase 14 - Sovereign Identity Registry)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * 🛡️ SOVEREIGN IDENTITY REGISTRY
   *
   * This table is the ONLY place where Clerk identity is correlated to Convex identity.
   * All Clerk → Convex lookups MUST go through this registry.
   *
   * Purpose:
   * - Webhook correlation (user.created, user.deleted events from Clerk)
   * - Vanish Protocol (account deletion flows)
   * - Identity handoff ceremony (auth boundary only)
   *
   * NEVER use this table for runtime identity. Use Convex _id directly.
   *
   * See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-14.2, SID-14.3)
   */
  admin_users_ClerkRegistry: defineTable({
    /** External auth provider ID (currently Clerk) */
    externalId: v.string(),
    /** Sovereign Convex user ID - THE source of truth */
    userId: v.id("admin_users"),
    /** Auth provider name for future federation (SID-20) */
    provider: v.literal("clerk"),
    /** When this mapping was created */
    createdAt: v.number(),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user_id", ["userId"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  admin_users: defineTable({
    // Identity (required)
    // 🛡️ S.I.D. Phase 15: clerkId REMOVED from domain table
    // Clerk identity now lives ONLY in admin_users_ClerkRegistry table.
    // See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-15.1)
    email: v.string(),
    emailVerified: v.boolean(), // Email verification status from Clerk (defaults to false)
    firstName: v.string(),
    lastName: v.string(),

    // Profile (optional - user fills in over time)
    secondaryEmail: v.optional(v.string()),
    avatarUrl: v.optional(v.union(v.string(), v.id("_storage"))),
    brandLogoUrl: v.optional(v.union(v.string(), v.id("_storage"))),
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    orgSlug: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    businessCountry: v.optional(v.string()),

    // Naval Rank System (required)
    rank: v.union(
      v.literal("crew"),
      v.literal("captain"),
      v.literal("commodore"),
      v.literal("admiral")
    ),

    // User onboarding status (required)
    setupStatus: v.union(
      v.literal("invited"),
      v.literal("pending"),
      v.literal("abandon"),
      v.literal("complete"),
      v.literal("revoked")
    ),

    // Theme preferences (required with defaults)
    themeDark: v.boolean(), // Default: false (light mode)

    // Miror AI avatar preference (optional - user configures)
    // f=female, m=male, i=inclusive × 1=caucasian, 2=dark, 3=oriental
    mirorAvatarProfile: v.optional(v.union(
      v.literal("f-1"),
      v.literal("f-2"),
      v.literal("f-3"),
      v.literal("m-1"),
      v.literal("m-2"),
      v.literal("m-3"),
      v.literal("i-1"),
      v.literal("i-2"),
      v.literal("i-3")
    )),
    mirorEnchantmentEnabled: v.optional(v.boolean()),
    mirorEnchantmentTiming: v.optional(v.union(
      v.literal("subtle"),
      v.literal("magical"),
      v.literal("playful")
    )),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.number(),
    loginCount: v.number(), // Default: 1 on signup

    // Subscription & Trial Management (required)
    subscriptionStatus: v.union(
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("lifetime"),
      v.literal("cancelled")
    ),
    trialStartedAt: v.optional(v.number()),
    trialEndsAt: v.optional(v.number()),
    trialDuration: v.optional(v.number()),

    // Payment Integration (optional - only when connected)
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    paypalSubscriptionId: v.optional(v.string()),
    subscriptionStartedAt: v.optional(v.number()),
    subscriptionRenewsAt: v.optional(v.number()),
    lastPaymentAt: v.optional(v.number()),

    // Vanish Protocol (optional - only when deletion in progress)
    deletedAt: v.optional(v.number()),
    deletionStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    )),
  })
    // 🛡️ S.I.D. Phase 14: by_clerk_id REMOVED - use admin_users_ClerkRegistry instead
    // All Clerk→Convex lookups now go through the sovereign registry table.
    // See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-14.1)
    .index("by_rank", ["rank"])
    .index("by_subscription_status", ["subscriptionStatus"]),

  // Vanish Protocol: Immutable audit trail for user deletions
  admin_users_DeleteLog: defineTable({
    // Original user identity (all required - user always has these at deletion)
    /**
     * Convex document _id of the deleted user (SOVEREIGN IDENTITY).
     * This is the primary identity reference for audit trails.
     */
    userId: v.id("admin_users"),
    /**
     * @deprecated REFERENCE ONLY — Stored for Clerk webhook correlation during deletion.
     * Do NOT use for lookups. See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
     */
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    rank: v.string(),
    setupStatus: v.string(),
    subscriptionStatus: v.string(),

    // Optional profile fields (may not have been set)
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),

    // Deletion metadata (required)
    /**
     * Convex document _id of the user who performed the deletion (SOVEREIGN IDENTITY).
     */
    deletedBy: v.id("admin_users"),
    deletedByRole: v.union(
      v.literal("self"),
      v.literal("admiral")
    ),
    reason: v.optional(v.string()),

    // Cascade scope
    scope: v.object({
      userProfile: v.boolean(),
      clerkAccount: v.boolean(),
      storageFiles: v.array(v.string()),
      relatedTables: v.array(v.string()),
    }),

    // Cascade execution (required)
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed")
    ),
    chunksCascaded: v.number(),
    recordsDeleted: v.number(),
    errorMessage: v.optional(v.string()),
    clerkDeletionError: v.optional(v.string()),

    // Timing (required)
    deletedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Compliance (optional)
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    /**
     * @deprecated WEBHOOK-ONLY INDEX — Required for Vanish Protocol Clerk correlation.
     * Do NOT use for runtime identity lookups.
     * See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-6.2)
     */
    .index("by_clerk_id", ["clerkId"])
    .index("by_user_id", ["userId"]) // SOVEREIGN: Primary lookup for audit trails
    .index("by_deleted_at", ["deletedAt"])
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  // Professional Genome - User's behavioral/contextual fingerprint
  settings_account_Genome: defineTable({
    userId: v.id("admin_users"),

    // Professional Identity
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    seniority: v.optional(v.string()), // Dropdown with "Custom" option

    // Company Context
    industry: v.optional(v.string()),
    companySize: v.optional(v.string()), // Dropdown with "Custom" option
    companyWebsite: v.optional(v.string()),

    // Transformation Journey
    transformationGoal: v.optional(v.string()),
    transformationStage: v.optional(v.string()), // Dropdown with "Custom" option
    transformationType: v.optional(v.string()), // Dropdown with "Custom" option
    timelineUrgency: v.optional(v.string()), // Dropdown with "Custom" option

    // Growth Intel
    howDidYouHearAboutUs: v.optional(v.string()),
    teamSize: v.optional(v.number()),
    annualRevenue: v.optional(v.string()),
    successMetric: v.optional(v.string()),

    // Meta
    completionPercent: v.number(), // 0-100, calculated on save
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIENTS DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  clients_contacts_Users: defineTable({
    // Identity (required)
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),

    // Profile (optional)
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),

    // SRS rank-scoping (required)
    /**
     * @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented.
     * Currently stores external org identifier (e.g., from Clerk Organizations).
     * See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
     */
    orgId: v.string(),
    assignedTo: v.optional(v.id("admin_users")),

    // Status (required with default)
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("prospect"),
      v.literal("archived")
    ),
    notes: v.optional(v.string()),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  finance_banking_Statements: defineTable({
    // Transaction identity (required)
    type: v.union(
      v.literal("invoice"),
      v.literal("payment"),
      v.literal("expense")
    ),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),

    // SRS rank-scoping (required)
    /**
     * @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented.
     */
    orgId: v.string(),

    // Status (required with default)
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    date: v.number(),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PROJECTS DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  projects_tracking_Schedule: defineTable({
    // Identity (required)
    name: v.string(),
    description: v.optional(v.string()),

    // SRS rank-scoping (required)
    /**
     * @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented.
     */
    orgId: v.string(),
    assignedTo: v.optional(v.id("admin_users")),

    // Status (required)
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_assigned", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_date", ["startDate"]),

  projects_tracking_Costs: defineTable({
    // Link to project (required)
    projectId: v.id("projects_tracking_Schedule"),

    // Cost details (required)
    name: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.union(
      v.literal("labor"),
      v.literal("materials"),
      v.literal("equipment"),
      v.literal("services"),
      v.literal("other")
    ),

    // SRS rank-scoping (required)
    /**
     * @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented.
     */
    orgId: v.string(),

    // Status (required)
    status: v.union(
      v.literal("estimated"),
      v.literal("approved"),
      v.literal("spent")
    ),
    date: v.number(),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_project", ["projectId"])
    .index("by_org", ["orgId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"]),

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCTIVITY DOMAIN
  // ═══════════════════════════════════════════════════════════════════════════

  productivity_email_Messages: defineTable({
    subject: v.string(),
    body: v.string(),
    from: v.string(),
    to: v.array(v.string()),
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("archived")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_status", ["status"]),

  /**
   * 📧 EMAIL INTAKE INDEX
   *
   * Stores metadata for RECEIVED emails (not sent/draft).
   * This is the single source of truth for message-level resolution state.
   *
   * DOCTRINE:
   * - Thread state is DERIVED (never stored) via deriveThreadState() pure function
   * - Message resolution state is STORED (single source of truth)
   * - AI classification is cached here (suggestions), humans commit via mutations
   * - Email bodies fetched on-demand (not stored initially)
   *
   * See: /docs/EMAIL_DOCTRINE.md, /docs/EMAIL_THREAD_STATE_DERIVATION.md
   */
  productivity_email_Index: defineTable({
    // External provider IDs (required)
    /** Gmail/Outlook message ID (external provider identifier) */
    externalMessageId: v.string(),
    /** Gmail/Outlook thread ID (groups conversation messages) */
    externalThreadId: v.string(),

    // Message metadata (required)
    subject: v.string(),
    snippet: v.string(), // First ~150 chars for preview
    from: v.object({
      name: v.string(),
      email: v.string(),
    }),
    to: v.array(v.object({
      name: v.string(),
      email: v.string(),
    })),
    cc: v.optional(v.array(v.object({
      name: v.string(),
      email: v.string(),
    }))),
    receivedAt: v.number(), // Unix timestamp (when message arrived)
    hasAttachments: v.boolean(),

    // Connected email account (required)
    /** Which email account this message belongs to */
    accountId: v.id("productivity_email_Accounts"),
    /** Email address of the connected account (for dashboard visibility) */
    ownerEmail: v.optional(v.string()),

    // Resolution state (required - single source of truth)
    /**
     * Message-level resolution state (user-committed).
     * Thread state is DERIVED from these via deriveThreadState().
     *
     * - awaiting_me: Requires my action/response
     * - awaiting_them: I responded, waiting for their reply
     * - resolved: Conversation concluded or action taken
     * - none: Default state (new/unprocessed)
     */
    resolutionState: v.union(
      v.literal("awaiting_me"),
      v.literal("awaiting_them"),
      v.literal("resolved"),
      v.literal("none")
    ),
    resolvedAt: v.optional(v.number()), // When user marked resolved
    resolvedBy: v.optional(v.id("admin_users")), // Who resolved it

    // AI classification (optional - advisory only, humans commit)
    aiClassification: v.optional(v.object({
      intent: v.optional(v.union(
        v.literal("question"),
        v.literal("request"),
        v.literal("update"),
        v.literal("booking"),
        v.literal("social"),
        v.literal("newsletter"),
        v.literal("spam")
      )),
      priority: v.optional(v.union(
        v.literal("urgent"),
        v.literal("high"),
        v.literal("normal"),
        v.literal("low")
      )),
      senderType: v.optional(v.union(
        v.literal("client"),
        v.literal("prospect"),
        v.literal("vendor"),
        v.literal("team"),
        v.literal("personal"),
        v.literal("automated")
      )),
      confidence: v.optional(v.number()), // 0-1 confidence score
      explanation: v.optional(v.string()), // Why AI suggested this classification
    })),

    // Promotion tracking (optional - links to promoted entities)
    promotedTo: v.optional(v.object({
      type: v.union(
        v.literal("task"),
        v.literal("project"),
        v.literal("booking")
      ),
      entityId: v.string(), // ID of promoted task/project/booking
      promotedAt: v.number(),
      promotedBy: v.id("admin_users"),
      undoWindowEndsAt: v.number(), // When undo expires (e.g., 10 minutes)
    })),

    // Read/unread tracking (optional)
    isRead: v.boolean(),
    readAt: v.optional(v.number()),

    // ─────────────────────────────────────────────────────────────────────────
    // CANONICAL EMAIL TAXONOMY (provider-agnostic classification)
    // See: /src/domains/email/canonical.ts
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Canonical folder assignment (provider-agnostic).
     * Maps Gmail labels, Outlook folders, Yahoo folders to unified taxonomy.
     *
     * Values: inbox | sent | drafts | archive | spam | trash | outbox | scheduled | system
     *
     * UI shows 6 folders: Inbox, Drafts, Sent, Archive, Trash, Spam
     * Advanced folders (Outbox, Scheduled, System) accessible via search/filters.
     */
    canonicalFolder: v.optional(v.string()),

    /**
     * Canonical states (provider metadata, NOT workflow).
     * Multiple states can apply to one message.
     *
     * Values: unread | starred | important | snoozed | muted | focused | other
     *
     * IMPORTANT: These are separate from resolutionState (Transfoorm workflow).
     * canonicalStates = provider metadata (Gmail starred, Outlook flagged)
     * resolutionState = Transfoorm workflow (with_me, with_them, done)
     */
    canonicalStates: v.optional(v.array(v.string())),

    /**
     * Provider-specific folder ID (for sync operations).
     * Gmail: label ID | Outlook: parentFolderId | Yahoo: folderId
     */
    providerFolderId: v.optional(v.string()),

    /**
     * Provider-specific folder name (for debugging/display).
     * Gmail: label name | Outlook: displayName | Yahoo: folder name
     */
    providerFolderName: v.optional(v.string()),

    /**
     * Provider-specific labels (Gmail only).
     * Stores user-defined labels for preservation.
     */
    providerLabels: v.optional(v.array(v.string())),

    /**
     * Provider-specific categories (Gmail/Outlook).
     * Gmail: CATEGORY_PERSONAL, CATEGORY_SOCIAL, etc.
     * Outlook: user-defined color categories
     */
    providerCategories: v.optional(v.array(v.string())),

    // Asset processing status (optional)
    /** Reference to email body asset (HTML/text) */
    bodyAssetId: v.optional(v.id("productivity_email_Assets")),
    /** Whether all assets (body + images + attachments) have been processed */
    assetsProcessed: v.boolean(),
    /** When assets were last processed */
    assetsProcessedAt: v.optional(v.number()),
    /** How many assets this message references (for quick stats) */
    assetCount: v.number(),

    // SRS rank-scoping (required)
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"])
    .index("by_account", ["accountId"])
    .index("by_external_message_id", ["externalMessageId"])
    .index("by_external_thread_id", ["externalThreadId"])
    .index("by_resolution_state", ["resolutionState"])
    .index("by_canonical_folder", ["canonicalFolder"])
    .index("by_received_at", ["receivedAt"])
    .index("by_sender_email", ["from.email"])
    .index("by_resolvedBy", ["resolvedBy"])
    .index("by_promotedBy", ["promotedTo.promotedBy"]),

  /**
   * 📬 EMAIL ACCOUNTS
   *
   * Stores connected email accounts (Gmail, Outlook, etc.).
   * Users can connect multiple accounts for unified inbox.
   *
   * DOCTRINE:
   * - OAuth tokens stored here (encrypted at rest by Convex)
   * - Sync status tracked for background workers
   * - Account quarantine follows Clerk SID pattern (external provider IDs)
   */
  productivity_email_Accounts: defineTable({
    // Account identity (required)
    /** User-friendly label (e.g., "Work Gmail", "Personal Outlook") */
    label: v.string(),
    /** Email address of connected account */
    emailAddress: v.string(),
    /** Owner's email (from admin_users) - for dashboard identification */
    ownerEmail: v.optional(v.string()),
    /** Provider type */
    provider: v.union(
      v.literal("gmail"),
      v.literal("outlook"),
      v.literal("imap") // Future: generic IMAP support
    ),
    /**
     * Provider variant - distinguishes API behavior differences within same provider.
     *
     * For Outlook:
     * - 'outlook_personal': Consumer accounts (outlook.com, hotmail.com, live.com, msn.com)
     * - 'outlook_enterprise': Microsoft 365/Azure AD accounts (custom domains)
     *
     * Graph API behaves differently between personal and enterprise:
     * - Folder parentFolderId structure differs
     * - Rate limits differ
     * - Some features (categories, rules) have different availability
     *
     * When this flag accumulates >5 branch points, promote to separate handlers.
     */
    providerVariant: v.optional(v.union(
      v.literal("outlook_personal"),
      v.literal("outlook_enterprise"),
      v.literal("gmail_personal"),
      v.literal("gmail_workspace")
    )),

    // OAuth credentials (required for gmail/outlook)
    /** OAuth access token (encrypted at rest by Convex) */
    accessToken: v.optional(v.string()),
    /** OAuth refresh token (encrypted at rest by Convex) */
    refreshToken: v.optional(v.string()),
    /** When access token expires */
    tokenExpiresAt: v.optional(v.number()),

    // Sync status (required)
    /** Last successful sync timestamp */
    lastSyncAt: v.optional(v.number()),
    /** Next scheduled sync */
    nextSyncAt: v.optional(v.number()),
    /** Sync frequency in milliseconds (default: 5 minutes) */
    syncFrequency: v.number(),
    /** Whether background sync is enabled */
    syncEnabled: v.boolean(),
    /** Whether a USER-INITIATED sync is in progress (shows spinner) */
    isSyncing: v.optional(v.boolean()),
    /** Whether BACKGROUND polling is in progress (invisible to UI) */
    isBackgroundPolling: v.optional(v.boolean()),
    /** When folder structure was last fetched (for caching) */
    foldersCachedAt: v.optional(v.number()),
    /** Last sync error (if any) */
    lastSyncError: v.optional(v.string()),
    /**
     * Whether initial historical sync is complete.
     *
     * TWO-PHASE SYNC DOCTRINE:
     * - Phase A (initialSyncComplete=false): Full history via /messages API
     * - Phase B (initialSyncComplete=true): Incremental via /messages/delta API
     *
     * Delta API only returns recent activity, NOT full history.
     * Initial sync MUST use standard /messages endpoint.
     */
    initialSyncComplete: v.optional(v.boolean()),

    // Sync lock (prevents parallel syncs)
    /** When current sync started (null = not syncing) */
    syncStartedAt: v.optional(v.number()),
    /** Sync lock TTL in ms - auto-release after this (default: 5 minutes) */
    syncLockTTL: v.optional(v.number()),

    // Provider-specific metadata (optional)
    /** Gmail: historyId for incremental sync */
    gmailHistoryId: v.optional(v.string()),
    /** Outlook: deltaToken for incremental sync */
    outlookDeltaToken: v.optional(v.string()),

    // Account status (required)
    status: v.union(
      v.literal("active"),     // Connected and syncing
      v.literal("paused"),     // User paused sync
      v.literal("error"),      // Sync error (needs reauth)
      v.literal("disconnected") // User disconnected account
    ),

    // SRS rank-scoping (required)
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    /** Which user owns this account */
    userId: v.id("admin_users"),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    connectedAt: v.number(),
    disconnectedAt: v.optional(v.number()),
  }).index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_email", ["emailAddress"])
    .index("by_status", ["status"])
    .index("by_next_sync", ["nextSyncAt"]),

  /**
   * 📁 EMAIL FOLDERS
   *
   * Stores folder hierarchy from email providers (Outlook, Gmail).
   * Used to display expandable folder tree in sidebar.
   *
   * DOCTRINE:
   * - Folders are synced from provider during email sync
   * - Child folders inherit parent's canonical type for message routing
   * - UI displays full hierarchy with expand/collapse
   */
  productivity_email_Folders: defineTable({
    // Folder identity (required)
    /** External folder ID from provider (GUID for Outlook) */
    externalFolderId: v.string(),
    /** User-visible folder name */
    displayName: v.string(),
    /** Canonical folder type (inbox, sent, drafts, etc.) */
    canonicalFolder: v.string(),

    // Hierarchy (optional - null for top-level folders)
    /** Parent folder's external ID (null for top-level) */
    parentFolderId: v.optional(v.string()),
    /** Number of child folders */
    childFolderCount: v.number(),

    // Ownership (required)
    /** Which email account this folder belongs to */
    accountId: v.id("productivity_email_Accounts"),
    /** Provider type (for provider-specific handling) */
    provider: v.union(v.literal("gmail"), v.literal("outlook")),
    /** Email address of the connected account (for dashboard visibility) */
    ownerEmail: v.optional(v.string()),

    // Delta sync (for incremental updates)
    /** Microsoft Graph deltaLink for this folder */
    deltaToken: v.optional(v.string()),
    /** When delta token was last updated */
    deltaTokenUpdatedAt: v.optional(v.number()),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_account", ["accountId"])
    .index("by_external_id", ["externalFolderId"])
    .index("by_parent", ["accountId", "parentFolderId"]),

  /**
   * 🧠 EMAIL SENDER CACHE
   *
   * Caches AI classification for known senders (performance optimization).
   * AI suggests, but classification only persists after human confirmation.
   *
   * DOCTRINE:
   * - AI suggestions are cached here (not authoritative)
   * - Humans can override AI classification
   * - Used to pre-populate AI suggestions for repeat senders
   * - NOT used for automatic state changes (humans commit)
   */
  productivity_email_SenderCache: defineTable({
    // Sender identity (required)
    /** Sender email address (normalized to lowercase) */
    senderEmail: v.string(),
    /** Sender display name (from most recent message) */
    senderName: v.optional(v.string()),

    // Classification (optional - set after human confirmation)
    senderType: v.optional(v.union(
      v.literal("client"),
      v.literal("prospect"),
      v.literal("vendor"),
      v.literal("team"),
      v.literal("personal"),
      v.literal("automated")
    )),
    /** Whether this classification was confirmed by human (vs AI suggestion) */
    confirmedByHuman: v.boolean(),
    /** If confirmed, who confirmed it */
    confirmedBy: v.optional(v.id("admin_users")),
    confirmedAt: v.optional(v.number()),

    // AI suggestion metadata (optional)
    aiSuggestedType: v.optional(v.union(
      v.literal("client"),
      v.literal("prospect"),
      v.literal("vendor"),
      v.literal("team"),
      v.literal("personal"),
      v.literal("automated")
    )),
    aiConfidence: v.optional(v.number()), // 0-1 confidence score
    aiExplanation: v.optional(v.string()), // Why AI suggested this

    // Usage statistics (required)
    messageCount: v.number(), // How many messages from this sender
    lastMessageAt: v.number(), // Most recent message timestamp

    // SRS rank-scoping (required)
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    /** Which user's inbox this sender appears in */
    userId: v.id("admin_users"),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["orgId"])
    .index("by_user", ["userId"])
    .index("by_sender_email", ["senderEmail"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_confirmedBy", ["confirmedBy"]),

  /**
   * 🖼️ EMAIL ASSETS
   *
   * Content-addressed storage for email bodies, images, and attachments.
   * Uses SHA-256 hashing for deduplication and immutability.
   *
   * DOCTRINE:
   * - Assets have identity before they have a home (hash-first)
   * - Storage location is an implementation detail (provider-agnostic)
   * - Deduplication via content-addressing (same hash = same asset)
   * - Referenced by multiple messages (many-to-many via AssetReferences)
   *
   * STORAGE STRATEGY:
   * - v1: Convex Storage (for ~100 emails, validation phase)
   * - v2: S3-class object storage (for scale, cost, desktop mirroring)
   * - Migration is mechanical (swap storage adapter, keys unchanged)
   */
  productivity_email_Assets: defineTable({
    // Content-addressed identity (required)
    /** SHA-256 hash of asset content (primary identifier) */
    hash: v.string(),
    /** Storage key (provider-agnostic): email-assets/sha256/{first2}/{fullhash} */
    key: v.string(),

    // Asset metadata (required)
    /** MIME type (e.g., text/html, image/png, application/pdf) */
    contentType: v.string(),
    /** Size in bytes */
    size: v.number(),
    /** Asset source */
    source: v.union(
      v.literal("body"),       // Email HTML/text body
      v.literal("attachment"), // Inline image (CID) or file attachment
      v.literal("external")    // Downloaded external image
    ),

    // Storage location (implementation detail)
    /** Convex storage ID (v1 - temporary warehouse) */
    storageId: v.optional(v.id("_storage")),
    /** S3/R2 key (v2 - future, mechanical migration) */
    s3Key: v.optional(v.string()),

    // Usage tracking (for garbage collection)
    /** Last time this asset was accessed (via signed URL generation) */
    lastAccessedAt: v.number(),
    /** Reference count (how many messages use this asset) */
    referenceCount: v.number(),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_hash", ["hash"])
    .index("by_key", ["key"])
    .index("by_source", ["source"])
    .index("by_last_accessed", ["lastAccessedAt"]),

  /**
   * 🔗 EMAIL ASSET REFERENCES
   *
   * Many-to-many relationship: messages ↔ assets
   * Tracks which messages use which assets (for deduplication and GC).
   *
   * DOCTRINE:
   * - Assets are shared across messages (deduplication)
   * - Reference counting for garbage collection
   * - Asset deleted only when referenceCount = 0
   * - Tracks original context (CID, external URL)
   */
  productivity_email_AssetReferences: defineTable({
    // Relationship (required)
    /** Message that references this asset */
    messageId: v.id("productivity_email_Index"),
    /** Asset being referenced */
    assetId: v.id("productivity_email_Assets"),

    // Reference context (required)
    /** How this asset is used in the message */
    referenceType: v.union(
      v.literal("body"),         // Email HTML/text body
      v.literal("inline_image"), // Inline image (embedded in body)
      v.literal("attachment")    // File attachment
    ),

    // Original reference metadata (optional - for debugging/auditing)
    /** Original URL for external images (before download) */
    originalUrl: v.optional(v.string()),
    /** Original CID reference for inline images (e.g., "image001@outlook") */
    cidReference: v.optional(v.string()),

    // Timestamps (required)
    createdAt: v.number(),
  }).index("by_message", ["messageId"])
    .index("by_asset", ["assetId"])
    .index("by_reference_type", ["referenceType"]),

  productivity_calendar_Events: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    attendees: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_start_time", ["startTime"]),

  productivity_bookings_Form: defineTable({
    clientName: v.string(),
    serviceType: v.string(),
    scheduledTime: v.number(),
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_status", ["status"]),

  productivity_pipeline_Prospects: defineTable({
    title: v.string(),
    participants: v.array(v.string()),
    scheduledTime: v.number(),
    duration: v.number(),
    /** @todo SID-ORG: Convert to v.id("admin_orgs") when orgs domain is implemented. */
    orgId: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("admin_users"),
  }).index("by_org", ["orgId"])
    .index("by_scheduled_time", ["scheduledTime"]),

  /**
   * 🔔 WEBHOOK SUBSCRIPTIONS
   *
   * Stores Microsoft Graph webhook subscriptions for push notifications.
   * When email arrives, Microsoft calls our endpoint instead of us polling.
   *
   * DOCTRINE:
   * - Subscriptions expire after ~3 days (Microsoft limit)
   * - Must renew before expiration via scheduled job
   * - One subscription per email account
   * - clientState used to verify notifications are from Microsoft
   */
  productivity_email_WebhookSubscriptions: defineTable({
    // Subscription identity (required)
    /** Microsoft Graph subscription ID (GUID) */
    subscriptionId: v.string(),
    /** Which email account this subscription monitors */
    accountId: v.id("productivity_email_Accounts"),
    /** Which user owns this account */
    userId: v.id("admin_users"),

    // Subscription config (required)
    /** Resource being monitored (e.g., "me/messages") */
    resource: v.string(),
    /** Change types: created, updated, deleted */
    changeTypes: v.array(v.string()),
    /** Secret for verifying notifications */
    clientState: v.string(),

    // Lifecycle (required)
    /** When subscription expires (must renew before this) */
    expirationDateTime: v.number(),
    /** Status of subscription */
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("error")
    ),
    /** Last error message if status is error */
    lastError: v.optional(v.string()),

    // Timestamps (required)
    createdAt: v.number(),
    updatedAt: v.number(),
    /** Last time we received a notification */
    lastNotificationAt: v.optional(v.number()),
  }).index("by_account", ["accountId"])
    .index("by_subscription_id", ["subscriptionId"])
    .index("by_expiration", ["expirationDateTime"])
    .index("by_status", ["status"]),

  /**
   * 📦 EMAIL BODY CACHE
   *
   * Ring buffer cache for email body content.
   * Accelerates repeat opens without becoming a system of record.
   *
   * DOCTRINE (from STORAGE-LIFECYCLE-DOCTRINE.md):
   * - Cache Loss Invariant: System works perfectly if cache disappears
   * - Bodies are disposable acceleration artifacts, never authoritative
   * - Per-account granularity (100 bodies per account, not per user)
   * - Ring buffer eviction: oldest evicted when count >= max
   * - TTL cleanup: stale entries removed after 14 days
   *
   * GRADUATED ENABLEMENT:
   * - CACHE_SIZE = 0: Pure on-demand (prefetch still works in memory)
   * - CACHE_SIZE = 20-100: Working set coverage
   * - Change requires deploy, not schema migration
   */
  productivity_email_BodyCache: defineTable({
    // Identity (required)
    /** Which email account this cached body belongs to */
    accountId: v.id("productivity_email_Accounts"),
    /** External message ID from Microsoft/Google (matches externalMessageId in Index) */
    messageId: v.string(),

    // Storage reference (required)
    /** Convex Storage blob ID containing the HTML/text body */
    storageId: v.id("_storage"),

    // Eviction metadata (required)
    /** When this body was cached (for LRU eviction) */
    cachedAt: v.number(),
    /** Body size in bytes (for future size-based limits) */
    size: v.number(),

    // Timestamps (required)
    createdAt: v.number(),
  }).index("by_account", ["accountId"])
    .index("by_message", ["messageId"])
    .index("by_account_oldest", ["accountId", "cachedAt"]),
});
