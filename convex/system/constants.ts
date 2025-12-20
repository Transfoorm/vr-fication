/**
 * Convex Server Constants
 * Shared constants for database operations
 *
 * NOTE: Database stores boolean (false = light, true = dark)
 * Client uses strings ('light', 'dark')
 */

export const THEME_DEFAULTS = {
  DEFAULT_THEME: 'transtheme' as const,
  DEFAULT_MODE: false as const, // false = light mode in database
  DEFAULT_MODE_STRING: 'light' as const, // Equivalent string for client compatibility
  AVAILABLE_THEMES: ['transtheme'] as const,
  AVAILABLE_MODES: [false, true] as const, // Database boolean values
  AVAILABLE_MODES_STRINGS: ['light', 'dark'] as const, // Client string values
} as const;

/**
 * FUSE Helper Functions - Convert between client and server theme formats
 */
export const ThemeConverter = {
  // Convert client string to database boolean
  stringToBoolean: (mode: 'light' | 'dark'): boolean => mode === 'dark',

  // Convert database boolean to client string
  booleanToString: (mode: boolean): 'light' | 'dark' => mode ? 'dark' : 'light',

  // Validate theme name
  isValidTheme: (theme: string): theme is typeof THEME_DEFAULTS.AVAILABLE_THEMES[number] =>
    (THEME_DEFAULTS.AVAILABLE_THEMES as readonly string[]).includes(theme),

  // Validate theme mode string
  isValidModeString: (mode: string): mode is 'light' | 'dark' =>
    (THEME_DEFAULTS.AVAILABLE_MODES_STRINGS as readonly string[]).includes(mode)
} as const;
