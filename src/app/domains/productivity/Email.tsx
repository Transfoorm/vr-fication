'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Card } from '@/prebuilts/card';
import { Grid } from '@/prebuilts/grid';

export default function Email() {
  useSetPageHeader('Email', 'Manage your communications');

  return (
    <Grid.verticalBig>
      <Grid.cards>
        <Card.metric
          title="Unread Messages"
          value={42}
          trend={8}
          trendDirection="up"
          context="since yesterday"
        />
        <Card.metric
          title="Sent Today"
          value={17}
          trend={3}
          trendDirection="down"
          context="vs daily avg"
        />
        <Card.metric
          title="Response Rate"
          value="78%"
          trend={12}
          trendDirection="up"
          context="this week"
        />
      </Grid.cards>
    </Grid.verticalBig>
  );
}
