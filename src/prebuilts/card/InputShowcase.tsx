/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Showcase Card                               │
│  /src/prebuilts/card/InputShowcase.tsx                                │
│                                                                        │
│  Displays all Input variants for demonstration.                       │
│  Self-contained - no props needed.                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { Grid } from '@/prebuilts/grid';
import { Input } from '@/prebuilts/input';
import { Label } from '@/prebuilts/label';
import { T } from '@/prebuilts';

export default function InputShowcase() {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [textarea, setTextarea] = useState('');
  const [select, setSelect] = useState('');
  const [checkbox, setCheckbox] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [range, setRange] = useState(50);

  return (
    <div className="vr-card vr-card-showcase">
      <div className="vr-card-showcase-header">
        <T.title size="sm" weight="semibold" className="vr-card-showcase-title">
          Input Showcase
        </T.title>
      </div>
      <div className="vr-card-showcase-content">
        <Grid.vertical>
          {/* 1. Text */}
          <div>
            <Label.basic>Text</Label.basic>
            <Input.text
              value={text}
              onChange={setText}
              placeholder="Type here..."
            />
          </div>

          {/* 2. Password */}
          <div>
            <Label.basic>Password</Label.basic>
            <Input.password
              value={password}
              onChange={setPassword}
              placeholder="Enter password..."
            />
          </div>

          {/* 3. Textarea */}
          <div>
            <Label.basic>Textarea</Label.basic>
            <Input.textarea
              value={textarea}
              onChange={setTextarea}
              placeholder="Multi-line text..."
            />
          </div>

          {/* 4. Select */}
          <div>
            <Label.basic>Select</Label.basic>
            <Input.select
              value={select}
              onChange={setSelect}
              options={[
                { value: '', label: 'Choose...' },
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
              ]}
            />
          </div>

          {/* 5. Checkbox (table variant - only one available) */}
          <div>
            <Label.basic>Checkbox</Label.basic>
            <Input.checkbox.table
              checked={checkbox}
              onChange={() => setCheckbox(!checkbox)}
            />
          </div>

          {/* 6. Toggle */}
          <div>
            <Input.toggle
              enabled={toggle}
              onChange={setToggle}
              label="Toggle switch"
            />
          </div>

          {/* 7. Range */}
          <div>
            <Label.basic>Range: {range}</Label.basic>
            <Input.range
              value={range}
              onChange={setRange}
              min={0}
              max={100}
            />
          </div>
        </Grid.vertical>
      </div>
    </div>
  );
}
