'use client';

import { useEffect } from 'react';
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
  // Fire celebration effects when modal appears
  useEffect(() => {
    // Play celebration sound
    sounds.connected();

    // Fire confetti
    fireConfetti();
  }, []);

  return (
    <>
      <div className="ft-email__modal-backdrop ft-email__modal-backdrop--celebration" onClick={onDismiss} />
      <div className="ft-email__modal ft-email__modal--celebration">
        <div className="ft-email__celebration-icon">
          <Mail size={48} strokeWidth={1.5} />
          <Sparkles className="ft-email__celebration-sparkle" size={24} />
        </div>
        <T.h3 className="ft-email__modal-title">You&apos;re All Set!</T.h3>
        <div className="ft-email__modal-message">
          <T.body><strong>{emailAddress}</strong> is now connected.</T.body>
          <T.body>Your emails are ready and waiting.</T.body>
        </div>
        <Button.fire onClick={onDismiss} icon={<Sparkles size={16} />}>
          <T.body>Let&apos;s Go!</T.body>
        </Button.fire>
      </div>
    </>
  );
}
