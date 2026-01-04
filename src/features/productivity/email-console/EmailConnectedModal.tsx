'use client';

import { useRef, useCallback } from 'react';
import { Mail, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button, T } from '@/vr';
import { sounds } from './sounds';

interface EmailConnectedModalProps {
  emailAddress: string;
  onDismiss: () => void;
}

/**
 * Fire confetti with brand colors (orange/red fire theme)
 */
function fireConfetti() {
  // First burst - center
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ec540e', '#d6361f', '#ff9465', '#ffec4d', '#ffffff'],
  });

  // Second burst - left side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#ec540e', '#d6361f', '#ff9465', '#ffec4d', '#ffffff'],
    });
  }, 150);

  // Third burst - right side
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#ec540e', '#d6361f', '#ff9465', '#ffec4d', '#ffffff'],
    });
  }, 300);
}

/**
 * Celebration modal shown when email account completes initial sync
 *
 * This modal gives the user positive feedback that their email is
 * fully connected and ready to use. It only shows ONCE per account.
 */
export function EmailConnectedModal({ emailAddress, onDismiss }: EmailConnectedModalProps) {
  // Track if confetti has fired (only once per modal)
  const hasFiredRef = useRef(false);

  // Fire confetti + sound TOGETHER on first mouse interaction
  // Mouse enter = user gesture = audio is allowed = perfect sync
  const triggerCelebration = useCallback(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    fireConfetti();
    sounds.confetti();
  }, []);

  // Handle dismiss with connected sound (user gesture guarantees playback)
  const handleDismiss = () => {
    sounds.connected();
    onDismiss();
  };

  return (
    <>
      <div className="ft-email__modal-backdrop ft-email__modal-backdrop--celebration" onClick={handleDismiss} />
      <div className="ft-email__modal ft-email__modal--celebration" onMouseEnter={triggerCelebration}>
        <div className="ft-email__celebration-icon">
          <Mail size={48} strokeWidth={1.5} />
          <Sparkles className="ft-email__celebration-sparkle" size={24} />
        </div>
        <T.h3 className="ft-email__modal-title">You&apos;re All Set!</T.h3>
        <div className="ft-email__modal-message">
          <T.body><strong className="ft-email__celebration-email">{emailAddress}</strong> is now connected and in sync.</T.body>
          <T.body>Your emails are ready and waiting.</T.body>
        </div>
        <Button.fire onClick={handleDismiss} icon={<Sparkles size={16} />}>
          Let&apos;s Go!
        </Button.fire>
      </div>
    </>
  );
}
