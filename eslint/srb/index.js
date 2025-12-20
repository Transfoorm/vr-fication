/**
 * SRB ESLint Plugin - Sovereignty Rules Enforcement
 *
 * Rules:
 *   - no-identity-in-views: Blocks identity resolution in domain views
 *
 * Ref: TTTS-ENFORCEMENT.md, SRB-1 through SRB-15
 */

const noIdentityInViews = require('./no-identity-in-views.js');

module.exports = {
  rules: {
    'no-identity-in-views': noIdentityInViews.rules['no-identity-in-views'],
  },
};
