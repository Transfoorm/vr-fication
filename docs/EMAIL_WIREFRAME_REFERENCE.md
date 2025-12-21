# 📐 EMAIL UI WIREFRAME: State Transition Reference

**Version:** 1.0
**Status:** Visual Foundation
**Last Updated:** 2025-12-21
**Companion To:** EMAIL_UX_DOCTRINE.md

---

## THE PURPOSE

This wireframe shows **one thread** moving through the resolution lifecycle:

**`none` → `awaiting_me` → `resolved`**

The goal: **Lock in the "work queue console" feel. Prevent Gmail drift.**

---

## SCENARIO: Sarah Chen Emails About Q4 Planning

We'll track one real thread through three states to prove the UI never "feels like email."

---

## STATE 1: `none` (Email Just Arrived)

```
┌────────────────────┬─────────────────────────────────────┬────────────────────────┐
│  INBOX QUEUE       │  MESSAGE BODY (Transient)           │  SYSTEM INTELLIGENCE   │
│  (Work Triage)     │  (Reader Mode)                      │  (Context First)       │
├────────────────────┼─────────────────────────────────────┼────────────────────────┤
│                    │                                     │                        │
│ ┌──────────────┐   │  Sarah Chen → You                   │ ┌────────────────────┐ │
│ │ AWAITING ME  │   │  Q4 Planning - need your input      │ │ THREAD STATE       │ │
│ └──────────────┘   │  2:34 PM                            │ │ ⚪ none             │ │
│ (3)                │                                     │ └────────────────────┘ │
│                    │ ┌─────────────────────────────────┐ │                        │
│ ┌──────────────┐   │ │                                 │ │ ┌────────────────────┐ │
│ │ AWAITING THEM│   │ │ Hey -                           │ │ │ AI ANALYSIS        │ │
│ └──────────────┘   │ │                                 │ │ │                    │ │
│ (5)                │ │ Can you review the attached     │ │ │ Intent:            │ │
│                    │ │ deck and let me know if the Q4  │ │ │ Action Required    │ │
│ ● Sarah Chen       │ │ timeline works for you?         │ │ │                    │ │
│   Q4 Planning...   │ │                                 │ │ │ Priority:          │ │
│   2:34 PM          │ │ Thanks!                         │ │ │ Urgent             │ │
│                    │ │                                 │ │ │                    │ │
│   David Park       │ └─────────────────────────────────┘ │ │ "Timeline decision │ │
│   Contract terms   │                                     │ │  needed by EOW"    │ │
│   Yesterday        │  Q4_Planning_Deck.pdf (2.4 MB)      │ └────────────────────┘ │
│                    │                                     │                        │
│   GitHub           │                                     │ ┌────────────────────┐ │
│   PR #234 merged   │ ┌─────────────────────────────────┐ │ │ SUGGESTED ACTIONS  │ │
│   2 days ago       │ │ [Reply] [Forward] [Archive]     │ │ │                    │ │
│                    │ └─────────────────────────────────┘ │ │ ⚠️ AI Suggests:    │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ This email needs   │ │
│                    │                                     │ │ your response on   │ │
│                    │                                     │ │ timeline approval  │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [Mark Awaiting Me] │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ ─────────────────  │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ Or:                │ │
│                    │                                     │ │ [→ Promote to Task]│ │
│                    │                                     │ │ [Link to Project]  │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
│                    │                                     │ ┌────────────────────┐ │
│                    │                                     │ │ SENDER PROFILE     │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ Sarah Chen         │ │
│                    │                                     │ │ Human              │ │
│                    │                                     │ │ Response: 95% <24h │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
└────────────────────┴─────────────────────────────────────┴────────────────────────┘
```

### KEY VISUAL ELEMENTS (State: `none`)

**Left Rail (Inbox Queue):**
- Thread row has **no state dot** (neutral)
- Thread row is **normal weight** (not bold)
- Thread appears in **no specific filter** (not in "Awaiting Me")
- Subject truncates (shows "Q4 Planning..." not full text)

**Center Panel (Message Body):**
- Clean, minimal header
- Plain body text (no heavy chrome)
- Attachment shown inline
- **Reply/Forward/Archive buttons** are present but **not primary**

**Right Rail (System Intelligence):**
- State badge shows **⚪ none** (gray, subtle)
- AI Analysis shows **Intent: Action Required, Priority: Urgent**
- **Suggested Actions** section shows **AI recommendation badge**:
  - "⚠️ AI Suggests: This email needs your response..."
  - **[Mark Awaiting Me]** button (suggests state change, doesn't commit)
- Alternative actions: Promote to Task, Link to Project
- Sender Profile shows classification (Human) and response patterns

### CRITICAL BEHAVIORS:

1. **AI suggests, doesn't commit:**
   - Badge says "AI Suggests" (not "AI Decided")
   - User must click [Mark Awaiting Me] to commit state change
   - No autonomous state changes

2. **State is visible in queue:**
   - No state dot = neutral/unprocessed
   - Row doesn't appear in "Awaiting Me" filter yet

3. **Actions are inverted:**
   - [→ Promote to Task] is equally prominent as [Mark Awaiting Me]
   - [Reply] is secondary (in center panel, not right rail)

---

## STATE 2: `awaiting_me` (User Committed State)

**User Action:** Clicked **[Mark Awaiting Me]** in right rail

```
┌────────────────────┬─────────────────────────────────────┬────────────────────────┐
│  INBOX QUEUE       │  MESSAGE BODY (Transient)           │  SYSTEM INTELLIGENCE   │
│  (Work Triage)     │  (Reader Mode)                      │  (Context First)       │
├────────────────────┼─────────────────────────────────────┼────────────────────────┤
│                    │                                     │                        │
│ ┌──────────────┐   │  Sarah Chen → You                   │ ┌────────────────────┐ │
│ │ AWAITING ME  │   │  Q4 Planning - need your input      │ │ THREAD STATE       │ │
│ └──────────────┘   │  2:34 PM                            │ │ 🟠 Awaiting Me     │ │
│ (4)                │                                     │ └────────────────────┘ │
│                    │ ┌─────────────────────────────────┐ │                        │
│ ┌──────────────┐   │ │                                 │ │ ┌────────────────────┐ │
│ │ AWAITING THEM│   │ │ Hey -                           │ │ │ AI ANALYSIS        │ │
│ └──────────────┘   │ │                                 │ │ │                    │ │
│ (5)                │ │ Can you review the attached     │ │ │ Intent:            │ │
│                    │ │ deck and let me know if the Q4  │ │ │ Action Required    │ │
│ 🟠 Sarah Chen      │ │ timeline works for you?         │ │ │                    │ │
│   Q4 Planning...   │ │                                 │ │ │ Priority:          │ │
│   2:34 PM          │ │ Thanks!                         │ │ │ Urgent             │ │
│   AWAITING ME      │ │                                 │ │ │                    │ │
│                    │ └─────────────────────────────────┘ │ │ "Timeline decision │ │
│   David Park       │                                     │ │  needed by EOW"    │ │
│   Contract terms   │  Q4_Planning_Deck.pdf (2.4 MB)      │ └────────────────────┘ │
│   Yesterday        │                                     │                        │
│                    │                                     │ ┌────────────────────┐ │
│   GitHub           │ ┌─────────────────────────────────┐ │ │ PRIMARY ACTIONS    │ │
│   PR #234 merged   │ │ [Reply] [Forward] [Archive]     │ │ │                    │ │
│   2 days ago       │ └─────────────────────────────────┘ │ │ [→ Promote to Task]│ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [Link to Project:  │ │
│                    │                                     │ │  Q4 Planning]      │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [✓ Resolve Thread] │ │
│                    │                                     │ │                    │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
│                    │                                     │ ┌────────────────────┐ │
│                    │                                     │ │ TEMPORAL           │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ Received: 2h ago   │ │
│                    │                                     │ │ Expected reply:    │ │
│                    │                                     │ │ By EOW (3 days)    │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
│                    │                                     │ ┌────────────────────┐ │
│                    │                                     │ │ SENDER PROFILE     │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ Sarah Chen         │ │
│                    │                                     │ │ Human              │ │
│                    │                                     │ │ Response: 95% <24h │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
└────────────────────┴─────────────────────────────────────┴────────────────────────┘
```

### VISUAL CHANGES (State: `awaiting_me`)

**Left Rail (Inbox Queue):**
- Thread row now has **🟠 orange dot** (high visibility)
- Thread row is **bold weight** (demands attention)
- **State badge "AWAITING ME"** appears on row
- Thread count in "AWAITING ME" filter increased from 3 → 4
- Thread is now **at the top of "Awaiting Me" queue** (sorted by urgency)

**Center Panel (Message Body):**
- **No changes** (body is transient, state lives in rails)

**Right Rail (System Intelligence):**
- State badge now shows **🟠 Awaiting Me** (orange, prominent)
- **"Suggested Actions" section replaced with "PRIMARY ACTIONS":**
  - [→ Promote to Task] (filled button, brand color)
  - [Link to Project: Q4 Planning] (AI pre-suggested match)
  - [✓ Resolve Thread] (secondary button)
- **AI suggestion badge removed** (user already committed state)
- **Temporal section added:**
  - "Received: 2h ago"
  - "Expected reply: By EOW (3 days)" (extracted from email)

### CRITICAL BEHAVIORS:

1. **State change is instant:**
   - No spinner, no loading state
   - Optimistic update (syncs in background)
   - Toast confirmation: "Marked as Awaiting Me" (2s duration)

2. **Queue reorganization:**
   - Thread jumps to top of "Awaiting Me" filter
   - Orange dot makes it impossible to miss
   - Badge shows state even when thread is closed

3. **Action hierarchy shift:**
   - [→ Promote to Task] is now primary CTA (most prominent)
   - [✓ Resolve Thread] is also visible (fast closure path)
   - [Reply] stays in center panel (secondary action)

4. **System tracks temporal context:**
   - "Expected reply: By EOW (3 days)" creates deadline
   - Will trigger follow-up notification if deadline passes
   - User doesn't need to remember

---

## STATE 3: `resolved` (User Finished Workflow)

**User Action:** Reviewed deck, replied to Sarah, clicked **[✓ Resolve Thread]**

```
┌────────────────────┬─────────────────────────────────────┬────────────────────────┐
│  INBOX QUEUE       │  MESSAGE BODY (Transient)           │  SYSTEM INTELLIGENCE   │
│  (Work Triage)     │  (Reader Mode)                      │  (Context First)       │
├────────────────────┼─────────────────────────────────────┼────────────────────────┤
│                    │                                     │                        │
│ ┌──────────────┐   │  Sarah Chen ⇄ You (3 messages)      │ ┌────────────────────┐ │
│ │ AWAITING ME  │   │  Q4 Planning - need your input      │ │ THREAD STATE       │ │
│ └──────────────┘   │  5:47 PM                            │ │ ✓ Resolved         │ │
│ (3)                │                                     │ └────────────────────┘ │
│                    │ ┌─────────────────────────────────┐ │                        │
│ ┌──────────────┐   │ │ Sarah Chen → You (2:34 PM)      │ │ ┌────────────────────┐ │
│ │ AWAITING THEM│   │ │                                 │ │ │ RESOLUTION HISTORY │ │
│ └──────────────┘   │ │ Hey - can you review the        │ │ │                    │ │
│ (5)                │ │ attached deck...                │ │ │ Resolved by:       │ │
│                    │ │                                 │ │ │ You                │ │
│ ┌──────────────┐   │ │ You → Sarah Chen (4:15 PM)      │ │ │                    │ │
│ │ RESOLVED     │   │ │                                 │ │ │ Resolved at:       │ │
│ └──────────────┘   │ │ Reviewed the deck. Timeline     │ │ │ 5:47 PM            │ │
│ (24)               │ │ looks good, let's proceed.      │ │ │                    │ │
│                    │ │                                 │ │ │ Duration:          │ │
│   Sarah Chen       │ │ Sarah Chen → You (5:47 PM)      │ │ │ 3h 13m             │ │
│   Q4 Planning...   │ │                                 │ │ └────────────────────┘ │
│   5:47 PM          │ │ Perfect, I'll schedule the      │ │                        │
│   RESOLVED         │ │ kickoff meeting.                │ │ ┌────────────────────┐ │
│                    │ │                                 │ │ │ LINKED OBJECTS     │ │
│   Contract review  │ └─────────────────────────────────┘ │ │                    │ │
│   Jan 10           │                                     │ │ 📋 Task:           │ │
│   RESOLVED         │                                     │ │ Review Q4 deck     │ │
│                    │                                     │ │ (Completed)        │ │
│                    │                                     │ │                    │ │
│                    │ ┌─────────────────────────────────┐ │ │ 📁 Project:        │ │
│                    │ │ [Reopen Thread] [Archive All]   │ │ │ Q4 Planning        │ │
│                    │ └─────────────────────────────────┘ │ │ (3 tasks active)   │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
│                    │                                     │ ┌────────────────────┐ │
│                    │                                     │ │ ACTIONS            │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [Reopen Thread]    │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [Archive All]      │ │
│                    │                                     │ │                    │ │
│                    │                                     │ │ [View in Gmail]    │ │
│                    │                                     │ └────────────────────┘ │
│                    │                                     │                        │
└────────────────────┴─────────────────────────────────────┴────────────────────────┘
```

### VISUAL CHANGES (State: `resolved`)

**Left Rail (Inbox Queue):**
- Thread row **no longer has orange dot** (neutral)
- Thread row is **dimmed/muted** (gray text)
- **State badge "RESOLVED"** appears (gray)
- Thread **moved to "Resolved" filter** (no longer in "Awaiting Me")
- "Awaiting Me" count decreased from 4 → 3
- "Resolved" count increased to 24
- Thread shows **latest message timestamp** (5:47 PM)

**Center Panel (Message Body):**
- Shows **full thread** (3 messages)
- Conversation flow visible
- Each message shows sender + timestamp
- **No "Reply" button** (thread is closed)
- Footer shows **[Reopen Thread] [Archive All]** (reversal actions)

**Right Rail (System Intelligence):**
- State badge shows **✓ Resolved** (green checkmark, gray color)
- **"Resolution History" section added:**
  - Resolved by: You
  - Resolved at: 5:47 PM
  - Duration: 3h 13m (time from arrival to resolution)
- **"Linked Objects" section shows:**
  - 📋 Task: Review Q4 deck (Completed)
  - 📁 Project: Q4 Planning (3 tasks active)
- **Actions section simplified:**
  - [Reopen Thread] (reversal path)
  - [Archive All] (cleanup)
  - [View in Gmail] (escape hatch)

### CRITICAL BEHAVIORS:

1. **Resolved threads are visually de-emphasized:**
   - Dimmed in queue (low visual weight)
   - Moved to separate filter
   - No attention-grabbing dots or badges

2. **Resolution is tracked as metadata:**
   - Who resolved (accountability)
   - When resolved (timestamp)
   - How long it took (efficiency metric)

3. **Linked objects show outcome:**
   - Email didn't just "get replied to"
   - It resulted in **real work** (task completed, project updated)
   - Proves email was **promoted**, not just processed

4. **Reversal is always possible:**
   - [Reopen Thread] → moves back to "Awaiting Me"
   - [Archive All] → removes from queue entirely
   - Fast systems must be forgiving systems

---

## VISUAL COMPARISON: The Three States Side-by-Side

### Left Rail (Inbox Queue) Evolution

```
STATE: none               STATE: awaiting_me         STATE: resolved
───────────────────────   ─────────────────────────  ──────────────────────
  Sarah Chen                🟠 Sarah Chen              Sarah Chen
  Q4 Planning...            Q4 Planning...             Q4 Planning...
  2:34 PM                   2:34 PM                    5:47 PM
                            AWAITING ME                RESOLVED
  (normal weight)           (bold weight)              (dimmed)
  (no dot)                  (orange dot)               (no dot)
```

### Right Rail (System Intelligence) Evolution

```
STATE: none               STATE: awaiting_me         STATE: resolved
───────────────────────   ─────────────────────────  ──────────────────────
┌────────────────────┐    ┌────────────────────┐     ┌────────────────────┐
│ THREAD STATE       │    │ THREAD STATE       │     │ THREAD STATE       │
│ ⚪ none             │    │ 🟠 Awaiting Me     │     │ ✓ Resolved         │
└────────────────────┘    └────────────────────┘     └────────────────────┘

┌────────────────────┐    ┌────────────────────┐     ┌────────────────────┐
│ SUGGESTED ACTIONS  │    │ PRIMARY ACTIONS    │     │ RESOLUTION HISTORY │
│                    │    │                    │     │                    │
│ ⚠️ AI Suggests:    │    │ [→ Promote to Task]│     │ Resolved by: You   │
│ Mark Awaiting Me   │    │ [Link to Project]  │     │ Resolved at: 5:47PM│
│                    │    │ [✓ Resolve Thread] │     │ Duration: 3h 13m   │
│ [Mark Awaiting Me] │    └────────────────────┘     └────────────────────┘
└────────────────────┘

                          ┌────────────────────┐     ┌────────────────────┐
                          │ TEMPORAL           │     │ LINKED OBJECTS     │
                          │                    │     │                    │
                          │ Expected reply:    │     │ 📋 Task: Completed │
                          │ By EOW (3 days)    │     │ 📁 Project: Q4     │
                          └────────────────────┘     └────────────────────┘
```

---

## THE CRITICAL DIFFERENCES FROM GMAIL/OUTLOOK

### ❌ What Gmail/Outlook Would Show:

**Left Sidebar:**
- Folder tree (Inbox > Sent > Drafts > Archive)
- Unread count badges everywhere
- Labels/categories (Primary, Social, Promotions)
- Heavy chrome, lots of nested items

**Message List:**
- Sender name + subject only
- Preview snippet (2 lines of body text)
- Star icon for importance
- Checkbox for selection
- No state indicators (just read/unread)

**Message View:**
- Heavy card container around body
- Reply button is primary CTA
- "More actions" dropdown
- No context rail
- No AI suggestions
- No linked objects

### ✅ What Transfoorm Shows Instead:

**Left Sidebar:**
- State filters (Awaiting Me, Awaiting Them, Resolved)
- Thread count (not unread count)
- High-density list
- Minimal chrome

**Message List:**
- State dots (orange, blue, gray)
- State badges (AWAITING ME, RESOLVED)
- Visual weight indicates urgency
- No preview text clutter
- No star/flag icons

**Message View:**
- Transient body (minimal chrome)
- **Promotion/Resolution buttons are primary CTAs**
- **Context rail is the star** (AI analysis, linked objects, temporal data)
- Reply is secondary
- Shows **outcome** (linked task/project) not just "replied"

---

## THE VISUAL LANGUAGE CONSISTENCY

### Typography
```css
/* Thread row in queue */
.thread-row {
  font-size: 15px;
  font-weight: 400;  /* normal */
}

.thread-row--unread {
  font-weight: 600;  /* semibold */
}

.thread-row--resolved {
  opacity: 0.6;      /* dimmed */
}

/* State badge */
.state-badge {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### Colors
```css
/* State indicators */
--state-awaiting-me: #F97316;      /* Orange 600 */
--state-awaiting-them: #3B82F6;    /* Blue 600 */
--state-resolved: #9CA3AF;         /* Gray 400 */

/* Dot colors */
.state-dot--awaiting-me {
  background: var(--state-awaiting-me);
  box-shadow: 0 0 8px rgb(249 115 22 / 40%);  /* Subtle glow */
}

.state-dot--awaiting-them {
  background: var(--state-awaiting-them);
}

/* No dot for resolved (visually recedes) */
```

### Spacing
```css
/* Queue list density */
.thread-row {
  height: 64px;          /* Compact */
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

/* Right rail sections */
.intelligence-section {
  margin-bottom: 24px;   /* Clear separation */
  padding: 16px;
}
```

---

## INTERACTION SEQUENCE (Frame-by-Frame)

### User Flow: Process One Email (Total Time: <30 seconds)

**Frame 1 (0s):** User scans inbox queue
- Sees Sarah's email with no state dot
- AI badge suggests "Awaiting Me"

**Frame 2 (2s):** User clicks thread row
- Center panel shows body (instant, no spinner)
- Right rail shows AI analysis + suggestions
- User reads: "Timeline decision needed by EOW"

**Frame 3 (5s):** User clicks [Mark Awaiting Me]
- State changes instantly (optimistic update)
- Orange dot appears on thread row
- Badge changes to "🟠 Awaiting Me"
- Toast: "Marked as Awaiting Me"

**Frame 4 (8s):** User clicks [→ Promote to Task]
- Modal opens with task creation form
- Email subject pre-filled as task title
- Email body included as context
- Suggested project: "Q4 Planning"

**Frame 5 (12s):** User fills task details + clicks [Create]
- Task created (instant)
- Right rail updates: "📋 Task: Review Q4 deck"
- Toast: "Email promoted to task [Undo]"

**Frame 6 (15s):** User clicks [Reply] in center panel
- Compose window opens inline
- Types quick response: "Reviewed the deck. Timeline looks good."
- Clicks [Send]

**Frame 7 (20s):** User clicks [✓ Resolve Thread]
- State changes to "Resolved" (instant)
- Thread moves to "Resolved" filter
- Thread row dims in queue
- Toast: "Thread resolved"

**Frame 8 (22s):** User presses `j` key
- Next thread selected
- Center panel updates (instant)
- Right rail updates (instant)
- User repeats flow

**Total Time: 22 seconds**
**Result:** Email processed, task created, reply sent, thread resolved.

---

## THE LITMUS TESTS (Pass/Fail)

### ✅ PASS: User can resolve email without opening body
- State change buttons in right rail
- [✓ Resolve Thread] visible even if body not read

### ✅ PASS: User understands why email matters from list alone
- State dot + badge visible in queue
- Subject truncation keeps density high
- No need to open email to see state

### ✅ PASS: User can promote email without navigating away
- [→ Promote to Task] in right rail
- Modal opens inline
- No page navigation, no context loss

### ✅ PASS: User trusts system to remember follow-ups
- Temporal section shows "Expected reply: By EOW"
- System will notify if deadline passes
- User doesn't need to set reminder manually

### ❌ FAIL (Gmail-style): User must open email to see state
- Gmail only shows read/unread
- No state indicators in list view

### ❌ FAIL (Gmail-style): Reply is primary action
- Gmail shows [Reply] [Reply All] [Forward] as primary CTAs
- No promotion buttons

### ❌ FAIL (Gmail-style): No context rail
- Gmail shows email body only
- No AI analysis, no linked objects, no temporal data

---

## DEVELOPER HANDOFF NOTES

### What to build first (Phase 1):
1. Three-column layout (left queue, center body, right intelligence)
2. Thread list with state dots + badges
3. State filters (Awaiting Me, Awaiting Them, Resolved)
4. Basic state change buttons ([Mark Awaiting Me], [Resolve Thread])

### What to build second (Phase 2):
5. Right rail sections (Thread State, AI Analysis, Suggested Actions)
6. Promotion buttons ([→ Promote to Task], [Link to Project])
7. Temporal section (Expected reply, Follow-up detection)
8. Linked objects display (Tasks, Projects)

### What to build third (Phase 3):
9. AI suggestion badges (Intent, Priority, Reason)
10. Sender classification (Human, Automated, etc.)
11. Resolution history tracking
12. Undo/reversal actions

### What NOT to build (Never):
- ❌ Folder tree navigation
- ❌ Star/flag importance markers
- ❌ Preview snippets in queue (keep density high)
- ❌ Heavy card containers around messages
- ❌ Envelope icons or email nostalgia
- ❌ "Friendly" UI language

---

## THE FINAL VISUAL PROOF

**If the UI passes these tests:**
1. ✅ Email looks like a work queue, not a mailbox
2. ✅ State is more visible than content
3. ✅ Promotion is easier than reply
4. ✅ Context lives in right rail, not external apps
5. ✅ Resolution is tracked as outcome, not just "replied"

**Then the UI matches the doctrine.**

**If it fails any test:**
- ❌ The UI has drifted toward Gmail/Outlook
- ❌ Stop and reconsider before shipping

---

**END OF WIREFRAME REFERENCE**

This wireframe is the visual proof of the Email UX Doctrine.
Use it to prevent Gmail drift during implementation.

Last updated: 2025-12-21
Version: 1.0
