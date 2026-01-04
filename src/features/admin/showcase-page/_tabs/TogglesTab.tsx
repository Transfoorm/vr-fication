/**──────────────────────────────────────────────────────────────────────┐
│  🔘 TOGGLES TAB FEATURE                                                │
│  /src/features/admin/showcase-page/_tabs/TogglesTab.tsx               │
│                                                                        │
│  VR Doctrine: Feature Layer                                           │
│  Showcases all toggle input variants with demo state                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../showcase-page.css';
import { useState } from 'react';
import { Card, Input, T, Stack } from '@/vr';

export function TogglesTab() {
  // Size demos
  const [sm, setSm] = useState(true);
  const [md, setMd] = useState(true);
  const [lg, setLg] = useState(false);

  // Label position demos
  const [labelRight, setLabelRight] = useState(true);
  const [labelLeft, setLabelLeft] = useState(false);
  const [noLabel, setNoLabel] = useState(true);

  // State demos
  const [disabled, setDisabled] = useState(true);
  const [disabledOff, setDisabledOff] = useState(false);

  return (
    <Card.standard
      title="Toggles Showcase"
      subtitle="Choose from or sandbox the site's toggle features"
    >
      <Stack>
        {/* Size Variants */}
        <div>
          <T.h4 className="ft-showcasetabs-section-title">Size Variants</T.h4>
          <div className="ft-showcasetabs-grid-3">
            <div>
              <T.caption className="ft-showcasetabs-item-label">Input.toggle size=&quot;sm&quot;</T.caption>
              <Input.toggle
                enabled={sm}
                onChange={setSm}
                size="sm"
              />
            </div>
            <div>
              <T.caption className="ft-showcasetabs-item-label">Input.toggle size=&quot;md&quot; (default)</T.caption>
              <Input.toggle
                enabled={md}
                onChange={setMd}
                size="md"
              />
            </div>
            <div>
              <T.caption className="ft-showcasetabs-item-label">Input.toggle size=&quot;lg&quot;</T.caption>
              <Input.toggle
                enabled={lg}
                onChange={setLg}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Label Positions */}
        <div>
          <T.h4 className="ft-showcasetabs-section-title">Label Positions</T.h4>
          <div className="ft-showcasetabs-grid-3">
            <div>
              <T.caption className="ft-showcasetabs-item-label">labelPosition=&quot;right&quot; (default)</T.caption>
              <Input.toggle
                enabled={labelRight}
                onChange={setLabelRight}
                label="Enable notifications"
                labelPosition="right"
              />
            </div>
            <div>
              <T.caption className="ft-showcasetabs-item-label">labelPosition=&quot;left&quot;</T.caption>
              <Input.toggle
                enabled={labelLeft}
                onChange={setLabelLeft}
                label="Dark mode"
                labelPosition="left"
              />
            </div>
            <div>
              <T.caption className="ft-showcasetabs-item-label">No label</T.caption>
              <Input.toggle
                enabled={noLabel}
                onChange={setNoLabel}
              />
            </div>
          </div>
        </div>

        {/* States */}
        <div>
          <T.h4 className="ft-showcasetabs-section-title">States</T.h4>
          <div className="ft-showcasetabs-grid-3">
            <div>
              <T.caption className="ft-showcasetabs-item-label">Disabled (on)</T.caption>
              <Input.toggle
                enabled={disabled}
                onChange={setDisabled}
                label="Locked setting"
                disabled
              />
            </div>
            <div>
              <T.caption className="ft-showcasetabs-item-label">Disabled (off)</T.caption>
              <Input.toggle
                enabled={disabledOff}
                onChange={setDisabledOff}
                label="Unavailable"
                disabled
              />
            </div>
          </div>
        </div>

        {/* All Sizes with Labels */}
        <div>
          <T.h4 className="ft-showcasetabs-section-title">All Sizes with Labels</T.h4>
          <Stack>
            <Input.toggle
              enabled={sm}
              onChange={setSm}
              label="Small toggle with label"
              size="sm"
            />
            <Input.toggle
              enabled={md}
              onChange={setMd}
              label="Medium toggle with label"
              size="md"
            />
            <Input.toggle
              enabled={lg}
              onChange={setLg}
              label="Large toggle with label"
              size="lg"
            />
          </Stack>
        </div>
      </Stack>
    </Card.standard>
  );
}
