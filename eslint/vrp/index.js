/**
 * VRP ESLint Plugin - Virgin Repo Protocol Enforcement
 *
 * Rules:
 *   - no-foreign-auth: Blocks foreign authentication systems outside auth boundary
 *   - no-eslint-disable: Blocks eslint-disable comments (VRP bypass prevention)
 *   - no-fuse-in-domains: Blocks FUSE hooks and Convex calls in domain files
 *
 * Ref: VRP-PROTOCOL.md, TTT-99-WAYS-CLERK-CAN-INFECT.md, DOMAIN-AND-FEATURES-SETUP.md
 */

const noForeignAuth = require('./no-foreign-auth.js');
const noEslintDisable = require('./no-eslint-disable.js');
const noFuseInDomains = require('./no-fuse-in-domains.js');

module.exports = {
  rules: {
    'no-foreign-auth': noForeignAuth.rules['no-foreign-auth'],
    'no-eslint-disable': noEslintDisable.rules['no-eslint-disable'],
    'no-fuse-in-domains': noFuseInDomains.rules['no-fuse-in-domains'],
  },
};
