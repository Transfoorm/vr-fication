/**──────────────────────────────────────────────────────────────────────┐
│  🧬 GENOME FIELDS FEATURE                                            │
│  /src/features/account/GenomeFields/index.tsx                        │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Imports VRs (Field.live, Dropdown.simple)                         │
│  - Wires FUSE (genome state, updateGenome)                           │
│  - Contains sleek section cards (ft-* CSS)                           │
│  - The sponge that absorbs all dirt                                  │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { Field, Dropdown, Card, T, Stack } from '@/vr';
import { useFuse } from '@/store/fuse';
import './genome-tab.css';

// ─────────────────────────────────────────────────────────────────────
// Dropdown Options
// ─────────────────────────────────────────────────────────────────────

const SENIORITY_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'coach', label: 'Coach' },
  { value: 'advisor', label: 'Advisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'director', label: 'Director' },
  { value: 'executive', label: 'Executive' },
  { value: 'founder', label: 'Founder' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1,000 employees' },
  { value: '1001-5000', label: '1,001-5,000 employees' },
  { value: '5001+', label: '5,001+ employees' },
];

const TRANSFORMATION_STAGE_OPTIONS = [
  { value: 'exploring', label: 'Exploring' },
  { value: 'planning', label: 'Planning' },
  { value: 'executing', label: 'Executing' },
  { value: 'scaling', label: 'Scaling' },
];

const TRANSFORMATION_TYPE_OPTIONS = [
  { value: 'digital', label: 'Digital' },
  { value: 'operational', label: 'Operational' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'product', label: 'Product' },
  { value: 'go_to_market', label: 'Go-to-Market' },
];

const TIMELINE_URGENCY_OPTIONS = [
  { value: 'exploratory', label: 'Exploratory (no rush)' },
  { value: 'immediate', label: 'Immediate' },
  { value: '3_6_months', label: '3-6 months' },
  { value: '1_2_years', label: '1-2 years' },
  { value: 'lifes_work', label: "My Life's Work" },
];

// ─────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────

export function GenomeFields() {
  // ─────────────────────────────────────────────────────────────────────
  // FUSE wiring - all state access lives here in the Feature
  // Data flows: WARP → FUSE (Golden Bridge pattern)
  // Persistence: updateGenomeLocal → Server Action → Convex
  // ─────────────────────────────────────────────────────────────────────
  const genome = useFuse((s) => s.genome);
  const updateGenomeLocal = useFuse((s) => s.updateGenomeLocal);

  // Save handler - FUSE action handles both optimistic update AND persistence
  const handleSave = async (field: string, value: string | number | undefined) => {
    await updateGenomeLocal({ [field]: value });
  };

  const completionPercent = genome?.completionPercent ?? 0;

  return (
    <Stack>
      <Card.standard
        title={<>Professional Genome <T.body size="sm" className="ft-genometab-percent">{completionPercent}% Complete</T.body></>}
        subtitle="Complete your profile to unlock personalised Al coaching and transformation insights"
        footer={
          <div className="ft-genometab-completion">
            <div className="ft-genometab-completion-bar">
              <div className="ft-genometab-completion-fill" data-percent={completionPercent} />
            </div>
          </div>
        }
      >
        <div className="vr-field-spacing">
          {/* Professional Identity */}
          <div className="ft-genometab-row">
            <Field.live
              label="Job Title"
              value={genome?.jobTitle ?? ''}
              onSave={(v) => handleSave('jobTitle', v || undefined)}
              placeholder="e.g. Head of Operations"
            />
            <Field.live
              label="Department"
              value={genome?.department ?? ''}
              onSave={(v) => handleSave('department', v || undefined)}
              placeholder="e.g. Event Management"
            />
          </div>
          <div className="ft-genometab-row">
            <Dropdown.simple
              label="Seniority Level"
              options={SENIORITY_OPTIONS}
              value={genome?.seniority ?? ''}
              onChange={(v: string) => handleSave('seniority', v || undefined)}
              placeholder="Select seniority level"
              allowOther
              otherPlaceholder="e.g. Chief Innovation Officer"
            />
            <Dropdown.simple
              label="Company Size"
              options={COMPANY_SIZE_OPTIONS}
              value={genome?.companySize ?? ''}
              onChange={(v: string) => handleSave('companySize', v || undefined)}
              placeholder="Select company size"
              allowOther
              otherPlaceholder="e.g. 10,000+ employees"
            />
          </div>

          {/* Company Context */}
          <div className="ft-genometab-row">
            <Field.live
              label="Industry"
              value={genome?.industry ?? ''}
              onSave={(v) => handleSave('industry', v || undefined)}
              placeholder="e.g. Coaching, Training, Advisory"
            />
            <Field.live
              label="Company Website"
              value={genome?.companyWebsite ?? ''}
              onSave={(v) => handleSave('companyWebsite', v || undefined)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          {/* Transformation Journey - Special Section */}
          <Card.standard
            title="🔥 Transformation Journey"
            subtitle=" Your transformation context will define how the AI can assist you to create the greatest change!"
            className="ft-genometab-inner-card"
          >
            <div className="vr-field-spacing">
              <div className="ft-genometab-row">
                <Field.live
                  label="Transformation Goal"
                  value={genome?.transformationGoal ?? ''}
                  onSave={(v) => handleSave('transformationGoal', v || undefined)}
                  placeholder="e.g. Drive digital transformation and improve customer experience"
                  multiline
                  maxLength={3000}
                  rows={3}
                />
              </div>
              <div className="ft-genometab-row">
                <Dropdown.simple
                  label="Current Stage"
                  options={TRANSFORMATION_STAGE_OPTIONS}
                  value={genome?.transformationStage ?? ''}
                  onChange={(v: string) => handleSave('transformationStage', v || undefined)}
                  placeholder="Select stage"
                  allowOther
                  otherPlaceholder="e.g. Restructuring"
                />
                <Dropdown.simple
                  label="Transformation Type"
                  options={TRANSFORMATION_TYPE_OPTIONS}
                  value={genome?.transformationType ?? ''}
                  onChange={(v: string) => handleSave('transformationType', v || undefined)}
                  placeholder="Select type"
                  allowOther
                  otherPlaceholder="e.g. Talent & Culture"
                />
                <Dropdown.simple
                  label="Timeline & Urgency"
                  options={TIMELINE_URGENCY_OPTIONS}
                  value={genome?.timelineUrgency ?? ''}
                  onChange={(v: string) => handleSave('timelineUrgency', v || undefined)}
                  placeholder="Select timeline"
                  allowOther
                  otherPlaceholder="e.g. Q1 2025"
                />
              </div>
            </div>
          </Card.standard>

          {/* Growth Intel */}
          <div className="ft-genometab-row">
            <Field.live
              label="How did you hear about us?"
              value={genome?.howDidYouHearAboutUs ?? ''}
              onSave={(v) => handleSave('howDidYouHearAboutUs', v || undefined)}
              placeholder="e.g. LinkedIn, Referral, Google"
            />
            <Field.live
              label="Team Size"
              value={genome?.teamSize?.toString() ?? ''}
              onSave={(v) => handleSave('teamSize', v ? parseInt(v, 10) : undefined)}
              placeholder="Number of people"
              transform="numbersOnly"
            />
          </div>
          <div className="ft-genometab-row">
            <Field.live
              label="Annual Revenue (Optional)"
              value={genome?.annualRevenue ?? ''}
              onSave={(v) => handleSave('annualRevenue', v || undefined)}
              placeholder="e.g. $1M-$5M"
            />
            <Field.live
              label="Annual Revenue Goal (Not optional!)"
              value={genome?.successMetric ?? ''}
              onSave={(v) => handleSave('successMetric', v || undefined)}
              placeholder="e.g. $500K ARR, $2M in new revenue"
            />
          </div>
        </div>
      </Card.standard>
    </Stack>
  );
}
