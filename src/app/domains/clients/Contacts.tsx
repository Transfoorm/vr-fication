'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Card } from '@/prebuilts/card';
import { Grid } from '@/prebuilts/grid';

export default function Contacts() {
  useSetPageHeader('Contacts', 'Manage your clients and contacts');

  return (
    <Grid.verticalBig>
      <Grid.cards>
        <Card.metric
          title="Total Contacts"
          value={248}
          trend={15}
          trendDirection="up"
          context="this month"
        />
        <Card.metric
          title="Active Clients"
          value={67}
          trend={3}
          trendDirection="up"
          context="from last week"
        />
        <Card.metric
          title="New Leads"
          value={19}
          trend={2}
          trendDirection="down"
          context="this week"
        />
      </Grid.cards>
    </Grid.verticalBig>
  );
}
