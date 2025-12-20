'use client';

import '@/features/admin/showcase-bundle/showcase-bundle.css';
import { Card } from '@/vr/card';
import { Button } from '@/vr/button';
import { T } from '@/vr';

export default function Buttons() {
  return (
    <Card.standard
      title="Buttons Sandbox"
      subtitle="Choose from these button VR's (Variant Robots)"
    >
      <div className="ft-showcasetabs-grid-5">
        <Button.primary><T.caption>Button.primary</T.caption></Button.primary>
        <Button.secondary><T.caption>Button.secondary</T.caption></Button.secondary>
        <Button.ghost><T.caption>Button.ghost</T.caption></Button.ghost>
        <Button.danger><T.caption>Button.danger</T.caption></Button.danger>
        <Button.link><T.caption>Button.link</T.caption></Button.link>
        <Button.fire><T.caption>Button.fire</T.caption></Button.fire>
        <Button.outline><T.caption>Button.outline</T.caption></Button.outline>
        <Button.blue><T.caption>Button.blue</T.caption></Button.blue>
        <Button.green><T.caption>Button.green</T.caption></Button.green>
      </div>
    </Card.standard>
  );
}
