/**──────────────────────────────────────────────────────────────────────┐
│  🔐 AUTH LAYOUT - TTT-CERTIFIED SERVER SHELL                         │
│  /src/app/(auth)/layout.tsx                                           │
│                                                                        │
│  SERVER COMPONENT (no "use client")                                   │
│  Renders instantly via SSR - NEVER blinks, NEVER collapses.           │
│                                                                        │
│  TTT Architecture:                                                     │
│  - Logo: SSR (stable, instant)                                         │
│  - Card shell: SSR (stable, instant)                                   │
│  - Footer: SSR (stable, instant)                                       │
│  - Form content: Client (hydrates in place)                            │
│                                                                        │
│  This eliminates:                                                      │
│  - Logo disappearing on refresh                                        │
│  - Form jumping upward                                                 │
│  - Layout collapse during hydration                                    │
│  - Blink on navigation between auth pages                              │
└────────────────────────────────────────────────────────────────────────┘ */

import Image from 'next/image';
import './auth.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="ft-auth-page">
      <div className="ft-auth-container">
        {/* Logo - SSR with explicit dimensions, zero layout shift */}
        <div className="ft-auth-logo-wrapper">
          <Image
            src="/images/brand/transfoorm.png"
            alt="Transfoorm"
            width={340}
            height={64}
            className="ft-auth-logo"
            priority
          />
        </div>

        {/* Card Shell - SSR, never collapses */}
        <div className="ft-auth-card-wrapper">
          <div className="ft-auth-card-glow"></div>
          <div className="ft-auth-card ft-auth-card-stable">
            {/* Form content hydrates here - client component */}
            {children}
          </div>
        </div>

        {/* FUSE Note - SSR, never blinks */}
        <div className="ft-auth-note">
          <p className="ft-auth-note-text">
            Powered by FUSE • Instant everything
          </p>
        </div>
      </div>
    </div>
  );
}
