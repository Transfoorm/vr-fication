/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TAB                                                        │
│  /src/features/settings/preferences/_tabs/EmailTab.tsx               │
│                                                                       │
│  VR Doctrine: Tab Component                                           │
│  Email preferences: mark-as-read behavior + sound effects            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, Input, Stack } from '@/vr';
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

  // Get current values from user (defaults: timer for mode, true for sounds)
  const markReadMode: MarkReadMode = (user?.emailMarkReadMode as MarkReadMode) || 'timer';
  const soundTrash = user?.emailSoundTrash ?? true;
  const soundSend = user?.emailSoundSend ?? true;
  const soundReceive = user?.emailSoundReceive ?? true;
  const soundMark = user?.emailSoundMark ?? true;

  // Save mark-as-read mode
  const handleModeChange = async (value: string) => {
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

  // Save sound toggle
  const handleSoundToggle = async (field: 'emailSoundTrash' | 'emailSoundSend' | 'emailSoundReceive' | 'emailSoundMark', enabled: boolean) => {
    // 1. Optimistic UI update
    updateUserLocal({ [field]: enabled });

    // 2. Also update localStorage for email console to read
    localStorage.setItem(field, String(enabled));

    // 3. Play feedback sound if enabling
    if (enabled) playMarkSound();

    // 4. Persist to Convex
    if (user?.convexId) {
      try {
        await updateEmailSettings({
          callerUserId: user.convexId as Id<'admin_users'>,
          [field]: enabled,
        });
      } catch (error) {
        console.error('Failed to save sound preference:', error);
      }
    }
  };

  return (
    <Stack.row.equal>
      <Stack>
        <Card.standard
          title="Mark as Read"
          subtitle="When to auto-mark emails as read"
        >
          <Input.radio
            value={markReadMode}
            onChange={handleModeChange}
            size="sm"
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
        </Card.standard>
      </Stack>

      <Stack>
        <Card.standard
          title="Sound Effects"
          subtitle="Toggle email action sounds"
        >
          <Stack>
            <Input.toggle
              label="Trash sound"
              enabled={soundTrash}
              onChange={(enabled) => handleSoundToggle('emailSoundTrash', enabled)}
              size="sm"
            />
            <Input.toggle
              label="Send sound"
              enabled={soundSend}
              onChange={(enabled) => handleSoundToggle('emailSoundSend', enabled)}
              size="sm"
            />
            <Input.toggle
              label="Receive sound"
              enabled={soundReceive}
              onChange={(enabled) => handleSoundToggle('emailSoundReceive', enabled)}
              size="sm"
            />
            <Input.toggle
              label="Mark read/unread sound"
              enabled={soundMark}
              onChange={(enabled) => handleSoundToggle('emailSoundMark', enabled)}
              size="sm"
            />
          </Stack>
        </Card.standard>
      </Stack>
    </Stack.row.equal>
  );
}
