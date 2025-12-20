# Database Naming Convention

> Three-level hierarchical naming for scalable database organization

---

## The Pattern

```
[domain]_[area]_[Entity]
```

**Examples:**
- `admin_users_DeletionLogs`
- `prod_email_Messages`
- `fin_rec_Transactions`
- `client_notes_Attachments`

---

## Three Levels

### Level 1: Domain (lowercase prefix)
The major business domain:
- `admin_` - Administration
- `client_` - Client management
- `fin_` - Finance
- `prod_` - Productivity
- `proj_` - Projects

### Level 2: Area (lowercase)
The functional area within domain:
- `admin_users_` - User management
- `prod_email_` - Email functionality
- `fin_rec_` - Recurring payments
- `proj_task_` - Task tracking

### Level 3: Entity (PascalCase)
The specific data entity:
- `DeletionLogs`
- `Messages`
- `Transactions`
- `Attachments`

---

## Domain Catalog

### Admin Domain (`admin_`)

| Table | Purpose |
|-------|---------|
| `admin_users` | Core user records |
| `admin_users_DeletionLogs` | User deletion audit trail |
| `admin_tenant_Settings` | Tenant configuration |
| `admin_plans_Features` | Plan feature mappings |

### Client Domain (`client_`)

| Table | Purpose |
|-------|---------|
| `clients` | Core client records |
| `client_notes_Notes` | Client notes |
| `client_notes_Attachments` | Note attachments |
| `client_sessions_Sessions` | Coaching sessions |

### Finance Domain (`fin_`)

| Table | Purpose |
|-------|---------|
| `finance` | Core financial records |
| `fin_inv_Invoices` | Invoice records |
| `fin_pay_Payments` | Payment records |
| `fin_rec_Subscriptions` | Recurring subscriptions |
| `fin_rec_Transactions` | Recurring transactions |

### Productivity Domain (`prod_`)

| Table | Purpose |
|-------|---------|
| `prod_email_Messages` | Email messages |
| `prod_email_Threads` | Email threads |
| `prod_cal_Events` | Calendar events |
| `prod_book_Bookings` | Appointment bookings |
| `prod_pipe_Meetings` | Pipeline meetings |

### Projects Domain (`proj_`)

| Table | Purpose |
|-------|---------|
| `projects` | Core project records |
| `proj_task_Tasks` | Project tasks |
| `proj_task_Comments` | Task comments |
| `proj_loc_Locations` | Project locations |

---

## Core Tables (No Prefix)

Domain-level core tables don't need the three-level pattern:

| Table | Domain | Purpose |
|-------|--------|---------|
| `users` | Admin | Core user document |
| `clients` | Client | Core client document |
| `finance` | Finance | Core finance document |
| `projects` | Projects | Core project document |

**These are the primary tables for each domain.** Sub-domain and feature tables use the three-level pattern.

---

## Naming Rules

### Rule 1: Lowercase Domain Prefix
```
admin_    ✅
Admin_    ❌
ADMIN_    ❌
```

### Rule 2: Lowercase Area
```
admin_users_    ✅
admin_Users_    ❌
```

### Rule 3: PascalCase Entity
```
admin_users_DeletionLogs    ✅
admin_users_deletionlogs    ❌
admin_users_deletion_logs   ❌
```

### Rule 4: Singular Entity Names
```
admin_users_DeletionLog    ✅ (describes one log)
admin_users_DeletionLogs   ✅ (collection of logs)
```

### Rule 5: No Abbreviations in Entity
```
admin_users_DeletionLogs       ✅
admin_users_DelLogs            ❌
```

---

## SRS Alignment

Database naming aligns with SRS architecture:

```
Routes:     /app/domains/admin/users/
Backend:    /convex/domains/admin/users/
Database:   admin_users, admin_users_DeletionLogs
```

All three layers use the same domain hierarchy.

---

## Migration Strategy

### Renaming Existing Tables

```typescript
// Step 1: Create new table
defineTable('admin_users_DeletionLogs', { ... })

// Step 2: Migrate data
const oldData = await ctx.db.query('deletionLogs').collect();
for (const record of oldData) {
  await ctx.db.insert('admin_users_DeletionLogs', record);
}

// Step 3: Update all references

// Step 4: Delete old table (after verification)
```

### Adding New Tables

1. Identify domain (`admin_`, `client_`, etc.)
2. Identify area (`users_`, `notes_`, etc.)
3. Name entity (PascalCase, descriptive)
4. Create table with full pattern

---

## Benefits

### 1. Visual Organization
Tables group naturally in database viewers:
```
admin_plans_Features
admin_tenant_Settings
admin_users
admin_users_DeletionLogs
client_notes_Attachments
client_notes_Notes
```

### 2. Easy Discovery
Find database tables by knowing the SRS domain:
- Route: `/admin/users`
- Tables: `admin_users*`

### 3. Scalability
Works with 500+ tables without confusion.

### 4. Self-Documenting
Table name tells you domain, area, and purpose.

---

## Examples

### Good Names
```
admin_users_DeletionLogs     ✅ Clear domain/area/entity
prod_email_Messages          ✅ Productivity email messages
fin_rec_Transactions         ✅ Finance recurring transactions
```

### Bad Names
```
deletionLogs                 ❌ No domain context
UserDeletionLogs             ❌ Missing prefix pattern
admin_deletionlogs           ❌ Wrong casing
admin_usr_DelLogs            ❌ Abbreviations
```

---

## Quick Reference

| Domain | Prefix | Example |
|--------|--------|---------|
| Admin | `admin_` | `admin_users_DeletionLogs` |
| Client | `client_` | `client_notes_Attachments` |
| Finance | `fin_` | `fin_rec_Transactions` |
| Productivity | `prod_` | `prod_email_Messages` |
| Projects | `proj_` | `proj_task_Comments` |

---

## Summary

```
[domain]_[area]_[Entity]
```

- **Domain**: lowercase, major business area
- **Area**: lowercase, functional subdivision
- **Entity**: PascalCase, specific data type
- **Core tables**: No prefix (e.g., `users`, `clients`)

This creates perfect alignment from URL to database.
