# 🖼️ AVATAR UPLOAD SDK - Complete Wiring & Philosophy

**Single Source of Truth for Avatar Upload System**
**When avatar is broken, start here.**

---

## 🎯 FUSE Philosophy

### The Prime Directive
> **Database is the source. Cookie is the cache. URLs are for browsers. Storage IDs are for Convex.**

### The Laws
1. **Database stores Storage IDs** - Convex storage references (e.g., `kg2abc...`)
2. **Cookie stores URLs** - CDN URLs for instant browser rendering (e.g., `https://beloved-ram-857.convex.cloud/api/storage/...`)
3. **Client NEVER sees Storage IDs** - Only URLs or null (fallback to default)
4. **Middleware refreshes cookie on EVERY request** - Database is always truth

### Why This Matters
- **ZERO loading states** - Avatar appears instantly from cookie
- **WARP/PRISM ready** - Data is preloaded, not fetched
- **No 404 errors** - Browser never tries to load storage IDs

---

## 🔌 The Complete Wiring

### Upload Flow
```
User selects image
    ↓
[1] Client: Crop/optimize image
    ↓
[2] Client: Call generateUploadUrl({ userId })
    ↓
[3] Convex: Generate signed upload URL
    ↓
[4] Client: Upload file to Convex storage URL
    ↓
[5] Convex: Save storage ID to database
    ↓
[6] Client: Call uploadAvatar({ fileId, userId })
    ↓
[7] Convex: Update user.avatarUrl = storageId
    ↓
[8] Client: Fetch fresh user via getCurrentUser
    ↓
[9] Convex: Convert storage ID → URL via ctx.storage.getUrl()
    ↓
[10] Client: Update FUSE store with URL
    ↓
[11] Client: Call refreshSessionAfterUpload()
    ↓
[12] Server: Mint new cookie with URL
    ↓
✅ Avatar appears instantly
```

### Refresh Flow
```
User refreshes page
    ↓
[1] Middleware: Read session cookie
    ↓
[2] Middleware: Fetch fresh user via getCurrentUser({ userId })
    ↓
[3] Convex: Read user.avatarUrl (storage ID)
    ↓
[4] Convex: Convert storage ID → URL via ctx.storage.getUrl()
    ↓
[5] Convex: Return user with avatarUrl as URL
    ↓
[6] Middleware: Mint new session with URL
    ↓
[7] Middleware: Set cookie with URL
    ↓
[8] Client: Hydrate FUSE from cookie
    ↓
✅ Avatar appears instantly (zero loading)
```

---

## 📁 File Map - Every Piece of the System

### 1️⃣ Client Upload Component
**File:** `/src/features/shell/user-button/index.tsx`
**Lines:** 195-275
**Purpose:** Handles image selection, cropping, upload, and UI updates

**Key Functions:**
- `handleAvatarUpload()` - Main upload orchestration (lines 195-275)
- `generateUploadUrl` - Convex mutation hook (line 46)
- `uploadAvatar` - Convex mutation hook (line 47)

**Critical Code:**
```typescript
// Line 208: Generate signed upload URL
const url = await generateUploadUrl({ userId: user!.id });

// Line 210-213: Upload file to Convex storage
const uploadRes = await fetch(url, {
  method: "POST",
  body: fileToUpload,
});

// Line 219: Save storage ID to database
await uploadAvatar({ fileId: storageId, userId: user!.id });

// Line 232-234: Fetch fresh user with URL
const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
  userId: user!.id
});

// Line 237: Update FUSE store
setUser({ ...freshUser, avatarUrl: freshUser.avatarUrl });

// Line 260: Refresh session cookie
await refreshSessionAfterUpload();
```

**Debug Logs:**
- Line 208: `🔍 [UPLOAD] Requesting upload URL for userId:`
- Line 210: `🔍 [UPLOAD] Received upload URL:`
- Line 217: `🔍 [UPLOAD] Uploading file, size:`
- Line 222: `🔍 [UPLOAD] Upload response status:`

---

### 2️⃣ Generate Upload URL (Convex Mutation)
**File:** `/convex/storage/generateUploadUrl.ts`
**Lines:** 12-28
**Purpose:** Generate signed URL for uploading file to Convex storage

**Critical Code:**
```typescript
export const generateUploadUrl = mutation({
  args: {
    userId: v.id("admin_users"), // ✅ Sovereign ID
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl; // Returns signed URL
  },
});
```

---

### 3️⃣ Upload Avatar (Convex Mutation)
**File:** `/convex/identity/uploadAvatar.ts`
**Purpose:** Save storage ID to database

**Critical Code:**
```typescript
export const uploadAvatar = mutation({
  args: {
    fileId: v.id("_storage"), // Storage ID from upload
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      avatarUrl: args.fileId, // ✅ Save storage ID (NOT URL)
    });
  },
});
```

**⚠️ CRITICAL:** Database stores storage IDs, NOT URLs!

---

### 4️⃣ Get Current User (Convex Query)
**File:** `/convex/domains/admin/users/api.ts`
**Lines:** 254-329
**Purpose:** **THE CONVERTER** - Converts storage IDs to URLs for client consumption

**Critical Code:**
```typescript
export const getCurrentUser = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // ✅ CONVERSION MAGIC HAPPENS HERE
    let avatarUrl = null;
    const avatarField = user.avatarUrl;

    if (avatarField) {
      // Already a URL? Use it
      if (typeof avatarField === 'string' && avatarField.startsWith('http')) {
        avatarUrl = avatarField;
      } else {
        // It's a storage ID - convert to URL
        try {
          const url = await ctx.storage.getUrl(avatarField);
          if (url) {
            avatarUrl = url; // ✅ URL for client
            console.log('✅ Avatar URL resolved:', url.substring(0, 60));
          } else {
            // Conversion failed - return null (client uses fallback)
            console.error('❌ Avatar URL is null for storage ID:', avatarField);
            avatarUrl = null;
          }
        } catch (error) {
          console.error('❌ Error resolving avatar storage ID:', error);
          avatarUrl = null;
        }
      }
    }

    return {
      ...user,
      avatarUrl, // ✅ Returns URL or null (NEVER storage ID)
    };
  },
});
```

**Debug Logs:**
- `✅ Avatar URL resolved:` - Conversion succeeded
- `❌ Avatar URL is null for storage ID:` - Conversion failed (file might not exist)
- `❌ Error resolving avatar storage ID:` - Exception during conversion

**⚠️ CRITICAL:** This query MUST return URLs or null - NEVER storage IDs!

---

### 5️⃣ Refresh Session Cookie (Server Action)
**File:** `/src/app/actions/user-mutations.ts`
**Lines:** 344-394
**Purpose:** Update session cookie with fresh data after upload

**Critical Code:**
```typescript
export async function refreshSessionAfterUpload() {
  const session = await readSessionCookie();
  if (!session) throw new Error('No session');

  // Fetch fresh user with URLs (not storage IDs)
  const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
    userId: session._id,
  });

  if (!freshUser) throw new Error('User not found');

  // Mint new session with URLs
  const token = await mintSession({
    _id: String(freshUser._id),
    avatarUrl: freshUser.avatarUrl || undefined, // ✅ URL from getCurrentUser
    // ... rest of session data
  });

  // Update cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}
```

**Debug Logs:**
- Line 362: `🔍 refreshSessionAfterUpload - avatarUrl from Convex:`

---

### 6️⃣ Middleware Cookie Refresh
**File:** `/src/middleware.ts`
**Lines:** 62-113
**Purpose:** **THE GUARDIAN** - Refreshes cookie on EVERY request to ensure database truth

**Critical Code:**
```typescript
let session = await readSessionCookie();

// 🔄 Refresh cookie with fresh database data on every request
if (session && session._id) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Fetch fresh user with URLs
    const freshUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
      userId: session._id
    });

    if (freshUser) {
      // Mint fresh session with latest database data
      const updatedCookieToken = await mintSession({
        _id: String(freshUser._id),
        avatarUrl: freshUser.avatarUrl || undefined, // ✅ URL from database
        // ... rest of session data
      });

      // Update session object for use below
      session = {
        ...session,
        avatarUrl: freshUser.avatarUrl || undefined,
      };
    }
  } catch (error) {
    console.error('❌ FUSE Middleware: Failed to refresh cookie:', error);
  }
}

// Set updated cookie on response
if (updatedCookieToken) {
  res.cookies.set(SESSION_COOKIE, updatedCookieToken, {
    httpOnly: false, // Client needs to read
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
```

**Debug Logs:**
- `🔍 MIDDLEWARE: Fresh user from DB:` - Shows what Convex returned
- `✅ FUSE Middleware: Cookie refreshed with DB data` - Cookie updated
- `🔍 MIDDLEWARE: Updated session object:` - Shows what went into cookie

---

### 7️⃣ Identity Handoff (Login Flow)
**File:** `/src/app/(auth)/actions/identity-handoff.ts`
**Lines:** 120-140
**Purpose:** Set initial session cookie during login with URLs (not storage IDs)

**Critical Code:**
```typescript
// Fetch user with converted URLs
const userWithUrls = await convex.query(api.domains.admin.users.api.getCurrentUser, {
  userId: convexUser._id
});

// Mint session with URLs
const token = await mintSession({
  _id: String(convexUser._id),
  avatarUrl: userWithUrls?.avatarUrl || undefined, // ✅ URL from getCurrentUser
  // ... rest of session data
});

// Set cookie
const cookieStore = await cookies();
cookieStore.set(SESSION_COOKIE, token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
});
```

**Debug Logs:**
- `✅ SID: Identity Handoff Ceremony — COMPLETE` - Login successful
- `Sovereign _id:` - Shows user ID

---

### 8️⃣ Session Cookie System
**File:** `/src/fuse/hydration/session/cookie.ts`
**Lines:** 1-120
**Purpose:** Mint and read JWT session cookies

**Cookie Payload:**
```typescript
type SessionPayload = {
  _id: string;          // ✅ Sovereign Convex ID
  clerkId: string;      // Reference only
  avatarUrl?: string;   // ✅ URL (NOT storage ID)
  // ... other fields
};
```

**Critical:** Cookie MUST contain URLs, never storage IDs!

---

### 9️⃣ Client Hydration
**File:** `/src/fuse/hydration/client/ClientHydrator.tsx`
**Lines:** 50-115
**Purpose:** Read cookie and hydrate FUSE store on page load

**Critical Code:**
```typescript
useEffect(() => {
  const cookieData = document.cookie
    .split('; ')
    .find(row => row.startsWith('FUSE_5.0='));

  if (cookieData) {
    const token = cookieData.split('=')[1];
    const decoded = decodeJWT(token);

    setUser({
      id: decoded._id,
      avatarUrl: decoded.avatarUrl, // ✅ URL from cookie
      // ... other fields
    });
  }
}, []);
```

---

### 🔟 Display Component
**File:** `/src/features/shell/user-button/index.tsx`
**Lines:** 295-298
**Purpose:** Render avatar image

**Critical Code:**
```typescript
const avatarSrc = optimisticUrl || committedUrl || user?.avatarUrl || "/images/sitewide/avatar.png";

<Image
  src={avatarSrc}
  alt="Avatar"
  width={40}
  height={40}
/>
```

**Fallback Chain:**
1. `optimisticUrl` - Temporary blob URL during upload
2. `committedUrl` - URL after successful upload
3. `user?.avatarUrl` - URL from FUSE store (from cookie)
4. `/images/sitewide/avatar.png` - Default fallback

---

## 🐛 Troubleshooting Guide

### Issue: 404 Errors After Upload

**Symptom:** Avatar shows 404 error `GET http://localhost:3000/kg2abc... 404`

**Root Cause:** Cookie contains storage ID instead of URL

**Debug Steps:**
1. Check browser console - do you see storage IDs in 404 URLs?
2. Check terminal logs:
   - Look for `✅ Avatar URL resolved:` (should show URL)
   - Look for `❌ Avatar URL is null` (conversion failed)
3. Check middleware logs:
   - `🔍 MIDDLEWARE: Fresh user from DB:` should show URL, not storage ID

**Fix:**
- If `getCurrentUser` is returning storage IDs → Check lines 270-293 in `/convex/domains/admin/users/api.ts`
- If middleware isn't running → Check `/src/middleware.ts` lines 62-113
- If cookie has storage IDs → Refresh page (middleware will fix it)

---

### Issue: Avatar Not Updating After Upload

**Symptom:** Upload succeeds but avatar doesn't change

**Debug Steps:**
1. Check browser console logs:
   - `🔍 [UPLOAD] Upload response status: 200` (upload succeeded)
   - `✅ FUSE store updated with new avatar:` (store updated)
2. Check terminal logs:
   - `✅ Avatar uploaded: Storage ID kg2...` (database updated)
   - `✅ Avatar URL resolved:` (conversion worked)
3. Check FUSE store in React DevTools
   - Does `user.avatarUrl` have the new URL?

**Fix:**
- If store not updating → Check line 237 in `user-button/index.tsx`
- If upload succeeds but no URL → Check `getCurrentUser` conversion logic
- If cookie not updating → Check `refreshSessionAfterUpload` call (line 260)

---

### Issue: Avatar Shows on Upload, Disappears on Refresh

**Symptom:** Avatar appears after upload but gone after refresh

**Root Cause:** Middleware not refreshing cookie OR cookie has storage ID

**Debug Steps:**
1. Upload avatar, see it appear ✓
2. Refresh page
3. Check terminal logs:
   - Should see `🔍 MIDDLEWARE: Fresh user from DB:`
   - Should see `✅ FUSE Middleware: Cookie refreshed`
4. If no middleware logs → Middleware not running
5. If middleware shows storage ID → `getCurrentUser` not converting

**Fix:**
- Check middleware is enabled (lines 62-113 in `/src/middleware.ts`)
- Check `getCurrentUser` conversion (lines 270-293 in `/convex/domains/admin/users/api.ts`)

---

### Issue: Null/Undefined Avatar URL

**Symptom:** Logs show `❌ Avatar URL is null for storage ID: kg2...`

**Root Cause:** `ctx.storage.getUrl()` returning null

**Possible Reasons:**
1. Storage ID doesn't exist (file was deleted)
2. Storage ID is invalid
3. Timing issue (file just uploaded, not committed yet)

**Debug Steps:**
1. Check Convex dashboard - does the file exist in storage?
2. Check database - does `user.avatarUrl` have a valid storage ID?
3. Wait a few seconds and refresh - sometimes storage takes time

**Fix:**
- If file missing → Re-upload avatar
- If storage ID invalid → Clear `user.avatarUrl` in database and re-upload
- If timing issue → Refresh page (should work second time)

---

## ✅ Testing Checklist

### After Any Changes to Avatar System

1. **Upload Flow:**
   - [ ] Select image → Cropper appears
   - [ ] Crop image → Upload starts
   - [ ] Upload completes → Avatar updates instantly
   - [ ] Check browser console → No 404 errors
   - [ ] Check terminal → `✅ Avatar URL resolved:`

2. **Refresh Flow:**
   - [ ] Refresh page → Avatar still shows
   - [ ] Check terminal → `🔍 MIDDLEWARE: Fresh user from DB:` shows URL
   - [ ] Check terminal → `✅ FUSE Middleware: Cookie refreshed`
   - [ ] Check browser console → No 404 errors

3. **Login Flow:**
   - [ ] Log out
   - [ ] Log back in
   - [ ] Avatar appears instantly (from cookie)
   - [ ] Check terminal → `✅ SID: Identity Handoff Ceremony — COMPLETE`
   - [ ] Check terminal → `getCurrentUser` called during handoff

4. **Edge Cases:**
   - [ ] Delete avatar → Shows default fallback
   - [ ] Upload very large image → Handles gracefully
   - [ ] Upload invalid file → Shows error message
   - [ ] Network error during upload → Reverts to previous avatar

---

## 📊 Data Flow Diagram

```
DATABASE (Source of Truth)
    admin_users.avatarUrl = "kg2abc..." (Storage ID)
                ↓
    getCurrentUser() - THE CONVERTER
                ↓
    ctx.storage.getUrl(storageId)
                ↓
    Returns: "https://beloved-ram-857.convex.cloud/api/storage/abc123"
                ↓
    ┌───────────────────────────────────────┐
    │                                       │
    ↓                                       ↓
MIDDLEWARE                          UPLOAD FLOW
(Every request)                     (After upload)
    ↓                                       ↓
mintSession({ avatarUrl: URL })    mintSession({ avatarUrl: URL })
    ↓                                       ↓
Set Cookie                          Set Cookie
    ↓                                       ↓
    └───────────────┬───────────────────────┘
                    ↓
            COOKIE (Cache)
        avatarUrl = "https://..." (URL)
                    ↓
        CLIENT HYDRATION
                    ↓
            FUSE STORE
        user.avatarUrl = "https://..." (URL)
                    ↓
        IMAGE COMPONENT
            <Image src={URL} />
                    ↓
            ✅ DISPLAYS INSTANTLY
```

---

## 🎓 Key Principles

1. **Database = Source** - Always trust the database
2. **Cookie = Cache** - Refreshed from database on every request
3. **URLs for Clients** - Browsers need URLs, not storage IDs
4. **Storage IDs for Convex** - Database stores IDs, queries convert to URLs
5. **Middleware = Guardian** - Ensures cookie always matches database
6. **getCurrentUser = Converter** - The only place storage IDs become URLs
7. **Zero Loading States** - Avatar appears instantly from cookie (WARP/PRISM)

---

## 📝 Quick Reference

**When avatar is broken, check these in order:**

1. **Browser Console** - Are there 404 errors? If yes, cookie has storage IDs
2. **Terminal (Middleware)** - Is middleware running? Look for `🔍 MIDDLEWARE: Fresh user from DB:`
3. **Terminal (Convex)** - Is conversion working? Look for `✅ Avatar URL resolved:`
4. **Database** - Does `user.avatarUrl` have a storage ID? (Should be `kg2...`)
5. **Cookie** - Decode JWT - does it have URL or storage ID? (Should be `https://...`)
6. **FUSE Store** - React DevTools - does `user.avatarUrl` have URL? (Should be `https://...`)

**The path to truth:**
```
Database (kg2...) → getCurrentUser → URL → Cookie → FUSE → Display
```

If avatar is broken, one of these steps is failing. Start from the left and work right.

---

**Last Updated:** 2025-12-17
**Maintainer:** When avatar breaks, read this first. Then debug. Then fix. Then update this doc.
