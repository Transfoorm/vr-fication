/**
 * Email Sound Effects
 *
 * Provides audio feedback for email actions:
 * - trash: Delete, delete forever, empty folder
 * - send: Sending email (future)
 * - receive: New email arrives
 */

const playSound = (src: string) => {
  if (typeof window === 'undefined') return;
  const audio = new Audio(src);
  audio.volume = 0.5;
  audio.play().catch(() => {}); // Ignore autoplay restrictions
};

export const sounds = {
  trash: () => playSound('/audio/email-trash.mp3'),
  send: () => playSound('/audio/email-send.mp3'),
  receive: () => playSound('/audio/email-receive.mp3'),
};
