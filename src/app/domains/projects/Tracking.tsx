'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Card } from '@/prebuilts/card';
import { Grid } from '@/prebuilts/grid';

export default function Tracking() {
  useSetPageHeader('Tracking', 'Monitor project progress and timelines');

  return (
    <Grid.verticalBig>
      <Grid.cards>
        <Card.metric
          title="Active Projects"
          value={14}
          trend={2}
          trendDirection="up"
          context="started this week"
        />
        <Card.metric
          title="Hours Tracked"
          value="326"
          trend={18}
          trendDirection="up"
          context="this month"
        />
        <Card.metric
          title="On Schedule"
          value="92%"
          trend={5}
          trendDirection="up"
          context="improvement"
        />
      </Grid.cards>
    </Grid.verticalBig>
  );
}
