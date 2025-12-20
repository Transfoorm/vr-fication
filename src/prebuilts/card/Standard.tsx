/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Standard Card                                      │
│  /src/components/prebuilts/card/standard/index.tsx                     │
│                                                                        │
│  Default card. Generic content container. Flexible use.                │
│                                                                        │
│  Usage:                                                                │
│  import { CardVC } from '@/prebuilts/card';                │
│  <CardVC.standard title="Settings">                                   │
│    {content}                                                          │
│  </CardVC.standard>                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';
import { Icon, IconVariant, T } from '@/prebuilts';

export interface StandardCardProps {
  title?: ReactNode;
  subtitle?: string;
  icon?: IconVariant;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * StandardCard - General purpose content card
 *
 * Features:
 * - Optional title and subtitle
 * - Flexible content area
 * - Optional footer section
 * - Clean, minimal styling
 *
 * Perfect for:
 * - Generic content sections
 * - Form containers
 * - Information panels
 * - Settings groups
 * - Any custom content
 */
export default function StandardCard({
  title,
  subtitle,
  icon,
  children,
  footer,
  className = ''
}: StandardCardProps) {
  // Check if children has meaningful content
  const hasContent = children !== null && children !== undefined && children !== '';

  return (
    <div className={`vr-card vr-card-standard ${className}`}>
      {(title || subtitle) && (
        <div className="vr-card-standard-header">
          {title && (
            <T.title size="md" weight="semibold" className="vr-card-standard-title">
              {icon && <Icon variant={icon} size="md" />}
              {title}
            </T.title>
          )}
          {subtitle && (
            <T.body size="sm" color="secondary" className="vr-card-standard-subtitle">
              {subtitle}
            </T.body>
          )}
        </div>
      )}

      {hasContent && (
        <div className="vr-card-standard-content">
          {children}
        </div>
      )}

      {footer && (
        <div className="vr-card-standard-footer">
          {footer}
        </div>
      )}
    </div>
  );
}