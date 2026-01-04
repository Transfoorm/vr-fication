/** Productivity Domain Slice - email, calendar, meetings, bookings, tasks */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';
import type { ProductivityEmail } from '@/features/productivity/email-console/types';

// Types

export type EmailViewMode = 'live' | 'impact';

export interface ProductivityData {
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
}

export interface ProductivitySlice {
  // Domain data
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  // UI preferences (persisted)
  emailViewMode: EmailViewMode;
  // Pending read status updates (skip sync for these messages)
  pendingReadUpdates: Set<string>;
  // Pending move updates (protect folder moves from sync overwrite)
  pendingMoveUpdates: Map<string, { canonicalFolder: string; providerFolderId: string }>;
  // Auto-mark exempt IDs (never auto-mark these again this session)
  autoMarkExemptIds: Set<string>;
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ProductivityActions {
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
  updateEmailReadStatus: (messageId: string, isRead: boolean) => void;
  batchUpdateEmailReadStatus: (messageIds: string[], isRead: boolean) => void;
  removeEmailMessages: (messageIds: string[]) => void;
  moveEmailsToTrash: (messageIds: string[]) => void;
  removeEmailFolder: (folderId: string) => void;
  clearPendingReadUpdate: (messageId: string) => void;
  batchClearPendingReadUpdates: (messageIds: string[]) => void;
  batchClearPendingMoves: (messageIds: string[]) => void;
  addAutoMarkExempt: (messageId: string) => void;
  addAutoMarkExemptBatch: (messageIds: string[]) => void;
  removeAutoMarkExempt: (messageId: string) => void;
  removeAutoMarkExemptBatch: (messageIds: string[]) => void;
  clearProductivity: () => void;
  setEmailViewMode: (mode: EmailViewMode) => void;
}

// Initial State

const initialProductivityState: ProductivitySlice = {
  email: undefined,
  calendar: [],
  meetings: [],
  bookings: [],
  tasks: [],
  // UI preferences
  emailViewMode: 'live', // Default to Live mode (traditional Outlook-style)
  // Pending read status updates (protected from sync overwrite)
  pendingReadUpdates: new Set(),
  // Pending move updates (protected from sync overwrite)
  pendingMoveUpdates: new Map(),
  // Auto-mark exempt IDs
  autoMarkExemptIds: new Set(),
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// Slice Creator

export const createProductivitySlice: StateCreator<
  ProductivitySlice & ProductivityActions,
  [],
  [],
  ProductivitySlice & ProductivityActions
> = (set) => ({
  ...initialProductivityState,

  hydrateProductivity: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateProductivity');
    set((state) => {
      // CRITICAL: Preserve optimistic updates from being overwritten by stale sync
      // - pendingReadUpdates: protect isRead status
      // - pendingMoveUpdates: protect canonicalFolder/providerFolderId
      let finalEmail = data.email;
      const pendingReadSize = state.pendingReadUpdates.size;
      const pendingMoveSize = state.pendingMoveUpdates.size;


      if (data.email?.messages && (pendingReadSize > 0 || pendingMoveSize > 0)) {
        const protectedMessages = data.email.messages.map((msg) => {
          let protectedMsg = msg;

          // Protect pending read status
          if (state.pendingReadUpdates.has(msg._id)) {
            const localMsg = state.email?.messages?.find((m) => m._id === msg._id);
            if (localMsg && localMsg.isRead !== msg.isRead) {
              protectedMsg = { ...protectedMsg, isRead: localMsg.isRead };
            }
          }

          // Protect pending folder moves
          const pendingMove = state.pendingMoveUpdates.get(msg._id);
          if (pendingMove && msg.canonicalFolder !== pendingMove.canonicalFolder) {
            protectedMsg = {
              ...protectedMsg,
              canonicalFolder: pendingMove.canonicalFolder as typeof msg.canonicalFolder,
              providerFolderId: pendingMove.providerFolderId,
            };
          }

          return protectedMsg;
        });
        finalEmail = { ...data.email, messages: protectedMessages };

      }

      return {
        ...state,
        ...data,
        email: finalEmail,
        status: 'hydrated',
        lastFetchedAt: Date.now(),
        source,
      };
    });
    fuseTimer.end('hydrateProductivity', start);
  },

  updateEmailReadStatus: (messageId, isRead) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const updatedMessages = state.email.messages.map((msg) =>
        msg._id === messageId ? { ...msg, isRead } : msg
      );

      // Add to pending set to protect from sync overwrite
      const newPending = new Set(state.pendingReadUpdates);
      newPending.add(messageId);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 PENDING ADD: ${messageId.slice(-8)} (now ${newPending.size} pending)`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: updatedMessages,
        },
        pendingReadUpdates: newPending,
      };
    });
  },

  clearPendingReadUpdate: (messageId) => {
    set((state) => {
      const newPending = new Set(state.pendingReadUpdates);
      newPending.delete(messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔓 PENDING CLEAR: ${messageId.slice(-8)} (now ${newPending.size} pending)`);
      }
      return { ...state, pendingReadUpdates: newPending };
    });
  },

  // BATCH: Single state update for N messages (scales to 1000+)
  batchUpdateEmailReadStatus: (messageIds, isRead) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const idsSet = new Set(messageIds);
      const updatedMessages = state.email.messages.map((msg) =>
        idsSet.has(msg._id) ? { ...msg, isRead } : msg
      );

      // Add all to pending set
      const newPending = new Set(state.pendingReadUpdates);
      for (const id of messageIds) {
        newPending.add(id);
      }

      if (process.env.NODE_ENV === 'development') {
        const ids = messageIds.map(id => id.slice(-8)).join(', ');
        console.log(`🔒 PENDING BATCH ADD: [${ids}] (now ${newPending.size} pending)`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: updatedMessages,
        },
        pendingReadUpdates: newPending,
      };
    });
  },

  // BATCH: Clear multiple pending updates at once
  batchClearPendingReadUpdates: (messageIds) => {
    set((state) => {
      const newPending = new Set(state.pendingReadUpdates);
      for (const id of messageIds) {
        newPending.delete(id);
      }
      if (process.env.NODE_ENV === 'development') {
        const ids = messageIds.map(id => id.slice(-8)).join(', ');
        console.log(`🔓 PENDING BATCH CLEAR: [${ids}] (now ${newPending.size} pending)`);
      }
      return { ...state, pendingReadUpdates: newPending };
    });
  },

  // BATCH: Clear multiple pending move updates at once
  batchClearPendingMoves: (messageIds) => {
    set((state) => {
      const newPendingMoves = new Map(state.pendingMoveUpdates);
      for (const id of messageIds) {
        newPendingMoves.delete(id);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔓 PENDING MOVES CLEAR: ${messageIds.length} messages (now ${newPendingMoves.size} pending)`);
      }
      return { ...state, pendingMoveUpdates: newPendingMoves };
    });
  },

  // Auto-mark exempt: prevents auto-mark-as-read for these IDs this session
  addAutoMarkExempt: (messageId) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      newExempt.add(messageId);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  addAutoMarkExemptBatch: (messageIds) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      for (const id of messageIds) {
        newExempt.add(id);
      }
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  removeAutoMarkExempt: (messageId) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      newExempt.delete(messageId);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  removeAutoMarkExemptBatch: (messageIds) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      for (const id of messageIds) newExempt.delete(id);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  // OPTIMISTIC DELETE: Instantly remove messages from UI (API fires in background)
  // Note: Body cache cleanup is handled by fuse.ts which has access to both slices
  removeEmailMessages: (messageIds) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const idsSet = new Set(messageIds);
      const filteredMessages = state.email.messages.filter((msg) => !idsSet.has(msg._id));

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ FUSE: Removed ${messageIds.length} messages from UI`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: filteredMessages,
        },
      };
    });
  },

  // OPTIMISTIC MOVE TO TRASH: Instantly moves messages to Deleted folder in UI
  // Same message, different folder - appears in Deleted immediately
  moveEmailsToTrash: (messageIds) => {
    set((state) => {
      if (!state.email?.messages || !state.email?.folders) return state;

      // Find the trash folder
      const trashFolder = state.email.folders.find((f) => f.canonicalFolder === 'trash');
      if (!trashFolder) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`🗑️ FUSE: Cannot move to trash - no trash folder found`);
        }
        return state;
      }

      const idsSet = new Set(messageIds);
      const updatedMessages = state.email.messages.map((msg) => {
        if (idsSet.has(msg._id)) {
          return {
            ...msg,
            canonicalFolder: 'trash' as const,
            providerFolderId: trashFolder.externalFolderId,
          };
        }
        return msg;
      });

      // Add to pending moves - protect from sync overwrite
      const newPendingMoves = new Map(state.pendingMoveUpdates);
      for (const id of messageIds) {
        newPendingMoves.set(id, {
          canonicalFolder: 'trash',
          providerFolderId: trashFolder.externalFolderId,
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ FUSE: Moved ${messageIds.length} messages to trash (protected from sync)`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: updatedMessages,
        },
        pendingMoveUpdates: newPendingMoves,
      };
    });
  },

  // OPTIMISTIC DELETE: Instantly remove folder from UI (API fires in background)
  removeEmailFolder: (folderId) => {
    set((state) => {
      if (!state.email?.folders) return state;

      const filteredFolders = state.email.folders.filter((f) => f.externalFolderId !== folderId);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ FUSE: Removed folder ${folderId.slice(-8)} from UI`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          folders: filteredFolders,
        },
      };
    });
  },

  clearProductivity: () => {
    const start = fuseTimer.start('clearProductivity');
    set(initialProductivityState);
    fuseTimer.end('clearProductivity', start);
  },

  setEmailViewMode: (mode) => {
    set((state) => ({
      ...state,
      emailViewMode: mode,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ FUSE: Email view mode changed to ${mode}`);
    }
  },
});

// Exports

export type ProductivityStore = ProductivitySlice & ProductivityActions;
