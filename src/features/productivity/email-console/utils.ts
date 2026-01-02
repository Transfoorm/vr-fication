/** Get time bucket for grouping messages */
export function getTimeBucket(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= thisWeekStart) return 'This Week';
  if (date >= lastWeekStart) return 'Last Week';
  if (date >= thisMonthStart) return 'This Month';
  if (date >= lastMonthStart) return 'Last Month';
  return 'Older';
}

/** Format date like Outlook Web: today=time, recent=day+time, older=day+date */
export function formatThreadDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });

  if (date >= today) {
    // Today: just time
    return time;
  } else if (date >= yesterday) {
    // Yesterday: day + time
    return `${dayShort} ${time}`;
  } else if (date >= oneWeekAgo) {
    // Within a week: day + time
    return `${dayShort} ${time}`;
  } else {
    // Older: just date (no day name)
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}

// localStorage keys for persisted column widths
export const STORAGE_KEY_MAILBOX = 'email-column-mailbox';
export const STORAGE_KEY_THREADS = 'email-column-threads';

/** Get saved width from localStorage (SSR-safe) */
export function getSavedWidth(key: string, defaultValue: number): number {
  if (typeof window === 'undefined') return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? parseInt(saved, 10) : defaultValue;
}

/** Standard canonical folder types */
export const STANDARD_FOLDERS = ['inbox', 'drafts', 'sent', 'archive', 'spam', 'trash'];

/** Root folder display name mappings */
const ROOT_DISPLAY_NAMES: Record<string, string[]> = {
  inbox: ['inbox'],
  sent: ['sent items', 'sent'],
  drafts: ['drafts'],
  archive: ['archive'],
  spam: ['junk email', 'junk', 'spam'],
  trash: ['deleted items', 'deleted', 'trash'],
};

/** Conditional folders - only show when they have emails */
const CONDITIONAL_FOLDERS = ['clutter', 'conversation history', 'outbox'];

/** Fyxer AI numbered folder pattern */
const FYXER_PATTERN = /^\d+:\s/;

/** Folder tree structure returned by buildFolderTree */
export interface FolderTreeResult {
  folderTree: Record<string, Array<{ _id: string; externalFolderId: string; displayName: string; canonicalFolder: string; parentFolderId?: string; childFolderCount: number; provider: 'outlook' | 'gmail' }>>;
  getChildFolders: (parentExternalId: string) => Array<{ _id: string; externalFolderId: string; displayName: string; canonicalFolder: string; parentFolderId?: string; childFolderCount: number; provider: 'outlook' | 'gmail' }>;
  rootFolderIds: Record<string, string>;
}

/**
 * Build folder tree: group subfolders by their parent's canonical type
 * Also capture custom root-level folders (like Fyxer AI folders)
 */
export function buildFolderTree(
  allFolders: Array<{ _id: string; externalFolderId: string; displayName: string; canonicalFolder: string; parentFolderId?: string; childFolderCount: number; provider: 'outlook' | 'gmail' }>,
  allMessages: Array<{ providerFolderId?: string }>
): FolderTreeResult {
  const tree: Record<string, typeof allFolders> = {
    inbox: [],
    drafts: [],
    sent: [],
    archive: [],
    spam: [],
    trash: [],
    custom: [],
  };

  // Step 1: Count messages per folder (by externalFolderId)
  const folderMessageCounts = new Map<string, number>();
  for (const message of allMessages) {
    if (message.providerFolderId) {
      const count = folderMessageCounts.get(message.providerFolderId) || 0;
      folderMessageCounts.set(message.providerFolderId, count + 1);
    }
  }

  // Step 2: Find ROOT canonical folders by display name
  const rootFolderIds: Record<string, string> = {};
  for (const folder of allFolders) {
    const canonical = folder.canonicalFolder || '';
    const displayLower = folder.displayName.toLowerCase().trim();

    if (STANDARD_FOLDERS.includes(canonical) && !rootFolderIds[canonical]) {
      const expectedNames = ROOT_DISPLAY_NAMES[canonical] || [];
      if (expectedNames.includes(displayLower)) {
        rootFolderIds[canonical] = folder.externalFolderId;
      }
    }
  }

  // Step 3: Build parent → children lookup
  const childrenMap = new Map<string, typeof allFolders>();
  for (const folder of allFolders) {
    if (folder.parentFolderId) {
      const siblings = childrenMap.get(folder.parentFolderId) || [];
      siblings.push(folder);
      childrenMap.set(folder.parentFolderId, siblings);
    }
  }

  const getChildFolders = (parentExternalId: string): typeof allFolders => {
    return childrenMap.get(parentExternalId) || [];
  };

  // Step 4: Categorize folders
  for (const folder of allFolders) {
    const displayNameLower = folder.displayName.toLowerCase().trim();
    const isFyxerFolder = FYXER_PATTERN.test(folder.displayName);
    const isConditional = CONDITIONAL_FOLDERS.includes(displayNameLower);
    const messageCount = folderMessageCounts.get(folder.externalFolderId) || 0;

    // Conditional folders: only show if they have emails
    if (isConditional && messageCount === 0) continue;

    // Conditional folders with emails go to custom section
    if (isConditional && messageCount > 0) {
      tree.custom.push(folder);
      continue;
    }

    // Fyxer folders ALWAYS go to custom section
    if (isFyxerFolder) {
      tree.custom.push(folder);
      continue;
    }

    const canonical = folder.canonicalFolder || 'system';

    if (folder.parentFolderId) {
      // Subfolder - add to parent's tree if parent is a standard ROOT folder
      for (const [standardCanonical, rootId] of Object.entries(rootFolderIds)) {
        if (folder.parentFolderId === rootId && standardCanonical in tree) {
          tree[standardCanonical].push(folder);
          break;
        }
      }
    }

    // Custom folders: anything not standard that isn't a child of another shown custom folder
    if (!STANDARD_FOLDERS.includes(canonical)) {
      const parentFolder = allFolders.find(f => f.externalFolderId === folder.parentFolderId);
      const parentIsShownCustom = parentFolder && !STANDARD_FOLDERS.includes(parentFolder.canonicalFolder || 'system');

      if (!parentIsShownCustom) {
        tree.custom.push(folder);
      }
    }
  }

  // Sort custom folders by display name
  tree.custom.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return { folderTree: tree, getChildFolders, rootFolderIds };
}

/**
 * Compute folder unread counts
 * - Root folder badges: only count messages DIRECTLY in that folder
 * - Subfolder badges: count by providerFolderId
 */
export function computeFolderCounts(
  allMessages: Array<{ isRead: boolean; providerFolderId?: string; canonicalFolder?: string }>,
  rootFolderIds: Record<string, string>
): { folderCounts: Record<string, number>; subfolderCounts: Record<string, number> } {
  const counts: Record<string, number> = {
    inbox: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
    spam: 0,
    trash: 0,
  };
  const subCounts: Record<string, number> = {};

  for (const message of allMessages) {
    if (message.isRead) continue;

    if (message.providerFolderId) {
      subCounts[message.providerFolderId] = (subCounts[message.providerFolderId] || 0) + 1;
    }

    const canonical = message.canonicalFolder || 'inbox';
    if (canonical in counts && message.providerFolderId) {
      const rootFolderId = rootFolderIds[canonical];
      if (message.providerFolderId === rootFolderId) {
        counts[canonical]++;
      }
    }
  }

  return { folderCounts: counts, subfolderCounts: subCounts };
}

/**
 * Filter messages by selected folder and sort by receivedAt descending
 */
export function filterMessages<T extends { providerFolderId?: string; canonicalFolder?: string; receivedAt: number }>(
  allMessages: T[],
  selectedFolder: string,
  selectedSubfolderId: string | null,
  rootFolderIds: Record<string, string>
): T[] {
  if (!allMessages.length) return allMessages;

  let filtered: T[];

  if (selectedFolder === 'custom' && selectedSubfolderId) {
    filtered = allMessages.filter(m => m.providerFolderId === selectedSubfolderId);
  } else if (selectedSubfolderId) {
    filtered = allMessages.filter(m => m.providerFolderId === selectedSubfolderId);
  } else {
    const rootFolderId = rootFolderIds[selectedFolder];
    if (rootFolderId) {
      filtered = allMessages.filter(m => m.providerFolderId === rootFolderId);
    } else {
      filtered = allMessages.filter(m => (m.canonicalFolder || 'inbox') === selectedFolder);
    }
  }

  return filtered.sort((a, b) => b.receivedAt - a.receivedAt);
}

/** Virtual item types for message list virtualization */
export type VirtualItem<T> =
  | { type: 'header'; bucket: string }
  | { type: 'message'; message: T; bucket: string };

/**
 * Build flat list of virtual items (headers + messages) for virtualization
 */
export function buildVirtualItems<T extends { receivedAt: number }>(
  messages: T[],
  collapsedSections: Set<string>
): VirtualItem<T>[] {
  const items: VirtualItem<T>[] = [];
  let lastBucket: string | null = null;

  for (const message of messages) {
    const bucket = getTimeBucket(message.receivedAt);

    if (bucket !== lastBucket) {
      items.push({ type: 'header', bucket });
      lastBucket = bucket;
    }

    if (!collapsedSections.has(bucket)) {
      items.push({ type: 'message', message, bucket });
    }
  }

  return items;
}
