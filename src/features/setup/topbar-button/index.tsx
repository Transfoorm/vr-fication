'use client';

/**──────────────────────────────────────────────────────────────────────────┐
 │  🤖 VARIANT ROBOT - TopbarSetupButton                                     │
 │  /src/features/setup/topbar-button/index.tsx                               │
 │                                                                            │
 │  VR-Sovereign: Owns ALL button state, visibility, and click behavior.     │
 │  Topbar just renders <TopbarSetupButton /> - zero ceremony.               │
 │                                                                            │
 │  Handles:                                                                  │
 │  - Phantom button (GPS positioning for Phoenix)                           │
 │  - Real button visibility based on route + skip state                     │
 │  - phoenixLanded event listener                                           │
 │  - Reverse flow click handlers (same page + different page)               │
 │  - Fade in/out animations                                                 │
 └────────────────────────────────────────────────────────────────────────────*/

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/prebuilts/button';
import { useFuse } from '@/store/fuse';
import { useRankCheck } from '@/fuse/hydration/hooks/useRankCheck';
import {
  reverseFlow,
  navAwayFlow,
  navReturnFlow
} from '@/features/setup/flying-button/config';

export default function TopbarSetupButton() {
  // ─────────────────────────────────────────────────────────────────────
  // FUSE State
  // ─────────────────────────────────────────────────────────────────────
  const navigate = useFuse((s) => s.navigate);
  const route = useFuse((s) => s.sovereign.route);
  const user = useFuse((s) => s.user);
  const modalSkipped = useFuse((s) => s.modalSkipped);
  const flyingButtonVisible = useFuse((s) => s.phoenixButtonVisible);
  const setFlyingButtonVisible = useFuse((s) => s.setPhoenixButtonVisible);

  const { isCaptain } = useRankCheck();

  // ─────────────────────────────────────────────────────────────────────
  // Local Animation State
  // ─────────────────────────────────────────────────────────────────────
  const [shouldFadeIn, setShouldFadeIn] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // ─────────────────────────────────────────────────────────────────────
  // Phoenix Landing Listener (skip flow complete)
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePhoenixLanded = () => {
      // Phoenix has landed - show the real button immediately
      setFlyingButtonVisible(true);
    };

    window.addEventListener('phoenixLanded', handlePhoenixLanded);

    return () => {
      window.removeEventListener('phoenixLanded', handlePhoenixLanded);
    };
  }, [setFlyingButtonVisible]);

  // ─────────────────────────────────────────────────────────────────────
  // Route-Based Visibility Logic
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const isOnHome = route === 'dashboard';
    const needsSetup = isCaptain() && user?.setupStatus === 'pending';
    const modalIsUnskipped = needsSetup && !modalSkipped;

    // GOLDEN RULE: If we're on home page with unskipped modal, hide topbar button
    // BUT NOT during reverse flow (isFadingOut means reverse is in progress)
    if (isOnHome && modalIsUnskipped && !isFadingOut) {
      if (flyingButtonVisible) {
        setIsFadingOut(true);
        setShouldFadeOut(true);
        setTimeout(() => {
          setFlyingButtonVisible(false);
          setIsFadingOut(false);
          setShouldFadeOut(false);
        }, navAwayFlow.topbarButtonFadeOutDuration);
      }
      return;
    }

    // Keep button visible when in skip mode (Phoenix has already landed)
    if (modalSkipped && needsSetup) {
      // Button should remain visible during skip mode
      return;
    }

    // If we're NOT on home and modal is unskipped
    if (!isOnHome && modalIsUnskipped) {
      // If button is already visible, don't re-trigger everything!
      if (flyingButtonVisible) {
        return; // Button is already there, keep it solid like skipped mode
      }

      // Show button with fade-in animation
      setTimeout(() => {
        setShouldFadeIn(true);
        setFlyingButtonVisible(true);
        // Remove fade-in class after animation completes
        setTimeout(() => setShouldFadeIn(false), 400);
      }, navAwayFlow.topbarButtonAppearDelay);
    }
  }, [route, modalSkipped, user, flyingButtonVisible, isCaptain, setFlyingButtonVisible, isFadingOut]);

  // ─────────────────────────────────────────────────────────────────────
  // Click Handler - Reverse Flow
  // ─────────────────────────────────────────────────────────────────────
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const isOnHomePage = route === 'dashboard';

    if (isOnHomePage) {
      // REVERSE FLOW: Bring modal back down (same page)
      const sourceButton = e.currentTarget as HTMLElement;

      if (sourceButton) {
        // Capture position IMMEDIATELY before anything changes
        const buttonRect = sourceButton.getBoundingClientRect();

        // Mark as fading to keep button visible (prevents useEffect from hiding instantly)
        setIsFadingOut(true);

        // Hide button after delay (blink disappear, no fade/motion)
        setTimeout(() => {
          setFlyingButtonVisible(false);
          setIsFadingOut(false);
        }, reverseFlow.topbarButtonFadeStartDelay);

        // Tell dashboard to bring modal back
        window.dispatchEvent(new CustomEvent('bringModalBack'));

        // Fire Phoenix event after the ONE takeoff delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('phoenixReverseFlow', {
            detail: {
              sourceX: buttonRect.left,
              sourceY: buttonRect.top,
              sourceWidth: buttonRect.width
            }
          }));
        }, reverseFlow.phoenixTakeoffDelay);
      }
    } else {
      // NOT on homepage - navigate home and trigger reverse-like flow
      const sourceButton = e.currentTarget as HTMLElement;
      const buttonRect = sourceButton.getBoundingClientRect();

      // Set modalReturning BEFORE navigation so Dashboard reads it on mount
      const setModalReturning = useFuse.getState().setModalReturning;
      setModalReturning(true);

      // Reset modalSkipped BEFORE navigation so modal renders with page
      const setModalSkipped = useFuse.getState().setModalSkipped;
      setModalSkipped(false);

      // Navigate to home - modal will render with button hidden (modalReturning)
      navigate('dashboard');

      // Mark fading out to protect from useEffect
      setIsFadingOut(true);

      // Hide topbar button at configured delay
      setTimeout(() => {
        setFlyingButtonVisible(false);
        setIsFadingOut(false);
      }, reverseFlow.topbarButtonFadeStartDelay);

      // Dispatch bringModalBack after small delay for Dashboard to mount
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('bringModalBack'));
      }, navReturnFlow.bringModalBackDelay);

      // Fire Phoenix after modal has animated into position
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('phoenixReverseFlow', {
          detail: {
            sourceX: buttonRect.left,
            sourceY: buttonRect.top,
            sourceWidth: buttonRect.width
          }
        }));
      }, reverseFlow.phoenixTakeoffDelay);
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render Guards
  // ─────────────────────────────────────────────────────────────────────

  // Don't render anything if setup is complete
  if (user?.setupStatus !== 'pending') {
    return null;
  }

  // Determine if real button should show
  const showRealButton = (modalSkipped || isFadingOut || route !== 'dashboard') && flyingButtonVisible;

  return (
    <>
      {/* Phantom button for flying button positioning (GPS beacon) */}
      <Button.fire
        data-setup-target
        className={`whitespace-nowrap ly-topbar-phantom-button ${flyingButtonVisible ? 'ly-topbar-phantom-button--absolute' : 'ly-topbar-phantom-button--relative'}`}
        icon={<Sparkles />}
      >
        Complete my setup
      </Button.fire>

      {/* Real button - visible when skipped, fading out, OR navigated away from unskipped modal */}
      {showRealButton && (
        <Button.fire
          className={`whitespace-nowrap animate-pulse-slow ly-topbar-setup-button ${shouldFadeIn ? 'ly-topbar-setup-button--fade-in' : ''} ${shouldFadeOut ? 'ly-topbar-setup-button--fade-out' : ''}`}
          icon={<Sparkles />}
          onMouseDown={handleClick}
        >
          Complete my setup
        </Button.fire>
      )}
    </>
  );
}
