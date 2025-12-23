/**──────────────────────────────────────────────────────────────────────┐
│  📐 FT GUIDE TAB FEATURE                                              │
│  /src/features/admin/showcase-page/_tabs/FtGuideTab.tsx               │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  Documents architectural patterns for building features:              │
│  - Folder naming conventions                                          │
│  - _tabs pattern (TTT-compliant tab organization)                     │
│  - CSS file naming rules                                              │
│  - Code examples and comparisons                                      │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../showcase-page.css';
import { Card, Stack, T } from '@/vr';

export function FtGuideTab() {
  return (
    <Stack>
      {/* Folder Naming Convention */}
      <Card.standard
        title="Folder Naming Convention"
        subtitle="How to name feature folders"
      >
        <Stack>
          <T.body size="md">
            Feature folders use <strong>kebab-case</strong> with a <strong>type suffix</strong> describing what they are.
          </T.body>

          <div>
            <T.caption color="secondary" size="sm">NAMING PATTERN:</T.caption>
            <pre className="ft-patterns__code-block">
{`feature-name-type/
       │         │
       │         └── -page, -drawer, -modal, etc.
       │
       └── descriptive name in kebab-case`}
            </pre>
          </div>

          <div>
            <T.body size="md" weight="semibold">Examples:</T.body>
            <div className="ft-patterns__check-list">
              <T.body size="md" color="success">users-page/</T.body>
              <T.body size="md" color="success">user-drawer/</T.body>
              <T.body size="md" color="success">showcase-page/</T.body>
              <T.body size="md" color="success">account-page/</T.body>
              <T.body size="md" color="success">preferences-page/</T.body>
              <T.body size="md" color="tertiary">account/ (missing type suffix)</T.body>
              <T.body size="md" color="tertiary">UsersPage/ (wrong case)</T.body>
            </div>
          </div>
        </Stack>
      </Card.standard>

      {/* The Feature Structure */}
      <Card.standard
        title="The Feature Structure"
        subtitle="Rock-solid, replicable pattern for all features"
      >
        <Stack>
          <T.body size="md">
            Every feature follows this exact structure. No exceptions.
          </T.body>

          <div>
            <T.caption color="secondary" size="sm">THE PATTERN:</T.caption>
            <pre className="ft-patterns__code-block">
{`feature-name-type/
├── index.tsx              ← Main component (owns Tabs.panels if tabbed)
├── feature-name-type.css  ← CSS matches folder name EXACTLY
└── _tabs/                 ← Tab components (if needed)
    ├── SomethingTab.tsx
    ├── AnotherTab.tsx
    └── ...`}
            </pre>
          </div>

          <T.body size="md">
            <strong>Critical rules:</strong>
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md"><strong>CSS filename = folder name:</strong> <code>users-page/users-page.css</code></T.body></li>
            <li><T.body size="md"><strong>One CSS file per feature:</strong> Lives at root, not inside _tabs/</T.body></li>
            <li><T.body size="md"><strong>Tabs import parent CSS:</strong> <code>import &apos;../feature-name-type.css&apos;</code></T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* Real Example: users-page */}
      <Card.standard
        title="Real Example: users-page"
        subtitle="How the pattern looks in production code"
      >
        <Stack>
          <T.caption color="secondary" size="sm">DIRECTORY STRUCTURE:</T.caption>
          <pre className="ft-patterns__code-block">
{`src/features/admin/users-page/
├── index.tsx                    ← Renders Tabs.panels
├── users-page.css               ← ALL styles for this feature
└── _tabs/
    ├── ActiveUsersTab.tsx       ← Active users table
    ├── DeletedUsersTab.tsx      ← Deletion logs table
    ├── InvitesTab.tsx           ← Invite management
    └── StatusTab.tsx            ← Status monitoring`}
          </pre>

          <T.caption color="secondary" size="sm">FEATURE INDEX.TSX:</T.caption>
          <pre className="ft-patterns__code-block">
{`import './users-page.css';
import { Tabs, Stack } from '@/vr';
import { ActiveUsersTab } from './_tabs/ActiveUsersTab';
import { DeletedUsersTab } from './_tabs/DeletedUsersTab';
import { InvitesTab } from './_tabs/InvitesTab';
import { StatusTab } from './_tabs/StatusTab';

export function UsersPageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users',
            content: <ActiveUsersTab /> },
          { id: 'deleted', label: 'Deleted Users',
            content: <DeletedUsersTab /> },
          { id: 'invite', label: 'Invite Users',
            content: <InvitesTab /> },
          { id: 'status', label: 'Status',
            content: <StatusTab /> }
        ]}
      />
    </Stack>
  );
}`}
          </pre>

          <T.caption color="secondary" size="sm">TAB COMPONENT (_tabs/InvitesTab.tsx):</T.caption>
          <pre className="ft-patterns__code-block">
{`'use client';

import '../users-page.css';  // ← Import parent CSS
import { Field, Card, Stack } from '@/vr';

export function InvitesTab() {
  return (
    <Stack>
      <Card.standard title="Invite Users">
        {/* Tab content */}
      </Card.standard>
    </Stack>
  );
}`}
          </pre>
        </Stack>
      </Card.standard>

      {/* CSS Naming Rules */}
      <Card.standard
        title="CSS Naming Rules"
        subtitle="One file, matching name, at root level"
      >
        <Stack>
          <div>
            <T.body size="md" weight="semibold">Correct:</T.body>
            <div className="ft-patterns__check-list">
              <T.body size="md" color="success">showcase-page/showcase-page.css</T.body>
              <T.body size="md" color="success">user-drawer/user-drawer.css</T.body>
              <T.body size="md" color="success">users-page/users-page.css</T.body>
              <T.body size="md" color="success">account-page/account-page.css</T.body>
            </div>
          </div>

          <div>
            <T.body size="md" weight="semibold">Wrong:</T.body>
            <div className="ft-patterns__check-list">
              <T.body size="md" color="tertiary">users-page/_tabs/invites-tab.css (inside _tabs/)</T.body>
              <T.body size="md" color="tertiary">account-page/account.css (does not match folder)</T.body>
              <T.body size="md" color="tertiary">users-page/styles.css (generic name)</T.body>
            </div>
          </div>

          <T.body size="md">
            <strong>Why one CSS file?</strong> All tabs in a feature share the same <code>ft-featurename__*</code> class namespace.
            Splitting CSS across files creates confusion about where styles live.
          </T.body>
        </Stack>
      </Card.standard>

      {/* The Anti-Pattern (What NOT to do) */}
      <Card.standard
        title="The Anti-Pattern"
        subtitle="What NOT to do (folder-based tabs, CSS in wrong places)"
      >
        <Stack>
          <T.body size="md" color="tertiary">
            These patterns are forbidden. They create unnecessary complexity.
          </T.body>

          <T.caption color="secondary" size="sm">FOLDER PATTERN (DO NOT DO THIS):</T.caption>
          <pre className="ft-patterns__code-block ft-patterns__code-block--error">
{`src/features/admin/users-page/
├── index.tsx
├── active-users-tab/
│   └── index.tsx          ← Subfolder per tab (WRONG)
├── deleted-users-tab/
│   └── index.tsx
└── invites-tab/
    ├── index.tsx
    └── invites-tab.css    ← CSS inside tab folder (WRONG)`}
          </pre>

          <T.body size="md">
            <strong>Problems:</strong>
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md">Subfolders per tab = unnecessary nesting</T.body></li>
            <li><T.body size="md">CSS scattered across folders = hard to find styles</T.body></li>
            <li><T.body size="md">Breaks the simple flat _tabs/ pattern</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* Tab File Naming */}
      <Card.standard
        title="Tab File Naming"
        subtitle="PascalCase with Tab suffix"
      >
        <Stack>
          <div>
            <T.body size="md" weight="semibold">Tab Files:</T.body>
            <div className="ft-patterns__check-list">
              <T.body size="md" color="success">ActiveUsersTab.tsx</T.body>
              <T.body size="md" color="success">ProfileTab.tsx</T.body>
              <T.body size="md" color="success">EmailTab.tsx</T.body>
              <T.body size="md" color="success">MirorAiTab.tsx</T.body>
              <T.body size="md" color="tertiary">active.tsx (not descriptive)</T.body>
              <T.body size="md" color="tertiary">tab1.tsx (meaningless)</T.body>
            </div>
          </div>

          <div>
            <T.body size="md" weight="semibold">Exported function matches filename:</T.body>
            <pre className="ft-patterns__code-block">
{`// File: ProfileTab.tsx
export function ProfileTab() { ... }

// File: InvitesTab.tsx
export function InvitesTab() { ... }`}
            </pre>
          </div>
        </Stack>
      </Card.standard>

      {/* Why _tabs? */}
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

      {/* Domain Layer */}
      <Card.standard
        title="Domain Layer"
        subtitle="The page configuration layer"
      >
        <Stack>
          <T.body size="md">
            Domains are <strong>thin page shells</strong> that configure page-level concerns.
            They are NOT where features live - they just host features.
          </T.body>

          <T.caption color="secondary" size="sm">THE 4 CONCERNS OF A DOMAIN:</T.caption>
          <pre className="ft-patterns__code-block">
{`export default function Users() {
  useSetPageHeader('Users', 'Manage users');  // 1. Page title/subtitle
  usePageTiming('/admin/users');              // 2. Analytics tracking

  return (
    <Page.constrained>                        // 3. Layout mode
      <UsersPageFeature />                    // 4. Which feature
    </Page.constrained>
  );
}`}
          </pre>

          <T.body size="md" weight="semibold">A Domain answers 4 questions:</T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md">1. What is the page title? → <code>useSetPageHeader()</code></T.body></li>
            <li><T.body size="md">2. What route for analytics? → <code>usePageTiming()</code></T.body></li>
            <li><T.body size="md">3. Full width or constrained? → <code>&lt;Page.full&gt;</code> or <code>&lt;Page.constrained&gt;</code></T.body></li>
            <li><T.body size="md">4. Which feature? → <code>&lt;SomeFeature /&gt;</code></T.body></li>
          </ul>

          <T.body size="md" weight="semibold">A Domain does NOT:</T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md" color="tertiary">Wire FUSE</T.body></li>
            <li><T.body size="md" color="tertiary">Handle events</T.body></li>
            <li><T.body size="md" color="tertiary">Manage state</T.body></li>
            <li><T.body size="md" color="tertiary">Know about tabs</T.body></li>
            <li><T.body size="md" color="tertiary">Contain business logic</T.body></li>
            <li><T.body size="md" color="tertiary">Import VRs directly (only imports the feature)</T.body></li>
          </ul>
        </Stack>
      </Card.standard>

      {/* Domains vs Features */}
      <Card.standard
        title="Domains vs Features"
        subtitle="Understanding the relationship"
      >
        <Stack>
          <T.body size="md">
            The Sovereign Router switches between <strong>Domains</strong>.
            Each Domain renders one <strong>Feature</strong>.
          </T.body>

          <T.caption color="secondary" size="sm">THE RELATIONSHIP:</T.caption>
          <pre className="ft-patterns__code-block">
{`Router.tsx  →  Domain (Users.tsx)  →  Feature (UsersPageFeature)
     │              │                        │
     │              │                        └── Owns tabs, FUSE, logic
     │              │
     │              └── Page shell (header, layout, analytics)
     │
     └── Switches views based on sovereign.route`}
          </pre>

          <T.body size="md" weight="semibold">Why this separation?</T.body>
          <T.body size="md">
            Features should be <strong>reusable</strong> and <strong>context-agnostic</strong>.
            A feature does not know (or care) about:
          </T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md">What page title wraps it</T.body></li>
            <li><T.body size="md">What route it lives on</T.body></li>
            <li><T.body size="md">Whether layout is full or constrained</T.body></li>
          </ul>
          <T.body size="md">
            This makes features portable. The same feature could theoretically
            be rendered in different domains with different page titles.
          </T.body>
        </Stack>
      </Card.standard>

      {/* Domain Structure */}
      <Card.standard
        title="Domain Structure"
        subtitle="Flat files only - no subfolders"
      >
        <Stack>
          <T.caption color="secondary" size="sm">CORRECT DOMAIN STRUCTURE:</T.caption>
          <pre className="ft-patterns__code-block">
{`src/app/domains/
├── Dashboard.tsx
├── admin/
│   ├── Users.tsx           ← Flat file
│   ├── Plans.tsx           ← Flat file
│   └── Showcase.tsx        ← Flat file
├── system/
│   ├── Database.tsx        ← Flat file
│   ├── AI.tsx              ← Flat file
│   └── Ranks.tsx           ← Flat file
└── settings/
    ├── Account.tsx         ← Flat file
    └── Preferences.tsx     ← Flat file`}
          </pre>

          <T.caption color="secondary" size="sm">WRONG (NO _TABS IN DOMAINS):</T.caption>
          <pre className="ft-patterns__code-block ft-patterns__code-block--error">
{`src/app/domains/admin/users/
├── Users.tsx
└── _tabs/                  ← WRONG! Tabs belong in features
    ├── ActiveUsers.tsx
    └── DeletedUsers.tsx`}
          </pre>

          <T.body size="md">
            <strong>Rule:</strong> Domains are flat files. If you need tabs, that logic
            lives in the Feature, not the Domain.
          </T.body>
        </Stack>
      </Card.standard>

      {/* The Three-Layer Stack */}
      <Card.standard
        title="The Three-Layer Stack"
        subtitle="VR → Feature → Domain"
      >
        <Stack>
          <T.body size="md">
            The architecture has three distinct layers, each with a clear responsibility:
          </T.body>

          <pre className="ft-patterns__code-block">
{`┌─────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER                                               │
│  src/app/domains/admin/Users.tsx                            │
│                                                             │
│  Responsibility: Page configuration                         │
│  • Page header (title, subtitle)                            │
│  • Layout mode (Page.full vs Page.constrained)              │
│  • Analytics tracking                                       │
│  • Which feature to render                                  │
│                                                             │
│  Contains: useSetPageHeader, usePageTiming, <Page.*>        │
│  Imports: ONE feature                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  FEATURE LAYER                                              │
│  src/features/admin/users-page/index.tsx                    │
│                                                             │
│  Responsibility: Business logic + composition               │
│  • FUSE wiring (state, data)                                │
│  • Event handlers and callbacks                             │
│  • Tab organization (Tabs.panels)                           │
│  • Composing VRs with data                                  │
│                                                             │
│  Contains: useFuse, useAdminData, handlers, _tabs/          │
│  Imports: VR components                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  VR LAYER                                                   │
│  src/vr/table/index.tsx                                     │
│                                                             │
│  Responsibility: Pure UI primitives                         │
│  • Visual presentation                                      │
│  • Interaction patterns                                     │
│  • Accessibility                                            │
│  • Consistent styling                                       │
│                                                             │
│  Contains: JSX, CSS classes, aria attributes                │
│  Imports: Nothing from features or domains                  │
└─────────────────────────────────────────────────────────────┘`}
          </pre>

          <T.body size="md" weight="semibold">The Golden Rule:</T.body>
          <ul className="ft-patterns__list">
            <li><T.body size="md"><strong>VRs</strong> know nothing about Features or Domains</T.body></li>
            <li><T.body size="md"><strong>Features</strong> know nothing about Domains</T.body></li>
            <li><T.body size="md"><strong>Domains</strong> know only which Feature to render</T.body></li>
          </ul>

          <T.body size="md">
            Dependencies flow <strong>downward only</strong>. Domain imports Feature imports VR.
            Never the reverse.
          </T.body>
        </Stack>
      </Card.standard>

      {/* The Decision Rule */}
      <Card.standard
        title="The Decision Rule"
        subtitle="Simple guideline for any new feature"
      >
        <Stack>
          <T.body size="lg" weight="semibold" className="ft-patterns__decision-box">
            folder-name-type/ + folder-name-type.css + _tabs/
          </T.body>

          <T.body size="md">
            1. Name folder with type suffix: <code>feature-name-page/</code><br />
            2. Create CSS with matching name: <code>feature-name-page.css</code><br />
            3. Put tabs in <code>_tabs/</code> as PascalCase files<br />
            4. Domain just imports <code>&lt;FeatureNamePageFeature /&gt;</code>
          </T.body>

          <T.body size="lg" weight="bold">
            Rock solid. Replicable. No exceptions.
          </T.body>
        </Stack>
      </Card.standard>
    </Stack>
  );
}
