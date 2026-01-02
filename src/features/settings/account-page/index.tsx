/**──────────────────────────────────────────────────────────────────────┐
│  🔱 ACCOUNT PAGE FEATURE                                              │
│  /src/features/settings/account/index.tsx                             │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Wires FUSE (user state, genome data)                               │
│  - Shadow King integration for pending users                          │
│  - Handles all callbacks and transforms                               │
│                                                                       │
│  Shadow King Integration:                                             │
│  When setupStatus === 'pending', clicking any tab or field activates  │
│  Shadow King. User can view the page but interaction triggers invite. │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './account-page.css';

import { useFuse } from '@/store/fuse';
import { Tabs, Stack, Icon } from '@/vr';
import { ProfileTab } from './_tabs/ProfileTab';
import { EmailTab } from './_tabs/EmailTab';
import { PasswordTab } from './_tabs/PasswordTab';
import { GenomeTab } from './_tabs/GenomeTab';

export function AccountPageFeature() {
  const user = useFuse((s) => s.user);
  const genome = useFuse((s) => s.genome);
  const setShadowKingActive = useFuse((s) => s.setShadowKingActive);

  const freeze = user?.setupStatus === 'pending';
  const genomePercent = genome?.completionPercent ?? 0;

  // If frozen, intercept field interactions only - tabs are allowed
  // Based purely on setupStatus === 'pending' (not emailVerified)
  const handleInteraction = (e: React.MouseEvent | React.FocusEvent) => {
    if (!freeze) return;

    const target = e.target as HTMLElement;

    // Allow tab clicks - user can browse all tabs
    const isTabClick = target.closest('[role="tab"]') || target.closest('.vr-tabs-tab');
    if (isTabClick) return;

    // Allow Password tab ONLY - changing password doesn't need setup
    const isPasswordTab = target.closest('.ft-passwordtab');
    if (isPasswordTab) return;

    // Block Profile and Genome fields - trigger ShadowKing
    // Email tab is allowed - user can change/verify email during setup
    const isProfile = target.closest('.vr-stack-row-equal') && !target.closest('[class*="ft-emailtab"]');
    const isGenome = target.closest('.ft-genometab');

    if (isProfile || isGenome) {
      e.preventDefault();
      e.stopPropagation();
      // Blur any focused element
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setShadowKingActive(true);
    }
  };

  return (
    <Stack>
      <div
        onClickCapture={handleInteraction}
        onFocusCapture={handleInteraction}
      >
        <Tabs.panels
          tabs={[
            { id: 'profile', label: 'Profile', icon: <Icon variant="user" />, content: <ProfileTab /> },
            { id: 'email', label: 'Email', icon: <Icon variant="send" />, content: <EmailTab /> },
            { id: 'password', label: 'Password', icon: <Icon variant="lock" />, content: <PasswordTab /> },
            { id: 'genome', label: <><span>Genome</span> <span className="vr-tabs-panels-label-sm">{genomePercent}%</span></>, icon: <Icon variant="dna" />, content: <GenomeTab />, highlight: genomePercent < 100 },
          ]}
        />
      </div>
    </Stack>
  );
}
