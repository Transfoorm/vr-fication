// FUSE Constants - Core configuration values
// Following FUSE Doctrine: 2BA + Triple-T Ready

/**
 * Theme default values
 */
export const THEME_DEFAULTS = {
  DEFAULT_THEME: 'transtheme' as const,
  DEFAULT_MODE: 'light' as const,
};

/**
 * LocalStorage keys for client-side persistence
 */
export const STORAGE_KEYS = {
  THEME_MODE: 'fuse_theme_mode',
  THEME_NAME: 'fuse_theme_name',
  USER_PREFERENCES: 'fuse_user_prefs',
};

/**
 * DOM attributes for CSS theming
 */
export const DOM_ATTRIBUTES = {
  THEME_MODE: 'data-theme-mode',
  THEME_NAME: 'data-theme',
};

/**
 * Miror AI Avatar Options (9 avatars: gender × skin tone)
 * f = female, m = male, i = inclusive
 * 1 = caucasian, 2 = dark skin, 3 = oriental
 *
 * Single source of truth - used by:
 * - PRISM for image preloading
 * - MirorAiTabFeature for avatar selection UI
 * - AISidebar for avatar display
 */
export const AVATAR_OPTIONS = [
  'f-1', 'f-2', 'f-3',  // Female: caucasian, dark, oriental
  'm-1', 'm-2', 'm-3',  // Male: caucasian, dark, oriental
  'i-1', 'i-2', 'i-3',  // Inclusive: caucasian, dark, oriental
] as const;

export type AvatarOption = typeof AVATAR_OPTIONS[number];

/**
 * Miror AI default values for new users
 * Enchantment timing options: 'subtle', 'magical', 'playful'
 */
export const MIROR_DEFAULTS = {
  DEFAULT_AVATAR: 'f-1' as AvatarOption,       // Female caucasian
  DEFAULT_ENCHANTMENT: 'playful' as const,     // Options: 'subtle' | 'magical' | 'playful'
  DEFAULT_ENCHANTMENT_ENABLED: true,
};
