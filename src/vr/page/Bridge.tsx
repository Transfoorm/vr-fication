/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Bridge Page (Universal Feed Grid)                 │
│  /src/vr/page/bridge/index.tsx                      │
│                                                                        │
│  Universal content feed layout with auto-grid sections.                │
│  Zero-decision feed structure for news, announcements, learning.       │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/vr/page';                  │
│  <Page.bridge                                                         │
│    title="Fleet Bridge"                                               │
│    sections={[                                                        │
│      {                                                                │
│        title: "Platform Updates",                                     │
│        items: [                                                       │
│          { title: "...", description: "...", timestamp: "..." }       │
│        ]                                                              │
│      }                                                                │
│    ]}                                                                 │
│  />                                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { Card } from '@/vr/card';
import { T } from '@/vr';

export interface BridgeFeedItem {
  title: string;
  description: string;
  timestamp: string;
}

export interface BridgeSection {
  title: string;
  items: BridgeFeedItem[];
}

export interface BridgePageProps {
  title: string;
  subtitle?: string;
  sections: BridgeSection[];
  className?: string;
}

/**
 * BridgePage - Universal feed grid layout
 *
 * Features:
 * - Auto-responsive grid for feed sections
 * - Consistent card-based layout
 * - Zero horizontal padding (inherits from PageArch)
 * - Type-safe feed data structure
 *
 * Perfect for:
 * - News feeds
 * - Announcement sections
 * - Learning center content
 * - Universal shared content
 */
export default function BridgePage({
  title,
  subtitle,
  sections,
  className = ''
}: BridgePageProps) {
  return (
    <section className={`vr-page vr-page-bridge ${className}`}>
      <div className="vr-page-bridge-header">
        <T.title size="xl" weight="bold" className="vr-page-bridge-title">
          {title}
        </T.title>
        {subtitle && (
          <T.body size="md" className="vr-page-bridge-subtitle">
            {subtitle}
          </T.body>
        )}
      </div>

      <div className="vr-page-bridge-grid">
        {sections.map((section, index) => (
          <Card.standard
            key={index}
            title={section.title}
          >
            <div className="vr-page-bridge-feed">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="vr-page-bridge-item">
                  <T.body size="md" weight="semibold">
                    {item.title}
                  </T.body>
                  <T.body size="sm">
                    {item.description}
                  </T.body>
                  <T.caption size="xs" className="vr-page-bridge-timestamp">
                    {item.timestamp}
                  </T.caption>
                </div>
              ))}
            </div>
          </Card.standard>
        ))}
      </div>
    </section>
  );
}
