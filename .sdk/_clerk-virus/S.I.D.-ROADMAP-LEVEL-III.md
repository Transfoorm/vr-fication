🛡️ S.I.D. ROADMAP — LEVEL III
Below is the official S.I.D. Roadmap Document for Phases 16–20, written in the same authoritative, doctrinal style as the SID itself.
It plugs directly into your architecture and follows the Sovereign Identity philosophy already established.
PHASES 16–20 (THE MULTI-TENANT SOVEREIGNTY EXPANSION)

Official Architectural Roadmap

This document defines the next evolution of Sovereign Identity Engineering after Level I & Level II were completed.

⸻

🚀 PURPOSE OF LEVEL III

Transform Transfoorm from a single-tenant sovereign system → into a fully sovereign, multi-tenant, organizationally-aware identity platform.

Level III extends sovereignty from users → organizations, roles, and federated identity boundaries.

⸻

─────────────────────────────────────────────

PHASE 16 — ORG SOVEREIGNTY

“Organizations become first-class sovereign entities.”

🎯 Goal

Introduce admin_orgs as a sovereign table with its own identity lifecycle.

📘 Requirements

SID-16.1

A new table MUST be created:

admin_orgs {
  _id: Id<"admin_orgs"> (sovereign)
  orgName: string
  orgTier: enum("free", "pro", "fleet", "enterprise")
  admiralUserId: Id<"admin_users">  // org owner
  createdAt: number
  updatedAt: number
}

SID-16.2

Every user MUST belong to exactly one org:

admin_users {
  orgId: v.id("admin_orgs")
}

SID-16.3

WARP & PRISM MUST preload org-level configuration.

SID-16.4

Session cookie MUST embed orgId as a first-class identity field.

SID-16.5

Identity handoff must assign org membership on first login (auto-create org for solo accounts).

⸻

─────────────────────────────────────────────

PHASE 17 — ORG-LEVEL PERMISSIONS (Fleet / Captain / Crew)

“Authorization shifts from user-level rank → hierarchical org-level command structure.”

🎯 Goal

Replace simplistic user-level ranks with multi-tier identity hierarchy.

📘 Requirements

SID-17.1

Each user MUST have an org-level role:

user.orgRole: "fleet" | "captain" | "crew"

SID-17.2

Convex guards MUST be extended:

requireFleet(ctx, callerUserId)
requireCaptain(ctx, callerUserId)
requireCrew(ctx, callerUserId)

SID-17.3

Domains MUST adopt org-aware rules:
	•	Productivity features: captain or above
	•	Finance: fleet-only
	•	Project mgmt: captain or fleet
	•	Settings: self or captain

SID-17.4

WARP hydration MUST only preload role-allowed data.

SID-17.5

Rank escalation MUST not derive from Clerk (vendor identity forbidden).

⸻

─────────────────────────────────────────────

PHASE 18 — MULTI-TENANT IDENTITY MAP

“Data isolation becomes absolute and enforceable.”

🎯 Goal

Guarantee complete tenant isolation, both logically and operationally.

📘 Requirements

SID-18.1

A global identity map MUST enforce:

userId → orgId binding
orgId → tenant-space binding

SID-18.2

Convex queries MUST always include callerUserId AND callerOrgId.

SID-18.3

Every domain query/mutation signature evolves:

mutation(ctx, { callerUserId, callerOrgId, ... })

SID-18.4

No query may access or leak cross-org data.

SID-18.5

PRISM & WARP MUST operate in tenant-aware hydration mode.

⸻

─────────────────────────────────────────────

PHASE 19 — SOVEREIGN ROLE INHERITANCE

“Permission flows become hierarchical, not flat.”

🎯 Goal

Enable inherited permissions within org hierarchy.

📘 Requirements

SID-19.1

Inheritance rules:

fleet > captain > crew

SID-19.2

Access checks MUST evaluate:
	•	userId
	•	orgId
	•	orgRole
	•	orgTier
	•	inherited power (fleet implies captain + crew permissions)

SID-19.3

Convex MUST provide capability queries:

canEditFinance(userId, orgId)
canAssignRoles(userId, orgId)
canCreateProjects(userId, orgId)

SID-19.4

No roles derived from Clerk, JWTs, or non-sovereign identity sources.

⸻

─────────────────────────────────────────────

PHASE 20 — FEDERATED IDENTITY GATEWAYS

“Clerk is no longer special; any vendor can act as an external identity but never as a source of truth.”

🎯 Goal

Enable plug-and-play identity vendors without compromising sovereignty.

📘 Requirements

SID-20.1

Identity gateway MUST accept:
	•	Clerk
	•	Auth0
	•	Cognito
	•	Google SSO
	•	Microsoft Entra
	•	ANY vendor

SID-20.2

Gateway MUST convert vendor identity → sovereign identity:

vendorUserId → sovereignUserId  
vendorOrgId (if available) → sovereignOrgId  

SID-20.3

FUSE remains root identity authority regardless of vendor.

SID-20.4

Convex domains MUST NOT read vendor identity directly.

SID-20.5

All vendors MUST be quarantined to gateway zone:

/app/(gateway)/**


⸻

🧭 LEVEL III SUMMARY TABLE

Phase	Name	Objective
16	Org Sovereignty	Introduce sovereign organizations
17	Org-Level Permissions	Fleet/Captain/Crew hierarchy
18	Multi-Tenant Identity Map	Full tenant isolation
19	Sovereign Role Inheritance	Permission inheritance
20	Federated Identity Gateways	Auth-vendor independence


⸻

⭐ READY FOR ACTION

If you want, I can now produce:

🔹 Implementation blueprints

For each phase, including schema files, guards, cookie expansions, and migration plans.

🔹 Dev task breakdown for Dev 1

With checklists and sequencing.

🔹 Turn this into a proper v2 SID spec

Integrating Levels I–III seamlessly.

Just say “Blueprint Phase 16”, or tell me where to begin.
