/**──────────────────────────────────────────────────────────────────────┐
│  📐 FT GUIDE TAB FEATURE                                              │
│  /src/features/admin/showcase-page/_tabs/FtGuide.tsx                 │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  Documents architectural patterns for building features:              │
│  - _tabs pattern (TTT-compliant tab organization)                     │
│  - Feature structure guidelines                                       │
│  - Code examples and comparisons                                      │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../showcase-page.css';
import { Card, Stack, T } from '@/vr';

export function FtGuideTab() {
  return (
    <Stack>
      {/* _tabs Pattern Overview */}
      <Card.standard
        title="The _tabs Pattern"
        subtitle="TTT-compliant tab organization for features"
      >
        <Stack>
          <T.body size="md">
            When a feature needs multiple tab views, use the <strong>_tabs subdirectory pattern</strong>.
            This is simpler, clearer, and more TTT-compliant than folder-based patterns.
          </T.body>

          <div>
            <T.caption color="secondary" size="sm">RECOMMENDED STRUCTURE:</T.caption>
            <pre className="ft-patterns__code-block">
{`feature-name/
├── index.tsx              ← Feature (imports Tabs.panels VR)
├── feature-name.css       ← Shared styles
└── _tabs/
    ├── TabOne.tsx         ← Tab component
    ├── TabTwo.tsx
    └── tab-styles.css     ← Optional tab-specific CSS`}
            </pre>
          </div>

          <T.body size="md">
            <strong>Why this wins (TTT Compliance):</strong>
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md"><strong>Clarity:</strong> Tab files live next to the feature that uses them</T.body></li>
            <li><T.body size="md"><strong>Simplicity:</strong> No indirection through domain layer (1 layer, not 3!)</T.body></li>
            <li><T.body size="md"><strong>Consistency:</strong> Same pattern across users-page, user-drawer, etc.</T.body></li>
            <li><T.body size="md"><strong>Architecture:</strong> Feature owns its tabs, not scattered across domain</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* Real Example: users-page */}
      <Card.standard
        title="Real Example: users-page"
        subtitle="How the _tabs pattern looks in production code"
      >
        <Stack>
          <T.caption color="secondary" size="sm">DIRECTORY STRUCTURE:</T.caption>
          <pre className="ft-patterns__code-block">
{`src/features/admin/users-page/
├── index.tsx                    ← Renders Tabs.panels
└── _tabs/
    ├── ActiveUsersTab.tsx       ← Active users table
    ├── DeletedUsersTab.tsx      ← Deletion logs table
    ├── InvitesTab.tsx          ← Invite management
    ├── StatusTab.tsx           ← Status monitoring
    └── invites-tab.css         ← Tab-specific styles`}
          </pre>

          <T.caption color="secondary" size="sm">FEATURE INDEX.TSX:</T.caption>
          <pre className="ft-patterns__code-block">
{`import { Tabs, Stack } from '@/vr';
import { ActiveUsersFeature } from './_tabs/ActiveUsersTab';
import { DeletedUsersFeature } from './_tabs/DeletedUsersTab';
import { InvitesFeature } from './_tabs/InvitesTab';
import { StatusTabFeature } from './_tabs/StatusTab';

export function UsersPageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users',
            content: <ActiveUsersFeature /> },
          { id: 'deleted', label: 'Deleted Users',
            content: <DeletedUsersFeature /> },
          { id: 'invite', label: 'Invite Users',
            content: <InvitesFeature /> },
          { id: 'status', label: 'Status',
            content: <StatusTabFeature /> }
        ]}
      />
    </Stack>
  );
}`}
          </pre>

          <T.caption color="secondary" size="sm">TAB COMPONENT (_tabs/ActiveUsersTab.tsx):</T.caption>
          <pre className="ft-patterns__code-block">
{`'use client';

import { Table, Search, Stack } from '@/vr';
import { useAdminData } from '@/hooks/useAdminData';

export function ActiveUsersFeature() {
  const { data } = useAdminData();

  return (
    <Stack>
      <Search.bar />
      <Table.sortable
        columns={columns}
        data={data.users}
      />
    </Stack>
  );
}`}
          </pre>
        </Stack>
      </Card.standard>

      {/* The Anti-Pattern (What NOT to do) */}
      <Card.standard
        title="The Anti-Pattern"
        subtitle="Folder-based pattern with unnecessary indirection (DON'T DO THIS)"
      >
        <Stack>
          <T.body size="md" color="tertiary">
            This is the old way - more complex, more files, more layers of indirection.
          </T.body>

          <T.caption color="secondary" size="sm">FOLDER PATTERN (3 LAYERS OF INDIRECTION):</T.caption>
          <pre className="ft-patterns__code-block ft-patterns__code-block--error">
{`src/features/admin/users-page/
├── index.tsx
├── active-users-tab/
│   └── index.tsx                    ← Tab feature
├── deleted-users-tab/
│   └── index.tsx                    ← Tab feature
└── invites-tab/
    ├── index.tsx                    ← Tab feature
    └── invites-tab.css

src/app/domains/admin/users/_tabs/
├── ActiveUsers.tsx                  ← Domain wrapper
├── DeletedUsers.tsx                 ← Domain wrapper
└── Invites.tsx                      ← Domain wrapper

// Domain wrapper just imports feature (WHY?!)
import { ActiveUsersFeature } from
  '@/features/admin/users-page/active-users-tab';

export default function ActiveUsers() {
  return <ActiveUsersFeature />;
  // ↑ This file exists ONLY to import. Pointless!
}`}
          </pre>

          <T.body size="md">
            <strong>Problems with folder pattern:</strong>
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md">3 layers instead of 1 (Feature → Domain tab → Feature tab)</T.body></li>
            <li><T.body size="md">Domain tab files exist ONLY to import (pointless indirection)</T.body></li>
            <li><T.body size="md">Harder to navigate (jump between domain and features directories)</T.body></li>
            <li><T.body size="md">More files to maintain with no architectural benefit</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* When to Use _tabs */}
      <Card.standard
        title="When to Use _tabs"
        subtitle="Decision guide for organizing tab components"
      >
        <Stack>
          <T.body size="md">
            <strong>Use the _tabs pattern when:</strong>
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md">Feature needs 2+ tab views</T.body></li>
            <li><T.body size="md">Tabs share the same domain/context</T.body></li>
            <li><T.body size="md">Tabs are closely related (user management, email views, etc.)</T.body></li>
          </ul>

          <T.body size="md">
            <strong>Examples in this codebase:</strong>
          </T.body>
          <ul className="ft-patterns__list-spaced">
            <li><T.body size="md"><code>users-page/_tabs/</code> - Active, Deleted, Invites, Status tabs</T.body></li>
            <li><T.body size="md"><code>user-drawer/_tabs/</code> - Profile, Email, Activity tabs</T.body></li>
            <li><T.body size="md"><code>showcase/_tabs/</code> - VR Guide, Typography, Buttons, etc.</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* Naming Conventions */}
      <Card.standard
        title="Naming Conventions"
        subtitle="How to name tab files and exported functions"
      >
        <Stack>
          <div>
            <T.body size="md" weight="semibold">Tab Files (PascalCase, descriptive):</T.body>
            <div className="ft-patterns__check-list">
              <T.body size="md" color="success">✅ <code>ActiveUsersTab.tsx</code></T.body>
              <T.body size="md" color="success">✅ <code>ProfileTab.tsx</code></T.body>
              <T.body size="md" color="success">✅ <code>EmailTab.tsx</code></T.body>
              <T.body size="md" color="tertiary">❌ <code>active.tsx</code> (not clear)</T.body>
              <T.body size="md" color="tertiary">❌ <code>tab1.tsx</code> (meaningless)</T.body>
            </div>
          </div>

          <div>
            <T.body size="md" weight="semibold">Exported Function (matches filename):</T.body>
            <pre className="ft-patterns__code-block">
{`// File: ActiveUsersTab.tsx
export function ActiveUsersTab() { ... }

// OR if it's a feature-level component:
// File: ActiveUsersTab.tsx
export function ActiveUsersFeature() { ... }`}
            </pre>
          </div>
        </Stack>
      </Card.standard>

      {/* Why the underscore prefix? */}
      <Card.standard
        title="Why _tabs?"
        subtitle="The meaning of the underscore prefix"
      >
        <Stack>
          <T.body size="md">
            The underscore prefix (<code>_tabs/</code>) signals:
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md"><strong>Private to feature:</strong> Not meant for direct import from outside</T.body></li>
            <li><T.body size="md"><strong>Organizational:</strong> Groups related tab components together</T.body></li>
            <li><T.body size="md"><strong>Convention:</strong> Matches Next.js app router patterns (<code>_components/</code>, <code>_utils/</code>)</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* The Decision Rule */}
      <Card.standard
        title="The Decision Rule"
        subtitle="Simple guideline for tab organization"
      >
        <Stack>
          <T.body size="lg" weight="semibold" className="ft-patterns__decision-box">
            &ldquo;Create a _tabs/ subdirectory and put tab components there.&rdquo;
          </T.body>

          <T.body size="md">
            Don&apos;t create separate feature folders for each tab.<br />
            Don&apos;t create domain wrapper files.<br />
            Just put the tabs in <code>_tabs/</code> and import them directly.
          </T.body>

          <T.body size="lg" weight="bold">
            Simple. Clear. TTT-compliant.
          </T.body>
        </Stack>
      </Card.standard>
    </Stack>
  );
}
