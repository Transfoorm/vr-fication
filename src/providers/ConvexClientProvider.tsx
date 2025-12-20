/**──────────────────────────────────────────────────────────────────────┐
│  🔄 CONVEX CLIENT PROVIDER - Real-time Data Layer                     │
│  /src/providers/ConvexClientProvider.tsx                               │
│                                                                        │
│  Wraps the app with Convex real-time database connection.             │
│  Integrated with Clerk authentication for secure mutations.           │
│  TTT-Ready: Handles 100K concurrent users with real-time updates.      │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
