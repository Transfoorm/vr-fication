/**─────────────────────────────────────────────────────────────────────────┐
│  🔧 OUTLOOK HELPERS - Pure Functions (No Convex)                          │
│  /convex/productivity/email/outlookHelpers.ts                             │
│                                                                           │
│  Token refresh, folder fetching - no Convex bindings                      │
│  Importable from actions without creating circular deps                   │
└───────────────────────────────────────────────────────────────────────────┘ */

import { OUTLOOK_FOLDER_MAP, CanonicalFolder, MESSAGE_FIELDS } from './outlookCanonical';

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ═══════════════════════════════════════════════════════════════════════════

export type TokenData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  emailAddress?: string;
};

/**
 * Refresh access token using Microsoft OAuth
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number } | null> {
  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
      }),
    });

    if (!response.ok) {
      console.error('Token refresh failed:', await response.text());
      return null;
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER FETCHING
// ═══════════════════════════════════════════════════════════════════════════

export type FolderData = {
  externalFolderId: string;
  displayName: string;
  canonicalFolder: string;
  parentFolderId?: string;
  childFolderCount: number;
};

/**
 * Fetch folders from Microsoft Graph API
 */
export async function fetchFoldersFromGraph(
  accessToken: string
): Promise<{
  folderMap: Record<string, { displayName: string }>;
  foldersToStore: FolderData[];
}> {
  const folderMap: Record<string, { displayName: string }> = {};
  const foldersToStore: FolderData[] = [];

  console.log('📁 Fetching Outlook folder list (including hidden)...');
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/mailFolders?$select=id,displayName,childFolderCount&$top=100&includeHiddenFolders=true',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.warn(`⚠️ Could not fetch folders (${response.status})`);
    return { folderMap, foldersToStore };
  }

  const data = (await response.json()) as {
    value: Array<{ id: string; displayName: string; childFolderCount: number }>;
  };

  console.log(`📁 Found ${data.value.length} top-level folders`);

  // Add top-level folders
  for (const folder of data.value) {
    const canonicalFolder = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()] || CanonicalFolder.INBOX;
    folderMap[folder.id] = { displayName: folder.displayName };
    foldersToStore.push({
      externalFolderId: folder.id,
      displayName: folder.displayName,
      canonicalFolder,
      parentFolderId: undefined,
      childFolderCount: folder.childFolderCount,
    });
  }

  // Fetch child folders recursively
  for (const parentFolder of data.value.filter(f => f.childFolderCount > 0)) {
    const parentCanonical = OUTLOOK_FOLDER_MAP[parentFolder.displayName.toLowerCase().trim()] || CanonicalFolder.INBOX;
    await fetchChildFoldersRecursive(
      accessToken, parentFolder.id, parentFolder.displayName, parentCanonical, 1, folderMap, foldersToStore
    );
  }

  // Dedupe
  const seenIds = new Set<string>();
  const dedupedFolders = foldersToStore.filter(f => {
    if (seenIds.has(f.externalFolderId)) return false;
    seenIds.add(f.externalFolderId);
    return true;
  });

  return { folderMap, foldersToStore: dedupedFolders };
}

async function fetchChildFoldersRecursive(
  accessToken: string,
  parentId: string,
  parentDisplayName: string,
  parentCanonical: string,
  depth: number,
  folderMap: Record<string, { displayName: string }>,
  foldersToStore: FolderData[]
): Promise<void> {
  if (depth > 100) return;

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders?$select=id,displayName,childFolderCount&$top=100`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  if (!response.ok) return;

  const data = (await response.json()) as {
    value: Array<{ id: string; displayName: string; childFolderCount: number }>;
  };

  for (const child of data.value) {
    folderMap[child.id] = { displayName: parentDisplayName };
    foldersToStore.push({
      externalFolderId: child.id,
      displayName: child.displayName,
      canonicalFolder: parentCanonical,
      parentFolderId: parentId,
      childFolderCount: child.childFolderCount || 0,
    });

    if (child.childFolderCount > 0) {
      await fetchChildFoldersRecursive(accessToken, child.id, child.displayName, parentCanonical, depth + 1, folderMap, foldersToStore);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNC PHASES
// ═══════════════════════════════════════════════════════════════════════════

export type SyncFolder = {
  externalFolderId: string;
  displayName: string;
  canonicalFolder: string;
  deltaToken?: string;
};

export type SyncCallbacks = {
  storeMessages: (messages: unknown[], folderMap: Record<string, { displayName: string }>) => Promise<void>;
  removeStaleMessages: (folderId: string, validIds: string[]) => Promise<void>;
  saveDeltaToken: (folderId: string, token: string) => Promise<void>;
  signalNewEmails: (count: number) => Promise<void>;
};

/**
 * Phase A: Initial historical sync using /messages endpoint
 */
export async function syncPhaseA(
  accessToken: string,
  folders: SyncFolder[],
  folderMap: Record<string, { displayName: string }>,
  batchSize: number,
  callbacks: SyncCallbacks
): Promise<{ totalMessages: number; pagesProcessed: number }> {
  let totalMessages = 0;
  let pagesProcessed = 0;
  let isFirstFolder = true;

  console.log('🅰️ PHASE A: Initial historical sync starting...');

  for (const folder of folders) {
    let folderMessages = 0;
    let folderPages = 0;
    const validMessageIds: string[] = [];

    let nextUrl: string | null = `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}/messages?` +
      new URLSearchParams({ $select: MESSAGE_FIELDS, $orderby: 'receivedDateTime desc', $top: String(batchSize) });

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Phase A failed for ${folder.displayName}: ${response.status}`);
      }

      const data = (await response.json()) as { value: Array<{ id: string }>; '@odata.nextLink'?: string };
      folderPages++;
      pagesProcessed++;

      for (const msg of data.value) {
        if (msg.id) validMessageIds.push(msg.id);
      }

      if (data.value.length > 0) {
        await callbacks.storeMessages(data.value, folderMap);
        folderMessages += data.value.length;
        totalMessages += data.value.length;
      }

      nextUrl = data['@odata.nextLink'] || null;
      if (folderPages >= 500) break;
    }

    await callbacks.removeStaleMessages(folder.externalFolderId, validMessageIds);
    console.log(`✅ ${folder.displayName}: Phase A synced ${folderMessages} messages`);

    if (isFirstFolder && folderMessages > 0) {
      await callbacks.signalNewEmails(folderMessages);
    }
    isFirstFolder = false;
  }

  return { totalMessages, pagesProcessed };
}

/**
 * Phase B: Incremental delta sync using /messages/delta endpoint
 */
export async function syncPhaseB(
  accessToken: string,
  folders: SyncFolder[],
  folderMap: Record<string, { displayName: string }>,
  batchSize: number,
  callbacks: SyncCallbacks
): Promise<{ totalMessages: number; pagesProcessed: number }> {
  let totalMessages = 0;
  let pagesProcessed = 0;
  let isFirstFolder = true;

  console.log('🅱️ PHASE B: Incremental delta sync...');

  for (const folder of folders) {
    let folderMessages = 0;
    let folderPages = 0;

    const hasDelta = Boolean(folder.deltaToken && folder.deltaToken.length > 0);
    let nextUrl: string | null = hasDelta
      ? folder.deltaToken as string
      : `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}/messages/delta?` +
        new URLSearchParams({ $select: MESSAGE_FIELDS, $top: String(batchSize) });

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 410 || errorText.includes('SyncStateNotFound')) {
          await callbacks.saveDeltaToken(folder.externalFolderId, '');
        }
        throw new Error(`Delta failed for ${folder.displayName}: ${response.status}`);
      }

      const data = (await response.json()) as {
        value: unknown[];
        '@odata.nextLink'?: string;
        '@odata.deltaLink'?: string;
      };

      folderPages++;
      pagesProcessed++;

      if (data.value.length > 0) {
        await callbacks.storeMessages(data.value, folderMap);
        folderMessages += data.value.length;
        totalMessages += data.value.length;
      }

      if (data['@odata.nextLink']) {
        nextUrl = data['@odata.nextLink'];
      } else if (data['@odata.deltaLink']) {
        await callbacks.saveDeltaToken(folder.externalFolderId, data['@odata.deltaLink']);
        nextUrl = null;
      } else {
        nextUrl = null;
      }

      if (folderPages >= 50) break;
    }

    console.log(`✅ ${folder.displayName}: Delta synced ${folderMessages} messages`);

    if (isFirstFolder && folderMessages > 0) {
      await callbacks.signalNewEmails(folderMessages);
    }
    isFirstFolder = false;
  }

  return { totalMessages, pagesProcessed };
}
