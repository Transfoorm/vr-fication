'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { EmailConsole } from '@/features/productivity/email-console';
import { Page } from '@/vr';

export default function Email() {
  useSetPageHeader('Email', 'Inbox triage and workflow management');

  return (
    <Page.full>
      <EmailConsole />
    </Page.full>
  );
}
