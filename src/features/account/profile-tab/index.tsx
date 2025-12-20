/**──────────────────────────────────────────────────────────────────────┐
│  🔱 PROFILE FIELDS FEATURE                                            │
│  /src/features/account/ProfileFields/index.tsx                        │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Imports VRs (Field.live)                                           │
│  - Wires FUSE (user state, updateUserLocal)                           │
│  - Handles all transforms and callbacks                               │
│  - Includes CountrySelectorLive (inlined - single use component)      │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './profile-tab.css';
import { useState, useCallback, useRef } from 'react';
import { useFuse } from '@/store/fuse';
import { Field, Card } from '@/prebuilts';
import CountrySelector from '@/features/shell/country-selector';

// ─────────────────────────────────────────────────────────────────────
// COUNTRY DATA
// ─────────────────────────────────────────────────────────────────────
const COUNTRIES: Record<string, { flag: string; name: string }> = {
  AU: { flag: '🇦🇺', name: 'Australia' },
  US: { flag: '🇺🇸', name: 'United States' },
  GB: { flag: '🇬🇧', name: 'United Kingdom' },
};

// ─────────────────────────────────────────────────────────────────────
// COUNTRY SELECTOR LIVE (inlined - only used here)
// Wraps CountrySelector in Field.live VR shell with save badge ceremony
// ─────────────────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saved' | 'error';

interface CountrySelectorLiveProps {
  label: string;
  onSave: (country: string) => Promise<void>;
}

function CountrySelectorLive({ label, onSave }: CountrySelectorLiveProps) {
  const user = useFuse((s) => s.user);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(async (country: string) => {
    // Clear any existing badge timeout
    if (badgeTimeoutRef.current) {
      clearTimeout(badgeTimeoutRef.current);
    }

    // Optimistic: show badge immediately (speedster UX)
    setSaveState('saved');

    // Badge fades after 1s
    badgeTimeoutRef.current = setTimeout(() => {
      setSaveState('idle');
    }, 1000);

    // Fire save in background - error overrides badge if it fails
    try {
      await onSave(country);
    } catch {
      setSaveState('error');
    }
  }, [onSave]);

  const country = user?.businessCountry ? COUNTRIES[user.businessCountry] : null;

  const handleSelect = (code: string) => {
    setShowDropdown(false);
    handleChange(code);
  };

  // VR classes
  const wrapperClass = [
    'vr-field-live',
    saveState === 'saved' && 'vr-field-live--saved',
    saveState === 'error' && 'vr-field-live--error',
  ].filter(Boolean).join(' ');

  const chipClass = [
    'vr-field-live__chip',
    saveState !== 'idle' && 'vr-field-live__chip--visible',
    saveState === 'saved' && 'vr-field-live__chip--saved',
    saveState === 'error' && 'vr-field-live__chip--error',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      <label className="vr-field__label">{label}</label>
      <div className="vr-field-live__input-wrapper">
        <button
          ref={buttonRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="vr-field-live__input ft-profiletab-country-button"
        >
          <span className="ft-profiletab-country-button__flag">{country?.flag}</span>
          <span className="ft-profiletab-country-button__text">{country?.name}</span>
        </button>
        <div className={chipClass}>
          {saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Error' : null}
        </div>
      </div>
      {showDropdown && (
        <CountrySelector
          triggerRef={buttonRef}
          onClose={() => setShowDropdown(false)}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// PROFILE FIELDS (main export)
// ─────────────────────────────────────────────────────────────────────
export function ProfileFields() {
  const user = useFuse((s) => s.user);
  const updateUserLocal = useFuse((s) => s.updateUserLocal);

  return (
    <Card.standard
      title="Your Profile"
      subtitle="You can change your details here"
    >
      <div className="vr-field-spacing">
        {/* Row 1: First Name + Last Name */}
        <div className="vr-field-row">
          <Field.live
            label="First Name"
            value={user?.firstName ?? ''}
            onSave={(v) => updateUserLocal({ firstName: v })}
            placeholder="Not set"
          />
          <Field.live
            label="Last Name"
            value={user?.lastName ?? ''}
            onSave={(v) => updateUserLocal({ lastName: v })}
            placeholder="Not set"
          />
        </div>

        {/* Row 2: Entity/Organisation + Social Name */}
        <div className="vr-field-row">
          <Field.live
            label="Entity/Organisation"
            value={user?.entityName ?? ''}
            onSave={(v) => updateUserLocal({ entityName: v || undefined })}
            placeholder="Not set"
          />
          <Field.live
            label="Username"
            value={user?.socialName ?? ''}
            onSave={(v) => updateUserLocal({ socialName: v || undefined })}
            placeholder="Not set'"
            transform="username"
            helper="* Letters, numbers, and one dot only"
          />
        </div>

        {/* Row 3: Phone Number + Business Location */}
        <div className="vr-field-row">
          <Field.live
            label="Phone Number (Optional)"
            value={user?.phoneNumber ?? ''}
            onSave={(v) => updateUserLocal({ phoneNumber: v || undefined })}
            type="tel"
            placeholder="Not set"
          />
          <CountrySelectorLive
            label="Business Location"
            onSave={(country) => updateUserLocal({ businessCountry: country })}
          />
        </div>
      </div>
    </Card.standard>
  );
}
