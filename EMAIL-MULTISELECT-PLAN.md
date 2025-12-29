# Plan: Email Multi-Select, Context Menu & Unread Counts

## Objective
Implement Outlook-style email selection with:
1. Folder counts showing **unread** emails (not total)
2. Status bar with "Items: xxx" and "Selected: xxx"
3. Multi-select with Cmd+click (Mac) / Ctrl+click (PC)
4. Right-click context menu with email actions

---

## Current State

**Thread selection**: Single selection via `selectedThreadId: string | null`
**Unread tracking**: `thread.hasUnread` already available on each thread
**Context menus**: None exist, but dropdown/menu patterns exist in UserButton, CompanyButton

---

## Deliverable 1: Unread Counts in Folder Sidebar

**File:** `src/features/productivity/email-console/index.tsx`

Change `folderCounts` to count unread threads instead of total:

```typescript
// BEFORE: Counts all threads
for (const thread of allThreads) {
  const folder = thread.canonicalFolder || 'inbox';
  if (folder in counts) counts[folder]++;
}

// AFTER: Counts only unread threads
for (const thread of allThreads) {
  if (!thread.hasUnread) continue; // Skip read threads
  const folder = thread.canonicalFolder || 'inbox';
  if (folder in counts) counts[folder]++;
}
```

---

## Deliverable 2: Status Bar (Items / Selected)

**Location:** Header area of email console

Add status display showing:
- `Items: {totalThreadsInFolder}` - always visible
- `Selected: {selectedCount}` - only when multi-select active

```tsx
// In header-right area
<span className="ft-email__status">
  Items: {threads.length}
  {selectedThreadIds.size > 0 && ` | Selected: ${selectedThreadIds.size}`}
</span>
```

**CSS:** Add `.ft-email__status` styling (muted text, small font)

---

## Deliverable 3: Multi-Select State

**State change:**
```typescript
// BEFORE
const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

// AFTER
const [selectedThreadIds, setSelectedThreadIds] = useState<Set<string>>(new Set());
```

**Reading pane behavior when multi-select:**
- 1 selected: Show thread messages (current behavior)
- 2+ selected: Show "X items selected" placeholder

---

## Deliverable 4: Click Handler with Modifier Keys

**New click handler:**
```typescript
const handleThreadClick = (threadId: string, event: React.MouseEvent) => {
  const isModifierHeld = event.metaKey || event.ctrlKey; // Cmd (Mac) or Ctrl (PC)

  if (isModifierHeld) {
    // Toggle selection
    setSelectedThreadIds(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  } else {
    // Single select (clear others)
    setSelectedThreadIds(new Set([threadId]));
  }
};
```

**Apply to thread items:**
```tsx
<div
  className={`ft-email__thread-item ${selectedThreadIds.has(thread.threadId) ? 'ft-email__thread-item--selected' : ''}`}
  onClick={(e) => handleThreadClick(thread.threadId, e)}
  onContextMenu={(e) => handleContextMenu(thread.threadId, e)}
>
```

---

## Deliverable 5: Context Menu

**State:**
```typescript
const [contextMenu, setContextMenu] = useState<{
  x: number;
  y: number;
  threadId: string;
} | null>(null);
```

**Handler:**
```typescript
const handleContextMenu = (threadId: string, event: React.MouseEvent) => {
  event.preventDefault();

  // If right-clicking an unselected thread, select it
  if (!selectedThreadIds.has(threadId)) {
    setSelectedThreadIds(new Set([threadId]));
  }

  setContextMenu({
    x: event.clientX,
    y: event.clientY,
    threadId,
  });
};
```

**Menu component (inline, not VR):**
```tsx
{contextMenu && (
  <>
    <div
      className="ft-email__context-backdrop"
      onClick={() => setContextMenu(null)}
    />
    <div
      className="ft-email__context-menu"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button onClick={() => handleAction('open')}>Open Message</button>
      <hr />
      <button onClick={() => handleAction('reply')}>Reply</button>
      <button onClick={() => handleAction('replyAll')}>Reply All</button>
      <button onClick={() => handleAction('forward')}>Forward</button>
      <hr />
      <button onClick={() => handleAction('markUnread')}>Mark as Unread</button>
      <hr />
      <button onClick={() => handleAction('delete')}>Delete</button>
      <button onClick={() => handleAction('archive')}>Archive</button>
    </div>
  </>
)}
```

**CSS for context menu:**
```css
.ft-email__context-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.ft-email__context-menu {
  position: fixed;
  z-index: 1000;
  background: var(--prod-bg-surface);
  border: 1px solid var(--prod-border-normal);
  border-radius: var(--prod-radius-md);
  box-shadow: var(--prod-shadow-lg);
  padding: var(--prod-space-sm) 0;
  min-width: 180px;
}

.ft-email__context-menu button {
  display: block;
  width: 100%;
  padding: var(--prod-space-sm) var(--prod-space-xl);
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--prod-text-body-sm);
}

.ft-email__context-menu button:hover {
  background: var(--prod-bg-hover);
}

.ft-email__context-menu hr {
  border: none;
  border-top: 1px solid var(--prod-border-light);
  margin: var(--prod-space-sm) 0;
}
```

---

## Implementation Order

1. **Unread counts** - Change folderCounts calculation
2. **Multi-select state** - Replace selectedThreadId with selectedThreadIds Set
3. **Click handler** - Add modifier key detection
4. **Status bar** - Add Items/Selected display in header
5. **Context menu** - Add right-click menu with actions
6. **Reading pane** - Handle multi-select display

---

## Files to Modify

- `src/features/productivity/email-console/index.tsx` (main changes)
- `src/features/productivity/email-console/email-console.css` (context menu styles)

---

## Phase 2 (Future)

Context menu actions that require backend:
- Delete (move to trash)
- Archive
- Mark as Read/Unread
- Move to folder

These need Convex mutations - stub them with console.log for now.

---

## Status: READY FOR APPROVAL
