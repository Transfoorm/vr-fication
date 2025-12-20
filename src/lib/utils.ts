// Generic Utilities
// Core helper functions used throughout the application

/**
 * Combines class names, filtering out falsy values
 * @param classes - Class names to merge
 * @returns Merged className string
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
