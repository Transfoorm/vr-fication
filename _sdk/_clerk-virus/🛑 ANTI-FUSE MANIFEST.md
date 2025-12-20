🛑 ANTI-FUSE MANIFEST

Every Identity Violation Humanly Imaginable

The Complete Catalogue of Sovereignty-Breaking Behaviours

⸻

⚔️ SECTION 1 — AUTHENTICATION BREACHES

Any of these instantly destroys FUSE sovereignty.

1.1 Using auth() anywhere outside the auth boundary

1.2 Calling auth().userId and treating it as primary identity

1.3 Using Clerk session tokens to decide permissions

1.4 Using useAuth() or useUser() inside features

1.5 Using Clerk cookies directly in any client code

1.6 Allowing client-side auth to govern server behaviour

1.7 Using Clerk’s JWT claims for role determination

1.8 Calling currentUser() in API handlers

1.9 Passing Clerk ID as identity to any server action

1.10 Passing Clerk ID to Convex at any point

⸻

⚔️ SECTION 2 — IMPORT-LEVEL INFECTIONS

Contamination through import statements alone.

2.1 Importing @clerk/nextjs outside /app/(auth)

2.2 Importing Clerk React hooks in features/domains

2.3 Using <SignedIn> / <SignedOut> in domain UI

2.4 Importing Clerk types (e.g., User) into business logic

2.5 Transitive imports pulling Clerk into sovereign zones

⸻

⚔️ SECTION 3 — MUTATION-SIDE IDENTITY COLLAPSE

Convex is the identity engine; these break it.

3.1 Mutation accepts clerkId: string

3.2 Mutation fetches a user via by_clerk_id

3.3 Mutation internally derives identity from Clerk

3.4 Mutation performs authorization from Clerk identity

3.5 Mutation writes Clerk identity into domain tables

3.6 Mutation checks role from Clerk (admin flag, etc.)

⸻

⚔️ SECTION 4 — QUERY-SIDE SOVEREIGNTY BREAKS

Identity leaks or mis-routed authority.

4.1 Query receives clerkId argument from runtime

4.2 Query uses ctx.auth.getUserIdentity() for authorization

4.3 Query checks user role based on Clerk claim

4.4 Query looks up user via Clerk email

4.5 Query spreads Clerk data into API responses

4.6 Query returns Clerk identifiers in its payload

⸻

⚔️ SECTION 5 — SCHEMA-LEVEL VIOLATIONS

Any of these break identity at the database layer.

5.1 Storing clerkId as a primary or foreign key

5.2 Using .index("by_clerk_id") in any domain table

5.3 Allowing clerkId to be indexed at all

5.4 Encoding Clerk identity inside composite indexes

5.5 Storing authorization state in Clerk fields

5.6 Tables referencing Clerk IDs instead of Convex IDs

5.7 Orphaned records created by Clerk-driven lookups

⸻

⚔️ SECTION 6 — COOKIE & SESSION VIOLATIONS

Identity corruption through hydration.

6.1 FUSE cookie missing _id (sovereign ID)

6.2 Using clerkId as the canonical identity

6.3 Client reading Clerk session cookies

6.4 Storing Clerk JSON inside app cookies

6.5 Hydrating UI state from Clerk instead of FUSE

6.6 Modifying FUSE state based on Clerk tokens

⸻

⚔️ SECTION 7 — API ROUTE VIOLATIONS

Any API route that uses Clerk is contaminated.

7.1 Using auth() inside /api/** routes

7.2 Using Clerk to fetch the user record

7.3 Using Clerk identity to decide permissions

7.4 Passing Clerk identity into Convex

7.5 Using Clerk to gate access to a backend resource

7.6 Building REST endpoints around Clerk identity

⸻

⚔️ SECTION 8 — UI / FEATURE-ZONE VIOLATIONS

Identity bugs introduced by front-end components.

8.1 Any Clerk hook in /src/features/**

8.2 UI checking if (clerkUser) for access

8.3 Feature components reading Clerk session

8.4 Forms posting clerkId to server actions

8.5 Mixing Clerk user with FUSE session in React state

8.6 Using Clerk provider inside feature components

⸻

⚔️ SECTION 9 — STATE, STORE & HYDRATION POLLUTION

Identity breaks that come from internal state management.

9.1 Storing clerkId in global store

9.2 Storing Clerk user object in Redux / Zustand

9.3 Deriving UI identity from Clerk instead of FUSE

9.4 Any hydration pipeline reading Clerk identity

9.5 Passing Clerk identity to preloading functions (WARP/PRISM)

9.6 Role-checking inside store based on Clerk

⸻

⚔️ SECTION 10 — NAVIGATION & ROUTING VIOLATIONS

Identity leaks caused by router-level logic.

10.1 Protecting routes via Clerk identity

10.2 Redirect logic using Clerk session

10.3 if (!clerkUser) redirect("/login") outside auth boundary

10.4 Next.js middleware using Clerk to enforce access

10.5 Client transitions checking Clerk identity before FUSE

⸻

⚔️ SECTION 11 — FEATURE GATE VIOLATIONS

Clerk decides access instead of FUSE/Convex.

11.1 Showing/hiding UI based on Clerk roles

11.2 Verifying email via Clerk instead of server action

11.3 Using Clerk status to determine setup completion

11.4 Letting Clerk verify feature availability

11.5 Passing Clerk identity into analytics / tracking

⸻

⚔️ SECTION 12 — RUNTIME ELEVATION PATHS

How Clerk “re-enters” the system at runtime.

12.1 Using Clerk after session hydration

12.2 Reading Clerk JWT client-side

12.3 Using Clerk to elevate permissions client-side

12.4 Using Clerk identity to refresh privileged state

12.5 Allowing Clerk webhooks to override Convex identity

12.6 Allowing Clerk API to mutate domain data directly

⸻

⚔️ SECTION 13 — ORIGIN & HATCHERY BREAKS

Any of these destroys the identity birth logic.

13.1 Multiple identity birth points in codebase

13.2 Allowing identity to be minted without Convex _id

13.3 Minting session before ensureUser runs

13.4 Using Clerk data to populate user tables

13.5 Allowing Clerk to “overrule” identity birth

⸻

⚔️ SECTION 14 — BACKCHANNEL / SIDE-DOOR INFRACTIONS

Identity leaks inside background or hidden processes.

14.1 CRON jobs using Clerk API for identity

14.2 Edge functions deriving permissions from Clerk

14.3 Any backend worker trusting Clerk ID as authority

14.4 Analytics pipeline attributing actions to Clerk ID

14.5 Sync scripts or admin scripts using Clerk identity

⸻

⚔️ SECTION 15 — VENDOR LOCK-IN VIOLATIONS

Red flags that compromise vendor independence.

15.1 Clerk ID used as canonical identity

15.2 Domain tables storing vendor-specific identifiers

15.3 Business logic referencing Clerk fields

15.4 Role system based on Clerk

15.5 Permissions encoded inside Clerk metadata

⸻

⚔️ SECTION 16 — HYDRATION PIPELINE COLLISION

When Clerk “re-enters” hydration and corrupts FUSE state.

16.1 Clerk rehydrating user state on page load

16.2 Clerk preloading user into React tree before FUSE

16.3 FUSE store initialising using Clerk values

16.4 WARP/PRISM preloading based on Clerk session

16.5 React Island / RSC reintroducing Clerk identity

⸻

⚔️ SECTION 17 — HOLE-PUNCHING EXPLOITS

How Clerk identity “punches through” sovereignty.

17.1 “Just pass clerkId to debug something”

17.2 “Temporary Clerk lookup” left in production

17.3 Feature flag based on Clerk roles

17.4 Email lookup pipeline starting from Clerk

17.5 Fallback to Clerk identity when FUSE cookie missing

⸻

⚔️ SECTION 18 — MISPLACED RESPONSIBILITY

Where Clerk is trusted to do what Convex/FUSE must do.

18.1 Clerk validates user permissions

18.2 Clerk decides rank or roles

18.3 Clerk determines org membership

18.4 Clerk handles identity migration events

18.5 Clerk stores product-level settings

⸻

⚔️ SECTION 19 — RECOVERY PATH CORRUPTION

Breaks during edge-case flows.

19.1 Recover account using Clerk ID

19.2 Recreate user record using Clerk identity

19.3 Resolving orphaned records by Clerk lookup

19.4 Password reset pipeline tied to Clerk ID

19.5 Using Clerk deletion webhook to delete Convex users

⸻

⚔️ SECTION 20 — THE “NUCLEAR FAILURES”

The most catastrophic identity violations.

20.1 Two identity masters exist (Clerk + Convex)

20.2 Clerk ID becomes de facto primary key

20.3 Convex identity derived from Clerk

20.4 App boots without sovereign _id

20.5 Role system tied to Clerk instead of FUSE

20.6 FUSE cookie contains Clerk user profile

20.7 Clerk becomes required to access Convex

20.8 Convex rejects requests without Clerk ID

20.9 Identity computation duplicated in multiple layers

20.10 Identity Birth Ceremony bypasses Convex lookup