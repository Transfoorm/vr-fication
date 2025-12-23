# Design Plan for a Modern Email Application

> This report translates the Dribbble page into a structured plan for a modern email application. It includes findings from competitor analysis, detailed user flows, iterative wireframes, visual design guidelines and concrete recommendations on layout, features and interactions. By following this plan, you'll be able to build an email app that is clean, user-focused and efficient, addressing the frustrations and goals identified in the original research.

---

## 1. Problem and User Persona

### Problem

The design brief emphasises that modern entrepreneurs and freelancers find traditional email clunky and formal; they would rather use chat tools but still need email for professional communication. The aim is to create a fast, efficient desktop email client that feels more conversational and reduces the time spent dealing with email. The designer's assignment was to research existing patterns, analyse competitors, and create user flows, wireframes and a polished UI.

### Research Data and Persona

A primary persona ("Sasha") represents a 25-year-old professional wedding photographer earning ~$120k/year who spends 2-3 hours a day on email.

**Complaints:**
- Email is "clunky and serious"
- Would like it to behave more like casual text messaging

**Goals:**
- Reduce emailing to one hour per day
- Automate repetitive tasks

**Frustrations:**
- Overly formal interfaces
- Redundant actions
- Never achieving inbox zero

**Current Tools:**
- MS Office
- Outlook for Gmail
- iOS Calendar
- Slack

This persona guided the design decisions.

---

## 2. Competitive Analysis

### Competitor Features

Research looked at modern email clients such as Airmail, Spark and Canary email. Useful patterns identified include:

- Smart inbox filtering (on/off toggle) that categorises messages by type
- Clean command bars
- Chat-like message windows for a conversational feel

These findings highlighted opportunities for automation and simplified messaging while maintaining clarity.

### Pain Points from Competing Apps

Some competitor apps still feel cluttered or have complex command areas, so the design needed to avoid overwhelming users with options and instead focus on the core task of replying to emails quickly.

---

## 3. User Flows

Two key flows were documented and tested to guide the interface structure:

### Flow 1: Respond to New Inquiry

| Step | Action |
|------|--------|
| 1 | Start from Inbox view |
| 2 | Choose a channel (e.g., potential clients) |
| 3 | Open a new email |
| 4 | View conversation |
| 5 | Decide whether to respond now |
| 6 | Choose a pre-defined answer or write a response |
| 7 | Send email and optionally move to #unanswered or other category |
| 8 | End |

**Goal:** Minimise the time needed to find, filter and reply to new or existing inquiries. The flow encourages using templates for efficiency but permits manual responses.

### Flow 2: Create New Automation

| Step | Action |
|------|--------|
| 1 | Start from Inbox view |
| 2 | Choose automation tab |
| 3 | Open list of automations |
| 4 | Click create new automation |
| 5 | Pop-up appears |
| 6 | Choose a template or define rules and actions |
| 7 | Modify actions as needed |
| 8 | Save |
| 9 | Return to list of automations |
| 10 | End |

**Goal:** Automation was frequently requested in the research data. A dedicated flow ensures that building automations does not interrupt normal emailing.

### Findings from User-Flow Testing

User testing revealed that:

- **70% of respondents** found a three-column layout (navigation, mail list and conversation) confusing
- Scanning from one end to the other when switching channels or reading conversations required too much cognitive effort
- Users struggled to understand the purpose of the "topics" section
- Users were confused about how to switch between folders and channels

These findings led to a **simpler two-pane approach** and clearer labelling.

---

## 4. Wireframes and Design Iterations

### 4.1 Early Wireframes

The initial concept used:
- A vertical sidebar for icons (Inbox, Automation, OneDrive, Google Drive)
- A secondary panel for topics (e.g., #funUnanswered, #followUp, #offerSent, #WaitingForResponse)
- A main conversation area with chat-style bubbles
- A quick reply area with drag-and-drop attachments and quick actions

**Problem:** The presence of three columns and many coloured tags created visual clutter. User feedback showed that people didn't understand the topics section and were confused about navigating between folders and channels.

### 4.2 Revised Wireframes

Changes made:
- Replaced the topic list with channels (e.g., #Potential clients, #Booked clients, #General)
- Clearly separated folders (Inbox, Draft, Sent, Trash)
- Left column shows the user's name and a "New message" button, followed by channels and folders
- Separate Automation icon provides access to rules and templates
- Conversation area uses chat bubbles for a conversational feel
- Message composer includes pre-defined responses, subject/cc/bcc fields, and attachment options

**Final revision:** Moved away from a three-column structure to a **two-pane layout**:
- **Left pane:** Channels/folders and mail list
- **Right pane:** Conversation and composer

Quick response templates and service/attachment options were integrated directly into the composer, eliminating the distracting right-side panel.

### 4.3 Visual Design and Mood

The mood board explored:
- Clean, modern aesthetics
- Poppins typeface
- Flat iconography
- Purple-toned colour palette
- Light backgrounds with bold accent colours

**Design V1 Issues:**
- Purple side stripe drew too much attention
- "Choose response" and "Select service" were misplaced (top corner instead of prominent position)
- Users wanted clearer indication of the current channel
- Users wanted a larger folder section

### 4.4 Final UI

The final design:
- Removed the right-hand stripe
- Reduced interface to two main panes
- Left pane lists channels and folders with "New conversation" button
- Right pane shows the conversation
- Quick response templates and attachments appear inside the message composer as dropdowns and icons
- Primary call-to-action (sending a reply) is prominent
- Removed unnecessary buttons (cancel, settings, automation toggles)
- Removed extraneous colour elements

**Key Lesson:** Iterate based on feedback and eliminate non-essential elements until the interface breaks — then restore only the indispensable parts.

---

## 5. Recommendations for Your Email App Design

### 5.1 Information Architecture

1. **Two-pane layout** - Use a left pane for navigation and mail list and a right pane for conversations. Avoid a third pane unless contextual content is needed.

2. **Channels and folders** - Allow users to create or edit channels to group conversations based on projects or client types (e.g., "Potential clients," "Booked clients"). Provide standard folders (Inbox, Sent, Drafts, Spam, Trash) for traditional email management.

3. **Automation hub** - Offer an Automation section accessible from a settings or sidebar icon. From here, users can manage automation rules (e.g., auto-reply templates, filing rules) without cluttering the main interface.

### 5.2 Core Features

1. **Conversational email view** - Display emails as chat bubbles in the conversation pane. Use avatars, names and timestamps; emphasise readability and a friendly tone. Provide a "See more messages" link to load older messages.

2. **Message composer** - Integrate quick-reply templates (pre-defined responses) directly into the composer via a dropdown; allow users to add their own templates. Include subject, cc and bcc fields that expand only when needed to maintain focus.

3. **Attachments integration** - Allow drag-and-drop attachments and integrate cloud services (e.g., OneDrive, Google Drive). Display icons for photos, documents and other file types in the composer.

4. **Search and filtering** - Provide a search bar at the top of the mail list to quickly find conversations. Offer smart filters (e.g., unread, flagged) without overwhelming the user.

5. **Automation workflows** - Support creating new automation actions using templates or custom rules, accessible via the Automation hub. Guide users through the flow: select template → define rules and actions → modify actions → save. Provide clear feedback when automations run.

6. **Multi-account support** - If relevant, enable switching between accounts or identities from the profile area.

7. **Accessibility** - Use high-contrast text and icons, keyboard navigation and clear status indicators to ensure the app is usable for all.

### 5.3 Visual and Interaction Design Guidelines

1. **Minimal colour palette** - Adopt a primary accent colour (e.g., a modern purple or blue) and neutral backgrounds. Use accent colours sparingly to highlight interactive elements (buttons, selected items).

2. **Clean typography** - Choose a sans-serif typeface like Poppins for headings and body text; ensure adequate line spacing and font sizes.

3. **Iconography** - Use simple, line-based icons consistent with the mood board. Icons should be descriptive (e.g., folder, automation, settings) and accompanied by tooltips.

4. **Hierarchy and spacing** - Use typography, colour and spacing to signal hierarchy. Keep the conversation area dominant. Secondary actions (e.g., attachments, cc/bcc fields) appear when the user needs them.

5. **Micro-interactions** - Provide subtle hover states, button feedback and animations (e.g., sending animation) to make the interface feel responsive without being distracting.

6. **Responsiveness** - While the design is primarily for desktop, use flexible layouts so that the interface scales to different screen sizes.

### 5.4 Onboarding and Help

1. **Guided tour** - On first use, guide the user through key features: channels vs folders, how to use quick replies, how to create an automation rule. Keep the tour optional.

2. **Contextual tips** - Provide inline explanations (e.g., when hovering over automation icons) rather than separate documentation.

3. **Feedback loops** - After tasks like sending an email or creating an automation, offer confirmation messages and an undo option.

---

## 6. Conclusion

The Dribbble case study demonstrates the importance of iterative design, user testing and focusing on user goals. By adopting a two-pane, conversation-centric layout, integrating quick replies, automation and cloud-based attachments, and using a clean, modern visual language, your email app can transform email into an efficient and pleasant experience.

**Key Takeaway:** Continuously gather feedback and be prepared to simplify further; eliminating unnecessary elements until only the essential tools remain is a proven strategy to avoid clutter and support your users' goals.
