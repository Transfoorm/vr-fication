# 📧 EMAIL DOCTRINE: What Email Is Allowed to Do in Transfoorm

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2025-12-21

---

## THE CORE PRINCIPLE

> **"Email is not a destination. It's an intake, triage, and promotion system."**

Email in Transfoorm is NOT:
- ❌ Another Gmail clone
- ❌ A place to "live" all day
- ❌ A productivity black hole
- ❌ A notification spam machine
- ❌ A permanent storage system

Email in Transfoorm IS:
- ✅ An intelligent sorting facility
- ✅ A promotion engine to tasks/projects/decisions
- ✅ A resolution state tracker (awaiting_me/awaiting_them/resolved)
- ✅ A temporal monitor (follow-up detection)
- ✅ An AI-assisted triage system
- ✅ An escape hatch FROM email addiction

---

## THE THREE SACRED RULES

### 1. STATE OWNERSHIP BOUNDARY
**Rule:** AI suggests. Humans commit.

**What This Means:**
- AI can analyze intent, priority, and suggested promotions
- AI can flag emails as likely "awaiting_me" or "awaiting_them"
- AI can detect follow-up opportunities
- AI can recommend linking to tasks/projects

**What AI CANNOT Do:**
- ❌ Autonomously change `resolutionState`
- ❌ Promote emails to tasks without human approval
- ❌ Mark emails as resolved
- ❌ Delete or archive without permission
- ❌ Send follow-ups automatically

**Why:** Trust. Users must feel in control. AI assists, never commands.

**Implementation:**
```typescript
// ✅ CORRECT - AI suggests, user commits
aiSuggestedState: "awaiting_me",
resolutionState: "none",  // User must click to commit

// ❌ WRONG - AI autonomously sets state
resolutionState: aiSuggestedState  // FORBIDDEN
```

---

### 2. NOTIFICATION BUDGET
**Rule:** Maximum 3 proactive notifications per day.

**What This Means:**
- AI must rank and prioritize
- Only the top 3 most urgent items get notifications
- No notification creep over time
- Hard cap enforced at system level

**Why:**
- Fast systems must be respectful systems
- 10 notifications = 0 notifications (user ignores all)
- Forces AI to be selective and accurate
- Preserves user trust and attention

**Implementation:**
```typescript
// Daily notification budget tracking
type NotificationBudget = {
  userId: Id<"admin_users">,
  date: string,  // YYYY-MM-DD
  notificationsUsed: number,  // Max 3
  candidateEmails: Array<{
    emailId: Id<"productivity_email_Index">,
    urgencyScore: number,  // 0-100
    reason: string
  }>
}

// Budget enforcement
if (notificationsUsed >= 3) {
  // Queue for tomorrow, don't notify
}
```

---

### 3. PROMOTION REVERSIBILITY
**Rule:** Every promotion must be undoable and unlinkable.

**What This Means:**
- Promoted email → task? User can undo within 10-30 seconds
- Linked email → project? User can unlink and restore to inbox later
- Fast actions require fast forgiveness
- No permanent consequences from quick clicks

**Why:**
- Fast systems without forgiveness = anxiety
- Users won't use promotion if they fear mistakes
- "Undo" unlocks confidence in the system

**Implementation:**
```typescript
type EmailPromotion = {
  type: "task" | "project" | "booking" | "decision",
  id: Id<...>,
  promotedAt: number,
  promotedBy: Id<"admin_users">,

  // Reversibility metadata
  undoWindowExpires: number,  // promotedAt + 30_000 (30 seconds)
  canUnlink: boolean,  // Always true
  originalInboxState: {
    folder: string,
    readState: "unread" | "read",
    resolutionState: string
  }
}

// Undo action (within window)
function undoPromotion(promotionId) {
  if (Date.now() <= promotion.undoWindowExpires) {
    // Delete linked object, restore email to original state
  }
}

// Unlink action (any time)
function unlinkPromotion(promotionId) {
  // Remove link, restore email to inbox
}
```

---

## THE FOUR ARCHITECTURAL LAWS

### LAW 1: THREAD STATE DERIVATION
**Problem:** Phantom follow-ups where messages within same thread show different states.

**Solution:** Thread-level state is derived from message-level states.

**Algorithm:**
```typescript
function deriveThreadState(messages: Message[]): ThreadState {
  const lastMessage = messages.sort((a, b) => b.timestamp - a.timestamp)[0];

  // If ANY message is awaiting_me → thread is awaiting_me
  if (messages.some(m => m.resolutionState === "awaiting_me")) {
    return "awaiting_me";
  }

  // If ALL messages are resolved → thread is resolved
  if (messages.every(m => m.resolutionState === "resolved")) {
    return "resolved";
  }

  // If last message sent by me + no reply → awaiting_them
  if (lastMessage.from.email === currentUser.email) {
    return "awaiting_them";
  }

  // Default fallback
  return "none";
}
```

**Storage:**
```typescript
// Messages store individual states
productivity_email_Index: {
  resolutionState: "awaiting_me" | "awaiting_them" | "resolved" | "none",
  threadId: string
}

// Thread state is computed on read (not stored)
export const getThreadState = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.db
      .query("productivity_email_Index")
      .filter(q => q.eq(q.field("threadId"), threadId))
      .collect();

    return deriveThreadState(messages);
  }
});
```

**Why No Storage:** Avoids sync issues. Single source of truth = message states. Thread state = pure function.

---

### LAW 2: SEARCH VS STATE SEMANTICS
**Problem:** User searches for email, can't find it because it's in "resolved" state.

**Solution:** Search is exhaustive. Inbox views are opinionated.

**Implementation:**
```typescript
// Inbox view (opinionated - filtered by state)
function InboxView({ filter }: { filter: "awaiting_me" | "awaiting_them" | "resolved" }) {
  const emails = useQuery(api.productivity.queries.listEmails, {
    resolutionState: filter
  });
  // Only shows emails matching state filter
}

// Search view (exhaustive - no state filter)
function SearchView({ query }: { query: string }) {
  const emails = useQuery(api.productivity.queries.searchEmails, {
    query,
    // NO resolutionState filter - searches ALL states
  });

  // Shows emails from all states, with state badge visible
  return emails.map(email => (
    <EmailRow
      email={email}
      showStateBadge={true}  // "Resolved", "Awaiting me", etc.
    />
  ));
}
```

**Why:** Prevents "system ate my email" panic. Search = safety net.

---

### LAW 3: METADATA-ONLY SYNC
**Problem:** User has 500GB of email. Can't store it all.

**Solution:** Store metadata index (30-50MB), fetch content on-demand.

**What Gets Stored:**
```typescript
// Stored in Convex (lightweight index)
productivity_email_Index: {
  providerMessageId: string,  // e.g., Gmail message ID
  threadId: string,
  from: { name: string, email: string },
  to: Array<{ name: string, email: string }>,
  subject: string,
  snippet: string,  // First 200 chars
  timestamp: number,
  folder: string,
  hasAttachments: boolean,
  // ... resolution state, AI metadata, etc.
}
```

**What Gets Fetched On-Demand:**
- Full email body (HTML/plain text)
- Attachments
- Full thread history (older than sync window)

**Sync Window:**
- Default: 30 days
- Options: 30 | 90 | 180 days
- Configurable per account

**Why:** Matches desktop Outlook's "Cached Exchange Mode" pattern. Industry standard.

---

### LAW 4: SENDER CLASSIFICATION
**Problem:** AI wastes notifications on automated emails.

**Solution:** Classify senders, suppress notifications for low-value categories.

**Categories:**
```typescript
type SenderClassification =
  | "human"           // Real person, full notifications
  | "automated"       // GitHub, Jira, CI/CD - suppress
  | "transactional"   // Receipts, shipping - suppress unless urgent
  | "marketing"       // Newsletters - always suppress
  | "system"          // Password resets - high priority

// Cache classification (don't re-analyze every time)
productivity_email_SenderCache: {
  emailDomain: string,
  classification: SenderClassification,
  lastSeenAt: number,
  messageCount: number,
  humanOverride?: SenderClassification  // User can correct AI
}
```

**Notification Suppression:**
```typescript
function shouldNotify(email: Email, sender: SenderCache): boolean {
  // Never notify for marketing/automated
  if (sender.classification === "marketing" || sender.classification === "automated") {
    return false;
  }

  // Always notify for system (password resets, security)
  if (sender.classification === "system") {
    return true;
  }

  // Transactional: only if urgent (keyword matching)
  if (sender.classification === "transactional") {
    return email.aiPriority === "urgent";
  }

  // Human: respect notification budget
  return true;
}
```

---

## THE DATA ARCHITECTURE

### Three-Tier System

**Tier 1: Index (Convex)**
- Metadata only (30-50MB for 100k emails)
- Fast queries, instant UI
- Resolution states, AI metadata, promotions
- Synced every 5-15 minutes

**Tier 2: Ephemeral (Redis/Memory)**
- Full email bodies for recent/open threads
- Expires after 24-48 hours of inactivity
- Cache layer for performance

**Tier 3: Source (Gmail/Outlook API)**
- Permanent storage remains with provider
- Fetch on-demand for old/archived emails
- Never migrate provider data to Transfoorm

**Why Three Tiers:**
- Index = Speed (UI feels instant)
- Ephemeral = Smart caching (don't re-fetch on every click)
- Source = Safety (never lose email if Transfoorm goes down)

---

## THE RESOLUTION STATES

### Four States Only

**1. `none`** (default)
- Email just arrived
- No action taken yet
- Not in any workflow

**2. `awaiting_me`**
- I need to reply
- I need to take action
- Ball is in my court

**3. `awaiting_them`**
- I replied, waiting for their response
- I asked a question
- Ball is in their court

**4. `resolved`**
- Conversation complete
- No further action needed
- Outcome achieved (or abandoned)

**State Transitions:**
```
none → awaiting_me    (AI suggests, or user clicks)
awaiting_me → awaiting_them   (User replies)
awaiting_them → awaiting_me   (They reply)
any → resolved        (User marks done)
resolved → awaiting_me   (User reopens)
```

**No Other States Allowed:**
- ❌ No "snoozed"
- ❌ No "pending"
- ❌ No "flagged"
- ❌ No "important"

**Why:** Simplicity. Four states cover 99% of real workflows.

---

## THE AI AGENT BOUNDARIES

### What AI Can Do
✅ Analyze intent (action_required, scheduling, decision, reference)
✅ Detect priority (urgent, normal, low)
✅ Suggest promotions to tasks/projects/bookings
✅ Monitor temporal patterns (follow-up detection)
✅ Classify senders (human vs automated)
✅ Flag likely state (awaiting_me vs awaiting_them)
✅ Rank notification candidates

### What AI Cannot Do
❌ Autonomously change `resolutionState`
❌ Send emails without user approval
❌ Delete or archive emails
❌ Promote to tasks without user click
❌ Exceed 3 notifications per day
❌ Override user's manual classifications
❌ Access email content without user opening it

### AI Agent Architecture
```typescript
// Agent runs every 15 minutes (background job)
export const emailTriageAgent = internalMutation({
  handler: async (ctx) => {
    // 1. Fetch new emails (last 15 min)
    const newEmails = await getRecentEmails(ctx);

    // 2. Classify senders (cache lookup + AI if new)
    for (const email of newEmails) {
      const sender = await classifySender(ctx, email.from.email);

      // 3. Analyze intent + priority (only for human senders)
      if (sender.classification === "human") {
        const analysis = await analyzeEmail(email);

        await ctx.db.patch(email._id, {
          aiIntent: analysis.intent,
          aiPriority: analysis.priority,
          aiSuggestedState: analysis.suggestedState,
          aiSuggestedLinks: analysis.suggestedLinks
        });
      }
    }

    // 4. Temporal monitoring (follow-up detection)
    await detectFollowUps(ctx);

    // 5. Notification ranking (respect budget)
    await rankNotificationCandidates(ctx);
  }
});
```

---

## THE PROMOTION ENGINE

### Promotion Types

**1. Email → Task**
- User clicks "Make Task"
- Creates task in productivity domain
- Links email to task
- Email stays in inbox (or moves to resolved)

**2. Email → Project**
- User clicks "Link to Project"
- Shows project picker
- Links email to existing project
- Email can be resolved or kept active

**3. Email → Booking**
- User clicks "Schedule Meeting"
- Opens booking flow with email context
- Pre-fills attendees from email
- Links booking to email thread

**4. Email → Decision**
- User clicks "Track Decision"
- Creates decision node
- Links email as evidence/context
- Tracks outcome in decision log

### Promotion Metadata
```typescript
linkedObjects: Array<{
  type: "task" | "project" | "booking" | "decision",
  id: Id<...>,
  promotedAt: number,
  promotedBy: Id<"admin_users">,

  // Reversibility
  undoWindowExpires: number,
  canUnlink: boolean,
  originalInboxState: {
    folder: string,
    readState: "unread" | "read",
    resolutionState: string
  }
}>
```

### Promotion UI Pattern
```typescript
// Every promotion shows undo toast
function onPromoteToTask(email: Email) {
  const task = await createTask(email);

  showToast({
    message: "Email promoted to task",
    action: {
      label: "Undo",
      onClick: () => undoPromotion(task._id)
    },
    duration: 30_000  // 30 second undo window
  });
}
```

---

## THE TEMPORAL MONITORING SYSTEM

### Follow-Up Detection

**Scenario 1: I sent email, no reply**
```typescript
if (
  lastMessage.from.email === currentUser.email &&
  Date.now() - lastMessage.timestamp > 3 * 24 * 60 * 60 * 1000  // 3 days
) {
  // Flag as follow-up candidate
  aiReason: "You sent this 3 days ago, no reply yet"
}
```

**Scenario 2: They promised reply by date**
```typescript
// AI extracts "I'll get back to you by Friday" from email body
expectedReplyBy: extractDateFromText(emailBody)

if (Date.now() > expectedReplyBy) {
  aiReason: "They said they'd reply by Friday, it's now Monday"
}
```

**Scenario 3: Regular follow-up pattern**
```typescript
// User historically follows up every 7 days with this sender
if (Date.now() - lastMessage.timestamp > 7 * 24 * 60 * 60 * 1000) {
  aiReason: "You usually follow up weekly with this contact"
}
```

### Follow-Up State
```typescript
followUpState: {
  lastSentAt: number,           // When I last sent message
  expectedReplyBy?: number,     // AI-extracted promise date
  followUpCount: number,        // How many times I've followed up
  aiReason?: string,            // Why AI thinks follow-up needed
  userSnoozedUntil?: number     // User said "remind me later"
}
```

---

## THE FORBIDDEN PATTERNS

### ❌ NEVER Auto-Reply
Email cannot send automated replies without explicit user approval each time.

### ❌ NEVER Auto-Archive
AI cannot move emails to archive. User must click "Resolve" or "Archive".

### ❌ NEVER Sync Full Bodies
Only metadata in Convex. Bodies fetched on-demand.

### ❌ NEVER Notification Spam
3 per day maximum. Hard cap. No exceptions.

### ❌ NEVER Permanent Promotions
Every promotion must be reversible (undo + unlink).

### ❌ NEVER State Autocomplete
AI suggests states, humans commit. No autonomous state changes.

### ❌ NEVER Hidden Search Results
Search must span all states. No filtering by resolution state.

---

## THE IMPLEMENTATION CHECKLIST

Before shipping email to production, verify:

- [ ] Notification budget enforced (max 3/day)
- [ ] Undo window implemented (30 seconds)
- [ ] Unlink functionality works (any time)
- [ ] Search spans all states (no filtering)
- [ ] Thread state derived (not stored)
- [ ] AI suggestions shown as badges (not committed)
- [ ] Sender classification cached
- [ ] Metadata-only sync (no full bodies in Convex)
- [ ] Follow-up detection working
- [ ] Promotion engine supports all 4 types
- [ ] OAuth setup for Gmail/Outlook
- [ ] SMTP fallback for custom providers

---

## THE SUCCESS METRICS

**Product North Star:**
> "Users spend 80% less time in email, 200% more time in promoted tasks/projects."

**Key Metrics:**
1. **Promotion Rate:** % of emails promoted to tasks/projects/bookings
2. **Resolution Speed:** Time from email arrival to "resolved" state
3. **Notification Accuracy:** % of notifications user acts on (target: >70%)
4. **Undo Usage:** % of promotions that get undone (should be <5%)
5. **Search Rescue Rate:** % of searches that find emails in non-active states

**Anti-Metrics (Should Decrease):**
1. Time spent in email tab (target: <10 min/day)
2. Emails sitting in "none" state (target: <10%)
3. Notification ignore rate (target: <30%)

---

## THE PHILOSOPHICAL STANCE

Email in Transfoorm is not about being "better at email."

It's about **escaping email.**

Every feature should ask:
> "Does this help the user spend LESS time in email?"

If the answer is no, don't build it.

Resolution states exist to **get emails out of inbox.**
Promotion engine exists to **move emails into real work.**
AI triage exists to **reduce decisions user must make.**
Notification budget exists to **protect user attention.**
Search safety net exists to **eliminate email anxiety.**

**The goal is not inbox zero.**
**The goal is inbox irrelevant.**

---

**END OF DOCTRINE**

This document is canonical. All email implementation must comply.
Deviations require explicit approval and doctrine amendment.

Last updated: 2025-12-21
Version: 1.0
