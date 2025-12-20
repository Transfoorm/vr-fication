/**──────────────────────────────────────────────────────────────────────┐
│  📍 PAGE ARCH - Curved Frame Container (WCCC ly-* Compliant)          │
│  /src/shell/PageArch.tsx                                               │
│                                                                        │
│  Foundational curved frame for page content.                           │
└────────────────────────────────────────────────────────────────────────┘ */


interface PageArchProps {
  children: React.ReactNode;
}

export default function PageArch({
  children,
}: PageArchProps) {
  return (
    // NANO PLANCK LAYER - The foundational curved frame (full flex width)
    <div className="ly-page-arch-container">
      {/* Content wrapper with max-width constraint and padding */}
      <div className="ly-page-arch-content">
        {children}
      </div>
    </div>
  );
}
