/**──────────────────────────────────────────────────────────────────────┐
│  🪞 MIROR AI TAB FEATURE                                             │
│  /src/features/preferences/miror-ai-tab/index.tsx                    │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Imports VRs (Card, Input.toggle, Input.radio)                     │
│  - Wires FUSE (user state, updateMirorLocal)                         │
│  - Handles all transforms and callbacks                               │
│  - The sponge that absorbs all dirt                                  │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect } from 'react';
import { Card, Tooltip } from '@/vr';
import { Input } from '@/vr/input';
import { useFuse } from '@/store/fuse';
import { ENCHANTMENT_TIMINGS } from '@/fuse/constants/enchantment';
import { AVATAR_OPTIONS, MIROR_DEFAULTS } from '@/fuse/constants/coreThemeConfig';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';
import './miror-ai-tab.css';

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function MirorAiTabFeature() {
  // ─────────────────────────────────────────────────────────────────────
  // FUSE wiring - all state access lives here in the Feature
  // ─────────────────────────────────────────────────────────────────────
  const user = useFuse((s) => s.user);
  const updateMirorLocal = useFuse((s) => s.updateMirorLocal);

  // Current values with defaults
  // Transform legacy underscore format to kebab-case (f_1 → f-1)
  const rawAvatar = user?.mirorAvatarProfile;
  const avatarProfile = rawAvatar
    ? rawAvatar.replace('_', '-') as AvatarOption
    : MIROR_DEFAULTS.DEFAULT_AVATAR;
  const enchantmentEnabled = user?.mirorEnchantmentEnabled ?? MIROR_DEFAULTS.DEFAULT_ENCHANTMENT_ENABLED;
  const enchantmentTiming = user?.mirorEnchantmentTiming ?? MIROR_DEFAULTS.DEFAULT_ENCHANTMENT;

  // ─────────────────────────────────────────────────────────────────────
  // Live preview enchantment animation state
  // ─────────────────────────────────────────────────────────────────────
  const [showStar, setShowStar] = useState(false);
  const [starKey, setStarKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Mount detection for client-side only animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Enchantment animation cycle (mirrors AISidebar logic)
  useEffect(() => {
    if (!mounted || !enchantmentEnabled) {
      setShowStar(false);
      return;
    }

    const currentTimingConfig = ENCHANTMENT_TIMINGS[enchantmentTiming];
    let onTimeout: NodeJS.Timeout;
    let offTimeout: NodeJS.Timeout;
    let isCancelled = false;

    const cycle = () => {
      if (isCancelled) return;

      // Show star
      setShowStar(true);
      setStarKey(prev => prev + 1);
      const randomOnDuration = currentTimingConfig.onDurations[
        Math.floor(Math.random() * currentTimingConfig.onDurations.length)
      ];

      onTimeout = setTimeout(() => {
        if (isCancelled) return;
        setShowStar(false);

        const randomOffDuration = currentTimingConfig.offDurations[
          Math.floor(Math.random() * currentTimingConfig.offDurations.length)
        ];
        offTimeout = setTimeout(cycle, randomOffDuration);
      }, randomOnDuration);
    };

    cycle();

    return () => {
      isCancelled = true;
      clearTimeout(onTimeout);
      clearTimeout(offTimeout);
    };
  }, [mounted, enchantmentEnabled, enchantmentTiming]);

  return (
    <div className="ft-miror-ai-tab">
      <Card.standard
        title="Miror AI Assistant"
        subtitle="Customise your AI assistant's appearance and enchantment effects"
      >
        {/* Avatar Grid + Preview wrapper */}
          <div className="ft-miror-ai-tab-avatar-row">
            {/* Avatar Grid */}
            <div className="ft-miror-ai-tab-avatar-grid">
              {AVATAR_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`ft-miror-ai-tab-avatar-option ${avatarProfile === option ? 'ft-miror-ai-tab-avatar-option--active' : ''}`}
                  onClick={() => updateMirorLocal({ mirorAvatarProfile: option as AvatarOption })}
                >
                  <img
                    src={`/images/ai/miror-${option}.png`}
                    alt={option}
                    className="ft-miror-ai-tab-avatar-image"
                  />
                </button>
              ))}
            </div>

          {/* Live Preview */}
          <div className="ft-miror-ai-tab-preview-wrapper">
            <div className="ft-miror-ai-tab-preview-label"></div>
            <Tooltip.caret content="Live Preview of your AI Avatar. You can select an enchantment level or turn it off completely ↘︎" side="top" size="md">
              <div className="ft-miror-ai-tab-preview">
                <div className="ft-miror-ai-tab-preview-avatar-container">
                  <img
                    src={`/images/ai/miror-${avatarProfile}.png`}
                    alt="Preview"
                    className="ft-miror-ai-tab-preview-avatar"
                  />
                  {mounted && enchantmentEnabled && showStar && (
                    <img
                      key={starKey}
                      src={`/images/sitewide/twinkle.webp?v=${starKey}`}
                      alt=""
                      className="ft-miror-ai-tab-preview-twinkle"
                    />
                  )}
                </div>
              </div>
            </Tooltip.caret>
          </div>

          {/* Star Toggle - standalone item for space-evenly */}
          <div className="ft-miror-ai-tab-star-wrapper">
            <Tooltip.caret content="Click to toggle enchantment on/off" side="top" dismissOnClick={true}>
              <label className="ft-star-toggle ft-star-toggle--enchantment">
                <input
                  className="ft-star-checkbox"
                  type="checkbox"
                  checked={enchantmentEnabled}
                  onChange={(e) => updateMirorLocal({ mirorEnchantmentEnabled: e.target.checked })}
                />
                <div className="ft-star-svg-container">
                  {/* White background star (solid) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ft-star-svg-bg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5Z" />
                  </svg>
                  {/* Grey outline star (ring shape) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ft-star-svg-outline"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5ZM12 4.75L14 9.33L18.7 9.75L15 13.07L16.18 17.75L12 15.16L7.82 17.75L9 13.07L5.3 9.75L10 9.33L12 4.75Z" />
                  </svg>
                  {/* Gold filled star (on state) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ft-star-svg-filled"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.5L9.45 8.5L3 9.06L7.725 13.39L6.25 19.82L12 16.5L17.75 19.82L16.275 13.39L21 9.06L14.55 8.5L12 2.5Z" />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="100"
                    width="100"
                    className="ft-star-svg-celebrate"
                  >
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                    <circle r="2" cy="50" cx="50" className="ft-star-particle" />
                  </svg>
                </div>
              </label>
            </Tooltip.caret>
  {/*           <span className="ft-miror-ai-tab-star-label">On • Off</span> */}
          </div>

          {/* Radio options - standalone item for space-evenly */}
          <div className={`ft-enchant-radio-container ${enchantmentEnabled ? 'ft-enchant-radio-container--active' : ''}`}>
            <span className="ft-miror-ai-tab-enchantment-label"></span>
            <Input.radioFancy
              value={enchantmentTiming}
              onChange={(val) => updateMirorLocal({ mirorEnchantmentTiming: val as 'subtle' | 'magical' | 'playful' })}
              options={[
                { value: 'playful', label: 'Playful: frequent and lively', description: '' },
                { value: 'magical', label: 'Magical: special and delightful', description: '' },
                { value: 'subtle', label: 'Subtle: rare and understated', description: '' },
              ]}
              name="enchantment"
            />
          </div>
        </div>
      </Card.standard>
    </div>
  );
}
