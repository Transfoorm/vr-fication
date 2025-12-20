#!/usr/bin/env tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🦠 CLERK VIRUS SCANNER - VRP Pre-commit Protection                   │
│  scripts/checkClerkVirus.ts                                           │
│                                                                        │
│  Scans staged files for Clerk contamination before commit.            │
│  Part of Clerk Knox enforcement layer.                                │
│                                                                        │
│  Usage: npm run vrp:clerk                                              │
└────────────────────────────────────────────────────────────────────────┘ */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

// ═══════════════════════════════════════════════════════════════════════
// VIRUS PATTERNS - Category definitions from Fort Clerk-Knox
// ═══════════════════════════════════════════════════════════════════════

interface VirusPattern {
  pattern: RegExp;
  category: string;
  message: string;
}

const VIRUS_PATTERNS: VirusPattern[] = [
  // Category A - Direct Import Viruses (CRITICAL)
  {
    pattern: /import\s+\{[^}]*\}\s+from\s+['"]@clerk\/nextjs['"]/,
    category: 'A',
    message: 'Direct @clerk/nextjs import in sovereign territory',
  },
  {
    pattern: /import\s+\{[^}]*\}\s+from\s+['"]@clerk\/clerk-react['"]/,
    category: 'A',
    message: 'Direct @clerk/clerk-react import',
  },
  {
    pattern: /\buseUser\s*\(/,
    category: 'A',
    message: 'useUser() hook - runtime identity injection',
  },
  {
    pattern: /\buseAuth\s*\(/,
    category: 'A',
    message: 'useAuth() hook - runtime auth resolution',
  },
  {
    pattern: /\buseClerk\s*\(/,
    category: 'A',
    message: 'useClerk() hook - direct Clerk access',
  },
  {
    pattern: /\buseSession\s*\(/,
    category: 'A',
    message: 'useSession() hook - runtime session access',
  },

  // Category B - Indirect Import Viruses
  {
    pattern: /<SignedIn[\s>]/,
    category: 'B',
    message: '<SignedIn> component - runtime auth resolution',
  },
  {
    pattern: /<SignedOut[\s>]/,
    category: 'B',
    message: '<SignedOut> component - runtime auth resolution',
  },
  {
    pattern: /<ClerkLoaded[\s>]/,
    category: 'B',
    message: '<ClerkLoaded> component - Clerk loading state',
  },
  {
    pattern: /<ClerkProvider[\s>]/,
    category: 'B',
    message: '<ClerkProvider> in domain territory',
  },

  // Category H - UI Viruses
  {
    pattern: /<UserButton[\s/>]/,
    category: 'H',
    message: '<UserButton> Clerk UI component',
  },
  {
    pattern: /<UserProfile[\s/>]/,
    category: 'H',
    message: '<UserProfile> Clerk UI component',
  },
  {
    pattern: /<OrganizationSwitcher[\s/>]/,
    category: 'H',
    message: '<OrganizationSwitcher> Clerk UI component',
  },

  // Category K - Golden Bridge Identity Breaches (Server Actions)
  {
    pattern: /getToken\s*\(\s*\{[^}]*template\s*:\s*['"]convex['"]/,
    category: 'K',
    message: 'getToken({ template: "convex" }) - identity generation outside auth boundary',
  },
  {
    pattern: /\.setAuth\s*\(/,
    category: 'K',
    message: '.setAuth() - token injection into Convex client',
  },
  {
    pattern: /clerkClient\.sessions/,
    category: 'K',
    message: 'clerkClient.sessions - direct session manipulation',
  },
];

// ═══════════════════════════════════════════════════════════════════════
// EXCEPTION ZONES - Where Clerk IS allowed
// ═══════════════════════════════════════════════════════════════════════

const EXCEPTION_PATTERNS = [
  /\/app\/\(auth\)\//,              // Auth pages (login, register)
  /\/app\/\(clerk\)\//,             // Clerk quarantine zone (route group)
  /\/app\/api\/session\//,          // Session management routes
  /\/app\/api\/webhooks\//,         // Webhook handlers
  /\/providers\//,                   // Providers (bridge Clerk → FUSE)
  /\/fuse\/hydration\//,             // Hydration utilities
  /middleware\.ts$/,                 // Auth middleware
  /\/vanish\/Quarantine\.tsx$/,      // Clerk quarantine zone
  /\/hooks\/useConvexUser\.ts$/,     // User sync hook
  /\/features\/verify\//,            // Verify features (VerifyForgot, VerifySetup, etc.)
  /\/features\/UserButton\//,        // Auth UI - sign out flow
  /\/features\/setup\//,             // Auth UI - onboarding/verification
  /\/features\/VerifyModal\//,       // Auth UI - email verification modal
  /\.test\.(ts|tsx|js|jsx)$/,        // Test files
  /\.spec\.(ts|tsx|js|jsx)$/,        // Spec files
  /_clerk-virus\//,                  // Clerk virus documentation
  /\.claude\/commands\//,            // Claude commands (scanner itself)
];

// ═══════════════════════════════════════════════════════════════════════
// ENFORCEMENT ZONES - Where we actively scan
// ═══════════════════════════════════════════════════════════════════════

const ENFORCEMENT_PATTERNS = [
  /\/app\/domains\//,                // Domain views
  /\/app\/actions\//,                // Server Actions
  /\/components\//,                  // Component files
  /\/features\//,                    // Feature components
  /\/vr\//,                   // VR components
  /\/store\//,                       // FUSE store
  /\/convex\//,                      // Convex functions
];

interface Violation {
  file: string;
  line: number;
  category: string;
  message: string;
  code: string;
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(file => file.match(/\.(tsx|ts|jsx|js)$/))
      .filter(file => !file.includes('node_modules'))
      .filter(file => !file.includes('.next'));
  } catch {
    return [];
  }
}

function isExceptionFile(filePath: string): boolean {
  return EXCEPTION_PATTERNS.some(pattern => pattern.test(filePath));
}

function shouldEnforce(filePath: string): boolean {
  return ENFORCEMENT_PATTERNS.some(pattern => pattern.test(filePath));
}

function scanFileForViruses(filePath: string): Violation[] {
  if (!existsSync(filePath)) return [];
  if (isExceptionFile(filePath)) return [];
  if (!shouldEnforce(filePath)) return [];

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    for (const virus of VIRUS_PATTERNS) {
      if (virus.pattern.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          category: virus.category,
          message: virus.message,
          code: line.trim().substring(0, 80),
        });
      }
    }
  });

  return violations;
}

function main() {
  console.log('\n🦠 CLERK VIRUS SCANNER - Protecting Sovereignty...\n');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged TypeScript/React files to check.\n');
    process.exit(0);
  }

  console.log(`📂 Scanning ${stagedFiles.length} staged file(s):\n`);

  let allViolations: Violation[] = [];

  stagedFiles.forEach(file => {
    const violations = scanFileForViruses(file);
    if (violations.length === 0) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} (${violations.length} infection${violations.length > 1 ? 's' : ''})`);
    }
    allViolations = allViolations.concat(violations);
  });

  if (allViolations.length > 0) {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🦠 CLERK VIRUS DETECTED - COMMIT BLOCKED                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Group by category
    const byCategory: Record<string, Violation[]> = {};
    allViolations.forEach(v => {
      if (!byCategory[v.category]) byCategory[v.category] = [];
      byCategory[v.category].push(v);
    });

    const categoryNames: Record<string, string> = {
      'A': 'DIRECT IMPORTS (CRITICAL)',
      'B': 'INDIRECT IMPORTS',
      'H': 'UI VIRUSES',
      'K': 'GOLDEN BRIDGE IDENTITY BREACH',
    };

    for (const [cat, violations] of Object.entries(byCategory)) {
      console.log(`CATEGORY ${cat} - ${categoryNames[cat] || 'UNKNOWN'}: ${violations.length}`);
      violations.forEach(v => {
        console.log(`  ❌ ${v.file}:${v.line}`);
        console.log(`     ${v.message}`);
        console.log(`     Code: ${v.code}`);
        console.log('');
      });
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('⛔ PRESCRIPTION:\n');
    console.log('  1. REMOVE all Clerk imports from sovereign territory');
    console.log('  2. Use readSessionCookie() for identity in Server Actions');
    console.log('  3. Pass callerClerkId to Convex as argument, not via token');
    console.log('  4. Domain views read from FUSE store, never Clerk\n');
    console.log('📖 Documentation:');
    console.log('  - _clerk-virus/TTT-CLERK-VIRUS-HIGH-ALERT.md');
    console.log('  - _clerk-virus/TTT-99-WAYS-CLERK-CAN-INFECT.md\n');

    process.exit(1);
  }

  console.log('\n✅ CLERK VIRUS SCAN PASSED - Sovereignty protected!\n');
  process.exit(0);
}

main();
