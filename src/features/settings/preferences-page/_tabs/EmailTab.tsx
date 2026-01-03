/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TAB                                                        │
│  /src/features/settings/preferences/_tabs/EmailTab.tsx               │
│                                                                       │
│  VR Doctrine: Tab Component                                           │
│  Email preferences: mark-as-read behavior                            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { T, Stack, Input } from '@/vr';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

type MarkReadMode = 'departure' | 'timer' | 'never';

// Play sound on preference change
const playMarkSound = () => {
  if (typeof window === 'undefined') return;
  const audio = new Audio('/audio/email-mark.wav');
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

export function EmailTab() {
  // Read from FUSE (synced from Convex via user data)
  const user = useFuse((state) => state.user);
  const updateUserLocal = useFuse((state) => state.updateUserLocal);
  const updateEmailSettings = useMutation(api.domains.settings.mutations.updateEmailSettings);

  // Get current value from user or default to 'timer'
  const markReadMode: MarkReadMode = (user?.emailMarkReadMode as MarkReadMode) || 'timer';

  // Save to Convex and update local FUSE
  const handleChange = async (value: string) => {
    const mode = value as MarkReadMode;

    // 1. Optimistic UI update
    updateUserLocal({ emailMarkReadMode: mode });

    // 2. Also update localStorage for email console to read
    localStorage.setItem('email-mark-read-mode', mode);

    // 3. Play sound
    playMarkSound();

    // 4. Persist to Convex
    if (user?.convexId) {
      try {
        await updateEmailSettings({
          callerUserId: user.convexId as Id<'admin_users'>,
          emailMarkReadMode: mode,
        });
      } catch (error) {
        console.error('Failed to save email preference:', error);
      }
    }
  };

  return (
    <Stack.lg>
      <Stack.sm>
        <T.h4>Mark as Read</T.h4>
        <T.caption>Choose when emails are automatically marked as read</T.caption>
      </Stack.sm>

      <Input.radio
        value={markReadMode}
        onChange={handleChange}
        options={[
          {
            value: 'timer',
            label: 'After 3 seconds',
            description: 'Mark as read after viewing for 3 seconds',
          },
          {
            value: 'departure',
            label: 'When I click away',
            description: 'Mark as read when I select a different email',
          },
          {
            value: 'never',
            label: 'Never',
            description: 'Only mark as read manually',
          },
        ]}
      />
    </Stack.lg>
  );
}
