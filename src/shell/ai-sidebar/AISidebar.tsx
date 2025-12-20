/**──────────────────────────────────────────────────────────────────────┐
│  🤖 AI SIDEBAR - Right Side Assistant (WCCC ly-* Compliant)           │
│  /src/shell/AISidebar/AISidebar.tsx                                   │
│                                                                        │
│  AI Assistant sidebar with three states:                               │
│  - Closed: 45px (avatar only)                                          │
│  - Open: 256px (default assistant)                                     │
│  - Expanded: 900px (full chat interface)                               │
│                                                                        │
│  Zero fade delays. Instant. Clean. Works.                              │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useState, useCallback, useEffect } from 'react';
import { Icon, T } from '@/vr';
import { useFuse } from '@/store/fuse';
import { ENCHANTMENT_TIMINGS } from '@/fuse/constants/enchantment';
import { MIROR_DEFAULTS } from '@/fuse/constants/coreThemeConfig';

export default function AISidebar() {
  const navigate = useFuse(state => state.navigate);
  const sidebarState = useFuse(state => state.aiSidebarState);
  const setAISidebarState = useFuse(state => state.setAISidebarState);
  const toggleSection = useFuse(state => state.toggleSection);
  const expandedSections = useFuse(state => state.navigation.expandedSections);
  const setPendingRoute = useFuse(state => state.setPendingRoute);
  const mirorAvatarProfile = useFuse(state => state.user?.mirorAvatarProfile);
  const mirorEnchantmentEnabled = useFuse(state => state.user?.mirorEnchantmentEnabled);
  const mirorEnchantmentTiming = useFuse(state => state.user?.mirorEnchantmentTiming);

  const [chatContent, setChatContent] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [showStar, setShowStar] = useState(false);
  const [starKey, setStarKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const isOpen = sidebarState === 'open' || sidebarState === 'expand';

  // Dynamic avatar path based on user preference
  // Transform legacy underscore format to kebab-case (f_1 → f-1)
  const avatarKey = mirorAvatarProfile?.replace('_', '-') || MIROR_DEFAULTS.DEFAULT_AVATAR;
  const avatarPath = `/images/ai/miror-${avatarKey}.png`;

  // Enchantment enabled by default
  const enchantmentEnabled = mirorEnchantmentEnabled ?? MIROR_DEFAULTS.DEFAULT_ENCHANTMENT_ENABLED;

  // Get current timing (default from config)
  const selectedTiming = mirorEnchantmentTiming || MIROR_DEFAULTS.DEFAULT_ENCHANTMENT;

  const handleMainClick = useCallback(() => {
    if (isClosing) return; // Prevent clicks during close animation

    if (sidebarState === 'closed') {
      setAISidebarState('open');
    } else if (sidebarState === 'open') {
      setAISidebarState('expand');
    } else {
      setAISidebarState('open');
    }
  }, [sidebarState, setAISidebarState, isClosing]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsClosing(true);
    setAISidebarState('closed');
    setTimeout(() => setIsClosing(false), 300); // Reset after animation
  }, [setAISidebarState]);

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Star animation: uses user's selected timing preference
  useEffect(() => {
    if (!mounted || !enchantmentEnabled) {
      setShowStar(false);
      return;
    }

    // Timing options - imported from single source of truth
    const currentTimingConfig = ENCHANTMENT_TIMINGS[selectedTiming];

    let onTimeout: NodeJS.Timeout;
    let offTimeout: NodeJS.Timeout;
    let isCancelled = false;

    const cycle = () => {
      if (isCancelled) return;

      // Show star for random duration from selected timing (GIF will loop automatically)
      setShowStar(true);
      setStarKey(prev => prev + 1); // Increment key to force GIF restart
      const randomOnDuration = currentTimingConfig.onDurations[
        Math.floor(Math.random() * currentTimingConfig.onDurations.length)
      ];

      onTimeout = setTimeout(() => {
        if (isCancelled) return;

        // Hide star
        setShowStar(false);

        // Pick random off duration from selected timing
        const randomOffDuration = currentTimingConfig.offDurations[
          Math.floor(Math.random() * currentTimingConfig.offDurations.length)
        ];

        // Wait random duration, then start new cycle
        offTimeout = setTimeout(cycle, randomOffDuration);
      }, randomOnDuration);
    };

    cycle();

    // Cleanup: clear timeouts when effect re-runs or unmounts
    return () => {
      isCancelled = true;
      clearTimeout(onTimeout);
      clearTimeout(offTimeout);
    };
  }, [mounted, enchantmentEnabled, selectedTiming]);

  // Get container class based on state
  const getContainerClass = () => {
    const classes = ['ly-aisidebar-container'];
    if (sidebarState === 'closed') classes.push('ly-aisidebar-container--closed');
    else if (sidebarState === 'open') classes.push('ly-aisidebar-container--open');
    else if (sidebarState === 'expand') classes.push('ly-aisidebar-container--expanded');
    return classes.join(' ');
  };

  return (
    <>
      <div className={getContainerClass()}>
      {/* Top border - extends beyond container */}
      <div className="ly-aisidebar-top-border" />

      {/* Content wrapper with overflow hidden */}
      <div
        onClick={sidebarState === 'closed' ? handleMainClick : undefined}
        className={`ly-aisidebar-content-wrapper ${sidebarState === 'closed' ? 'ly-aisidebar-content-wrapper--closed' : 'ly-aisidebar-content-wrapper--open'}`}
      >
        {/* Header */}
        <div
          onClick={isOpen ? handleMainClick : undefined}
          className={`ly-aisidebar-header ${isOpen ? 'ly-aisidebar-header--clickable' : ''}`}
        >
        {/* Expand/Contract Icons */}
        {isOpen && (
          <div className="ly-aisidebar-icons-container">
            {sidebarState === 'open' && (
              <Icon variant="arrow-left-from-line" size="xs" className="ly-aisidebar-icon" />
            )}
            {sidebarState === 'expand' && (
              <Icon variant="arrow-right-from-line" size="xs" className="ly-aisidebar-icon" />
            )}
          </div>
        )}

        {/* Centered Content */}
        <div className={`ly-aisidebar-centered-content ${sidebarState === 'closed' ? 'ly-aisidebar-centered-content--closed' : 'ly-aisidebar-centered-content--open'}`}>
          <div className="ly-aisidebar-avatar-container">
            <img
              src={avatarPath}
              alt="Miror AI"
              className="ly-aisidebar-avatar"
            />
            {mounted && enchantmentEnabled && showStar && (
              <img
                key={starKey}
                src={`/images/sitewide/twinkle.webp?v=${starKey}`}
                alt=""
                className="ly-aisidebar-twinkle"
              />
            )}
          </div>
          {isOpen && (
            <>
              <T.caption size="sm" weight="medium" className="ly-aisidebar-ask-text">
                Ask Miror
              </T.caption>
              <div
                className="ly-aisidebar-settings-cog"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // INSTANT: Set pending route for immediate visual feedback
                  setPendingRoute('/settings/preferences');

                  // Close AI sidebar
                  setAISidebarState('closed');

                  // Open Settings dropdown if not already open
                  if (!expandedSections.includes('settings')) {
                    toggleSection('settings');
                  }

                  // Navigate
                  navigate('settings/preferences');
                }}
              >
                <Icon variant="cog" size="xs" className="ly-aisidebar-settings-cog-icon" />
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <div
          onClick={handleClose}
          className={`ly-aisidebar-close-button ${isOpen ? 'ly-aisidebar-close-button--visible' : 'ly-aisidebar-close-button--hidden'}`}
        >
          <Icon variant="square-x" size="xs" className="ly-aisidebar-icon" />
        </div>
      </div>

      {/* Chat Input */}
      {isOpen && (
        <div className="ly-aisidebar-chat-container">
          <div className="ly-aisidebar-chat-box">
            <textarea
              placeholder="Ask me anything..."
              value={chatContent}
              onChange={(e) => setChatContent(e.target.value)}
              className="ly-aisidebar-textarea vr-typography-body vr-typography-body--sm"
              rows={1}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="ly-aisidebar-submit-button"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon variant="arrow-right" size="xs" />
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isOpen && (
        <div className="ly-aisidebar-content-area">
          {/* Empty space for future AI chat content - click here to toggle */}
          <div
            onClick={handleMainClick}
            className="ly-aisidebar-toggle-area"
          >
            <T.body>Click to {sidebarState === 'open' ? 'expand' : 'shrink'}</T.body>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
