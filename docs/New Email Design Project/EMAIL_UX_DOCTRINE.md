# 🎨 EMAIL UX DOCTRINE: The Visual Language of Email Escape

**Version:** 1.0
**Status:** Canonical Design Foundation
**Last Updated:** 2025-12-21
**Companion To:** EMAIL_DOCTRINE.md, EMAIL_THREAD_STATE_DERIVATION.md

---

## THE FORBIDDEN CLONE

**DO NOT CLONE OUTLOOK.**
**DO NOT CLONE GMAIL.**
**DO NOT CLONE SUPERHUMAN.**

Not visually. Not structurally. Not mentally.

---

## THE CORE DISTINCTION

**Outlook/Gmail optimize for:** "Staying inside email"
**Transfoorm optimizes for:** "Exiting email as fast as possible"

That single difference means the UI **must** look different.

If it looks like email, users will use it like email.
If it looks like a system, they will use it like one.

---

## THE THREE FALSE ASSUMPTIONS

Every mainstream email client shares these structural assumptions:

### ❌ Assumption 1: The inbox is the destination
Everything radiates around the message list.
The inbox is where you "live."

### ❌ Assumption 2: Reading is the core action
Actions are secondary (reply, archive, label).
The body is permanent, actions are afterthoughts.

### ❌ Assumption 3: Context lives elsewhere
Projects, calendars, tasks live in other apps.
Email is isolated from real work.

**Even if you re-skin these layouts, the behavior stays the same.**

This is why Superhuman looks nicer but doesn't solve the problem.

---

## THE CORRECT MENTAL MODEL

The closest conceptual inspiration is:

**Linear + Notion + Slack**

NOT Gmail. NOT Outlook. NOT Superhuman.

Think in terms of:
- ✅ Queue
- ✅ State
- ✅ Resolution
- ✅ Context

NOT "mailbox."

---

## THE FOUR VISUAL ZONES

### ZONE 1: INBOX AS QUEUE (Left Panel)

**What it is:** A work queue, not a storage folder.

**Visual properties:**
- Flat list (no nested hierarchy obsession)
- High density (see more, scroll less)
- Minimal chrome (no decorative borders)
- Strong state indicators (awaiting_me = orange dot, bold)

**Each row answers immediately:**
1. Who is this from?
2. Why is it here? (state badge)
3. Am I needed? (visual weight)

**What to avoid:**
- ❌ Folder tree dominating the screen
- ❌ Nested labels taking up visual space
- ❌ "Unread count" badges everywhere
- ❌ Stars, flags, importance markers

**Visual reference:** Linear's issue list, Notion's database table view

```
Visual Structure:

┌─────────────────────────────────────┐
│ ● Sarah Chen                        │ ← Orange dot = awaiting_me
│   Q4 Planning - need your input     │ ← Bold = unread
│   2:34 PM  AWAITING ME              │ ← State badge
├─────────────────────────────────────┤
│   David Park                        │ ← Blue dot = awaiting_them
│   Updated contract terms            │ ← Normal weight = read
│   Yesterday  AWAITING THEM          │ ← State badge
├─────────────────────────────────────┤
│   GitHub                            │ ← No dot = automated
│   PR #234 merged                    │ ← Dimmed = low priority
│   2 days ago                        │ ← No state badge
└─────────────────────────────────────┘
```

**Density:**
- 50-60 threads visible without scrolling (not 20 like Gmail)
- Compact row height (not spacious)
- Information density > visual comfort

**Why:** Inbox ≠ storage. Inbox = work queue you clear daily.

---

### ZONE 2: CENTER PANEL IS TRANSIENT (Middle Panel)

**Critical mindset shift:**

In Gmail/Outlook: Message body feels **permanent**
In Transfoorm: Message body feels **temporary**

**Visual properties:**
- Clean, almost "reader mode"
- No heavy borders or container chrome
- No faux paper texture
- No email nostalgia (envelope icons, stamps, etc.)
- Minimal UI around content
- Fast transitions in/out

**The body is something you pass through, not settle into.**

**Visual reference:** Linear's issue detail view, Slack's thread view

```
Visual Structure:

┌─────────────────────────────────────────────────┐
│ Sarah Chen → You                                │ ← Minimal header
│ Q4 Planning - need your input                   │
│ 2:34 PM                                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ Hey - can you review the attached deck and      │ ← Clean body
│ let me know if the Q4 timeline works for you?   │ ← No chrome
│                                                 │
│ Thanks!                                         │
│                                                 │
├─────────────────────────────────────────────────┤
│ [Reply] [Resolve]                               │ ← Secondary actions
└─────────────────────────────────────────────────┘
```

**What to avoid:**
- ❌ Heavy card containers
- ❌ Multiple borders
- ❌ Decorative shadows
- ❌ Over-designed typography
- ❌ "Email-like" visual metaphors

**Why:** Users should flow through messages, not camp in them.

---

### ZONE 3: RIGHT RAIL IS PRIMARY INTELLIGENCE (Right Panel)

**This is where you break from every mainstream email app.**

**Critical principle:** The right rail is the **primary intelligence surface.**

**Visual feel:**
- Structured (not conversational)
- Calm (not busy)
- Slightly "system-like" (admin panel, not consumer app)
- Information-dense
- Metadata-first

**It answers:**
1. What is this connected to? (linked tasks/projects)
2. What does the system think? (AI intent, priority, suggestions)
3. What should happen next? (promotion actions)

**If you removed the email body entirely, the right rail should still explain why this email matters.**

**Visual reference:** Linear's sidebar, GitHub's issue metadata panel, Notion's properties panel

```
Visual Structure:

┌─────────────────────────────────────┐
│ THREAD STATE                        │
│ ● Awaiting Me                       │
│                                     │
│ AI ANALYSIS                         │
│ Intent: Action Required             │
│ Priority: Urgent                    │
│ "Timeline decision needed by EOW"   │
│                                     │
│ SUGGESTED ACTIONS                   │
│ → Promote to Task                   │
│ → Link to Project: Q4 Planning      │
│                                     │
│ LINKED OBJECTS                      │
│ 📋 Task: Review Q4 deck             │
│ 📁 Project: Q4 Planning (3 tasks)   │
│                                     │
│ TEMPORAL                            │
│ Last reply: 2 days ago              │
│ Expected reply: Tomorrow            │
│ Follow-up suggested: Yes            │
│                                     │
│ SENDER PROFILE                      │
│ Sarah Chen                          │
│ Classification: Human               │
│ Last contact: 1 week ago            │
│ Response rate: 95% within 24h       │
└─────────────────────────────────────┘
```

**Sections (priority order):**
1. **Thread State** - Current state badge + quick actions
2. **AI Analysis** - Intent, priority, extracted insights
3. **Suggested Actions** - Promotion buttons (primary CTAs)
4. **Linked Objects** - Tasks/projects/bookings connected
5. **Temporal** - Follow-up detection, timing data
6. **Sender Profile** - Classification, history, patterns

**Visual language:**
- Monospace or system font (not decorative)
- High contrast labels
- Pill-shaped badges for states
- Icon + text for linked objects
- Subtle separators between sections
- No heavy cards (just content blocks)

**What to avoid:**
- ❌ Conversational tone ("Looks like this is urgent!")
- ❌ Over-animated elements
- ❌ Decorative icons
- ❌ Low-density layouts
- ❌ "Friendly" UI tropes

**Why:** This is an operator's tool, not a consumer app.

---

### ZONE 4: ACTIONS ARE INVERTED (Bottom Bar / Inline)

**The critical inversion:**

**In Gmail:** Reply is the dominant button
**In Transfoorm:** Promote/Resolve/Link are dominant, Reply is secondary

**Visual hierarchy:**
```
Primary Actions (always visible):
  [→ Promote to Task]  [✓ Resolve]  [Link to Project]

Secondary Actions (contextual):
  [Reply]  [Forward]  [Archive]
```

**Button visual design:**
- Primary = Brand color, filled, prominent
- Secondary = Ghost/outline, subtle

**Placement:**
- Primary actions in right rail (always visible)
- Secondary actions in center panel footer (contextual)

**This alone will retrain user behavior.**

---

## THE VISUAL LANGUAGE

### What it should feel like:
- ✅ Calm (not busy)
- ✅ Fast (instant state changes)
- ✅ Intentional (every element has purpose)
- ✅ Slightly "administrative" (system tool, not toy)
- ✅ Zero fluff (no decorative elements)

### What it must avoid:
- ❌ Inbox nostalgia (no envelope icons, paper textures)
- ❌ Over-branding (no brand color everywhere)
- ❌ Heavy shadows (flat or subtle only)
- ❌ Animated spinners (instant updates or nothing)
- ❌ "Friendly" UI tropes (no playful illustrations)
- ❌ Consumer app aesthetics (no gradients, rounded everything)

**This is an operator's tool, not a consumer app.**

---

## DESIGN REFERENCES (Structural, Not Visual)

Look at these for **structure and behavior**, not pixel-perfect copying:

### ✅ Linear
- **What to learn:** Queue + state + fast resolution
- **Specific elements:** Issue list density, state badges, keyboard shortcuts
- **Not:** Their color scheme or exact layout

### ✅ Notion Database Views
- **What to learn:** Metadata-first, content second
- **Specific elements:** Property panels, inline editing, view switching
- **Not:** Their card-based layouts

### ✅ Slack Threads
- **What to learn:** Conversation as context, not archive
- **Specific elements:** Thread sidebar, message grouping, quick actions
- **Not:** Their chat-first UI

### ✅ GitHub Issues
- **What to learn:** State-driven, not message-driven
- **Specific elements:** Right sidebar metadata, linked PRs, timeline view
- **Not:** Their developer-first complexity

**None of these are email apps. That's the point.**

---

## COMPONENT VOCABULARY

### Thread Row (Inbox List Item)
```tsx
<ThreadRow>
  <StateDot state="awaiting_me" />  {/* Orange/Blue/Gray */}
  <SenderName bold={unread}>Sarah Chen</SenderName>
  <Subject truncate>Q4 Planning - need your input</Subject>
  <Timestamp>2:34 PM</Timestamp>
  <StateBadge>AWAITING ME</StateBadge>
</ThreadRow>
```

**Visual properties:**
- Height: 44px (compact, not spacious)
- Hover: Subtle background change only
- Selected: Left border accent + background
- Unread: Bold sender + subject
- Read: Normal weight

### State Badge
```tsx
<StateBadge state="awaiting_me">AWAITING ME</StateBadge>
```

**Visual design:**
- Pill shape (rounded)
- Uppercase text (system feel)
- Color-coded:
  - `awaiting_me`: Orange background, dark text
  - `awaiting_them`: Blue background, white text
  - `resolved`: Gray background, muted text
  - `none`: No badge (hidden)

### Promotion Button (Primary CTA)
```tsx
<PromotionButton variant="primary">
  <Icon name="arrow-right" />
  Promote to Task
</PromotionButton>
```

**Visual design:**
- Filled background (brand color)
- Icon + text (not icon-only)
- Full width in right rail
- Hover: Subtle brightness increase
- Active: No heavy press effect

### AI Insight Card
```tsx
<AIInsight>
  <Label>AI ANALYSIS</Label>
  <Intent>Action Required</Intent>
  <Priority level="urgent">Urgent</Priority>
  <Reason>"Timeline decision needed by EOW"</Reason>
</AIInsight>
```

**Visual design:**
- No heavy container (just content block)
- Labels: Uppercase, muted color, small
- Values: Normal case, primary text color
- Quotes: Italic, slightly muted
- No icon clutter

---

## THE LAYOUT GRID

### Desktop (3-column)
```
┌────────────┬─────────────────────┬──────────────┐
│            │                     │              │
│  INBOX     │    MESSAGE BODY     │  INTELLIGENCE│
│  QUEUE     │    (Transient)      │  RAIL        │
│            │                     │  (Primary)   │
│  320-400px │    Flexible         │  320-380px   │
│            │                     │              │
└────────────┴─────────────────────┴──────────────┘
```

**Proportions:**
- Left (inbox): 25-30% width, fixed
- Center (body): 40-50% width, flexible
- Right (intelligence): 25-30% width, fixed

**Breakpoints:**
- Desktop: 3-column (>1280px)
- Tablet: 2-column (768-1279px) - collapse right rail to modal
- Mobile: 1-column (<768px) - stack vertically

### Mobile (1-column)
```
┌──────────────┐
│ INBOX QUEUE  │ ← List view
├──────────────┤
│ (tap thread) │
├──────────────┤
│ MESSAGE BODY │ ← Full screen modal
├──────────────┤
│ INTELLIGENCE │ ← Swipe up drawer
│ DRAWER       │
└──────────────┘
```

---

## INTERACTION PATTERNS

### Pattern 1: Thread Selection
```
Click thread → Center panel updates (instant, no spinner)
              → Right rail updates (instant)
              → URL updates (for sharing)
```

**No loading states. Data is preloaded.**

### Pattern 2: State Change
```
Click "Resolve" → Badge updates (instant)
                → Thread moves to "Resolved" filter
                → Toast confirmation (2s)
                → Undo button (30s window)
```

**Optimistic updates. Feel instant, sync in background.**

### Pattern 3: Promotion
```
Click "Promote to Task" → Task creation modal opens
                         → Email content prefilled
                         → Click "Create"
                         → Toast: "Email promoted to task [Undo]"
                         → Thread updates with linked task badge
```

**Fast path to promotion. 2 clicks maximum.**

### Pattern 4: Search
```
Type in search → Results update live (as you type)
               → No "Search" button needed
               → Results span ALL states (no filter)
               → State badges visible on results
```

**No hidden emails. Search is exhaustive.**

---

## TYPOGRAPHY SYSTEM

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, monospace;
```

**Usage:**
- Body text: Sans-serif (Inter)
- System labels: Monospace (JetBrains Mono)
- Code/technical: Monospace

### Type Scale
```css
--text-xs: 11px;   /* Labels, metadata */
--text-sm: 13px;   /* Body, descriptions */
--text-md: 15px;   /* Subjects, headers */
--text-lg: 18px;   /* Section titles */
--text-xl: 24px;   /* Page headers */
```

### Weight Scale
```css
--weight-normal: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

**Usage:**
- Unread threads: Semibold (600)
- Read threads: Normal (400)
- Labels/metadata: Medium (500)

---

## COLOR SYSTEM

### State Colors
```css
--state-awaiting-me: #F97316;      /* Orange 600 */
--state-awaiting-them: #3B82F6;    /* Blue 600 */
--state-resolved: #9CA3AF;         /* Gray 400 */
--state-none: transparent;
```

### UI Colors
```css
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;           /* Gray 50 */
--bg-elevated: #FFFFFF;

--text-primary: #111827;           /* Gray 900 */
--text-secondary: #6B7280;         /* Gray 500 */
--text-tertiary: #9CA3AF;          /* Gray 400 */

--border-light: #E5E7EB;           /* Gray 200 */
--border-medium: #D1D5DB;          /* Gray 300 */
```

### Brand Colors
```css
--brand-primary: #F40;             /* Transfoorm orange */
--brand-hover: #E63900;
--brand-active: #CC3300;
```

**Color usage rules:**
- State colors ONLY for state indicators
- Brand color ONLY for primary CTAs
- Gray scale for everything else
- No decorative colors

---

## ANIMATION PRINCIPLES

### Speed
```css
--duration-instant: 0ms;           /* State updates */
--duration-fast: 150ms;            /* Hover, focus */
--duration-normal: 250ms;          /* Transitions */
--duration-slow: 400ms;            /* Modals, drawers */
```

### Easing
```css
--ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
```

### What gets animated:
- ✅ Thread selection (instant highlight)
- ✅ State changes (badge color shift)
- ✅ Hover states (subtle)
- ✅ Modal open/close
- ✅ Drawer slide-up

### What does NOT get animated:
- ❌ Spinners (use instant updates)
- ❌ Skeleton loaders (preload data)
- ❌ Progress bars (binary: done or not done)
- ❌ Decorative flourishes
- ❌ Loading dots

**Why:** Fast systems don't have time to animate loading states.

---

## KEYBOARD NAVIGATION

**Critical principle:** Email power users live in keyboard shortcuts.

### Essential Shortcuts
```
j/k          Navigate up/down threads
Enter        Open selected thread
Esc          Close thread
e            Resolve thread
r            Reply
p            Promote to task
l            Link to project
/            Focus search
g i          Go to inbox
g a          Go to awaiting me
g t          Go to awaiting them
g r          Go to resolved
```

**Visual feedback:**
- Show keyboard hint on hover
- Display shortcut palette (Cmd+K)
- Highlight selected thread with focus ring

**Reference:** Linear's command palette, Gmail's shortcuts

---

## WHAT TO SAY TO DESIGNERS/DEVELOPERS

### ❌ Do NOT say:
"Design an email UI"

### ✅ DO say:
"Design a work intake and resolution surface where email is just one input type."

---

## RED FLAGS TO WATCH FOR

If the design includes any of these, stop and reconsider:

### ❌ Folder Tree Dominating the Screen
Email folders are legacy. We have states instead.

### ❌ "Unread" as Primary Filter
Read/unread is a side effect, not a workflow state.

### ❌ Stars, Flags, or Importance Markers
We have AI priority and resolution states instead.

### ❌ Reply Button as Primary CTA
Promotion/resolution should be primary, reply secondary.

### ❌ Heavy Card Containers Around Messages
Messages should feel lightweight, not permanent.

### ❌ Envelope Icons, Stamps, Paper Textures
No email nostalgia. This is a system tool.

### ❌ Friendly Illustrations or Mascots
This is not a consumer app.

### ❌ Animated Spinners or Loading States
Data should be preloaded. Updates should feel instant.

---

## THE LITMUS TEST

A correct UI makes users say:

✅ "I cleared my inbox without reading everything"
✅ "I didn't need to remember anything"
✅ "I rarely open Gmail anymore"
✅ "This feels like a work tool, not an email app"

An Outlook/Gmail clone makes users say:

❌ "This looks nice, but…"
❌ "I still need to go to Gmail"
❌ "I have so much email"
❌ "It's just like Outlook"

---

## IMPLEMENTATION CHECKLIST

Before shipping the email UI, verify:

- [ ] Inbox feels like a queue, not a storage folder
- [ ] Message body feels transient, not permanent
- [ ] Right rail is information-dense and system-like
- [ ] Promotion buttons are more prominent than Reply
- [ ] State badges use correct colors (orange/blue/gray)
- [ ] No folder tree dominating the screen
- [ ] No envelope icons or email nostalgia
- [ ] Keyboard shortcuts implemented (j/k/e/r/p/l)
- [ ] Thread selection feels instant (no spinners)
- [ ] Search spans all states by default
- [ ] AI insights are calm and structured (not friendly)
- [ ] Overall feel is "operator tool" not "consumer app"

---

## THE FINAL DIRECTIVE

**Do not clone Outlook or Gmail.**
**That would betray everything you've designed.**

You are building:

> **A high-speed work triage console that happens to ingest email.**

If it looks like email, people will treat it like email.
If it looks like a system, they will use it like one.

**That is the design line you should not cross.**

---

**END OF UX DOCTRINE**

This document is canonical for all email UI/UX decisions.
Deviations require explicit approval and doctrine amendment.

Last updated: 2025-12-21
Version: 1.0
