/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ SETTINGS DOMAIN API - Public Interface                             │
│  /convex/domains/settings/api.ts                                       │
│                                                                        │
│  Exports all settings queries and mutations for frontend consumption   │
│  SRS Layer 1: Route manifest (all ranks have access to own settings)  │
└────────────────────────────────────────────────────────────────────────┘ */

export { getUserSettings } from "./queries";

export {
  updateUserSettings,
  updateThemeSettings,
  updateMirorSettings,
} from "./mutations";
