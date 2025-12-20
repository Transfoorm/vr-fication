/**──────────────────────────────────────────────────────────────────────┐
│  🎯 SIDEDRAWER - Clean Architecture                                    │
│  /src/prebuilts/modal/Drawer.tsx                                       │
│                                                                        │
│  Merged context + portal in single file.                               │
│  requestAnimationFrame for flicker-free animations.                    │
│  Single 500ms timing constant throughout.                              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, T } from '@/vr';

// ═══════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════

interface SideDrawerConfig {
  content: ReactNode;
  title?: string;
  subtitle?: ReactNode;
  width?: string;
  onClose?: () => void;
}

interface SideDrawerContextValue {
  isOpen: boolean;
  config: SideDrawerConfig | null;
  openDrawer: (config: SideDrawerConfig) => void;
  closeDrawer: () => void;
}

// ═══════════════════════════════════════════════════════════════════
//  CONTEXT
// ═══════════════════════════════════════════════════════════════════

const SideDrawerContext = createContext<SideDrawerContextValue | undefined>(undefined);

export function SideDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SideDrawerConfig | null>(null);

  const openDrawer = useCallback((newConfig: SideDrawerConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Call onClose callback if provided
    if (config?.onClose) {
      config.onClose();
    }
    // Clear config after animation completes (500ms)
    setTimeout(() => {
      setConfig(null);
    }, 500);
  }, [config]);

  return (
    <SideDrawerContext.Provider
      value={{
        isOpen,
        config,
        openDrawer,
        closeDrawer
      }}
    >
      {children}
    </SideDrawerContext.Provider>
  );
}

export function useSideDrawer() {
  const context = useContext(SideDrawerContext);
  if (!context) {
    throw new Error('useSideDrawer must be used within SideDrawerProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════
//  PORTAL COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SideDrawerPortal() {
  const { isOpen, config, closeDrawer } = useSideDrawer();
  const [isVisible, setIsVisible] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Find portal root on mount
  useEffect(() => {
    const root = document.getElementById('side-drawer-portal');
    setPortalRoot(root);
  }, []);

  // Handle entrance/exit animations with requestAnimationFrame
  useEffect(() => {
    if (isOpen) {
      // Double rAF ensures browser paint happens before animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation before calling closeDrawer (500ms)
    setTimeout(() => {
      closeDrawer();
    }, 500);
  }, [closeDrawer]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Don't render if no config or no portal root
  if (!config || !portalRoot) return null;

  return createPortal(
    <>
      {/* Backdrop overlay */}
      <div
        onClick={handleClose}
        className={`vr-sidedrawer-backdrop ${isVisible ? 'vr-sidedrawer-backdrop--visible' : 'vr-sidedrawer-backdrop--hidden'}`}
      />

      {/* Drawer panel */}
      <div
        className={`vr-sidedrawer-panel ${isVisible ? 'vr-sidedrawer-panel--visible' : 'vr-sidedrawer-panel--hidden'}`}
      >
        {/* Header */}
        <div className="vr-sidedrawer-header">
          <div>
            {config.title && (
              <T.title size="md" weight="semibold" className="vr-sidedrawer-header-title">
                {config.title}
              </T.title>
            )}
            {config.subtitle && (
              <T.body size="sm" className="vr-sidedrawer-header-subtitle">
                {config.subtitle}
              </T.body>
            )}
          </div>
          <button
            onClick={handleClose}
            className="vr-sidedrawer-close-button"
            aria-label="Close drawer"
          >
            <Icon variant="arrow-right-from-line" size="md" strokeWidth={1.5} />
          </button>
        </div>

        {/* Body - scrollable content */}
        <div className="vr-sidedrawer-body">
          {config.content}
        </div>
      </div>
    </>,
    portalRoot
  );
}
