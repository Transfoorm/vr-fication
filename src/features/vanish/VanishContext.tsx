/**──────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH DRAWER - Quarantined (WCCC ft-* Compliant)                 │
│  /src/vanish/Drawer.tsx                                                │
│                                                                        │
│  Safe FUSE mechanism for VANISH deletion protocol.                    │
│  QUARANTINED: Lives in /src/vanish (isolated from features).          │
│  Merged context + portal in single file.                              │
│  requestAnimationFrame for flicker-free animations.                   │
│  Single 300ms timing constant throughout.                             │
│  Dynamically imports Quarantine.tsx to isolate Clerk SDK.             │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import './vanish.css';

// ═══════════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════════

/**
 * Target configuration for VANISH drawer
 * Supports both single and batch deletion
 */
export interface VanishTarget {
  /** Single user ID (Convex _id) */
  target?: string;

  /** Multiple user IDs (batch deletion) */
  targets?: string[];
}

/**
 * Deletion result passed to completion callback
 */
export interface DeletionResult {
  success: boolean;
  successCount: number;
  failCount?: number;
  errors?: string[];
  deletedUsers?: Array<{ name: string; email: string }>;
}

/**
 * Drawer context state and actions
 */
interface VanishContextValue {
  /** Is drawer currently open? */
  isOpen: boolean;

  /** Current deletion target(s) */
  config: VanishTarget | null;

  /** Open drawer with target configuration */
  openDrawer: (config: VanishTarget, onComplete?: (result: DeletionResult) => void) => void;

  /** Close drawer and clear state */
  closeDrawer: () => void;

  /** Trigger completion callback with result */
  triggerComplete: (result: DeletionResult) => void;
}

// ═══════════════════════════════════════════════════════════════════
//  CONTEXT
// ═══════════════════════════════════════════════════════════════════

const VanishContext = createContext<VanishContextValue | undefined>(undefined);

export function VanishProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<VanishTarget | null>(null);
  const [onComplete, setOnComplete] = useState<((result: DeletionResult) => void) | null>(null);

  const openDrawer = useCallback((newConfig: VanishTarget, completionCallback?: (result: DeletionResult) => void) => {
    setConfig(newConfig);
    setOnComplete(() => completionCallback || null);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Clear config after animation completes (300ms)
    setTimeout(() => {
      setConfig(null);
      setOnComplete(null);
    }, 300);
  }, []);

  const triggerComplete = useCallback((result: DeletionResult) => {
    if (onComplete) {
      onComplete(result);
    }
  }, [onComplete]);

  return (
    <VanishContext.Provider
      value={{
        isOpen,
        config,
        openDrawer,
        closeDrawer,
        triggerComplete
      }}
    >
      {children}
    </VanishContext.Provider>
  );
}

export function useVanish() {
  const context = useContext(VanishContext);
  if (!context) {
    throw new Error('useVanish must be used within VanishProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════
//  PORTAL COMPONENT
// ═══════════════════════════════════════════════════════════════════

// Dynamically import VanishQuarantine to isolate Clerk SDK (code splitting)
const VanishQuarantine = dynamic(
  () => import('./VanishQuarantine').then(mod => ({ default: mod.VanishQuarantine })),
  { ssr: false }
);

export function VanishPortal() {
  const { isOpen, config } = useVanish();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Find portal root on mount
  useEffect(() => {
    const root = document.getElementById('vanish-drawer-portal');
    setPortalRoot(root);
  }, []);

  // Don't render if not open or no config or no portal root
  if (!isOpen || !config || !portalRoot) {
    return null;
  }

  // Render Quarantine component via React Portal
  // Quarantine manages its own animation state
  return createPortal(
    <VanishQuarantine />,
    portalRoot
  );
}
