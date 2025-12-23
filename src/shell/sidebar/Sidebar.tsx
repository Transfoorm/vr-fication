/**──────────────────────────────────────────────────────────────────────┐
│  📍 SIDEBAR - Navigation Panel (WCCC ly-* Compliant)                   │
│  /src/shell/Sidebar/Sidebar.tsx                                        │
│                                                                        │
│  Building from scratch - iterative, user-directed.                     │
│  Old sidebar preserved in /src/appshell/ as reference.                 │
│                                                                        │
│  🔮 PRISM Integration: Preloads domains on dropdown open               │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronsUpDown } from 'lucide-react';
import UserButton from '@/features/shell/user-button';
import CompanyButton from '@/features/shell/company-button';
import { useFuse } from '@/store/fuse';
import type { DomainRoute } from '@/store/fuse';
import { Icon, T } from '@/vr';
import { getNavForRank } from './navigation';
import { usePrism } from '@/fuse/hooks/usePrism';

// 🔱 Helper: Convert URL path to DomainRoute
function pathToRoute(path: string): DomainRoute {
  // Remove leading slash: '/admin/users' → 'admin/users'
  const route = path.replace(/^\//, '');
  // Dashboard is '/' → 'dashboard'
  return (route === '' ? 'dashboard' : route) as DomainRoute;
}

// 🔮 PRISM: Map section labels to domain keys for preloading
const SECTION_TO_DOMAIN: Record<string, 'productivity' | 'admin' | 'clients' | 'finance' | 'projects' | 'system' | 'settings'> = {
  productivity: 'productivity',
  admin: 'admin',
  clients: 'clients',
  finance: 'finance',
  projects: 'projects',
  system: 'system',
  settings: 'settings',
};

export default function Sidebar() {
  const pathname = usePathname();
  const user = useFuse((s) => s.user);
  const rank = useFuse((s) => s.rank);
  const expandedSections = useFuse((s) => s.navigation.expandedSections);
  const toggleSection = useFuse((s) => s.toggleSection);
  const collapseAllSections = useFuse((s) => s.collapseAllSections);
  const [isFooterMenuOpen, setIsFooterMenuOpen] = useState(false);

  // 🔱 SOVEREIGN ROUTER: navigate() replaces router.push()
  const navigate = useFuse((s) => s.navigate);

  // 🔮 PRISM: Preload domains on dropdown open
  const { preloadDomain } = usePrism();

  const navItems = getNavForRank(rank);
  const hydrateExpandedSections = useFuse((s) => s.hydrateExpandedSections);
  const prevPathnameRef = useRef<string | null>(null);

  const isActive = useCallback((path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  }, [pathname]);

  // Hydrate expanded sections from localStorage on mount
  useEffect(() => {
    hydrateExpandedSections();
  }, [hydrateExpandedSections]);

  // Auto-expand sections when navigating to their child routes
  useEffect(() => {
    // Only run when pathname actually changes, not when expandedSections changes
    if (prevPathnameRef.current === pathname) {
      return;
    }
    prevPathnameRef.current = pathname;

    navItems.forEach((item) => {
      if (item.children) {
        const sectionKey = item.label.toLowerCase();
        const hasActiveChild = item.children.some((child) => isActive(child.path));

        // If a child is active but section is not expanded, expand it
        if (hasActiveChild && !expandedSections.includes(sectionKey)) {
          toggleSection(sectionKey);
        }
      }
    });
  }, [pathname, navItems, isActive, expandedSections, toggleSection]);

  // Watch for UserButton menu open/close state
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const menu = document.querySelector('.ft-userbutton-menu');
      setIsFooterMenuOpen(!!menu);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  const hasOpenSections = expandedSections.length > 0;

  return (
    <aside className="ly-sidebar-container">
      {/* Header - Company/Org selector */}
      <CompanyButton />

      {/* Navigation Content */}
      <div className="ly-sidebar-content">
        {hasOpenSections && (
          <button
            className="ly-sidebar-collapse-all"
            onClick={collapseAllSections}
            title="Collapse all sections"
          >
            <Icon variant="chevrons-up" size="sm" className="ly-sidebar-collapse-all-icon" />
          </button>
        )}
        {navItems.map((item) => {
          if (item.path && !item.children) {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                className={`ly-sidebar-button ${active ? 'ly-sidebar-button--active' : ''}`}
                onClick={() => {
                  // 🔱 SOVEREIGN ROUTER: Instant navigation, zero server
                  navigate(pathToRoute(item.path!));
                }}
              >
                <Icon variant={item.icon} size="sm" className="ly-sidebar-icon" />
                <T.body size="sm" weight="medium">{item.label}</T.body>
              </button>
            );
          }

          if (item.children) {
            const sectionKey = item.label.toLowerCase();
            const open = expandedSections.includes(sectionKey);
            const hasActiveChild = item.children.some((child) => isActive(child.path));

            // 🔮 PRISM: Handle section click with preload
            const handleSectionClick = () => {
              toggleSection(sectionKey);
              // If section is being opened (not already open), trigger PRISM
              if (!open) {
                const domain = SECTION_TO_DOMAIN[sectionKey];
                if (domain) {
                  preloadDomain(domain);
                }
              }
            };

            return (
              <div key={item.label} className="ly-sidebar-section">
                <button
                  className={`ly-sidebar-button ${hasActiveChild ? 'ly-sidebar-button--active' : ''}`}
                  onClick={handleSectionClick}
                >
                  <Icon variant={item.icon} size="sm" className="ly-sidebar-icon" />
                  <T.body size="sm" weight="medium">{item.label}</T.body>
                  <ChevronRight
                    className={`ly-sidebar-chevron ${open ? 'ly-sidebar-chevron--open' : ''}`}
                  />
                </button>

                {open && (
                  <div className="ly-sidebar-sublinks">
                    {item.children.map((child) => {
                      const childActive = isActive(child.path);
                      return (
                        <button
                          key={child.path}
                          className={`ly-sidebar-sublink ${childActive ? 'ly-sidebar-sublink--active' : ''}`}
                          onClick={() => {
                            // 🔱 SOVEREIGN ROUTER: Instant navigation, zero server
                            navigate(pathToRoute(child.path));
                          }}
                        >
                          <T.body size="sm">{child.label}</T.body>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Footer - User profile */}
      <div
        className={`ly-sidebar-footer ${isFooterMenuOpen ? 'ly-sidebar-footer--active' : ''}`}
        onMouseDown={(e) => {
          // Don't trigger if clicking inside the UserButton itself (let it handle its own clicks)
          if ((e.target as HTMLElement).closest('.ft-userbutton-container')) {
            return;
          }
          // Don't trigger if the menu is currently open (prevents reopening during close animation)
          const menu = document.querySelector('.ft-userbutton-menu');
          if (menu) {
            return;
          }
          // Close CompanyButton menu if open
          const companyMenu = document.querySelector('.ft-company-button-menu');
          if (companyMenu) {
            const backdrop = document.querySelector('.ft-company-button-backdrop') as HTMLElement;
            backdrop?.click();
          }
          // Trigger the UserButton avatar click
          const avatarWrapper = document.querySelector('.ly-sidebar-footer .ft-userbutton-avatar-wrapper') as HTMLElement;
          avatarWrapper?.click();
        }}
      >
        <div className="ly-sidebar-footer-userbutton" onClick={(e) => e.stopPropagation()}>
          <UserButton />
        </div>
        <div className="ly-sidebar-footer-text">
          <div className="ly-sidebar-footer-name">
            <T.body size="sm" weight="semibold">
              {user?.emailVerified && user?.firstName && user?.lastName
                ? `${user.firstName} ${user.lastName}`
                : (user as Record<string, unknown>)?.socialName as string || user?.email?.split('@')[0] || ''}
            </T.body>
          </div>
          <div className="ly-sidebar-footer-email">
            <T.caption size="xs" className="ly-sidebar-footer-email-text">
              {user?.emailVerified
                ? (user as Record<string, unknown>)?.socialName as string || ''
                : user?.email || ''}
            </T.caption>
          </div>
        </div>
        <ChevronsUpDown
          className={`ly-sidebar-footer-chevron ${
            (user?.emailVerified && user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : (user as Record<string, unknown>)?.socialName as string || user?.email?.split('@')[0] || '').length > 12 ||
            (user?.emailVerified
              ? ((user as Record<string, unknown>)?.socialName as string || '').length > 14
              : (user?.email || '').length > 14)
              ? 'ly-sidebar-footer-chevron--hidden'
              : ''
          }`}
        />
      </div>
    </aside>
  );
}
