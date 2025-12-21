'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { EmailConsole } from '@/features/productivity/email-console';

export default function Email() {
  useSetPageHeader('Email', 'Inbox triage and workflow management');

  return <EmailConsole />;
}
