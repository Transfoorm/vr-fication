'use client';

/**──────────────────────────────────────────────────────────────────────────┐
 │  ✈️ FLYING BUTTON (PHOENIX) - Animation Engine                           │
 │  /src/features/setup/flying-button/index.tsx                              │
 │                                                                            │
 │  The animated button that flies between SetupModal and Topbar.            │
 │  Uses phantom buttons as GPS beacons for precise positioning.             │
 │                                                                            │
 │  Creates the Houdini illusion - users see one button transforming         │
 │  across the screen, never knowing there are three separate instances.     │
 └────────────────────────────────────────────────────────────────────────────*/

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/vr/button';
import { skipFlow, reverseFlow, debug } from './config';

interface Position {
  x: number;
  y: number;
}

interface FlightPayload {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  targetX: number;
  targetY: number;
}

export default function FlyingButton() {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [width, setWidth] = useState<number>(0);
  const [isFlying, setIsFlying] = useState(false);
  const [isReverse, setIsReverse] = useState(false);

  // Wait for DOM to be ready
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Listen for show/hide events
  useEffect(() => {
    const handleShow = (event: Event) => {
      const customEvent = event as CustomEvent<FlightPayload>;
      if (customEvent.detail) {
        const { sourceX, sourceY, sourceWidth, targetX, targetY } = customEvent.detail;

        // Start at source position with source width
        setPosition({ x: sourceX, y: sourceY });
        setWidth(sourceWidth);
        setIsVisible(true);
        setIsFlying(false);
        setIsReverse(false); // Normal flow

        // Begin flight immediately
        requestAnimationFrame(() => {
          setIsFlying(true);
          setPosition({ x: targetX, y: targetY });
        });

        // Disappear after landing (flight complete)
        setTimeout(() => {
          setIsVisible(false);
          setIsFlying(false);
          // Signal topbar to show its button
          window.dispatchEvent(new CustomEvent('phoenixLanded'));
        }, skipFlow.flightDuration + skipFlow.landingBuffer);
      }
    };

    const handleReverseFlow = (event: Event) => {
      const customEvent = event as CustomEvent<{ sourceX: number; sourceY: number; sourceWidth: number }>;
      if (customEvent.detail) {
        const { sourceX, sourceY, sourceWidth } = customEvent.detail;

        // Prepare Phoenix at topbar position IMMEDIATELY
        const adjustedWidth = sourceWidth / 0.8; // Compensate for 80% scale
        setPosition({ x: sourceX, y: sourceY });
        setWidth(adjustedWidth);
        setIsReverse(true); // Reverse flow
        setIsFlying(false);

        // Make Phoenix visible immediately
        setIsVisible(true);

        // Wait for modal animation to complete before getting position and flying
        setTimeout(() => {
          const targetButton = document.querySelector('[data-setup-source]');
          if (!targetButton) {
            return;
          }

          // Get position AFTER modal has finished animating
          const targetRect = targetButton.getBoundingClientRect();

        // Start flight to modal
        requestAnimationFrame(() => {
          setIsFlying(true);
          setPosition({ x: targetRect.left, y: targetRect.top });
        });

        // Show modal button based on config timing
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('phoenixApproachingModal'));
        }, reverseFlow.setupButtonAppearDelay); // Use config value!

        // Disappear after landing back at modal
        setTimeout(() => {
          setIsVisible(false);
          setIsFlying(false);
          // Signal modal that Phoenix has fully landed
          window.dispatchEvent(new CustomEvent('phoenixReturnedToModal'));
        }, reverseFlow.flightDuration + reverseFlow.landingBuffer);
        }, reverseFlow.modalPositionDelay); // Wait for modal to reach position
      }
    };

    window.addEventListener('phoenixShow', handleShow);
    window.addEventListener('phoenixReverseFlow', handleReverseFlow);

    return () => {
      window.removeEventListener('phoenixShow', handleShow);
      window.removeEventListener('phoenixReverseFlow', handleReverseFlow);
    };
  }, []);

  if (!isMounted || !isVisible) return null;

  return createPortal(
    <div
      className={`ft-phoenix ${isVisible ? 'ft-phoenix--visible' : 'ft-phoenix--hidden'} ${isFlying ? 'ft-phoenix--flying' : ''} ${isReverse ? 'ft-phoenix--reverse' : ''}`}
       
      style={{
        '--phoenix-x': `${position.x}px`,
        '--phoenix-y': `${position.y}px`,
        '--phoenix-width': `${width}px`,
        '--phoenix-flight-duration': `${isReverse ? reverseFlow.flightDuration : skipFlow.flightDuration}ms`,
      } as React.CSSProperties}
    >
      <Button.fire
        icon={<Sparkles />}
        style={debug.enabled ? { background: debug.color } : undefined}
      >
        Complete my setup
      </Button.fire>
    </div>,
    document.body
  );
}
