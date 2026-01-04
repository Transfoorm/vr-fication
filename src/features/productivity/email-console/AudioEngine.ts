/**
 * 🔊 AUDIO ENGINE - Pooled HTMLAudioElement Implementation
 *
 * Uses pre-loaded audio element pools for instant playback.
 * No clone-on-play delays - elements are ready to fire.
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

// Pool size per sound (allows overlapping plays)
const POOL_SIZE = 3;

class AudioEngine {
  private audioPools: Map<SoundName, HTMLAudioElement[]> = new Map();
  private poolIndexes: Map<SoundName, number> = new Map();
  private isInitialized = false;
  private isPrimed = false;
  private volume = 0.5;

  /**
   * Initialize audio element pools (SSR-safe)
   */
  init(): void {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;

    // Create pool of Audio elements for each sound
    for (const [name, path] of Object.entries(SOUND_PATHS) as [SoundName, string][]) {
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < POOL_SIZE; i++) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        audio.volume = this.volume;
        pool.push(audio);
      }
      this.audioPools.set(name, pool);
      this.poolIndexes.set(name, 0);
    }

    this.isInitialized = true;
  }

  /**
   * Prime the audio engine - load all sounds into memory
   * Call early for instant playback (PRISM)
   */
  async prime(): Promise<void> {
    if (!this.isInitialized) this.init();
    if (this.isPrimed) return;

    // Force load all audio elements and wait for them to be ready
    const loadPromises: Promise<void>[] = [];

    for (const pool of this.audioPools.values()) {
      for (const audio of pool) {
        loadPromises.push(
          new Promise<void>((resolve) => {
            if (audio.readyState >= 4) {
              resolve();
            } else {
              audio.addEventListener('canplaythrough', () => resolve(), { once: true });
              audio.load();
            }
          })
        );
      }
    }

    await Promise.all(loadPromises);
    this.isPrimed = true;
  }

  /**
   * Play a sound - uses pooled elements for instant playback
   */
  play(name: SoundName): void {
    if (!this.isInitialized) this.init();
    if (!this.isEnabled(name)) return;

    const pool = this.audioPools.get(name);
    if (!pool || pool.length === 0) return;

    // Get next audio element from pool (round-robin)
    const index = this.poolIndexes.get(name) ?? 0;
    const audio = pool[index];
    this.poolIndexes.set(name, (index + 1) % pool.length);

    // Reset and play (instant - already loaded)
    audio.currentTime = 0;
    audio.volume = this.volume;
    audio.play().catch(() => {});
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
    for (const pool of this.audioPools.values()) {
      for (const audio of pool) {
        audio.volume = this.volume;
      }
    }
  }

  /**
   * Check if engine is primed and ready
   */
  get isReady(): boolean {
    return this.isPrimed;
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();

// Initialize on module load
if (typeof window !== 'undefined') {
  audioEngine.init();
}
