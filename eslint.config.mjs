import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import customRules from "./eslint/class-prefix.js";
import noComponentCss from "./eslint/no-component-css.js";
import noUseStateForData from "./eslint/no-usestate-for-data.js";
import noHardcodedSecrets from "./eslint/no-hardcoded-secrets.js";
import tttsRules from "./eslint/ttts/index.js";
import vrpRules from "./eslint/vrp/index.js";
import srbRules from "./eslint/srb/index.js";
import typographySovereignty from "./eslint/typography-sovereignty.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".ops/**",
      "convex/_generated/**",
      ".archive/**",  // Archived legacy code - reference only
      "eslint/**",  // ESLint plugins use CommonJS require()
    ],
  },
  // Register custom VRP enforcement plugins
  {
    plugins: {
      "class-prefix": customRules,
      "no-component-css": noComponentCss,
      "no-usestate-for-data": noUseStateForData,
      "no-hardcoded-secrets": noHardcodedSecrets,
      "ttts": tttsRules,
      "vrp": vrpRules,
      "srb": srbRules,
      "typography": typographySovereignty,
    },
  },
  // Global lint configuration + Superior VRP Layer 2 Rules
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@next/next/no-img-element": "off", // Performance suggestion, not required
      "@typescript-eslint/no-unused-vars": "error", // ✅ RE-ENABLED 2025-11-09 - Dead code prevention
      "@typescript-eslint/no-explicit-any": "error", // 🛡️ TAV PROTECTION - Enabled 2025-11-04 - See TAV-EXCEPTIONS.md
      "react-hooks/exhaustive-deps": "error", // ✅ RE-ENABLED 2025-11-09 - Stale closure prevention

      // ═══════════════════════════════════════════════════════════
      // VRP LAYER 2: SUPERIOR DOCTRINE ENFORCEMENT (from transfoormv2)
      // ═══════════════════════════════════════════════════════════

      // FUSE DOCTRINE ENFORCEMENT
      "no-usestate-for-data/no-usestate-for-data": "error",

      // SECURITY ENFORCEMENT
      "no-hardcoded-secrets/no-hardcoded-secrets": "error",

      // ═══════════════════════════════════════════════════════════
      // TTTS - TRIPLE-T SOVEREIGNTY ENFORCEMENT (Strategy 1 Protection)
      // ═══════════════════════════════════════════════════════════
      // Enforces FUSE/ADP/PRISM/WARP architectural sovereignty
      // These rules make Strategy 1 (full domain preload) impossible to break

      // TTTS-2: Golden Bridge - No direct Convex in pages/components
      "ttts/no-direct-convex-in-pages": "error",

      // TTTS-5: Domain Sovereignty - No cross-domain imports
      "ttts/no-cross-domain-imports": "error",

      // TTTS-1: Slice Discipline - Enforce ADP slice shape
      // UPGRADED TO ERROR: All slices are now TTTS-1 compliant (status === 'hydrated')
      "ttts/enforce-slice-shape": "error",

      // TTTS-6: No Lazy Domains - Block dynamic()/React.lazy() in domain views
      "ttts/no-lazy-domains": "error",

      // TTTS-7: No Runtime Debt - Block useEffect fetch chains and async hooks
      "ttts/no-runtime-debt": "error",

      // SRB-7: No Clerk in Domains - Enforces Golden Bridge (Clerk relegated to auth only)
      "ttts/no-clerk-in-domains": "error",

      // Category K: No Clerk Identity in Server Actions - Blocks getToken/setAuth outside auth boundary
      "ttts/no-clerk-identity-in-actions": "error",

      // VANISH-1: Enforce cascade manifest coverage - No orphaned user data
      "ttts/enforce-vanish-manifest": "error",

      // ═══════════════════════════════════════════════════════════════════
      // VRP & SRB - FOREIGN AUTH & IDENTITY PROTECTION
      // ═══════════════════════════════════════════════════════════════════

      // VRP: No Foreign Auth - Block non-FUSE auth systems outside auth boundary
      "vrp/no-foreign-auth": "error",

      // VRP: No ESLint Disable - Block eslint-disable bypass comments
      "vrp/no-eslint-disable": "error",

      // VRP: No FUSE in Domains - Block FUSE hooks and Convex in domain files (DOMAIN=Clean, FEATURE=Dirty)
      "vrp/no-fuse-in-domains": "error",

      // SRB: No Identity in Views - Block identity resolution in domain views
      "srb/no-identity-in-views": "error",

      // ═══════════════════════════════════════════════════════════════════
      // TYPOGRAPHY SOVEREIGNTY - VR TEXT ENFORCEMENT
      // ═══════════════════════════════════════════════════════════════════
      // ✅ TYPOGRAPHY SOVEREIGNTY - PERMANENTLY ENFORCED
      // All 421 violations fixed - rules now prevent future violations

      // TYPO-1: Ban raw text nodes in DOM components
      "typography/no-raw-text-nodes": "error",

      // TYPO-2: Ban HTML typography tags (h1-h6, p, span, small)
      "typography/no-html-typography-tags": "error",

      // TYPO-4: Heading integrity - no size prop on Typography.heading
      "typography/no-heading-size-override": "error",

      // TYPO-6: Prevent prop sprawl - max 3 semantic props per Typography VR
      "typography/no-prop-sprawl": "warn",

      // NOTE: class-prefix and no-component-css DISABLED for now
      // Legacy uses VR architecture, not 5-file system yet
      // "class-prefix/enforce-class-prefix": "error",  // DISABLED
      // "no-component-css/no-component-css": "error",  // DISABLED
    },
  },
  // ═══════════════════════════════════════════════════════════════════
  // TYPOGRAPHY SOVEREIGNTY EXCEPTION - Auth Pages
  // ═══════════════════════════════════════════════════════════════════
  // Auth pages (sign-in, sign-up, forgot, layout) use native HTML tags with
  // CSS classes for styling. This is intentional for auth boundary isolation.
  // Typography VRs are not used in the auth layer.
  {
    files: ["src/app/(auth)/**/*.tsx"],
    rules: {
      "typography/no-html-typography-tags": "off",  // Native HTML is the pattern
      "typography/no-raw-text-nodes": "off"         // Text in native tags is expected
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // TYPOGRAPHY SOVEREIGNTY EXCEPTION - Setup Modal
  // ═══════════════════════════════════════════════════════════════════
  // Setup modal is a special marketing component with custom design requirements
  // that need pixel-perfect control beyond standard Typography VR sizes
  {
    files: ["src/features/setup/setup-modal/index.tsx"],
    rules: {
      "typography/no-html-typography-tags": "off",  // Allow native HTML (h1, h3, h4, p)
      "typography/no-raw-text-nodes": "off"         // Allow text in native tags
    }
  },
  // Genome tab passes text content to Card.standard VR, which handles rendering
  // Card VR doesn't use Typography VRs internally (legacy design - to be refactored)
  {
    files: ["src/features/account/genome-tab/index.tsx"],
    rules: {
      "typography/no-raw-text-nodes": "off"  // Text passed to Card VR for rendering
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ VRP 2.0 - FUSE STACK ARCHITECTURAL PURITY - VRP (Virgin Repo Protocol)
  // ═══════════════════════════════════════════════════════════════════
  // Enforce FUSE Stack architecture: WARP preloading + Golden Bridge + Zero waterfalls
  {
    files: ["src/**/*.{ts,tsx,js,jsx}", "convex/**/*.{ts,tsx}", "scripts/**/*.{ts,js}"],
    rules: {
      // FUSE Rule 1: Ban loading states (architectural cancer)
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclarator[id.name=/^(is)?loading$/i][init.callee.name='useState']",
          message: "⛔ FUSE VIOLATION: Loading states are bugs. Data is preloaded via WARP pattern before render. Read from useFuse() state, never fetch in components."
        },
        {
          selector: "VariableDeclarator[id.name=/^isPending$/i][init.callee.name='useState']",
          message: "⛔ FUSE VIOLATION: Pending states are bugs. Use optimistic updates or WARP preloading instead of loading indicators."
        }
      ],

      // FUSE Rule 2: Ban client-side fetch() (violates Golden Bridge)
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message: "⛔ FUSE VIOLATION: Components never fetch(). READS: use useFuse() - data preloaded via WARP. WRITES: use Convex mutations → cookie update → ClientHydrator refresh → FUSE state auto-updates."
        }
      ],

      // FUSE Rule 3: Ban axios + relative imports
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message: "⛔ FUSE VIOLATION: No HTTP libraries allowed. READS: useFuse() (WARP preloaded). WRITES: Convex mutations."
            }
          ],
          patterns: [
            {
              group: ["../*", "../../*", "../../../*", "../../../../*", "!../*.css", "!../*.module.css"],
              message: "⛔ ARCHITECTURAL CANCER: Relative imports hide domain structure. Use @ aliases:\n  • src: @/components, @/store, @/fuse\n  • convex: @/convex/_generated, @/convex/vanish\n  Example: @/convex/vanish/cascade not ../../../vanish/cascade"
            }
          ]
        }
      ]
    },
  },
  // Exception: Allow isSubmitting for optimistic UI feedback (not loading states)
  {
    files: [
      "src/app/(auth)/sign-in/page.tsx",
      "src/app/(auth)/sign-up/page.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off"  // isSubmitting is optimistic UI, not loading
    }
  },
  // Exception: Allow Clerk in auth/clerk quarantine zones
  {
    files: [
      "src/app/(auth)/**/*.{ts,tsx}",
      "src/app/(clerk)/**/*.{ts,tsx}",   // Clerk quarantine zone
    ],
    rules: {
      "ttts/no-clerk-in-domains": "off",  // These ARE the Clerk boundary
      "no-restricted-syntax": "off",       // isSubmitting for form feedback
      "vrp/no-eslint-disable": "off",      // Allow documented Clerk zone disable comments
    }
  },
  // Exception: Allow fetch in API routes (server-side only)
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-restricted-globals": "off",  // Server-side fetch is acceptable
      "vrp/no-eslint-disable": "off"   // Allow documented fetch disable comments
    }
  },
  // Exception: Allow fetch for Clerk admin operations (boundary concern only)
  // Quarantined to admin user drawer tabs - Clerk API requires HTTP calls
  {
    files: [
      "src/features/admin/user-drawer/_tabs/*.tsx"  // Directory-scoped quarantine
    ],
    rules: {
      "no-restricted-globals": "off",  // Clerk admin API operations (email/password management)
      "vrp/no-eslint-disable": "off"   // Allow documented Clerk API disable comments
    }
  },
  // Exception: Allow fetch for session cleanup on logout
  {
    files: ["**/sign-out/page.tsx"],
    rules: {
      "no-restricted-globals": "off",  // Server-side session cookie deletion
      "vrp/no-eslint-disable": "off"   // Allow documented session cleanup disable comments
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ TTTS-7 EXCEPTIONS - GOLDEN BRIDGE SYNC INFRASTRUCTURE
  // ═══════════════════════════════════════════════════════════════════
  // These hooks are the OFFICIAL Convex → FUSE sync infrastructure.
  // useQuery is allowed ONLY because they sync INTO FUSE, never return data.
  // Components MUST read from FUSE, not from these sync hooks.
  {
    files: [
      "src/hooks/useAdminSync.ts",      // Admin domain: Convex → FUSE
      "src/hooks/useConvexUser.ts",     // User identity: Convex → FUSE
      "src/hooks/useSettingsSync.ts",   // Settings domain: Convex → FUSE
      "src/features/vanish/**/*.tsx",   // Vanish deletion protocol
    ],
    rules: {
      "ttts/no-runtime-debt": "off",   // TTTS-2 compliant sync infrastructure
      "vrp/no-eslint-disable": "off"   // Allow documented sync infrastructure disable comments
    }
  },
  // Exception: Vanish operational quarantine (UI + Convex)
  // Vanish is explicitly destructive/terminal - allowed to perform side-effects VRP forbids elsewhere
  {
    files: [
      "src/features/vanish/**/*.tsx",  // Client-side Vanish UI
      "convex/vanish/**/*.ts"           // Server-side Vanish actions
    ],
    rules: {
      "no-restricted-globals": "off",  // Vanish performs destructive external API calls by design
      "vrp/no-eslint-disable": "off"   // Allow documented Vanish quarantine disable comments
    }
  },
  // Exception: Convex Actions (Productivity Email)
  // Convex actions are designed to make external HTTP requests to third-party APIs
  // IMPORTANT: This exception applies ONLY to Convex actions.
  // No client, query, or mutation code may live in this path.
  // TODO: Tighten to convex/**/actions/**/*.ts when actions are moved to dedicated subdirectory
  {
    files: [
      "convex/productivity/email/**/*.ts"  // Email sync actions (Outlook Graph API, Gmail API, etc.)
    ],
    rules: {
      "no-restricted-globals": "off"  // Convex actions use fetch() for external API requests
    }
  },
  // Exception: WARP/PRISM infrastructure (fetch for preloading)
  {
    files: [
      "src/fuse/hooks/usePrism.ts",    // PRISM preloading
      "src/fuse/warp/orchestrator.ts", // WARP orchestration
      "src/features/shell/user-button/index.tsx",   // Convex file upload
      "src/features/shell/company-button/index.tsx", // Convex file upload
    ],
    rules: {
      "vrp/no-eslint-disable": "off"   // Allow documented WARP/PRISM/Convex disable comments
    }
  },
  // Exception: Router and ClientHydrator (exhaustive-deps, unused-vars for architectural reasons)
  {
    files: [
      "src/app/domains/Router.tsx",          // Router exhaustive-deps bypass (intentional)
      "src/fuse/hydration/ClientHydrator.tsx", // Unused vars for future use
    ],
    rules: {
      "vrp/no-eslint-disable": "off"   // Allow documented architectural disable comments
    }
  },
  // Exception: E2E and Unit Tests (Playwright + Vitest)
  // Tests need to access browser globals and mock types that don't have TS definitions
  {
    files: [
      "e2e/**/*.{ts,tsx,spec.ts}",           // E2E tests (Playwright)
      "**/__tests__/**/*.{ts,tsx}",          // Unit tests (Vitest)
      "**/*.{test,spec}.{ts,tsx}",           // Test files
      "vitest.setup.ts",                      // Vitest setup file
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",  // Browser globals need any type
      "vrp/no-eslint-disable": "off",                // Allow test-specific disable comments
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ WCCC PROTECTION - PREVENT PAGE-SPECIFIC CSS FILES
  // ═══════════════════════════════════════════════════════════════════
  // Enforce 5-hub system: VRs, shell, features, layout, auth ONLY
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/page.css", "./page.css"],
              message: "⛔ WCCC VIOLATION: Page-specific CSS files are forbidden. Use VRs or create a feature component instead.\n\nAllowed CSS hubs:\n  • /styles/vr.css (vr-* components)\n  • /styles/features.css (ft-* components)\n  • /styles/layout.css (ly-* shell + layouts)\n\nIf you need custom styling:\n  1. Check if a VR variant exists\n  2. Create new VR variant in /src/vr/\n  3. Last resort: Create feature component in /src/features/\n\nSee TTT-WCCC-PROTOCOL.md for details."
            }
          ]
        }
      ]
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ ISV PROTECTION - GLOBAL "INLINE STYLE VIRUS" PREVENTION
  // ═══════════════════════════════════════════════════════════════════
  // Block ALL inline styles except documented FUSE-compliant exceptions
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "react/forbid-dom-props": [
        "error",
        {
          forbid: [
            {
              propName: "style",
              message:
                "⛔ INLINE STYLE VIRUS DETECTED! Use CSS classes instead. See ISV-PROTECTION.md for FUSE-STYLE architecture. Only dynamic runtime values are allowed (see ISVEA-EXCEPTIONS.md).",
            },
          ],
        },
      ],
    },
  },
  // Exception patterns for FUSE-compliant dynamic styles
  {
    files: [
      // Portal components (Dynamic Law - getBoundingClientRect positioning)
      "src/components/features/CountrySelector/index.tsx",
      "src/vr/tooltip/Tooltip.tsx",
      "src/vr/modal/drawer/portal.tsx",

      // Data-driven components (Dynamic Law - runtime values/metadata)
      "src/vr/input/range/index.tsx",      // Runtime percentage positioning
      "src/vr/fieldbox/Row.tsx",     // CSS custom property bridge for dynamic gap
      "src/vr/rank/Card.tsx",        // CSS custom property bridges from metadata
      "src/vr/divider/dashed/index.tsx",   // Runtime multiplier/color/height
      "src/vr/divider/default/index.tsx",  // Runtime multiplier/color/height
      "src/vr/divider/gradient/index.tsx", // Runtime multiplier/color/direction
      "src/vr/divider/line/index.tsx",     // Runtime multiplier/color/height
      "src/vr/card/standard/index.tsx",    // Runtime values
      "src/vr/search/Bar.tsx",       // Runtime width prop
      "src/vr/search/SearchBar.tsx", // Runtime width prop
      "src/vr/form/Inline.tsx",      // Runtime layout
      "src/appshell/PageHeader.tsx",              // Runtime values
      "src/features/setup/flying-button/index.tsx", // CSS custom properties for dynamic positioning
    ],
    rules: {
      "react/forbid-dom-props": "off", // Allow inline styles in these exception files
      "vrp/no-eslint-disable": "off", // Allow documented ISVEA disable comments
    },
  },
];

export default eslintConfig;

/*  */
