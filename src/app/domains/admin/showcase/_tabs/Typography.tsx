'use client';

import { Card, Divider, Typography } from '@/vr';

export default function TypographyShowcase() {
  return (
    <Card.standard
      title="Typography Showcase"
      subtitle="All Typography VR components with their variants"
    >
      {/* Typography.title Examples */}
      <Typography.heading level={2} weight="bold">Typography.title</Typography.heading>
      <Typography.caption color="secondary">Page-level titles (h1), rare, high-impact</Typography.caption>

      <Typography.title size="xl" weight="bold">Extra Large Title (xl, bold)</Typography.title>
      <Typography.title size="lg" weight="semibold">Large Title (lg, semibold) - Default</Typography.title>
      <Typography.title size="md" weight="medium">Medium Title (md, medium)</Typography.title>
      <Typography.title size="sm" weight="normal">Small Title (sm, normal)</Typography.title>

      <Typography.title size="lg" weight="semibold" align="center">Centered Title</Typography.title>
      <Typography.title size="lg" weight="semibold" align="right">Right-Aligned Title</Typography.title>

      <Divider.line />

      {/* Typography.hero Examples */}
      <Typography.heading level={2} weight="bold">Typography.hero</Typography.heading>
      <Typography.caption color="secondary">Large hero headlines (48px / 3rem), fixed size for landing pages and major sections</Typography.caption>

      <Typography.hero weight="bold">Extra Bold Hero Headline (Default)</Typography.hero>
      <Typography.hero weight="semibold">Semibold Hero Headline</Typography.hero>
      <Typography.hero weight="medium">Medium Hero Headline</Typography.hero>
      <Typography.hero weight="normal">Normal Hero Headline</Typography.hero>

      <Divider.line />

      {/* Typography.heading Examples */}
      <Typography.heading level={2} weight="bold">Typography.heading</Typography.heading>
      <Typography.caption color="secondary">Subsection headings (h2-h6)</Typography.caption>

      <Typography.heading level={2} weight="bold">H2 Large Bold Heading</Typography.heading>
      <Typography.heading level={3} weight="semibold">H3 Medium Semibold Heading (Default)</Typography.heading>
      <Typography.heading level={4} weight="medium">H4 Small Medium Heading</Typography.heading>
      <Typography.heading level={5} weight="normal">H5 Extra Small Normal Heading</Typography.heading>
      <Typography.heading level={6} weight="normal">H6 Extra Small Normal Heading</Typography.heading>

      <Divider.line />

      {/* Typography.body Examples */}
      <Typography.heading level={2} weight="bold">Typography.body</Typography.heading>
      <Typography.caption color="secondary">Regular body text (renders as p)</Typography.caption>

      <Typography.body size="lg" weight="normal" color="primary">
        Large body text (lg, normal, primary). This is the largest body text size, useful for introductory paragraphs or emphasis.
      </Typography.body>

      <Typography.body size="md" weight="normal" color="primary">
        Medium body text (md, normal, primary) - Default. This is the standard body text size used for most paragraph content across the application.
      </Typography.body>

      <Typography.body size="sm" weight="normal" color="secondary">
        Small body text (sm, normal, secondary). This smaller size is useful for supporting text or less critical information.
      </Typography.body>

      <Typography.body size="md" weight="medium" color="primary">
        Medium weight body text (md, medium, primary). Using medium weight adds subtle emphasis without being too bold.
      </Typography.body>

      <Typography.body size="md" weight="semibold" color="primary">
        Semibold body text (md, semibold, primary). This is useful for stronger emphasis within body content.
      </Typography.body>

      <Typography.body size="md" weight="normal" color="tertiary">
        Tertiary color body text (md, normal, tertiary). Used for de-emphasized content.
      </Typography.body>

      <Typography.body size="md" weight="normal" color="error">
        Error color body text (md, normal, error). Used for error messages and critical warnings.
      </Typography.body>

      <Typography.body size="md" weight="normal" color="success">
        Success color body text (md, normal, success). Used for success messages and confirmations.
      </Typography.body>

      <Typography.body size="md" weight="normal" color="warning">
        Warning color body text (md, normal, warning). Used for warning messages and cautions.
      </Typography.body>

      <Divider.line />

      {/* Typography.caption Examples */}
      <Typography.heading level={2} weight="bold">Typography.caption</Typography.heading>
      <Typography.caption color="secondary">Small caption and helper text (renders as span). Default: sm/normal/tertiary</Typography.caption>

      <div>
        <Typography.caption size="sm" weight="normal" color="primary">
          Small caption (sm, normal, primary)
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="sm" weight="normal" color="secondary">
          Small caption with secondary color (sm, normal, secondary)
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="sm" weight="normal" color="tertiary">
          Small caption with tertiary color (sm, normal, tertiary) - Default
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="sm" weight="normal" color="muted">
          Small caption with muted color (sm, normal, muted) - intentionally softer than tertiary
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="xs" weight="normal" color="tertiary">
          Extra small caption (xs, normal, tertiary)
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="sm" weight="medium" color="primary">
          Small caption with medium weight (sm, medium, primary)
        </Typography.caption>
      </div>

      <div>
        <Typography.caption size="sm" weight="normal" color="tertiary" italic>
          Small caption with italic style (sm, normal, tertiary, italic)
        </Typography.caption>
      </div>

      <Divider.line />

      {/* Combined Example */}
      <Typography.heading level={2} weight="bold">Combined Example (TypographyHeading)</Typography.heading>
      <Typography.caption color="secondary">How Typography components work together in real content (TypographyCaption)</Typography.caption>

      <Divider.line />

      <Typography.heading level={3} weight="semibold">Typography Sovereignty (body sm example)</Typography.heading>

      <Typography.body size="sm">
        <strong>The One-Sentence Rule:</strong> If text appears in the UI, it must pass through a Typography VR — globals may not style content.
      </Typography.body>

      <Typography.body size="sm">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </Typography.body>

      <Typography.body size="sm">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      </Typography.body>

      <Divider.line />

      <Typography.heading level={3} weight="semibold">Typography Sovereignty (body md example)</Typography.heading>

      <Typography.body size="md">
        <strong>The One-Sentence Rule:</strong> If text appears in the UI, it must pass through a Typography VR — globals may not style content.
      </Typography.body>

      <Typography.body size="md">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </Typography.body>

      <Typography.body size="md">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      </Typography.body>

      <Divider.line />

      <Typography.heading level={3} weight="semibold">Typography Sovereignty (body lg example)</Typography.heading>

      <Typography.body size="lg">
        <strong>The One-Sentence Rule:</strong> If text appears in the UI, it must pass through a Typography VR — globals may not style content.
      </Typography.body>

      <Typography.body size="lg">
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </Typography.body>

      <Typography.body size="lg">
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      </Typography.body>

      <Divider.line />

      <Typography.title size="lg" weight="bold">Welcome to Transfoorm [Typography.title - large, bold]</Typography.title>

      <Typography.body size="lg" weight="normal" color="primary">
        This is an introduction paragraph using large body text to capture attention and provide context. Large body text is perfect for opening statements, key messages, or important announcements that need to stand out from regular content. [Typography.body - large, normal, primary]
      </Typography.body>

      <Typography.heading level={3} weight="semibold">Getting Started [Typography.heading - level 3, semibold]</Typography.heading>

      <Typography.body size="md" weight="normal" color="primary">
        This is standard body text explaining the details. It uses the default medium size which is comfortable for reading longer passages of text. Multiple paragraphs of body text maintain consistent spacing thanks to the Card Layout Authority Principle. [Typography.body - medium, normal, primary]
      </Typography.body>

      <Typography.body size="md" weight="normal" color="primary">
        Notice how these paragraphs stack naturally with consistent gaps between them. No manual spacing needed, no wrapper divs required. The Card controls the vertical rhythm while Typography VRs stay pure and margin-less. [Typography.body - medium, normal, primary]
      </Typography.body>

      <Typography.body size="md" weight="normal" color="primary">
        This third paragraph demonstrates how the pattern scales. Whether you have two paragraphs or ten, the spacing remains predictable and clean. This is the power of separating content (Typography VRs) from layout (Card authority). [Typography.body - medium, normal, primary]
      </Typography.body>

      <Typography.heading level={3} weight="semibold">Advanced Features [Typography.heading - level 3, semibold]</Typography.heading>

      <Typography.body size="md" weight="normal" color="primary">
        You can mix different Typography components freely. The Card handles all spacing automatically, so you can focus on content hierarchy and meaning rather than fighting with margins. [Typography.body - medium, normal, primary]
      </Typography.body>

      <Typography.body size="md" weight="medium" color="primary">
        This paragraph uses medium weight for subtle emphasis. It stands out slightly from regular body text without being as bold as a heading. [Typography.body - medium, medium weight, primary]
      </Typography.body>

      <Typography.body size="md" weight="normal" color="secondary">
        Secondary color text is useful for supporting information that&apos;s less critical than primary content but still part of the main flow. [Typography.body - medium, normal, secondary]
      </Typography.body>

      <Typography.caption size="sm" weight="normal" color="tertiary">
        Last updated 3 hours ago • 5 min read [Typography.caption - small, normal, tertiary]
      </Typography.caption>

      <Divider.line />

      <Typography.heading level={2} weight="bold">Complete Typography VR Reference</Typography.heading>
      <Typography.caption color="secondary">Every variant, every size, every combination</Typography.caption>

      {/* TypographyTitle - All Variants */}
      <Typography.heading level={3} weight="semibold">TypographyTitle - All Sizes</Typography.heading>

      <Typography.title size="xl" weight="bold">Extra large (bold)</Typography.title>
      <Typography.title size="xl" weight="semibold">Extra large (semibold)</Typography.title>
      <Typography.title size="xl" weight="medium">Extra large (medium)</Typography.title>
      <Typography.title size="xl" weight="normal">Extra large (normal)</Typography.title>

      <Typography.title size="lg" weight="bold">Large (bold)</Typography.title>
      <Typography.title size="lg" weight="semibold">Large (semibold) - default</Typography.title>
      <Typography.title size="lg" weight="medium">Large (medium)</Typography.title>
      <Typography.title size="lg" weight="normal">Large (normal)</Typography.title>

      <Typography.title size="md" weight="bold">Medium (bold)</Typography.title>
      <Typography.title size="md" weight="semibold">Medium (semibold)</Typography.title>
      <Typography.title size="md" weight="medium">Medium (medium)</Typography.title>
      <Typography.title size="md" weight="normal">Medium (normal)</Typography.title>

      <Typography.title size="sm" weight="bold">Small (bold)</Typography.title>
      <Typography.title size="sm" weight="semibold">Small (semibold)</Typography.title>
      <Typography.title size="sm" weight="medium">Small (medium)</Typography.title>
      <Typography.title size="sm" weight="normal">Small (normal)</Typography.title>

      <Divider.line />

      {/* TypographyHeading - The Pure System */}
      <Typography.heading level={3} weight="semibold">TypographyHeading — The Pure System</Typography.heading>
      <Typography.caption color="secondary">Level determines BOTH semantics AND size automatically. No size prop exists.</Typography.caption>

      <Typography.heading level={2}>H2 Heading (Level 2)</Typography.heading>
      <Typography.heading level={3}>H3 Heading (Level 3, most common)</Typography.heading>
      <Typography.heading level={4}>H4 Heading (Level 4)</Typography.heading>
      <Typography.heading level={5}>H5 Heading (Level 5)</Typography.heading>
      <Typography.heading level={6}>H6 Heading (Level 6)</Typography.heading>

      <Divider.line />

      {/* TypographyHeading - All Weights */}
      <Typography.heading level={3} weight="semibold">TypographyHeading Weights</Typography.heading>
      <Typography.caption color="secondary">All weight variants shown at level 3</Typography.caption>

      <Typography.heading level={3} weight="bold">Bold weight</Typography.heading>
      <Typography.heading level={3} weight="semibold">Semibold weight (default)</Typography.heading>
      <Typography.heading level={3} weight="medium">Medium weight</Typography.heading>
      <Typography.heading level={3} weight="normal">Normal weight</Typography.heading>

      <Divider.line />

      {/* TypographyBody - All Sizes */}
      <Typography.heading level={3} weight="semibold">TypographyBody Sizes</Typography.heading>

      <Typography.body size="lg">Large size - for emphasis and introduction paragraphs</Typography.body>
      <Typography.body size="md">Medium size - default, standard body text for most content</Typography.body>
      <Typography.body size="sm">Small size - for supporting information</Typography.body>

      <Divider.line />

      {/* TypographyBody - All Weights */}
      <Typography.heading level={3} weight="semibold">TypographyBody Weights</Typography.heading>
      <Typography.caption color="secondary">All weight variants shown at medium size with primary color</Typography.caption>

      <Typography.body size="md" weight="semibold">Semibold weight (strong emphasis within body text)</Typography.body>
      <Typography.body size="md" weight="medium">Medium weight (subtle emphasis within body text)</Typography.body>
      <Typography.body size="md" weight="normal">Normal weight (default for body text)</Typography.body>

      <Divider.line />

      {/* TypographyBody - All Colors */}
      <Typography.heading level={3} weight="semibold">TypographyBody Colors</Typography.heading>
      <Typography.caption color="secondary">All color variants shown at medium size with normal weight</Typography.caption>

      <Typography.body size="md" weight="normal" color="primary">Primary color (default - main content text)</Typography.body>
      <Typography.body size="md" weight="normal" color="secondary">Secondary color (supporting information, less prominent)</Typography.body>
      <Typography.body size="md" weight="normal" color="tertiary">Tertiary color (de-emphasized content)</Typography.body>
      <Typography.body size="md" weight="normal" color="error">Error color (error messages and critical warnings)</Typography.body>
      <Typography.body size="md" weight="normal" color="success">Success color (success messages and confirmations)</Typography.body>
      <Typography.body size="md" weight="normal" color="warning">Warning color (warning messages and cautions)</Typography.body>

      <Divider.line />

      {/* TypographyCaption - All Variants */}
      <Typography.heading level={3} weight="semibold">TypographyCaption - All Variants</Typography.heading>

      <div>
        <Typography.caption size="sm" weight="medium" color="primary">Small, medium weight, primary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="normal" color="primary">Small, normal weight, primary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="medium" color="secondary">Small, medium weight, secondary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="normal" color="secondary">Small, normal weight, secondary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="medium" color="tertiary">Small, medium weight, tertiary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="normal" color="tertiary">Small, normal weight, tertiary color (default)</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="medium" color="muted">Small, medium weight, muted color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="normal" color="muted">Small, normal weight, muted color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="xs" weight="medium" color="primary">Extra small, medium weight, primary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="xs" weight="normal" color="primary">Extra small, normal weight, primary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="xs" weight="medium" color="tertiary">Extra small, medium weight, tertiary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="xs" weight="normal" color="tertiary">Extra small, normal weight, tertiary color</Typography.caption>
      </div>
      <div>
        <Typography.caption size="sm" weight="normal" color="tertiary" italic>Small, normal weight, tertiary color, italic</Typography.caption>
      </div>

      <Divider.line />

      <Typography.heading level={2} weight="bold">Typography VR Props Reference</Typography.heading>
      <Typography.caption color="secondary">Quick reference for available props per component</Typography.caption>

      <Typography.heading level={3} weight="semibold">TypographyHero</Typography.heading>
      <Typography.body size="md">
        <strong>Size:</strong> Fixed at 48px (3rem)<br />
        <strong>Weights:</strong> 4 (normal, medium, semibold, bold)<br />
        <strong>Use:</strong> Hero headlines for landing pages and major sections
      </Typography.body>

      <Typography.heading level={3} weight="semibold">TypographyTitle</Typography.heading>
      <Typography.body size="md">
        <strong>Sizes:</strong> 4 (sm, md, lg, xl)<br />
        <strong>Weights:</strong> 4 (normal, medium, semibold, bold)
      </Typography.body>

      <Typography.heading level={3} weight="semibold">TypographyHeading</Typography.heading>
      <Typography.body size="md">
        <strong>Levels:</strong> 5 (2, 3, 4, 5, 6) — level determines size automatically<br />
        <strong>Weights:</strong> 4 (normal, medium, semibold, bold)<br />
        <strong>Pure System:</strong> h2=lg, h3=md, h4=sm, h5=xs, h6=xs
      </Typography.body>

      <Typography.heading level={3} weight="semibold">TypographyBody</Typography.heading>
      <Typography.body size="md">
        <strong>Sizes:</strong> 3 (sm, md, lg)<br />
        <strong>Weights:</strong> 3 (normal, medium, semibold)<br />
        <strong>Colors:</strong> 6 (primary, secondary, tertiary, error, success, warning)
      </Typography.body>

      <Typography.heading level={3} weight="semibold">TypographyCaption</Typography.heading>
      <Typography.body size="md">
        <strong>Sizes:</strong> 2 (xs, sm)<br />
        <strong>Weights:</strong> 2 (normal, medium)<br />
        <strong>Colors:</strong> 4 (primary, secondary, tertiary, muted)<br />
        <strong>Default:</strong> sm/normal/tertiary (muted is explicitly softer)<br />
        <strong>Plus:</strong> italic variant
      </Typography.body>
    </Card.standard>
  );
}
