# 🏢 BRAND LOGO UPLOAD SDK
**Complete Wiring Specification for Company Button Brand Logo System**

---

## 📖 TABLE OF CONTENTS

1. [Philosophy](#philosophy)
2. [Complete Flow Diagrams](#complete-flow-diagrams)
3. [File Map & Code Walkthrough](#file-map--code-walkthrough)
4. [Troubleshooting Guide](#troubleshooting-guide)
5. [Testing Checklist](#testing-checklist)
6. [Data Flow Architecture](#data-flow-architecture)
7. [Quick Reference](#quick-reference)

---

## 🧠 PHILOSOPHY

### The FUSE Doctrine for Brand Logo

**Database is the source. Cookie is the cache. URLs are for browsers. Storage IDs are for Convex.**

This is the foundation of the brand logo system. Understanding this hierarchy prevents 99% of logo upload bugs.

### Three Immutable Laws

1. **Storage IDs NEVER reach the client**
   - Database stores: `kg2abc123...` (Convex storage reference)
   - Cookie contains: `https://clinical-llama-123.convex.cloud/api/storage/...` (CDN URL)
   - Client receives: URL string or `null` (NEVER a storage ID)

2. **The database is ALWAYS the source of truth**
   - Cookie is a cache that must be refreshed from database
   - Middleware refreshes cookie on EVERY page load
   - Upload refreshes cookie immediately after save

3. **Zero loading states via cookie URLs**
   - WARP/PRISM: Logo loads BEFORE user lands on page
   - Logo URL is already in cookie from login
   - No skeleton loaders, no spinners, no flash

### The Converter Pattern

**`getCurrentUser` is THE ONLY place where storage IDs become URLs.**

```typescript
// ❌ WRONG - Raw database query returns storage IDs
const user = await ctx.db.get(userId);
// user.brandLogoUrl = "kg2abc123..." (storage ID - client can't use this!)

// ✅ CORRECT - getCurrentUser converts to URL
const user = await convex.query(api.domains.admin.users.api.getCurrentUser, { userId });
// user.brandLogoUrl = "https://..." (URL - client can render this!)
```

Every part of the system that touches brand logo URLs MUST use `getCurrentUser`, never raw `ctx.db.get()`.

---

## 🗺️ COMPLETE FLOW DIAGRAMS

### Upload Flow (User clicks "Add Your Logo")

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "Add Your Logo" in Company Button Menu          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. FILE INPUT OPENS                                             │
│    Location: /src/features/shell/company-button/index.tsx:327  │
│    <input ref={fileInputRef} type="file" accept="image/*" />   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. USER SELECTS IMAGE FILE                                      │
│    handleFileChange() runs (line 130)                           │
│    - Validates file is an image                                 │
│    - Creates preview URL (blob URL)                             │
│    - Opens cropper modal                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. CROPPER MODAL OPENS                                          │
│    Component: react-easy-crop (line 491)                        │
│    - User drags to position                                     │
│    - User scrolls to zoom                                       │
│    - Crop area updates (onCropComplete, line 82)                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. USER CLICKS "Save cropped image"                             │
│    handleUpload() runs (line 146)                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CROP IMAGE TO CANVAS                                         │
│    getCroppedImg() (line 94)                                    │
│    - Renders cropped area to canvas                             │
│    - Resizes to max 400x400px                                   │
│    - Converts to PNG blob                                       │
│    - Creates File object: "companylogo.png"                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. OPTIMISTIC UI UPDATE                                         │
│    - Create blob URL from cropped image                         │
│    - setOptimisticUrl(blobUrl) (line 169)                       │
│    - Logo preview updates instantly                             │
│    - Close cropper modal                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. GENERATE UPLOAD URL                                          │
│    Mutation: generateUploadUrl (line 179)                       │
│    Location: /convex/storage/generateUploadUrl.ts              │
│    Returns: Signed Convex upload URL (expires in 5 min)        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. UPLOAD FILE TO CONVEX STORAGE                                │
│    fetch(url, { method: "POST", body: file }) (line 188)       │
│    - Uploads cropped PNG to Convex CDN                          │
│    - Returns: { storageId: "kg2abc123..." }                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. SAVE STORAGE ID TO DATABASE                                 │
│     Mutation: uploadBrandLogo (line 198)                        │
│     Location: /convex/identity/uploadBrandLogo.ts              │
│     - Updates user.brandLogoUrl = storageId (not URL!)          │
│     - Database now has: "kg2abc123..."                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. WAIT FOR URL CONVERSION                                     │
│     waitForImageUrl() polls every 500ms (line 63)               │
│     - Calls getImageUrl query                                   │
│     - Waits for ctx.storage.getUrl() to succeed                 │
│     - Max 10 retries (5 seconds total)                          │
│     - Returns: CDN URL "https://..."                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 12. COMMIT URL TO UI STATE                                      │
│     - setCommittedUrl(newLogoUrl) (line 201)                    │
│     - setOptimisticUrl(null)                                    │
│     - Revoke blob URL                                           │
│     - Logo now shows final CDN URL                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 13. REFRESH FUSE STORE                                          │
│     - Query getCurrentUser with userId (line 211)               │
│     - getCurrentUser CONVERTS storage ID → URL                  │
│     - useFuse.getState().setUser({ brandLogoUrl: url })         │
│     - FUSE store now has URL, not storage ID                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 14. REFRESH SESSION COOKIE                                      │
│     refreshSessionAfterUpload() (line 240)                      │
│     Location: /src/app/actions/user-mutations.ts               │
│     - Fetches fresh user with getCurrentUser                    │
│     - getCurrentUser returns URL (already converted)            │
│     - Mints new session cookie with URL                         │
│     - Sets cookie (maxAge: 30 days)                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 15. UPLOAD COMPLETE                                             │
│     ✅ Database has storage ID                                  │
│     ✅ FUSE store has URL                                       │
│     ✅ Cookie has URL                                           │
│     ✅ UI shows logo from URL                                   │
│     ✅ User can refresh page - logo persists (from cookie)      │
└─────────────────────────────────────────────────────────────────┘
```

### Refresh Flow (User reloads page)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER REFRESHES PAGE (F5 or browser refresh)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE EXECUTES (BEFORE React loads)                     │
│    Location: /src/middleware.ts:66                              │
│    - Reads session cookie                                       │
│    - Gets user._id from cookie                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. MIDDLEWARE FETCHES FRESH USER                                │
│    Query: getCurrentUser (line 69)                              │
│    Location: /convex/domains/admin/users/api.ts                │
│    - Reads user.brandLogoUrl (storage ID from database)         │
│    - Converts storage ID → URL via ctx.storage.getUrl()         │
│    - Returns: { brandLogoUrl: "https://..." }                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. MIDDLEWARE MINTS FRESH COOKIE                                │
│    mintSession() (line 80)                                      │
│    - brandLogoUrl: freshUser.brandLogoUrl (URL, not storage ID) │
│    - Creates new JWT with URL embedded                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. MIDDLEWARE SETS UPDATED COOKIE                               │
│    res.cookies.set(SESSION_COOKIE, token) (line 175)            │
│    - Cookie now has fresh URL from database                     │
│    - Sent with HTML response                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. SERVER-SIDE RENDER (RSC)                                     │
│    fetchUserServer() (optional)                                 │
│    Location: /src/fuse/hydration/server/fetchUser.ts           │
│    - Reads cookie (already has URL)                             │
│    - Fetches fresh user via getCurrentUser                      │
│    - Updates cookie AGAIN (double-refresh for safety)           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. HTML SENT TO BROWSER                                         │
│    - Cookie contains: brandLogoUrl = "https://..."              │
│    - React hasn't loaded yet                                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. BROWSER LOADS JAVASCRIPT                                     │
│    - React hydrates                                             │
│    - FUSE store initializes                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. FUSE STORE READS COOKIE                                      │
│    Location: /src/store/fuse.tsx (hydration logic)             │
│    - Parses session cookie                                      │
│    - Extracts brandLogoUrl (URL already converted)              │
│    - setUser({ brandLogoUrl: url })                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. COMPANY BUTTON RENDERS                                      │
│     Component: /src/features/shell/company-button/index.tsx    │
│     const logoSrc = user?.brandLogoUrl || "/images/..."         │
│     <img src={logoSrc} />                                       │
│     - Logo displays INSTANTLY (zero loading state)              │
│     - URL is already in FUSE store from cookie                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. LOGO VISIBLE                                                │
│     ✅ No network request (URL was in cookie)                   │
│     ✅ No flash of default image                                │
│     ✅ No loading spinner                                       │
│     ✅ Zero loading state achieved                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 FILE MAP & CODE WALKTHROUGH

### Overview

The brand logo upload system spans **10 files** across 4 layers:

1. **UI Layer** - Company button component with upload/crop
2. **Convex Layer** - Storage mutations and queries
3. **Session Layer** - Cookie management
4. **Middleware Layer** - Request-time cookie refresh

---

### File 1: `/src/features/shell/company-button/index.tsx`
**Role**: Client-side upload component with cropper modal

**Key Code Sections**:

#### Upload Trigger (Line 414-426)
```typescript
<button
  className="ft-company-button-menu-item"
  onClick={() => {
    fileInputRef.current?.click();  // Opens file picker
    closeMenu();
  }}
>
  <Icon variant="image-plus" size="sm" />
  <div className="ft-company-button-menu-value">
    {user?.brandLogoUrl ? 'Change Your Logo' : 'Add Your Logo'}
  </div>
</button>
```

#### File Selection Handler (Line 130-144)
```typescript
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  event.target.value = ""; // Clear to allow re-selecting same file

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    console.error("Only image files are allowed");
    return;
  }

  setSelectedFile(file);        // Store file for upload
  setShowCropperModal(true);    // Open cropper
  setIsCropping(true);          // Enable crop mode
};
```

#### Upload Handler (Line 146-257)
```typescript
const handleUpload = async () => {
  // 1. Crop image to canvas (400x400 max)
  const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
  const fileToUpload = new File([croppedBlob], "companylogo.png", { type: "image/png" });

  // 2. Optimistic UI update
  const optimisticBlobUrl = URL.createObjectURL(croppedBlob);
  setOptimisticUrl(optimisticBlobUrl);  // Logo shows cropped preview instantly

  // 3. Generate signed upload URL
  const url = await generateUploadUrl({ userId: user!.id });

  // 4. Upload to Convex storage
  const uploadRes = await fetch(url, { method: "POST", body: fileToUpload });
  const { storageId } = await uploadRes.json();

  // 5. Save storage ID to database
  await uploadBrandLogo({ fileId: storageId, userId: user!.id });

  // 6. Wait for URL conversion (polls every 500ms)
  const newLogoUrl = await waitForImageUrl(storageId);

  // 7. Commit URL to UI
  setCommittedUrl(newLogoUrl);
  setOptimisticUrl(null);

  // 8. Refresh FUSE store
  const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
    userId: user!.id,
  });
  useFuse.getState().setUser({
    brandLogoUrl: freshUser.brandLogoUrl  // URL, not storage ID
  });

  // 9. Refresh session cookie
  await refreshSessionAfterUpload();
};
```

#### Three-Tier State System (Line 55-58)
```typescript
// Prevents flash on upload - shows optimistic preview until URL commits
const [committedUrl, setCommittedUrl] = useState<string | null>(null);    // Final CDN URL
const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);  // Blob URL during upload
const [previousUrl, setPreviousUrl] = useState<string | null>(null);      // Rollback on error

// Display logic (line 265)
const logoSrc = optimisticUrl || committedUrl || user?.brandLogoUrl || "/images/sitewide/enterprise.png";
```

**Why This Matters**:
- Optimistic UI shows cropped preview immediately
- If upload fails, rollback to previous URL
- No flash between "uploading" and "complete" states

---

### File 2: `/convex/identity/uploadBrandLogo.ts`
**Role**: Convex mutation that saves storage ID to database

**Full Code** (expected):
```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const uploadBrandLogo = mutation({
  args: {
    fileId: v.id("_storage"),
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    // Update user record with storage ID (NOT URL)
    await ctx.db.patch(args.userId, {
      brandLogoUrl: args.fileId  // Stores "kg2abc123..." in database
    });

    console.log('✅ Brand logo storage ID saved to database');
    return { success: true };
  },
});
```

**Why This Matters**:
- Database stores storage IDs, not URLs
- URLs are generated on-demand via `ctx.storage.getUrl()`
- This keeps database decoupled from CDN infrastructure

---

### File 3: `/convex/domains/admin/users/api.ts`
**Role**: THE CONVERTER - Transforms storage IDs to URLs

**Critical Code** (Line 260-329):
```typescript
export const getCurrentUser = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // ─────────────────────────────────────────────────────────────
    // BRAND LOGO URL RESOLUTION (Storage ID → CDN URL)
    // ─────────────────────────────────────────────────────────────
    let brandLogoUrl = null;
    const logoField = user.brandLogoUrl;

    if (logoField) {
      // Check if already an HTTP URL (legacy or external)
      if (typeof logoField === 'string' && logoField.startsWith('http')) {
        brandLogoUrl = logoField;  // Already a URL, use as-is
      } else {
        // It's a storage ID - convert to URL
        try {
          const url = await ctx.storage.getUrl(logoField);
          if (url) {
            brandLogoUrl = url;
            console.log('✅ Brand logo URL resolved:', url.substring(0, 60));
          } else {
            console.error('❌ Brand logo URL is null for storage ID:', logoField);
            brandLogoUrl = null;  // ✅ Return null, NOT storage ID
          }
        } catch (error) {
          console.error('❌ Error resolving brand logo storage ID:', error);
          brandLogoUrl = null;
        }
      }
    }

    return {
      ...user,
      brandLogoUrl  // ✅ Returns URL or null (NEVER storage ID)
    };
  },
});
```

**Why This Matters**:
- This is THE ONLY place where storage IDs become URLs
- Every part of the system must use `getCurrentUser`, never raw `ctx.db.get()`
- Fallback is `null` (client shows default image), NOT storage ID (would cause 404)

---

### File 4: `/src/app/actions/user-mutations.ts`
**Role**: Server action that refreshes session cookie after upload

**Critical Code** (Line 344-394):
```typescript
export async function refreshSessionAfterUpload() {
  const session = await readSessionCookie();
  if (!session) throw new Error('No session');

  // Fetch fresh user with URLs (not storage IDs)
  const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
    userId: session._id as Id<"admin_users">,
  });

  if (!freshUser) throw new Error('User not found');

  console.log('🔍 refreshSessionAfterUpload - brandLogoUrl from Convex:', freshUser.brandLogoUrl);

  // getCurrentUser already converts storage IDs to URLs
  // No additional conversion needed here
  const token = await mintSession({
    _id: String(freshUser._id),
    clerkId: session.clerkId,
    brandLogoUrl: freshUser.brandLogoUrl || undefined,  // ✅ Already a URL
    // ... rest of session data
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,  // 30 days
  });

  return { success: true };
}
```

**Why This Matters**:
- Immediately updates cookie after upload completes
- User can refresh page and logo persists (from cookie)
- Trusts `getCurrentUser` to provide URL (no duplicate conversion)

---

### File 5: `/src/middleware.ts`
**Role**: THE GUARDIAN - Refreshes cookie from database on EVERY request

**Critical Code** (Line 62-122):
```typescript
export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Read current session cookie
  let session = await readSessionCookie();

  // 🔄 CRITICAL: Refresh cookie with fresh database data on every request
  let updatedCookieToken: string | null = null;

  if (session && session._id && !isPublicRoute(req) && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    try {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

      // Fetch fresh user from database with URLs
      const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
        userId: session._id as Id<"admin_users">
      });

      if (freshUser) {
        console.log('🔍 MIDDLEWARE: Fresh user from DB:', {
          brandLogoUrl: freshUser.brandLogoUrl?.substring(0, 60)
        });

        // Mint fresh session with latest database data
        updatedCookieToken = await mintSession({
          _id: String(freshUser._id),
          clerkId: session.clerkId,
          brandLogoUrl: freshUser.brandLogoUrl ?? undefined,  // ✅ URL from database
          // ... rest of session data
        });

        // Update session object for use below
        session = {
          ...session,
          brandLogoUrl: freshUser.brandLogoUrl ?? undefined,
        };

        console.log('✅ FUSE Middleware: Cookie refreshed with DB data');
      }
    } catch (error) {
      console.error('❌ FUSE Middleware: Failed to refresh cookie:', error);
    }
  }

  // ... routing logic ...

  const res = NextResponse.next();

  // Set updated cookie if we refreshed from database
  if (updatedCookieToken) {
    res.cookies.set(SESSION_COOKIE, updatedCookieToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return res;
});
```

**Why This Matters**:
- This is THE KEY FIX that solved the entire brand logo persistence issue
- Every page load refreshes cookie from database
- If upload happened, next refresh gets new URL
- User NEVER sees stale cookie data

---

### File 6: `/src/app/(auth)/actions/identity-handoff.ts`
**Role**: Creates initial session cookie on login

**Critical Code** (Line 120-140):
```typescript
// STEP 4: Verify Convex user exists
const convexUser = await convex.mutation(api.identity.ensureUser.ensureUser, {
  clerkId: clerkId,
  email: email,
});

// STEP 4.5: Fetch user with converted URLs — WARP/PRISM ready
const userWithUrls = await convex.query(api.domains.admin.users.api.getCurrentUser, {
  userId: convexUser._id
});

// Use URLs from getCurrentUser (already converted from storage IDs)
const brandLogoUrlString = userWithUrls?.brandLogoUrl || undefined;

const token = await mintSession({
  _id: String(convexUser._id),
  clerkId: clerkId,
  brandLogoUrl: brandLogoUrlString,  // ✅ URL, not storage ID
  // ... rest of session data
});

cookies().set(SESSION_COOKIE, token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
});
```

**Why This Matters**:
- Login flow must call `getCurrentUser` (not just `ensureUser`)
- `ensureUser` returns raw database record with storage ID
- `getCurrentUser` converts storage ID → URL before cookie creation
- WARP/PRISM works because cookie has URL from login

---

### File 7: `/src/fuse/hydration/server/fetchUser.ts`
**Role**: Server-side user fetch with cookie refresh (optional double-safety)

**Critical Code** (Line 36-123):
```typescript
export async function fetchUserServer(): Promise<ServerUser | null> {
  const session = await readSessionCookie();
  if (!session || !session._id) return null;

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  const convexUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
    userId: session._id as Id<"admin_users">
  });

  if (!convexUser) return null;

  const userData: ServerUser = {
    _id: String(convexUser._id),
    clerkId: session.clerkId,
    brandLogoUrl: convexUser.brandLogoUrl ?? undefined,  // ✅ URL from getCurrentUser
    // ... rest of user data
  };

  // 🔄 CRITICAL: ALWAYS refresh cookie with fresh database data
  console.log('🔄 FUSE: Refreshing cookie with fresh Convex data');

  const token = await mintSession({
    _id: String(convexUser._id),
    clerkId: session.clerkId,
    brandLogoUrl: convexUser.brandLogoUrl ?? undefined,  // ✅ URL, not storage ID
    // ... rest of session data
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  console.log('✅ FUSE: Cookie refreshed - brandLogoUrl:', convexUser.brandLogoUrl?.substring(0, 50));

  return userData;
}
```

**Why This Matters**:
- Called in RSC components for server-side rendering
- Provides double-safety: middleware + RSC both refresh cookie
- Ensures cookie is ALWAYS in sync with database

---

### File 8: `/src/fuse/hydration/session/cookie.ts`
**Role**: Session cookie utilities (read, mint, verify)

**Key Functions**:
```typescript
// Read and verify session cookie
export async function readSessionCookie(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return verifySession(token);  // Decodes JWT and validates
}

// Create new session JWT
export async function mintSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(JWT_SECRET));

  return token;
}

// Session payload type
export type SessionPayload = {
  _id: string;         // Convex user _id (sovereign)
  clerkId: string;     // Clerk ID (reference only)
  brandLogoUrl?: string;  // ✅ MUST be URL, NEVER storage ID
  // ... other fields
};
```

**Why This Matters**:
- `SessionPayload.brandLogoUrl` is typed as `string` (URL) not storage ID
- `mintSession` encodes URL into JWT
- `readSessionCookie` decodes JWT to get URL
- Cookie is the cache layer between database and client

---

### File 9: `/src/store/fuse.tsx`
**Role**: Client-side FUSE store that hydrates from cookie

**Key Code** (hydration logic):
```typescript
// On client initialization, read cookie and populate store
useEffect(() => {
  const session = readSessionCookieClient();  // Client-side cookie read
  if (session) {
    setUser({
      id: session._id,
      brandLogoUrl: session.brandLogoUrl,  // ✅ URL from cookie
      // ... other fields
    });
  }
}, []);
```

**Why This Matters**:
- FUSE store is the single source of truth for client components
- Hydrates from cookie on page load (zero loading state)
- Company button reads `useFuse(s => s.user.brandLogoUrl)` to display logo
- No network request needed - URL already in store from cookie

---

### File 10: `/convex/storage/generateUploadUrl.ts`
**Role**: Generates signed upload URL for Convex storage

**Expected Code**:
```typescript
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    // Generate signed upload URL (expires in 5 minutes)
    const uploadUrl = await ctx.storage.generateUploadUrl();

    console.log('✅ Generated upload URL for user:', args.userId);
    return uploadUrl;
  },
});
```

**Why This Matters**:
- Upload URL is time-limited (5 min) and signed for security
- Client cannot upload directly to storage without this mutation
- Upload flow: generateUploadUrl → fetch(url) → uploadBrandLogo

---

## 🔧 TROUBLESHOOTING GUIDE

### Issue 1: Logo works after upload, but disappears on refresh (404 errors)

**Symptoms**:
- Upload completes successfully
- Logo displays correctly
- F5 refresh → logo breaks
- Browser console: `GET http://localhost:3000/kg2abc123... 404 (Not Found)`

**Root Cause**: Cookie contains storage ID instead of URL

**Diagnosis**:
```typescript
// Check cookie contents
const session = await readSessionCookie();
console.log('Cookie brandLogoUrl:', session.brandLogoUrl);

// ❌ BAD: "kg2abc123..." (storage ID - client can't use this!)
// ✅ GOOD: "https://clinical-llama-123.convex.cloud/api/storage/..." (URL)
```

**Fix Locations**:
1. **Middleware** (`/src/middleware.ts:69`) - Must use `getCurrentUser`, not `ctx.db.get()`
2. **Identity Handoff** (`/src/app/(auth)/actions/identity-handoff.ts:126`) - Must call `getCurrentUser` after `ensureUser`
3. **Session Refresh** (`/src/app/actions/user-mutations.ts:351`) - Must use `getCurrentUser`

**The Rule**: ANY code that reads user data for cookie creation MUST use `getCurrentUser` query.

---

### Issue 2: Logo not updating after upload

**Symptoms**:
- Upload completes without errors
- Logo doesn't change in UI
- Refresh page → logo updates

**Root Cause**: FUSE store or local state not refreshed after upload

**Diagnosis**:
```typescript
// Check if FUSE store refresh is called after upload
// Location: /src/features/shell/company-button/index.tsx:211

const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
  userId: user!.id,
});

// This should be followed by:
useFuse.getState().setUser({
  brandLogoUrl: freshUser.brandLogoUrl
});
```

**Fix**: Ensure upload handler calls both:
1. `getCurrentUser` to fetch fresh URL
2. `useFuse.getState().setUser()` to update store
3. `refreshSessionAfterUpload()` to update cookie

---

### Issue 3: `getCurrentUser` returns storage ID instead of URL

**Symptoms**:
- `freshUser.brandLogoUrl = "kg2abc123..."`
- Should be `"https://..."`

**Root Cause**: `getCurrentUser` query has fallback that returns storage ID

**Bad Code**:
```typescript
// ❌ WRONG - Returns storage ID if conversion fails
if (url) {
  brandLogoUrl = url;
} else {
  brandLogoUrl = user.brandLogoUrl;  // ❌ This is a storage ID!
}
```

**Good Code**:
```typescript
// ✅ CORRECT - Returns null if conversion fails
if (url) {
  brandLogoUrl = url;
} else {
  console.error('❌ Brand logo URL is null for storage ID:', logoField);
  brandLogoUrl = null;  // ✅ Client shows default image
}
```

**Fix Location**: `/convex/domains/admin/users/api.ts` (brand logo resolution section)

---

### Issue 4: Middleware not refreshing cookie

**Symptoms**:
- Upload works
- First refresh: logo breaks
- Second refresh: logo works
- Third refresh: logo breaks again (inconsistent)

**Root Cause**: Middleware is not running cookie refresh logic

**Diagnosis**:
```typescript
// Check middleware logs
// Should see on EVERY page load:
// "🔍 MIDDLEWARE: Fresh user from DB: { brandLogoUrl: 'https://...' }"
// "✅ FUSE Middleware: Cookie refreshed with DB data"

// If logs are missing, middleware refresh code is not executing
```

**Fix**: Ensure middleware has cookie refresh block (lines 62-122 in `/src/middleware.ts`)

---

### Issue 5: Upload fails silently

**Symptoms**:
- Click "Save cropped image"
- Nothing happens (no error, no success)
- Console shows no logs

**Diagnosis**:
```typescript
// Add detailed logging to upload handler
// Location: /src/features/shell/company-button/index.tsx:146

const handleUpload = async () => {
  try {
    console.log('🔍 [UPLOAD START]');
    console.log('🔍 [UPLOAD] Requesting upload URL...');
    const url = await generateUploadUrl({ userId: user!.id });
    console.log('🔍 [UPLOAD] Received URL:', url);

    console.log('🔍 [UPLOAD] Uploading file...');
    const uploadRes = await fetch(url, { method: "POST", body: fileToUpload });
    console.log('🔍 [UPLOAD] Upload response:', uploadRes.status, uploadRes.statusText);

    // ... rest of upload
  } catch (err) {
    console.error('❌ [UPLOAD ERROR]:', err);  // THIS SHOULD SHOW THE PROBLEM
  }
};
```

**Common Causes**:
- Upload URL generation failed (check Convex dashboard)
- File size too large (Convex limit: 1GB per file)
- Network error (check browser network tab)
- CORS issue (shouldn't happen with Convex, but check)

---

## ✅ TESTING CHECKLIST

### Test 1: Fresh Upload
- [ ] Log in to app
- [ ] Click Company Button → "Add Your Logo"
- [ ] Select image file
- [ ] Cropper modal opens
- [ ] Crop and zoom work correctly
- [ ] Click "Save cropped image"
- [ ] Logo preview updates immediately (optimistic UI)
- [ ] Wait for upload to complete
- [ ] Logo shows final CDN URL
- [ ] No console errors
- [ ] Check cookie: `document.cookie` contains `https://` URL (not `kg2...`)

### Test 2: Page Refresh Persistence
- [ ] Upload logo (Test 1)
- [ ] Press F5 to refresh page
- [ ] Logo displays immediately (zero loading state)
- [ ] No 404 errors in console
- [ ] No flash of default image
- [ ] Logo URL in FUSE store: `useFuse.getState().user.brandLogoUrl`
- [ ] Should be `https://...`, not `kg2...`

### Test 3: Multiple Refreshes
- [ ] Upload logo
- [ ] Refresh page 5 times (F5, F5, F5, F5, F5)
- [ ] Logo should persist on ALL refreshes
- [ ] Check middleware logs: "✅ FUSE Middleware: Cookie refreshed with DB data" on each refresh

### Test 4: Login Flow
- [ ] Log out
- [ ] Clear cookies (or use incognito)
- [ ] Log in
- [ ] Logo should appear immediately (from WARP/PRISM)
- [ ] No delay, no loading state
- [ ] Check cookie: contains URL (not storage ID)

---

## 📊 DATA FLOW ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────┐
│                         LAYERS                                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1: UI (Client)                                            │
│  /src/features/shell/company-button/index.tsx                    │
│                                                                   │
│  - File upload + cropper                                         │
│  - Optimistic UI (blob URL)                                      │
│  - Reads from FUSE store: user.brandLogoUrl                      │
│  - Displays: <img src={logoSrc} />                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓ reads from
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2: FUSE Store (Client State)                              │
│  /src/store/fuse.tsx                                             │
│                                                                   │
│  - Single source of truth for UI                                 │
│  - Hydrates from session cookie on page load                     │
│  - Contains brandLogoUrl (URL, not storage ID)                   │
└──────────────────────────────────────────────────────────────────┘
                              ↓ hydrates from
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3: Session Cookie (Cache)                                 │
│  FUSE_5.0 cookie (JWT, 30-day expiry)                            │
│                                                                   │
│  - Contains user._id, brandLogoUrl, etc.                         │
│  - Refreshed by middleware on every request                      │
│  - Refreshed by RSC fetchUserServer (optional)                   │
│  - Refreshed after upload by refreshSessionAfterUpload           │
└──────────────────────────────────────────────────────────────────┘
                              ↓ refreshed from
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 4: Convex Queries (Converter)                             │
│  /convex/domains/admin/users/api.ts → getCurrentUser             │
│                                                                   │
│  - THE CONVERTER: storage ID → URL                               │
│  - Reads user.brandLogoUrl (storage ID from DB)                  │
│  - Calls ctx.storage.getUrl(storageId)                           │
│  - Returns URL or null (NEVER storage ID)                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓ reads from
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 5: Convex Database (Source of Truth)                      │
│  admin_users table → user.brandLogoUrl field                     │
│                                                                   │
│  - Stores storage ID: "kg2abc123..."                             │
│  - Updated by uploadBrandLogo mutation                           │
│  - Storage ID is a reference to Convex CDN                       │
└──────────────────────────────────────────────────────────────────┘
                              ↓ references
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 6: Convex Storage (File Storage)                          │
│  _storage table (internal Convex system)                         │
│                                                                   │
│  - Actual PNG file bytes                                         │
│  - Served via CDN: https://clinical-llama-123.convex.cloud/...   │
│  - Accessed via ctx.storage.getUrl(storageId)                    │
└──────────────────────────────────────────────────────────────────┘
```

### Upload Flow Data Transformations

```
User Selects File
      ↓
File (blob) → Canvas (crop/resize) → PNG Blob → "companylogo.png"
      ↓
Convex Upload API → { storageId: "kg2abc123..." }
      ↓
Database Patch → user.brandLogoUrl = "kg2abc123..."
      ↓
getCurrentUser Query → ctx.storage.getUrl("kg2abc123...")
      ↓
CDN URL → "https://clinical-llama-123.convex.cloud/api/storage/abc/def/kg2abc123..."
      ↓
Cookie Refresh → JWT with brandLogoUrl = "https://..."
      ↓
FUSE Store Hydration → user.brandLogoUrl = "https://..."
      ↓
UI Render → <img src="https://..." />
```

---

## 🚀 QUICK REFERENCE

### When Logo is Broken, Check These 3 Things:

1. **Cookie Contents** - Should have URL, not storage ID
   ```typescript
   const session = await readSessionCookie();
   console.log('brandLogoUrl in cookie:', session.brandLogoUrl);
   // ✅ GOOD: "https://clinical-llama-123.convex.cloud/..."
   // ❌ BAD:  "kg2abc123..."
   ```

2. **Middleware Logs** - Should refresh on every page load
   ```
   Should see in terminal:
   "🔍 MIDDLEWARE: Fresh user from DB: { brandLogoUrl: 'https://...' }"
   "✅ FUSE Middleware: Cookie refreshed with DB data"
   ```

3. **getCurrentUser Query** - Should return URL, not storage ID
   ```typescript
   const user = await convex.query(api.domains.admin.users.api.getCurrentUser, { userId });
   console.log('brandLogoUrl from getCurrentUser:', user.brandLogoUrl);
   // ✅ GOOD: "https://..." or null
   // ❌ BAD:  "kg2abc123..."
   ```

### The Golden Rule

**EVERY code path that creates or updates the session cookie MUST call `getCurrentUser`.**

This includes:
- ✅ Middleware (every request)
- ✅ Identity handoff (login)
- ✅ Session refresh (after upload)
- ✅ Server-side fetch (RSC)

**NEVER use `ctx.db.get()` or `ensureUser` to get data for cookie creation.**

---

## 📝 SUMMARY

The brand logo upload system is a **6-layer architecture** with **storage ID → URL conversion** at its core.

**The Flow**:
1. User uploads → Convex storage → Database stores storage ID
2. getCurrentUser converts storage ID → URL
3. Cookie refreshed with URL (not storage ID)
4. FUSE store hydrates from cookie
5. UI renders logo from store
6. Zero loading states, instant display

**The Key Fix**:
Middleware refreshes cookie from database on EVERY request, ensuring cookie always has latest URLs.

**The One Query**:
`getCurrentUser` is THE ONLY converter. Every other part of the system trusts it to provide URLs.

---

**For questions or issues, refer to this SDK first. 99% of brand logo bugs are solved by checking:**
1. Is cookie using `getCurrentUser`?
2. Is middleware refreshing cookie?
3. Is `getCurrentUser` returning URLs (not storage IDs)?
