# Canonical Email Taxonomy

> **Purpose**: Provider-agnostic email classification ensuring 100% inbox parity with Gmail, Outlook, and Yahoo.

---

## Core Principle

**"If a user sees an email in Gmail / Outlook / Yahoo web UI, they can always find it in Transfoorm."**

This is the acceptance test. If not, the implementation is wrong.

---

## Architecture Overview

```
Provider (Gmail/Outlook/Yahoo)
    │
    ▼
Canonical Mapping Layer
    │
    ▼
Unified Database (productivity_email_Index)
    │
    ▼
UI (6 visible folders)
```

---

## Two Separate State Systems

### 1. Resolution State (Transfoorm Workflow)

Where is this email in *your* workflow?

| State | Meaning |
|-------|---------|
| `with_me` | Requires my action/response |
| `with_them` | I responded, waiting for their reply |
| `done` | Conversation concluded |
| `none` | Not yet categorized |

**Storage**: `resolutionState` field (single value per message)

### 2. Canonical States (Provider Metadata)

What properties does the provider assign?

| State | Provider Source |
|-------|-----------------|
| `unread` | Gmail UNREAD label, Outlook isRead=false |
| `starred` | Gmail STARRED, Outlook flagged |
| `important` | Gmail IMPORTANT, Outlook high importance |
| `snoozed` | Gmail SNOOZED label |
| `muted` | Gmail MUTED label |
| `focused` | Outlook Focused Inbox |
| `other` | Outlook Other Inbox |

**Storage**: `canonicalStates[]` field (array - multiple can apply)

**Key Point**: These are SEPARATE. `canonicalStates` is provider metadata (what Gmail/Outlook says). `resolutionState` is Transfoorm workflow (what the user decides).

---

## Canonical Folders

### UI-Visible Folders (6)

| Folder | Icon | Purpose |
|--------|------|---------|
| Inbox | 📥 | Active incoming mail |
| Drafts | 📝 | Unsent messages |
| Sent | 📤 | Messages I sent |
| Archive | 📦 | Processed but kept |
| Trash | 🗑️ | Deleted items |
| Spam | ⚠️ | Junk/spam |

### Advanced Folders (via Search/Filters)

| Folder | Purpose |
|--------|---------|
| `outbox` | Queued for sending |
| `scheduled` | Scheduled sends |
| `system` | System folders (Sync Issues, etc.) |

---

## Provider Mapping Tables

### Gmail

| Gmail Source | Canonical Folder | Canonical State(s) |
|--------------|------------------|-------------------|
| INBOX label | `inbox` | — |
| SENT label | `sent` | — |
| DRAFT label | `drafts` | — |
| All Mail (no labels) | `archive` | — |
| SPAM label | `spam` | — |
| TRASH label | `trash` | — |
| SCHEDULED label | `scheduled` | — |
| SNOOZED label | `archive` | `snoozed` |
| STARRED label | — | `starred` |
| IMPORTANT label | — | `important` |
| MUTED label | `archive` | `muted` |
| CATEGORY_* labels | `archive` | (stored in providerCategories) |
| Custom labels | — | (stored in providerLabels) |
| CHAT label | `system` | — |

**Priority Logic**: TRASH > SPAM > DRAFT > SENT > INBOX > SCHEDULED > CHAT > ARCHIVE

### Outlook

| Outlook Source | Canonical Folder | Canonical State(s) |
|----------------|------------------|-------------------|
| Inbox | `inbox` | — |
| Sent Items | `sent` | — |
| Drafts | `drafts` | — |
| Archive | `archive` | — |
| Junk Email | `spam` | — |
| Deleted Items | `trash` | — |
| Outbox | `outbox` | — |
| Scheduled | `scheduled` | — |
| Focused Inbox | `inbox` | `focused` |
| Other Inbox | `inbox` | `other` |
| Flagged | — | `starred` |
| High Importance | — | `important` |
| Conversation History | `system` | — |
| Sync Issues | `system` | — |
| Clutter | `system` | — |
| User categories | — | (stored in providerCategories) |

### Yahoo

| Yahoo Source | Canonical Folder | Canonical State(s) |
|--------------|------------------|-------------------|
| Inbox | `inbox` | — |
| Sent | `sent` | — |
| Draft/Drafts | `drafts` | — |
| Archive | `archive` | — |
| Bulk | `spam` | — |
| Trash | `trash` | — |
| Starred/Flagged | — | `starred` |
| Custom folders | `system` | — |

---

## Database Schema

### productivity_email_Index

```typescript
// Canonical Email Taxonomy fields
canonicalFolder: string,         // "inbox" | "sent" | "drafts" | etc.
canonicalStates: string[],       // ["unread", "starred", "important"]
providerFolderId: string?,       // Original folder ID from provider
providerFolderName: string?,     // Display name for debugging
providerLabels: string[]?,       // Gmail user labels
providerCategories: string[]?,   // Gmail/Outlook categories

// Transfoorm Workflow (separate)
resolutionState: string,         // "with_me" | "with_them" | "done" | "none"
```

### Index

```typescript
.index("by_canonical_folder", ["canonicalFolder"])
```

---

## Source Code Locations

| File | Purpose |
|------|---------|
| `src/domains/email/canonical.ts` | Enums and type guards |
| `src/domains/email/mappings/gmail.ts` | Gmail → Canonical mapping |
| `src/domains/email/mappings/outlook.ts` | Outlook → Canonical mapping |
| `src/domains/email/mappings/yahoo.ts` | Yahoo → Canonical mapping (spec only) |
| `convex/schema.ts` | Database schema (lines 532-583) |
| `convex/productivity/email/outlook.ts` | Outlook sync with canonical population |

---

## Rules

1. **Ingest Everything**: Every email from every provider gets stored
2. **Normalize to Canonical**: Map to unified folder/state model
3. **Preserve Provider Data**: Original labels, categories, folder IDs kept
4. **Nothing Dropped**: Unknown folders → `system`, not deleted
5. **States are Additive**: Multiple `canonicalStates` can apply
6. **Folder is Singular**: Only ONE `canonicalFolder` per message
7. **Workflow is Separate**: `resolutionState` is independent of `canonicalStates`

---

## Legacy Migration

Old resolution state values need migration:

| Old Value | New Value |
|-----------|-----------|
| `awaiting_me` | `with_me` |
| `awaiting_them` | `with_them` |
| `resolved` | `done` |
| `none` | `none` |

Use `migrateLegacyResolutionState()` from `@/domains/email/canonical`.

---

## Implementation Status

| Component | Status |
|-----------|--------|
| Canonical enums | Done |
| Gmail mapping | Done |
| Outlook mapping | Done |
| Yahoo mapping | Done (spec only) |
| Schema update | Done |
| Outlook sync | Done (heuristic folder detection) |
| Gmail sync | Not started |
| Yahoo sync | Deferred to v2 |
| UI folder filtering | Not started |

---

*Last updated: December 2024*
