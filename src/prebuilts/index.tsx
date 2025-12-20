/**──────────────────────────────────────────────────────────────────────┐
│  🤖 PREBUILTS - Central Export                                         │
│  /src/components/prebuilts/index.tsx                                   │
│                                                                        │
│  Single import for all prebuilt components across the entire app.      │
│                                                                        │
│  Usage:                                                                │
│  import { Card, Page, Modal, Button, Table, Divider, Tabs, Search, Badge, Tooltip, Field, Input, Label, Checkbox } from '@/prebuilts'; │
│                                                                        │
│  TTT God Architecture (v2):                                            │
│  - Input: Raw controls (Input.text, Input.select, Input.toggle, etc.)│
│  - Field: Complete units (Field.live, Field.display, Field.row, etc.)│
│  - Label: Text decorations (Label.basic, Label.error, etc.)           │
└────────────────────────────────────────────────────────────────────────┘ */

// Prebuilt Component Variants
export { Page } from '@/prebuilts/page';
export { Card } from '@/prebuilts/card';
export { Modal, useSideDrawer } from '@/prebuilts/modal';
export { Button } from '@/prebuilts/button';
export { Table } from '@/prebuilts/table';
export { Divider } from '@/prebuilts/divider';
export { Tabs } from '@/prebuilts/tabs';
export { Search } from '@/prebuilts/search';
export { Badge } from '@/prebuilts/badge';
export { Tooltip } from '@/prebuilts/tooltip';
export { Typography, T } from '@/prebuilts/typography';
export { Actions, ActionPill } from '@/prebuilts/actions';
export { Stack } from '@/prebuilts/stack';
export { default as Backdrop } from '@/prebuilts/backdrop';

// TTT God Architecture v2
export { Field } from '@/prebuilts/field';
export { Input } from '@/prebuilts/input';
export { Label } from '@/prebuilts/label';
export { Checkbox } from '@/prebuilts/input/checkbox';
export { Dropdown } from '@/prebuilts/dropdown';

// Shared Utilities (re-exported for convenience)
export { Icon } from '@/prebuilts/icon/IconRegistry';
export type { IconVariant } from '@/prebuilts/icon/IconRegistry';
export { Spinner } from '@/prebuilts/icon/Spinner';
