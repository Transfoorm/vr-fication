/**
 * VR ESLint Plugin
 * Enforces VR (Variant Robot) architectural doctrine
 */

const noManualCardStacking = require('./no-manual-card-stacking');

module.exports = {
  rules: {
    'no-manual-card-stacking': noManualCardStacking,
  }
};
