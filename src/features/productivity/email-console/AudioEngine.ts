/**
 * 🔊 AUDIO ENGINE - Simple HTMLAudioElement Implementation
 *
 * Uses native browser Audio API for sound effects.
 * Simpler than Web Audio API, works for UI sounds.
 */

type SoundName = 'trash' | 'send' | 'receive' | 'mark' | 'connected' | 'confetti';

// Sound file paths
const SOUND_PATHS: Record<SoundName, string> = {
  trash: '/audio/email-trash.mp3',
  send: '/audio/email-send.mp3',
  receive: '/audio/email-receive.mp3',
  mark: '/audio/email-mark.wav',
  connected: '/audio/email-connected.mp3',
  confetti: '/audio/fx-confetti.mp3',
};

// Preference keys in localStorage (connected has no preference - always plays)
const PREF_KEYS: Partial<Record<SoundName, string>> = {
  trash: 'emailSoundTrash',
  send: 'emailSoundSend',
  receive: 'emailSoundReceive',
  mark: 'emailSoundMark',
};

class AudioEngine {
  private audioElements: Map<SoundName, HTMLAudioElement> = new Map();
  private isInitialized = false;
  private volume = 0.5;

  /**
   * Initialize audio elements (SSR-safe)
   */
  init(): void {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;

    // Create Audio elements for each sound (browser handles loading)
    for (const [name, path] of Object.entries(SOUND_PATHS) as [SoundName, string][]) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audio.volume = this.volume;
      this.audioElements.set(name, audio);
    }

    this.isInitialized = true;
  }

  /**
   * Prime the audio engine (required for autoplay policy)
   * Call on first user gesture
   */
  async prime(): Promise<void> {
    if (!this.isInitialized) this.init();
  }

  /**
   * Play a sound
   */
  play(name: SoundName): void {
    if (!this.isInitialized) this.init();
    if (!this.isEnabled(name)) return;

    const audio = this.audioElements.get(name);
    if (!audio) return;

    // Clone to allow overlapping sounds
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = this.volume;
    clone.play().catch(() => {});
  }

  /**
   * Check if sound is enabled via localStorage (defaults to true)
   */
  private isEnabled(name: SoundName): boolean {
    if (typeof window === 'undefined') return true;
    const key = PREF_KEYS[name];
    if (!key) return true; // No preference = always enabled
    const value = localStorage.getItem(key);
    return value === null || value === 'true';
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    for (const audio of this.audioElements.values()) {
      audio.volume = this.volume;
    }
  }

  /**
   * Check if engine is ready
   */
  get isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

// Initialize on module load
if (typeof window !== 'undefined') {
  audioEngine.init();
}
