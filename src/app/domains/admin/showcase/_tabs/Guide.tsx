'use client';

import '@/features/admin/showcase-bundle/showcase-bundle.css';
import { Card, Divider, T } from '@/prebuilts';

export default function Guide() {
  return (
    <Card.standard
      title="The VR Doctrine"
      subtitle="Everything you need to know about Variant Robots"
    >
      <div className="ft-showcasetabs-guide">
        <div className="ft-showcasetabs-guide-columns">
          {/* Introduction */}
          <T.body size="sm" className="ft-showcasetabs-guide-intro">
          <strong>Variant Robots (VRs)</strong> are the DNA of this application.
          They&apos;re dumb, beautiful, reusable UI shells that know nothing about
          your data — and that&apos;s exactly what makes them powerful.
        </T.body>

        <Divider.line />

        {/* The Stack */}
        <T.h3 weight="bold">The Stack</T.h3>
        <T.title size="sm" className="ft-showcasetabs-guide-flow">
          VR → Feature → Tab
        </T.title>

        <ul className="ft-showcasetabs-guide-stack-list">
          <li>
            <T.body size="sm"><strong>VR</strong> — Pure UI. Receives value, fires callback. No FUSE. No logic.</T.body>
          </li>
          <li>
            <T.body size="sm"><strong>Feature</strong> — Wires VRs to FUSE. Handles transforms, edge cases, all the dirt.</T.body>
          </li>
          <li>
            <T.body size="sm"><strong>Tab</strong> — One line import. Zero state. Just places Features on the page.</T.body>
          </li>
        </ul>

        <Divider.line />

        {/* The Sponge Principle */}
        <T.h3 weight="bold">The Sponge Principle</T.h3>
        <T.body size="sm">
          Features are the <strong>sponge</strong> — they absorb all complexity so VRs stay dry (reusable)
          and Tabs stay pristine (declarative).
        </T.body>
        <T.body size="sm" className="ft-showcasetabs-guide-emphasis">
          When you&apos;re unsure where code belongs, ask: <em>&quot;Is this dirt?&quot;</em>
        </T.body>
        <T.body size="sm">
          If yes, it goes in a Feature.
        </T.body>

        <Divider.line />

        {/* CSS Prefixes */}
        <T.h3 weight="bold">CSS Prefixes</T.h3>
        <T.caption className="ft-showcasetabs-guide-subtitle">
          Namespace isolation prevents class collisions
        </T.caption>

        <ul className="ft-showcasetabs-guide-prefix-list">
          <li>
            <T.body size="sm"><code className="ft-showcasetabs-guide-code">.vr-*</code> — Prebuilts only (reusable DNA)</T.body>
          </li>
          <li>
            <T.body size="sm"><code className="ft-showcasetabs-guide-code">.ft-*</code> — Features only (specific assembly)</T.body>
          </li>
          <li>
            <T.body size="sm"><strong>No CSS</strong> — Tabs have no CSS, they just compose</T.body>
          </li>
        </ul>

        <Divider.line />

        {/* The Ontology */}
        <T.h3 weight="bold">The Ontology</T.h3>
        <T.caption className="ft-showcasetabs-guide-subtitle">
          Bottom-up construction: from atoms to organisms
        </T.caption>

        <T.body size="sm" className="ft-showcasetabs-guide-ontology">
          byte → character → token → declaration → class → structure →
          behavior → variant surface → <strong>VR</strong> → section → screen → app
        </T.body>

        <T.body size="sm">
          A <strong>VR</strong> sits at the sweet spot: styling + structure + behavior + variants,
          sealed into one predictable, portable unit.
        </T.body>

        <T.body size="sm">
          Everything below is encapsulated. Everything above just composes it.
        </T.body>

        <Divider.line />

        {/* Deep Dive Documentation */}
        <T.h3 weight="bold">Deep Dive Documentation</T.h3>
        <T.caption className="ft-showcasetabs-guide-subtitle">
          Read the source for complete understanding
        </T.caption>

        <ul className="ft-showcasetabs-guide-links">
          <li>
            <T.h6 weight="medium">
              <code className="ft-showcasetabs-guide-code">_sdk/VR-DOCTRINE.md</code>
            </T.h6>
            <T.caption>The complete philosophy, examples, and ontology stack</T.caption>
          </li>
          <li>
            <T.h6 weight="medium">
              <code className="ft-showcasetabs-guide-code">.claude/commands/VR-devcheck.md</code>
            </T.h6>
            <T.caption>Quick layer checks before writing code</T.caption>
          </li>
          <li>
            <T.h6 weight="medium">
              <code className="ft-showcasetabs-guide-code">.claude/commands/VR-class-scanner.md</code>
            </T.h6>
            <T.caption>CSS namespace isolation and collision prevention</T.caption>
          </li>
          <li>
            <T.h6 weight="medium">
              <code className="ft-showcasetabs-guide-code">.claude/commands/VRP-audit.md</code>
            </T.h6>
            <T.caption>88-point FUSE compliance audit</T.caption>
          </li>
        </ul>
        </div>

        <Divider.line />

        {/* Main Section Title - Full Width, Centered */}
        <T.title size="xl" weight="bold" align="center">SET UP PAGES WITH VR&apos;s and FEATURES</T.title>

        {/* Second 2-column section - Page & Tab Setup */}
        <div className="ft-showcasetabs-guide-columns">
          <T.h3 weight="bold">Building Pages with Tabs</T.h3>
        <T.body size="sm">
          Read the complete guide: <code className="ft-showcasetabs-guide-code">_sdk/11-conventions/PAGE-AND-TAB-SETUP-GUIDE.md</code>
        </T.body>

        <T.h4 weight="semibold">The Two Patterns</T.h4>

        <T.body size="sm">
          <strong>Pattern 1: Feature-Based Tabs</strong> (95% of pages)
        </T.body>
        <T.body size="sm">
          Use when tabs have state, FUSE wiring, or business logic.
        </T.body>
        <T.body size="sm">
          Page → Page Feature → Tab → Tab Feature
        </T.body>

        <T.body size="sm">
          <strong>Pattern 2: Direct Composition</strong> (documentation only)
        </T.body>
        <T.body size="sm">
          Use only for pure static content with zero state/logic.
        </T.body>
        <T.body size="sm">
          Page → Tabs.panels → Tab (VR composition)
        </T.body>

        <T.h4 weight="semibold">Quick Start: Create a New Page</T.h4>

        <T.body size="sm">
          <strong>1. Create Domain Page</strong>
        </T.body>
        <T.caption>src/app/domains/admin/invoices/Invoices.tsx</T.caption>
        <T.body size="sm">
          Import ONE Feature. Set page header. Return Feature component.
        </T.body>

        <T.body size="sm">
          <strong>2. Create Page Feature</strong>
        </T.body>
        <T.caption>src/features/admin/invoices-page-tabs/index.tsx</T.caption>
        <T.body size="sm">
          Wire FUSE. Import VRs (Stack, Tabs.panels). Import tab components.
        </T.body>

        <T.body size="sm">
          <strong>3. Create Tab Files</strong>
        </T.body>
        <T.caption>src/app/domains/admin/invoices/_tabs/PendingInvoices.tsx</T.caption>
        <T.body size="sm">
          3 lines: Import Tab Feature, return Feature component.
        </T.body>

        <T.body size="sm">
          <strong>4. Create Tab Features</strong>
        </T.body>
        <T.caption>src/features/admin/invoices-tabs/pending-invoices-tab/index.tsx</T.caption>
        <T.body size="sm">
          All state, all FUSE, all callbacks, all VR composition, all Typography VRs.
        </T.body>

        <T.h4 weight="semibold">Reference Examples</T.h4>

        <ul className="ft-showcasetabs-guide-prefix-list">
          <li>
            <T.body size="sm"><code className="ft-showcasetabs-guide-code">/admin/users</code> — Pattern 1 (functional page with data tables)</T.body>
          </li>
          <li>
            <T.body size="sm"><code className="ft-showcasetabs-guide-code">/settings/account</code> — Pattern 1 (user profile with forms)</T.body>
          </li>
          <li>
            <T.body size="sm"><code className="ft-showcasetabs-guide-code">/admin/showcase</code> — Pattern 2 (documentation/demo)</T.body>
          </li>
        </ul>

        <T.h4 weight="semibold">When to Use a Feature</T.h4>

        <T.body size="sm">
          <strong>Always use a Feature when tab has:</strong>
        </T.body>
        <ul className="ft-showcasetabs-guide-prefix-list">
          <li><T.body size="sm">Any state (useState)</T.body></li>
          <li><T.body size="sm">Any FUSE wiring (useFuse)</T.body></li>
          <li><T.body size="sm">Any callbacks (handleDelete, handleSave)</T.body></li>
          <li><T.body size="sm">Any data transforms (useMemo)</T.body></li>
          <li><T.body size="sm">Any hooks (useAdminSync, useTableSearch)</T.body></li>
        </ul>

        <T.body size="sm">
          <strong>Skip Feature only when:</strong>
        </T.body>
        <ul className="ft-showcasetabs-guide-prefix-list">
          <li><T.body size="sm">Pure static content (docs, showcase)</T.body></li>
          <li><T.body size="sm">Zero state, zero logic, zero FUSE</T.body></li>
        </ul>

        <T.body size="sm">
          <strong>Rule:</strong> If you&apos;re asking &quot;Do I need a Feature?&quot;, the answer is YES.
        </T.body>
        </div>
      </div>
    </Card.standard>
  );
}
