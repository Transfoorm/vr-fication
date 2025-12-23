# 🧵 THREAD STATE DERIVATION LOGIC

**Version:** 1.0
**Status:** Technical Specification
**Last Updated:** 2025-12-21
**Companion To:** EMAIL_DOCTRINE.md

---

## THE PROBLEM

Email threads contain multiple messages. Each message can have a different `resolutionState`:

```
Thread: "Q4 Planning Meeting"
├─ Message 1: "Can we meet Friday?" (awaiting_them)
├─ Message 2: "Yes, 2pm works" (awaiting_me)
└─ Message 3: "Great, see you then" (resolved)
```

**Question:** What is the thread's state?

**Bad Answer:** Show 3 different states in the UI (confusing)
**Good Answer:** Derive a single thread state from message states (algorithmic)

---

## THE SOLUTION

Thread state is a **pure function** of message states:

```typescript
threadState = deriveThreadState(messages)
```

**Key Principles:**
1. Thread state is NEVER stored (only computed)
2. Message states are the single source of truth
3. Algorithm is deterministic (same inputs = same output)
4. Computation is fast (O(n) where n = messages in thread)

---

## THE CORE ALGORITHM

```typescript
type ResolutionState = "none" | "awaiting_me" | "awaiting_them" | "resolved";

interface Message {
  _id: Id<"productivity_email_Index">;
  threadId: string;
  from: { email: string; name: string };
  to: Array<{ email: string; name: string }>;
  timestamp: number;
  resolutionState: ResolutionState;
}

interface ThreadState {
  threadId: string;
  state: ResolutionState;
  lastMessageAt: number;
  lastMessageFrom: string;
  messageCount: number;
  unresolvedCount: number;
}

export function deriveThreadState(
  messages: Message[],
  currentUserEmail: string
): ThreadState {
  // 1. Sort by timestamp (newest first)
  const sorted = messages.sort((a, b) => b.timestamp - a.timestamp);
  const lastMessage = sorted[0];

  // 2. Count states
  const stateCount = {
    none: messages.filter(m => m.resolutionState === "none").length,
    awaiting_me: messages.filter(m => m.resolutionState === "awaiting_me").length,
    awaiting_them: messages.filter(m => m.resolutionState === "awaiting_them").length,
    resolved: messages.filter(m => m.resolutionState === "resolved").length,
  };

  const unresolvedCount = stateCount.none + stateCount.awaiting_me + stateCount.awaiting_them;

  // 3. Derivation rules (priority order)
  let derivedState: ResolutionState;

  // Rule 1: If ANY message is awaiting_me → thread is awaiting_me
  if (stateCount.awaiting_me > 0) {
    derivedState = "awaiting_me";
  }
  // Rule 2: If ALL messages are resolved → thread is resolved
  else if (messages.every(m => m.resolutionState === "resolved")) {
    derivedState = "resolved";
  }
  // Rule 3: If last message from me + not awaiting_me → awaiting_them
  else if (lastMessage.from.email === currentUserEmail) {
    derivedState = "awaiting_them";
  }
  // Rule 4: Default to "none" if no other rules match
  else {
    derivedState = "none";
  }

  return {
    threadId: messages[0].threadId,
    state: derivedState,
    lastMessageAt: lastMessage.timestamp,
    lastMessageFrom: lastMessage.from.email,
    messageCount: messages.length,
    unresolvedCount,
  };
}
```

---

## THE DERIVATION RULES (Priority Order)

### Rule 1: ANY awaiting_me → Thread is awaiting_me
**Logic:** If I need to reply to ANY message in the thread, the thread needs my attention.

**Example:**
```
Message 1: "Can you review this?" (awaiting_me)
Message 2: "Also, check attachment" (awaiting_me)
Message 3: "Thanks!" (resolved)

Thread State: awaiting_me
```

**Why Priority #1:** User action needed = highest priority.

---

### Rule 2: ALL resolved → Thread is resolved
**Logic:** Only mark thread as resolved if every single message is resolved.

**Example:**
```
Message 1: "Can we meet?" (resolved)
Message 2: "Yes, 2pm" (resolved)
Message 3: "See you then" (resolved)

Thread State: resolved
```

**Why Priority #2:** Conversation complete = can archive safely.

---

### Rule 3: Last message from me → awaiting_them
**Logic:** If I sent the last message and there's no awaiting_me, ball is in their court.

**Example:**
```
Message 1: "Can you review?" (none)
Message 2: "Sure, will do by Friday" (none)  ← from me

Thread State: awaiting_them
```

**Why Priority #3:** Helps track outbound requests.

---

### Rule 4: Default → none
**Logic:** If no other rules match, thread is in neutral state.

**Example:**
```
Message 1: "FYI: Q4 report attached" (none)

Thread State: none
```

**Why Priority #4:** Fallback for newsletters, FYIs, etc.

---

## EDGE CASES

### Edge Case 1: Mixed states with last message from them
```
Message 1: "Can you review?" (awaiting_me)
Message 2: "I sent the doc" (awaiting_them)  ← from me
Message 3: "Got it, reviewing now" (none)     ← from them

Thread State: awaiting_me (Rule 1 wins - ANY awaiting_me)
```

**Resolution:** Rule 1 has highest priority. Even though last message is from them, I still have an unresolved awaiting_me.

---

### Edge Case 2: All "none" with last message from me
```
Message 1: "FYI: Q4 numbers" (none)           ← from them
Message 2: "Thanks for sharing" (none)        ← from me

Thread State: awaiting_them (Rule 3 - last from me)
```

**Resolution:** Rule 3 applies. Even though it's just an FYI, system tracks that I sent last message.

**User Fix:** User can manually mark Message 2 as "resolved" to move thread to resolved.

---

### Edge Case 3: One-message thread from me
```
Message 1: "Hey, can we schedule a call?" (none)  ← from me

Thread State: awaiting_them (Rule 3 - last from me)
```

**Resolution:** Correct behavior. I sent a question, waiting for reply.

---

### Edge Case 4: One-message thread from them
```
Message 1: "Can you review this doc?" (none)  ← from them

Thread State: none (Rule 4 - default)
```

**Resolution:** Correct, but AI should suggest `awaiting_me` state. User clicks to commit.

---

### Edge Case 5: User resolves only their own messages
```
Message 1: "Can you review?" (awaiting_me)    ← from them
Message 2: "I'll review by Friday" (resolved) ← from me

Thread State: awaiting_me (Rule 1 - still have awaiting_me)
```

**Resolution:** Correct. User must resolve Message 1 to move thread to resolved.

---

## STATE TRANSITION FLOWS

### Flow 1: New email arrives
```
Before: Thread doesn't exist
Action: Email arrives from sender
After:  Thread state = "none" (Rule 4)
        AI suggests "awaiting_me"
```

### Flow 2: User replies
```
Before: Thread state = "awaiting_me"
Action: User sends reply, marks original as "resolved"
After:  Thread state = "awaiting_them" (Rule 3 - last from me)
```

### Flow 3: They reply back
```
Before: Thread state = "awaiting_them"
Action: New message arrives from sender
After:  Thread state = "none" (Rule 4)
        AI suggests "awaiting_me"
        User clicks to commit → "awaiting_me"
```

### Flow 4: User resolves entire conversation
```
Before: Thread state = "awaiting_me"
Action: User clicks "Resolve Thread" (marks ALL messages as resolved)
After:  Thread state = "resolved" (Rule 2 - all resolved)
```

### Flow 5: User reopens resolved thread
```
Before: Thread state = "resolved"
Action: User clicks "Reopen" on any message → changes to "awaiting_me"
After:  Thread state = "awaiting_me" (Rule 1 - ANY awaiting_me)
```

---

## IMPLEMENTATION: CONVEX QUERIES

### Query 1: Get thread state for single thread
```typescript
export const getThreadState = query({
  args: {
    threadId: v.string(),
  },
  handler: async (ctx, { threadId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const messages = await ctx.db
      .query("productivity_email_Index")
      .filter(q => q.eq(q.field("threadId"), threadId))
      .collect();

    if (messages.length === 0) {
      throw new Error("Thread not found");
    }

    return deriveThreadState(messages, user.email);
  },
});
```

### Query 2: List all threads with derived states
```typescript
export const listThreads = query({
  args: {
    filter?: v.optional(v.union(
      v.literal("awaiting_me"),
      v.literal("awaiting_them"),
      v.literal("resolved"),
      v.literal("none")
    )),
  },
  handler: async (ctx, { filter }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // 1. Get all messages for user
    const allMessages = await ctx.db
      .query("productivity_email_Index")
      .filter(q => q.eq(q.field("userId"), user._id))
      .collect();

    // 2. Group by threadId
    const threadGroups = new Map<string, Message[]>();
    for (const message of allMessages) {
      const existing = threadGroups.get(message.threadId) || [];
      threadGroups.set(message.threadId, [...existing, message]);
    }

    // 3. Derive state for each thread
    const threads = Array.from(threadGroups.entries()).map(([threadId, messages]) => {
      return deriveThreadState(messages, user.email);
    });

    // 4. Filter by state if requested
    const filtered = filter
      ? threads.filter(t => t.state === filter)
      : threads;

    // 5. Sort by last message (newest first)
    return filtered.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  },
});
```

---

## PERFORMANCE OPTIMIZATION

### Problem: Deriving state for 10,000 threads is slow

**Solution 1: Pagination**
```typescript
// Don't compute all threads at once
export const listThreadsPaginated = query({
  args: {
    limit: v.number(),  // e.g., 50
    cursor: v.optional(v.string()),  // threadId to start from
  },
  handler: async (ctx, { limit, cursor }) => {
    // Only derive state for visible threads
    // Next page computes on demand
  },
});
```

**Solution 2: Cache derived state in client**
```typescript
// React Query caching
const { data: threads } = useQuery({
  queryKey: ['threads', filter],
  queryFn: () => listThreads({ filter }),
  staleTime: 60_000,  // Cache for 1 minute
});
```

**Solution 3: Index by threadId**
```typescript
// Convex index for fast thread grouping
defineTable("productivity_email_Index", {
  // ... fields
}).index("by_thread", ["threadId", "timestamp"]);

// Query becomes:
const messages = await ctx.db
  .query("productivity_email_Index")
  .withIndex("by_thread", q => q.eq("threadId", threadId))
  .collect();
```

---

## UI REPRESENTATION

### Thread List View
```tsx
<ThreadRow
  subject="Q4 Planning Meeting"
  state={threadState.state}
  lastMessageFrom={threadState.lastMessageFrom}
  lastMessageAt={threadState.lastMessageAt}
  unresolvedCount={threadState.unresolvedCount}
/>
```

**Visual States:**
- `awaiting_me`: Orange dot, bold text
- `awaiting_them`: Blue dot, normal text
- `resolved`: Gray, dimmed text
- `none`: No dot, normal text

### Message List View (inside thread)
```tsx
<MessageList>
  {messages.map(message => (
    <MessageRow
      key={message._id}
      message={message}
      showStateBadge={true}  // Individual message state
    />
  ))}
</MessageList>

<ThreadActions>
  <button onClick={resolveThread}>
    Resolve Entire Thread
  </button>
  <button onClick={markAwaitingMe}>
    Mark as Awaiting Me
  </button>
</ThreadActions>
```

---

## BULK ACTIONS

### Action 1: Resolve entire thread
```typescript
export const resolveThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.db
      .query("productivity_email_Index")
      .filter(q => q.eq(q.field("threadId"), threadId))
      .collect();

    // Mark ALL messages as resolved
    for (const message of messages) {
      await ctx.db.patch(message._id, {
        resolutionState: "resolved"
      });
    }

    // Thread state will auto-derive to "resolved" (Rule 2)
  },
});
```

### Action 2: Reopen thread
```typescript
export const reopenThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const messages = await ctx.db
      .query("productivity_email_Index")
      .filter(q => q.eq(q.field("threadId"), threadId))
      .order("desc")
      .first();  // Get most recent message

    if (!message) throw new Error("Thread not found");

    // Mark most recent message as awaiting_me
    await ctx.db.patch(message._id, {
      resolutionState: "awaiting_me"
    });

    // Thread state will auto-derive to "awaiting_me" (Rule 1)
  },
});
```

---

## TESTING SCENARIOS

### Test 1: Single message thread
```typescript
describe("deriveThreadState", () => {
  it("should handle single message from sender", () => {
    const messages = [
      createMessage({ from: "sender@example.com", state: "none" })
    ];

    const result = deriveThreadState(messages, "me@example.com");

    expect(result.state).toBe("none");  // Rule 4
  });

  it("should handle single message from me", () => {
    const messages = [
      createMessage({ from: "me@example.com", state: "none" })
    ];

    const result = deriveThreadState(messages, "me@example.com");

    expect(result.state).toBe("awaiting_them");  // Rule 3
  });
});
```

### Test 2: Multi-message thread
```typescript
it("should prioritize awaiting_me over other states", () => {
  const messages = [
    createMessage({ from: "sender@example.com", state: "awaiting_me", timestamp: 3 }),
    createMessage({ from: "me@example.com", state: "resolved", timestamp: 2 }),
    createMessage({ from: "sender@example.com", state: "resolved", timestamp: 1 }),
  ];

  const result = deriveThreadState(messages, "me@example.com");

  expect(result.state).toBe("awaiting_me");  // Rule 1 wins
  expect(result.lastMessageFrom).toBe("sender@example.com");
  expect(result.unresolvedCount).toBe(1);
});
```

### Test 3: All resolved
```typescript
it("should mark thread as resolved when all messages resolved", () => {
  const messages = [
    createMessage({ from: "sender@example.com", state: "resolved", timestamp: 3 }),
    createMessage({ from: "me@example.com", state: "resolved", timestamp: 2 }),
    createMessage({ from: "sender@example.com", state: "resolved", timestamp: 1 }),
  ];

  const result = deriveThreadState(messages, "me@example.com");

  expect(result.state).toBe("resolved");  // Rule 2
  expect(result.unresolvedCount).toBe(0);
});
```

---

## MIGRATION STRATEGY

### Phase 1: Add threadId to existing emails
```typescript
export const migrateThreadIds = internalMutation({
  handler: async (ctx) => {
    const emails = await ctx.db.query("productivity_email_Index").collect();

    for (const email of emails) {
      // Generate threadId from subject + participants
      const threadId = generateThreadId(email.subject, email.from, email.to);

      await ctx.db.patch(email._id, { threadId });
    }
  },
});

function generateThreadId(subject: string, from: string, to: string[]): string {
  // Simple hash of normalized subject + sorted participants
  const normalized = subject.toLowerCase().replace(/^(re:|fwd:)\s*/gi, "");
  const participants = [from, ...to].sort().join(",");
  return hashString(normalized + participants);
}
```

### Phase 2: Backfill resolutionState
```typescript
export const backfillResolutionStates = internalMutation({
  handler: async (ctx) => {
    const emails = await ctx.db.query("productivity_email_Index").collect();

    for (const email of emails) {
      // Default to "none" if not set
      if (!email.resolutionState) {
        await ctx.db.patch(email._id, {
          resolutionState: "none"
        });
      }
    }
  },
});
```

---

## THE INVARIANTS

**Invariant 1:** Thread state is NEVER stored in database
- ✅ Computed on every read
- ✅ No sync issues
- ✅ Single source of truth = message states

**Invariant 2:** Derivation algorithm is deterministic
- ✅ Same messages → same thread state
- ✅ No randomness, no time-dependent logic
- ✅ Testable with pure functions

**Invariant 3:** Message states can be changed independently
- ✅ User marks one message as resolved
- ✅ Thread state auto-updates via derivation
- ✅ No cascading updates needed

**Invariant 4:** Performance is O(n) where n = messages in thread
- ✅ Scales linearly with thread size
- ✅ Most threads have <20 messages
- ✅ Computation is fast (<1ms per thread)

---

## THE FORBIDDEN PATTERNS

### ❌ NEVER Store Thread State
```typescript
// ❌ WRONG - storing derived state
productivity_email_Threads: {
  threadId: string,
  threadState: "awaiting_me",  // FORBIDDEN - this is derived
}

// ✅ CORRECT - compute on read
const threadState = deriveThreadState(messages, userEmail);
```

### ❌ NEVER Update Thread State Directly
```typescript
// ❌ WRONG - direct thread state mutation
await ctx.db.patch(thread._id, {
  threadState: "resolved"
});

// ✅ CORRECT - update message states, thread derives
await ctx.db.patch(message._id, {
  resolutionState: "resolved"
});
```

### ❌ NEVER Cache Thread State in Database
```typescript
// ❌ WRONG - caching for performance
productivity_email_Index: {
  resolutionState: "awaiting_me",
  _cachedThreadState: "awaiting_me",  // FORBIDDEN
}

// ✅ CORRECT - cache in client/Redis if needed
```

---

## SUCCESS CRITERIA

- [ ] Thread state computed in <1ms per thread
- [ ] Zero thread state storage in Convex
- [ ] 100% test coverage for derivation algorithm
- [ ] All 5 edge cases handled correctly
- [ ] Bulk actions (resolve thread, reopen thread) working
- [ ] UI shows consistent thread state across all views
- [ ] Migration script successfully backfills threadIds
- [ ] Performance tested with 10,000 thread dataset

---

**END OF SPECIFICATION**

This document defines the canonical thread state derivation system.
All email thread features must use this algorithm.

Last updated: 2025-12-21
Version: 1.0
