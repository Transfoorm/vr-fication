/**──────────────────────────────────────────────────────────────────────┐
│  🔱 PROFILE TAB (Admin) - Clone of Account ProfileFields              │
│  /src/features/admin/user-drawer/_tabs/ProfileTab.tsx                 │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Imports VRs (Field.live)                                           │
│  - Wires FUSE (admin data) + mutation for target user                 │
│  - Handles all transforms and callbacks                               │
│  - Includes CountrySelectorLive (inlined - single use component)      │
│  - Edit mode: fields locked by default, unlocked via "Edit User"      │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../user-drawer.css';
import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAdminData } from '@/hooks/useAdminData';
import { useFuse } from '@/store/fuse';
import { Field, Button, Icon, T, Stack } from '@/vr';
import { useSideDrawer } from '@/vr/modal';
import { useVanish } from '@/features/vanish/VanishContext';
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
// AVATAR DISPLAY (View-only VR component)
// Shows user avatar with fallback to initials
// ─────────────────────────────────────────────────────────────────────
interface AvatarDisplayProps {
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
}

function AvatarDisplay({ avatarUrl, firstName, lastName }: AvatarDisplayProps) {
  return (
    <div className="vr-field">
      <label className="vr-field__label">User Avatar</label>
      <div className="ft-profiletab-avatar-display">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={`${firstName} ${lastName}`}
            width={120}
            height={120}
            className="ft-profiletab-avatar-display__image"
            unoptimized
          />
        ) : (
          <div className="ft-profiletab-avatar-display__placeholder">
            <T.caption>No avatar uploaded</T.caption>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// BRAND LOGO DISPLAY (View-only VR component)
// Shows brand logo with fallback to entity name
// ─────────────────────────────────────────────────────────────────────
interface BrandLogoDisplayProps {
  brandLogoUrl?: string | null;
  entityName?: string | null;
}

function BrandLogoDisplay({ brandLogoUrl, entityName }: BrandLogoDisplayProps) {
  return (
    <div className="vr-field">
      <label className="vr-field__label">Brand Logo</label>
      <div className="ft-profiletab-logo-display">
        {brandLogoUrl ? (
          <Image
            src={brandLogoUrl}
            alt={entityName || 'Brand Logo'}
            width={120}
            height={120}
            className="ft-profiletab-logo-display__image"
            unoptimized
          />
        ) : (
          <div className="ft-profiletab-logo-display__placeholder">
            <T.caption>No logo uploaded</T.caption>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COUNTRY SELECTOR LIVE (inlined - only used here)
// Wraps CountrySelector in Field.live VR shell with save badge ceremony
// ─────────────────────────────────────────────────────────────────────
type SaveState = 'idle' | 'saved' | 'error';

interface CountrySelectorLiveProps {
  label: string;
  value: string | null;
  onSave: (country: string) => Promise<void>;
  disabled?: boolean;
}

function CountrySelectorLive({ label, value, onSave, disabled = false }: CountrySelectorLiveProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback(async (country: string) => {
    if (badgeTimeoutRef.current) {
      clearTimeout(badgeTimeoutRef.current);
    }

    setSaveState('saved');

    badgeTimeoutRef.current = setTimeout(() => {
      setSaveState('idle');
    }, 1000);

    try {
      await onSave(country);
    } catch {
      setSaveState('error');
    }
  }, [onSave]);

  const country = value ? COUNTRIES[value] : null;

  const handleSelect = (code: string) => {
    setShowDropdown(false);
    handleChange(code);
  };

  const wrapperClass = [
    'vr-field-live',
    saveState === 'saved' && 'vr-field-live--saved',
    saveState === 'error' && 'vr-field-live--error',
    disabled && 'vr-field-live--disabled',
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
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
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
// PROFILE TAB (main export)
// ─────────────────────────────────────────────────────────────────────
interface ProfileTabProps {
  userId: string;
  isActive?: boolean;
}

export function ProfileTab({ userId, isActive = true }: ProfileTabProps) {
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);
  const updateUser = useMutation(api.domains.admin.users.api.updateProfile);

  // Vanish drawer for user deletion
  const { openDrawer: openVanishDrawer } = useVanish();
  const { closeDrawer } = useSideDrawer();

  // Check if editing own profile (to sync session cookie)
  const currentUserId = useFuse((s) => s.user?.id);
  const updateUserLocal = useFuse((s) => s.updateUserLocal);
  const isEditingSelf = currentUserId === userId;

  // Edit mode: locked by default, unlocked via button
  const [isEditMode, setIsEditMode] = useState(false);

  // Reset edit mode when user changes OR tab becomes inactive
  useEffect(() => {
    setIsEditMode(false);
  }, [userId]);

  useEffect(() => {
    if (!isActive) {
      setIsEditMode(false);
    }
  }, [isActive]);

  if (!user) return <T.body>User not found</T.body>;

  // Handle Delete User button - opens Vanish drawer and closes this drawer
  const handleDeleteUser = () => {
    openVanishDrawer({ target: userId }, (result) => {
      if (result.success) {
        // Close the user details drawer after successful deletion
        closeDrawer();
      }
      // If deletion fails, Vanish drawer handles the error display
      // User drawer stays open so user can try again or navigate away
    });
  };

  // Save handler that calls mutation with target user ID
  const handleSave = async (field: string, value: string) => {
    console.log(`🔄 ProfileTab.handleSave: field=${field}, value=${value}, isEditingSelf=${isEditingSelf}`);

    await updateUser({
      userId: userId as Id<"admin_users">,
      [field]: value || undefined,
    });

    // If editing own profile, also update session cookie via FUSE
    if (isEditingSelf) {
      console.log(`🔄 ProfileTab: Calling updateUserLocal for ${field}`);
      await updateUserLocal({ [field]: value || undefined });
    }
  };

  return (
    <div className="ft-profiletab">
      <Stack.lg>
        {/* Row 1: First Name + Last Name */}
        <Stack.row.equal>
          <Field.live
            label="First Name"
            value={String(user.firstName ?? '')}
            onSave={(v) => handleSave('firstName', v)}
            placeholder="Not set"
            disabled={!isEditMode}
          />
          <Field.live
            label="Last Name"
            value={String(user.lastName ?? '')}
            onSave={(v) => handleSave('lastName', v)}
            placeholder="Not set"
            disabled={!isEditMode}
          />
        </Stack.row.equal>

        {/* Row 2: Entity/Organisation + Username */}
        <Stack.row.equal>
          <Field.live
            label="Entity/Organisation"
            value={String(user.entityName ?? '')}
            onSave={(v) => handleSave('entityName', v)}
            placeholder="Not set"
            disabled={!isEditMode}
          />
          <Field.live
            label="Username"
            value={String(user.socialName ?? '')}
            onSave={(v) => handleSave('socialName', v)}
            placeholder="Not set"
            transform="username"
            helper="*Letters, numbers, and one dot only"
            helperOnFocus
            disabled={!isEditMode}
          />
        </Stack.row.equal>

        {/* Row 3: Phone Number + Business Location */}
        <Stack.row.equal>
          <Field.live
            label="Phone Number (Optional)"
            value={String(user.phoneNumber ?? '')}
            onSave={(v) => handleSave('phoneNumber', v)}
            type="tel"
            placeholder="Not set"
            disabled={!isEditMode}
          />
          <CountrySelectorLive
            label="Business Location"
            value={user.businessCountry ? String(user.businessCountry) : null}
            onSave={(country) => handleSave('businessCountry', country)}
            disabled={!isEditMode}
          />
        </Stack.row.equal>

        {/* Row 4: Edit/Delete Buttons + Avatar/Logo Section */}
        <div className="ft-profiletab-media-section">
          <div className="ft-profiletab-button-group">
            <Button.ghost
              onClick={() => setIsEditMode(!isEditMode)}
              icon={<Icon variant={isEditMode ? 'check-circle' : 'pencil'} size="sm" />}
              className="ft-profiletab-edit-button-fixed"
            >
              {isEditMode ? 'Finished?' : 'Edit User'}
            </Button.ghost>
            <Button.ghost
              onClick={handleDeleteUser}
              icon={<Icon variant="trash" size="sm" />}
              disabled={isEditingSelf}
            >
              Delete User
            </Button.ghost>
          </div>
          <div className="ft-profiletab-media-group">
            <AvatarDisplay
              avatarUrl={user.avatarUrl as string | null | undefined}
              firstName={String(user.firstName ?? '')}
              lastName={String(user.lastName ?? '')}
            />
            <BrandLogoDisplay
              brandLogoUrl={user.brandLogoUrl as string | null | undefined}
              entityName={user.entityName ? String(user.entityName) : null}
            />
          </div>
        </div>
      </Stack.lg>
    </div>
  );
}
