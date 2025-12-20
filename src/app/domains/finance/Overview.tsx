'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Card } from '@/prebuilts/card';
import { Grid } from '@/prebuilts/grid';

export default function Overview() {
  useSetPageHeader('Overview', 'Financial summary and insights');

  return (
    <Grid.verticalBig>
      <Grid.cards>
        <Card.metric
          title="Monthly Revenue"
          value="$84,250"
          trend={22}
          trendDirection="up"
          context="vs last month"
        />
        <Card.metric
          title="Outstanding"
          value="$12,400"
          trend={5}
          trendDirection="down"
          context="collected this week"
        />
        <Card.metric
          title="Profit Margin"
          value="42%"
          trend={3}
          trendDirection="up"
          context="quarterly average"
        />
      </Grid.cards>
    </Grid.verticalBig>
  );
}
