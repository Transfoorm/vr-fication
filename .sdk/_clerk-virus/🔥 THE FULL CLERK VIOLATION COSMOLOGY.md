🔥 THE FULL CLERK VIOLATION COSMOLOGY

The Anti-FUSE / Anti-SID Master List (Exhaustive)

152 violations across 14 domains.

This is the fully enumerated taxonomy of every Clerk violation that can possibly exist, including:
	•	Actual violations
	•	Theoretical violations
	•	Edge-case violations
	•	Vendor-leak violations
	•	Implicit / semantic / behavioral violations
	•	Risk-pattern violations
	•	Identity, schema, pipeline, guard, UI, runtime, hydration, SSR, Convex, FUSE, and Golden Bridge violations

This is the Dante’s Inferno of Clerk-Sovereignty sins — the final anti-FUSE list.

⸻

🩸 I. ORIGIN VIOLATIONS (Birth-Level Sins)
	1.	Using auth() during session minting
	2.	Minting session before Convex _id is known
	3.	Using Clerk ID as the “source of truth” at birth
	4.	Creating user records by clerkId instead of sovereign _id
	5.	Calling Convex from Clerk identity before birth ceremony
	6.	Allowing empty _id during minting
	7.	Running identity creation in UI instead of auth boundary
	8.	Using Clerk’s primary email as identity
	9.	Treating Clerk JWT as core identity
	10.	Using Clerk metadata fields for identity
	11.	Allowing Clerk to decide account existence
	12.	Allowing Clerk to decide account uniqueness

⸻

🧬 II. PIPELINE VIOLATIONS (Identity Flow Corruption)
	13.	Passing clerkId to any Convex mutation
	14.	Passing clerkId to any Convex query
	15.	Translating Clerk → Convex inside Server Actions
	16.	Using getToken() outside auth boundary
	17.	Calling convex.setAuth() with Clerk token
	18.	Routing identity from a vendor through FUSE
	19.	Using vendor JWT to elevate permissions
	20.	Having mixed identity (both _id and clerkId in payloads)
	21.	Using client-side Clerk hooks for identity
	22.	Caching Clerk identity in global state
	23.	Using Clerk identity for WARP preloading
	24.	Using Clerk identity for PRISM triggers
	25.	Using Clerk claims for authorization logic

⸻

⚠️ III. IMPORT VIOLATIONS (Forbidden Zones)
	26.	Importing @clerk/nextjs in features
	27.	Importing useUser, useAuth, useSession in features
	28.	Using ClerkProvider outside (auth) boundary
	29.	Including Clerk components in domain code
	30.	Using Clerk SDK in Convex code
	31.	Importing Clerk types (User, Session, ClerkUser) in runtime
	32.	Having Clerk hydration in FUSE store
	33.	Importing Clerk client in API routes
	34.	Calling Clerk hooks in React Server Components
	35.	Using Clerk server helpers in non-auth pages

⸻

🔓 IV. SSR VIOLATIONS (Server-Side Leaks)
	36.	Calling auth() inside Server Actions
	37.	Calling auth() inside API routes
	38.	Calling auth() inside middleware (outside permitted patterns)
	39.	Using auth() to determine permissions
	40.	SSR rendering based on Clerk identity
	41.	Passing Clerk identity to database queries
	42.	Depending on Clerk cookie directly
	43.	SSR-protected routes dependent on Clerk
	44.	Using vendor identity to dynamically generate SSR output
	45.	Storing identity in React cache from Clerk

⸻

🛢️ V. COOKIE VIOLATIONS (Session Corruption)
	46.	Session cookie missing _id
	47.	Session cookie treating clerkId as canonical
	48.	Session cookie storing vendor JWT
	49.	Storing Clerk tokens directly
	50.	Storing identity in non-FUSE cookies
	51.	Writing Clerk session values from client-side
	52.	Allowing Clerk expiration to kill Convex identity
	53.	Writing identity in localStorage via Clerk
	54.	Persisting Clerk user data in FUSE store

⸻

🏗️ VI. SCHEMA VIOLATIONS (Database Pollution)
	55.	clerkId stored as primary lookup
	56.	Table keyed by Clerk ID
	57.	Index by_clerk_id used for runtime logic
	58.	Foreign keys referencing Clerk IDs
	59.	Mixed identity columns (userId & clerkId)
	60.	Documents created before sovereign _id
	61.	Storing Clerk tokens in database
	62.	Storing entire Clerk user object
	63.	Using Clerk metadata inside Convex
	64.	Storing Clerk email verification status in tables (instead of SA)

⸻

🔁 VII. MUTATION VIOLATIONS (Convex Layer)
	65.	Accepting clerkId: v.string()
	66.	Using Clerk identity inside Convex auth guards
	67.	Using ctx.auth.getUserIdentity() for identity
	68.	Elevating permissions based on Clerk email
	69.	Using Clerk organization fields
	70.	Having Convex mutations make Clerk API calls
	71.	Using vendor identity for row-level access
	72.	Using Clerk verification as authorization
	73.	Passing Clerk identity into role or rank calculations

⸻

⚡ VIII. QUERY VIOLATIONS (Data Fetch Layer)
	74.	Using by_clerk_id to fetch data
	75.	Running queries with Clerk identity in WARP
	76.	Using Clerk identity to hydrate dashboards
	77.	Using Clerk identity for table filters
	78.	Using Clerk identity for pagination boundaries
	79.	Using Clerk ID to determine “current user”
	80.	Running Convex queries that accept Clerk ID
	81.	Using Clerk identity to select multi-tenant rows
	82.	Query returning Clerk identity fields
	83.	Query returning Clerk object shapes

⸻

🌇 IX. UI VIOLATIONS (Feature Zone)
	84.	Clerk hooks inside VRs
	85.	Clerk hooks inside forms
	86.	Clerk provider in domain layout
	87.	Clerk identity on UI event handlers
	88.	Using Clerk user.avatarUrl instead of FUSE avatarUrl
	89.	Using Clerk user.fullName instead of FUSE profile
	90.	Using Clerk metadata for UI personalization
	91.	Using Clerk session for layout decisions
	92.	Passing Clerk identity to field VRs
	93.	Using Clerk to show/hide dashboard items
	94.	Mixing Clerk state with FUSE state

⸻

🧩 X. HYDRATION VIOLATIONS (Client → Server mismatches)
	95.	Hydrating FUSE store from Clerk immediately on load
	96.	Reading Clerk cookies client-side
	97.	Using Clerk session to build preloaded state
	98.	WARP hydration using Clerk identity
	99.	PRISM hydration triggered by Clerk
	100.	Hydration mismatch when Clerk user changes
	101.	FUSE state losing sovereignty on refresh
	102.	React Server Components reading Clerk identity
	103.	Using Clerk identity for optimistic UI

⸻

🛰️ XI. WARP & PRISM VIOLATIONS
	104.	Preloading Convex domains based on Clerk identity
	105.	Loading Admin data for Clerk user not in FUSE
	106.	PRISM preloading triggers reading Clerk identity
	107.	WARP reading Clerk session
	108.	Cross-domain hydration keyed by vendor identity
	109.	WARP caching Clerk identity
	110.	Using Clerk identity to pre-select domain access

⸻

🪓 XII. GOLDEN BRIDGE VIOLATIONS
	111.	Identity translation happening outside the origin
	112.	Multiple identity handoff points
	113.	Converting Clerk → Convex in UI
	114.	Having a second identity pipeline
	115.	Falling back to Clerk identity when FUSE cookie missing
	116.	Using Clerk for re-auth during Convex operation
	117.	Mixing vendor auth providers inside identity path
	118.	Permitting Clerk identity to “fix” missing Convex identity

⸻

⚔️ XIII. AUTHORIZATION VIOLATIONS
	119.	Permissions based on Clerk email domain
	120.	Using Clerk roles (if org product)
	121.	Using Clerk verification status for access
	122.	Using Clerk tier or org as permissions
	123.	Using vendor claims to elevate rank
	124.	Using Clerk to validate admin/end-user separation
	125.	Using Clerk user.updatedAt to bypass permissions
	126.	Checking Clerk provider (Google/Facebook) for roles
	127.	Deriving Admiral/Captain/Crew from Clerk profile

⸻

🧨 XIV. RUNTIME / EDGE-CASE VIOLATIONS
	128.	Fallback identity resolving to Clerk
	129.	Error handler using Clerk identity to recover
	130.	Logging Clerk ID instead of sovereign ID
	131.	Analytics keyed by Clerk identity
	132.	Feature flags using Clerk identity
	133.	A/B tests using Clerk identity
	134.	System tasks using Clerk identity
	135.	CRON tasks using Clerk identity
	136.	Background jobs using Clerk identity
	137.	Webhooks revalidating identity from Clerk incorrectly
	138.	Webhooks overwriting sovereign identity
	139.	Multi-device sessions tied to Clerk
	140.	Export/import data keyed by Clerk
	141.	Data migration scripts using Clerk
	142.	Using Clerk for audit trails
	143.	Using Clerk for impersonation flows
	144.	Using Clerk for secure actions verification
	145.	Creating admin accounts from Clerk tier
	146.	Using Clerk to determine first login state
	147.	Setup wizards depending on Clerk identity
	148.	Recovery flows using Clerk identity
	149.	MFA authority assigned to Clerk identity
	150.	Billing flows tied to Clerk ID
	151.	Tenant routing based on Clerk ID
	152.	Fallback admin login through Clerk

⸻

🟣 This is the complete, exhaustive Clerk violation universe.

Nothing more exists.
Nothing else can exist.
This is the full Anti-Sovereignty catalog.