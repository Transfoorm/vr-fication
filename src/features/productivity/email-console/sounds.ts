/**
 * Email Sound Effects - PRISM/WARP Sovereign Audio
 *
 * Provides audio feedback for email actions:
 * - trash: Delete, delete forever, empty folder
 * - send: Sending email
 * - receive: New email arrives
 * - mark: Mark as read/unread
 *
 * ARCHITECTURE:
 * Routes all playback through AudioEngine singleton.
 * Zero-latency after prime() is called on first user gesture.
 *
 * All sounds respect user preferences stored in localStorage.
 */

import { audioEngine } from './AudioEngine';

/**
 * Sound effects API
 * All methods route through sovereign AudioEngine
 */
export const sounds = {
  trash: () => audioEngine.play('trash'),
  send: () => audioEngine.play('send'),
  receive: () => audioEngine.play('receive'),
  mark: () => audioEngine.play('mark'),
  connected: () => audioEngine.play('connected'), // Celebration when clicking "Let's Go!"
  confetti: () => audioEngine.play('confetti'), // Confetti burst when modal appears

  /**
   * Prime the audio engine (call on first user gesture)
   * WARP: This is THE moment we pay the cold-start cost
   */
  prime: () => audioEngine.prime(),

  /**
   * Check if engine is ready for instant playback
   */
  get isReady() {
    return audioEngine.isReady;
  },
};
