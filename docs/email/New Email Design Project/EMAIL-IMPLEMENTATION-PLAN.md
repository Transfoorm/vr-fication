EMAIL2 DESIGN PALETTE - Implementation Plan

 Overview

 Create a new /productivity/email2 route as a design palette to prototype the merged PoppinsMail + Transform doctrine email design. This is a parallel
 implementation - the existing email-console remains untouched.

 Route: http://localhost:3000/productivity/email2
 Purpose: Visual prototyping and design validation
 Integration: App Router only (no sovereign router, no sidebar)

 ---
 Architecture

 src/app/domains/productivity/email2/
 └── page.tsx                    ← App Router page (direct route)

 src/features/productivity/email2-console/
 ├── index.tsx                   ← Main Email2Console component
 ├── email2-console.css          ← Three-pane layout styles
 ├── ResolutionQueue.tsx         ← Left pane (state filters + thread list)
 ├── ConversationPane.tsx        ← Center pane (chat bubbles)
 ├── IntelligenceRail.tsx        ← Right pane (primary surface)
 ├── ThreadRow.tsx               ← Individual thread in queue
 ├── MessageBubble.tsx           ← Chat-style message bubble
 ├── StateBadge.tsx              ← Resolution state badge
 ├── mockData.ts                 ← Design palette mock data
 └── types.ts                    ← TypeScript interfaces

 ---
 Phase 1: Route & Shell

 1.1 Create App Router Page

 File: src/app/domains/productivity/email2/page.tsx

 'use client';

 import { Page } from '@/vr';
 import { Email2Console } from '@/features/productivity/email2-console';

 export default function Email2Page() {
   return (
     <Page.full>
       <Email2Console />
     </Page.full>
   );
 }

 1.2 Create Feature Shell

 File: src/features/productivity/email2-console/index.tsx

 - Three-pane grid layout (320px | flex | 360px)
 - Import and render three rail components
 - Mock data state management

 ---
 Phase 2: Left Pane - Resolution Queue

 2.1 ResolutionQueue Component

 File: src/features/productivity/email2-console/ResolutionQueue.tsx

 Structure:
 ┌─────────────────────────────┐
 │ [Account Switcher]          │
 ├─────────────────────────────┤
 │ RESOLUTION FILTERS          │
 │ ┌─────────────────────────┐ │
 │ │ AWAITING ME (4)         │ │  ← Active filter
 │ └─────────────────────────┘ │
 │ ┌─────────────────────────┐ │
 │ │ AWAITING THEM (5)       │ │
 │ └─────────────────────────┘ │
 │ ┌─────────────────────────┐ │
 │ │ RESOLVED (24)           │ │
 │ └─────────────────────────┘ │
 ├─────────────────────────────┤
 │ [Search...]                 │
 ├─────────────────────────────┤
 │ THREAD LIST                 │
 │ 🟠 Sarah Chen               │
 │   Q4 Planning...            │
 │   AWAITING ME               │
 │ ─────────────────────────── │
 │ 🔵 David Park               │
 │   Contract terms            │
 │   AWAITING THEM             │
 └─────────────────────────────┘

 VRs to use:
 - Search.bar for thread search
 - Custom filter buttons (styled divs with state)
 - Custom ThreadRow component

 2.2 ThreadRow Component

 File: src/features/productivity/email2-console/ThreadRow.tsx

 Props:
 - thread: EmailThread
 - selected: boolean
 - onClick: () => void

 Visual elements:
 - State dot (orange/blue/none)
 - Sender name (bold if unread)
 - Subject preview (truncated)
 - Timestamp
 - State badge

 ---
 Phase 3: Center Pane - Conversation

 3.1 ConversationPane Component

 File: src/features/productivity/email2-console/ConversationPane.tsx

 Structure:
 ┌─────────────────────────────────────┐
 │ Sarah Chen → You                    │
 │ Q4 Planning - need your input       │
 │ 2:34 PM                             │
 ├─────────────────────────────────────┤
 │                                     │
 │ ┌─────────────────────────────────┐ │
 │ │ Their message (left-aligned)    │ │
 │ │ --bg-secondary background       │ │
 │ └─────────────────────────────────┘ │
 │                                     │
 │     ┌─────────────────────────────┐ │
 │     │ Your reply (right-aligned)  │ │
 │     │ --brand-faint background    │ │
 │     └─────────────────────────────┘ │
 │                                     │
 ├─────────────────────────────────────┤
 │ [Reply] [Forward] [Archive]         │
 └─────────────────────────────────────┘

 VRs to use:
 - Button.ghost for Reply/Forward/Archive
 - Icon for action icons
 - Custom MessageBubble component

 3.2 MessageBubble Component

 File: src/features/productivity/email2-console/MessageBubble.tsx

 Props:
 - message: EmailMessage
 - direction: 'incoming' | 'outgoing'
 - currentUserEmail: string

 Styling:
 - Incoming: Left-aligned, var(--bg-secondary) bg
 - Outgoing: Right-aligned, var(--brand-faint) bg
 - Border radius: 12px
 - Max-width: 80%

 ---
 Phase 4: Right Pane - Intelligence Rail

 4.1 IntelligenceRail Component

 File: src/features/productivity/email2-console/IntelligenceRail.tsx

 Structure (sections):
 ┌─────────────────────────────┐
 │ THREAD STATE                │
 │ 🟠 Awaiting Me              │
 ├─────────────────────────────┤
 │ AI ANALYSIS                 │
 │ Intent: Action Required     │
 │ Priority: Urgent            │
 │ "Timeline decision..."      │
 ├─────────────────────────────┤
 │ PRIMARY ACTIONS             │
 │ [→ Promote to Task]         │
 │ [Link to Project]           │
 │ [✓ Resolve Thread]          │
 ├─────────────────────────────┤
 │ LINKED OBJECTS              │
 │ 📋 Task: Review Q4 deck     │
 │ 📁 Project: Q4 Planning     │
 ├─────────────────────────────┤
 │ TEMPORAL                    │
 │ Received: 2h ago            │
 │ Expected reply: By EOW      │
 ├─────────────────────────────┤
 │ SENDER PROFILE              │
 │ Sarah Chen                  │
 │ Human · 95% response <24h   │
 └─────────────────────────────┘

 VRs to use:
 - Button.primary for Promote to Task
 - Button.secondary for Link to Project
 - Button.ghost for Resolve Thread
 - T.caption for section labels
 - T.body for values
 - Icon for linked object icons

 ---
 Phase 5: State Badges

 5.1 StateBadge Component

 File: src/features/productivity/email2-console/StateBadge.tsx

 Props:
 - state: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none'
 - size?: 'sm' | 'md'

 Colors (from transtheme.css):
 - awaiting_me: --brand-primary (#ff5020) background tint
 - awaiting_them: Blue (#3B82F6) background tint
 - resolved: Gray (#9CA3AF) background tint
 - none: Hidden

 ---
 Phase 6: CSS Styling

 6.1 Main Layout CSS

 File: src/features/productivity/email2-console/email2-console.css

 /* Three-pane grid */
 .ft-email2__layout {
   display: grid;
   grid-template-columns: 320px 1fr 360px;
   height: 100%;
   gap: 0;
 }

 /* Left pane */
 .ft-email2__queue {
   border-right: 1px solid var(--border-light);
   overflow-y: auto;
 }

 /* Center pane */
 .ft-email2__conversation {
   display: flex;
   flex-direction: column;
   overflow-y: auto;
 }

 /* Right pane */
 .ft-email2__intelligence {
   border-left: 1px solid var(--border-light);
   overflow-y: auto;
   padding: 16px;
 }

 6.2 Component-Specific Styles

 - Thread row hover/selected states
 - Message bubble alignment and colors
 - State badge pill styling
 - Intelligence rail section spacing

 ---
 Phase 7: Mock Data

 7.1 Mock Data File

 File: src/features/productivity/email2-console/mockData.ts

 Create realistic mock data for:
 - 10-15 email threads with various states
 - 3-5 messages per thread
 - AI classification data
 - Linked objects (tasks, projects)
 - Sender profiles

 ---
 File Creation Order

 1. src/app/domains/productivity/email2/page.tsx - Route
 2. src/features/productivity/email2-console/types.ts - Types
 3. src/features/productivity/email2-console/mockData.ts - Mock data
 4. src/features/productivity/email2-console/email2-console.css - Styles
 5. src/features/productivity/email2-console/StateBadge.tsx - State badge
 6. src/features/productivity/email2-console/ThreadRow.tsx - Thread row
 7. src/features/productivity/email2-console/ResolutionQueue.tsx - Left pane
 8. src/features/productivity/email2-console/MessageBubble.tsx - Chat bubble
 9. src/features/productivity/email2-console/ConversationPane.tsx - Center pane
 10. src/features/productivity/email2-console/IntelligenceRail.tsx - Right pane
 11. src/features/productivity/email2-console/index.tsx - Main component

 ---
 Key Design Decisions

 From EMAIL_DESIGN_PLAN.md:

 1. Three-pane layout (Queue | Conversation | Intelligence)
 2. Resolution states as primary filter (not folders)
 3. Chat bubbles for conversation (validated by PoppinsMail)
 4. Intelligence rail is primary (promotion buttons dominant)
 5. Reply is secondary (in conversation footer, not prominent)
 6. State dots: Orange (awaiting_me), Blue (awaiting_them)
 7. High density: 64px thread rows, minimal chrome
 8. Brand colors: Use CSS variables from transtheme.css

 VR Usage:

 - Page.full for layout wrapper
 - Search.bar for thread search
 - Button.primary/secondary/ghost for actions
 - Icon for visual elements
 - T.* for typography
 - Custom components for email-specific UI (ThreadRow, MessageBubble, StateBadge)

 ---
 Success Criteria

 - Route accessible at /productivity/email2
 - Three-pane layout renders correctly
 - State filters work (filter mock data)
 - Thread selection updates conversation pane
 - Chat bubbles render with correct alignment
 - Intelligence rail shows all sections
 - Colors match Transform brand (orange/warm grays)
 - Promotion buttons are visually primary
 - Reply button is visually secondary
 - No loading states (mock data instant)