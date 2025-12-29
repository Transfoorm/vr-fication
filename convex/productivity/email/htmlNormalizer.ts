/**─────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL HTML NORMALIZER - DISABLED (pass-through)                       │
│  /convex/productivity/email/htmlNormalizer.ts                            │
│                                                                           │
│  After testing, server-side HTML modification breaks more than it fixes. │
│  Emails have complex nested table structures where outer tables are      │
│  backgrounds and inner tables are content. Wrapping breaks this.         │
│                                                                           │
│  The reading pane's natural width provides the constraint.               │
│  CSS handles basic overflow protection.                                  │
│                                                                           │
│  This file now passes HTML through unchanged.                            │
└───────────────────────────────────────────────────────────────────────────┘ */

/**
 * Pass-through normalizer - returns HTML unchanged.
 * Server-side modification was causing more problems than it solved.
 */
export function normalizeEmailHtml(html: string): string {
  // Pass through unchanged
  return html;
}

/**
 * Checks if content is HTML (vs plain text).
 */
export function isHtmlContent(content: string, contentType: string): boolean {
  if (contentType.toLowerCase().includes('html')) {
    return true;
  }
  return /<[a-z][\s\S]*>/i.test(content);
}
