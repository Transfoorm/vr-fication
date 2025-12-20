/**──────────────────────────────────────────────────────────────────────┐
│  🤖 PREBUILTS - Central Export                                         │
│  /src/vr/index.tsx                                   │
│                                                                        │
│  Single import for all VR components across the entire app.      │
│                                                                        │
│  Usage:                                                                │
│  import { Card, Page, Modal, Button, Table, Divider, Tabs, Search, Badge, Tooltip, Field, Input, Label, Checkbox } from '@/vr'; │
│                                                                        │
│  TTT God Architecture (v2):                                            │
│  - Input: Raw controls (Input.text, Input.select, Input.toggle, etc.)│
│  - Field: Complete units (Field.live, Field.display, Field.row, etc.)│
│  - Label: Text decorations (Label.basic, Label.error, etc.)           │
└────────────────────────────────────────────────────────────────────────┘ */

// Prebuilt Component Variants
export { Page } from '@/vr/page';
export { Card } from '@/vr/card';
export { Modal, useSideDrawer } from '@/vr/modal';
export { Button } from '@/vr/button';
export { Table } from '@/vr/table';
export { Divider } from '@/vr/divider';
export { Tabs } from '@/vr/tabs';
export { Search } from '@/vr/search';
export { Badge } from '@/vr/badge';
export { Tooltip } from '@/vr/tooltip';
export { Typography, T } from '@/vr/typography';
export { Actions, ActionPill } from '@/vr/actions';
export { Stack } from '@/vr/stack';
export { default as Backdrop } from '@/vr/backdrop';

// TTT God Architecture v2
export { Field } from '@/vr/field';
export { Input } from '@/vr/input';
export { Label } from '@/vr/label';
export { Checkbox } from '@/vr/input/checkbox';
export { Dropdown } from '@/vr/dropdown';

// Shared Utilities (re-exported for convenience)
export { Icon } from '@/vr/icon/IconRegistry';
export type { IconVariant } from '@/vr/icon/IconRegistry';
export { Spinner } from '@/vr/icon/Spinner';
