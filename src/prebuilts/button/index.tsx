/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Button Component Registry                          │
│  /src/prebuilts/button/index.tsx                                       │
│                                                                        │
│  Central dispatcher for all 9 button variants.                         │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Button } from '@/prebuilts/button';                          │
│                                                                        │
│  <Button.primary onClick={...}>Save</Button.primary>                   │
│  <Button.secondary onClick={...}>Cancel</Button.secondary>             │
│  <Button.ghost onClick={...}>More</Button.ghost>                       │
│  <Button.danger onClick={...}>Delete</Button.danger>                   │
│  <Button.link onClick={...}>Learn More</Button.link>                   │
│  <Button.fire onClick={...}>Complete Setup</Button.fire>               │
│  <Button.outline onClick={...}>Skip</Button.outline>                   │
│  <Button.blue onClick={...}>Info</Button.blue>                         │
│  <Button.green onClick={...}>Confirm</Button.green>                    │
└────────────────────────────────────────────────────────────────────────┘ */


import PrimaryButton from './Primary';
import SecondaryButton from './Secondary';
import GhostButton from './Ghost';
import DangerButton from './Danger';
import LinkButton from './Link';
import FireButton from './Fire';
import OutlineButton from './Outline';
import BlueButton from './Blue';
import GreenButton from './Green';

/**
 * Button Registry - All button variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused buttons aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 * ✅ AI/CLI friendly: "Give me a primary button" → Button.primary
 */
export const Button = {
  primary: PrimaryButton,
  secondary: SecondaryButton,
  ghost: GhostButton,
  danger: DangerButton,
  link: LinkButton,
  fire: FireButton,
  outline: OutlineButton,
  blue: BlueButton,
  green: GreenButton,
} as const;

// Export individual components for direct import if needed
export {
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  DangerButton,
  LinkButton,
  FireButton,
  OutlineButton,
  BlueButton,
  GreenButton
};

// Type exports for TypeScript users
export type { PrimaryButtonProps } from './Primary';
export type { SecondaryButtonProps } from './Secondary';
export type { GhostButtonProps } from './Ghost';
export type { DangerButtonProps } from './Danger';
export type { LinkButtonProps } from './Link';
export type { FireButtonProps } from './Fire';
export type { OutlineButtonProps } from './Outline';
export type { BlueButtonProps } from './Blue';
export type { GreenButtonProps } from './Green';

// Helper type for variant names
export type ButtonVariant = keyof typeof Button;
