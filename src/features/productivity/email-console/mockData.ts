/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL CONSOLE MOCK DATA - Development Only                        │
│  /src/features/productivity/email-console/mockData.ts                 │
│                                                                        │
│  Temporary mock data to visualize the email console UI                │
│  DELETE THIS FILE once real email sync is implemented                 │
└────────────────────────────────────────────────────────────────────────┘ */

import type { ProductivityEmail } from './types';

export const MOCK_EMAIL_DATA: ProductivityEmail = {
  threads: [
    {
      threadId: 'thread-1',
      subject: 'Q1 Budget Review - Action Required',
      participants: [
        { name: 'Sarah Chen', email: 'sarah@acme.com' },
        { name: 'Mike Johnson', email: 'mike@acme.com' },
      ],
      state: 'awaiting_me',
      messageCount: 3,
      latestMessageAt: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      hasUnread: true,
    },
    {
      threadId: 'thread-2',
      subject: 'Client Onboarding - New Requirements',
      participants: [
        { name: 'Alex Rivera', email: 'alex@client.com' },
      ],
      state: 'awaiting_me',
      messageCount: 5,
      latestMessageAt: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
      hasUnread: true,
    },
    {
      threadId: 'thread-3',
      subject: 'Team Lunch This Friday?',
      participants: [
        { name: 'Emily Park', email: 'emily@acme.com' },
        { name: 'David Kim', email: 'david@acme.com' },
      ],
      state: 'awaiting_them',
      messageCount: 2,
      latestMessageAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      hasUnread: false,
    },
    {
      threadId: 'thread-4',
      subject: 'Project Alpha - Milestone Completed',
      participants: [
        { name: 'Jennifer Lee', email: 'jen@acme.com' },
      ],
      state: 'resolved',
      messageCount: 8,
      latestMessageAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      hasUnread: false,
    },
    {
      threadId: 'thread-5',
      subject: 'Invoice #1234 - Payment Confirmation',
      participants: [
        { name: 'Accounts Receivable', email: 'billing@vendor.com' },
      ],
      state: 'resolved',
      messageCount: 2,
      latestMessageAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      hasUnread: false,
    },
    {
      threadId: 'thread-6',
      subject: 'Security Alert: New Login Detected',
      participants: [
        { email: 'security@platform.com' },
      ],
      state: 'none',
      messageCount: 1,
      latestMessageAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
      hasUnread: false,
    },
  ],
  messages: [
    // Thread 1 messages
    {
      _id: 'msg-1-1',
      externalThreadId: 'thread-1',
      from: { name: 'Sarah Chen', email: 'sarah@acme.com' },
      to: [{ name: 'You', email: 'you@acme.com' }],
      receivedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      snippet: 'Hi team, I need everyone to review the Q1 budget proposal by EOD Friday. Please focus on the marketing spend section.',
      hasAttachments: true,
      resolutionState: 'awaiting_me',
      aiClassification: {
        intent: 'action_required',
        priority: 'high',
        senderType: 'internal_team',
        explanation: 'Budget review with explicit deadline requires immediate action',
        confidence: 0.92,
      },
    },
    {
      _id: 'msg-1-2',
      externalThreadId: 'thread-1',
      from: { name: 'Mike Johnson', email: 'mike@acme.com' },
      to: [
        { name: 'Sarah Chen', email: 'sarah@acme.com' },
        { name: 'You', email: 'you@acme.com' },
      ],
      receivedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      snippet: 'Sarah, I reviewed the numbers and have some concerns about the projected ROI. Can we schedule a quick call?',
      hasAttachments: false,
      resolutionState: 'awaiting_them',
    },
    {
      _id: 'msg-1-3',
      externalThreadId: 'thread-1',
      from: { name: 'Sarah Chen', email: 'sarah@acme.com' },
      to: [
        { name: 'Mike Johnson', email: 'mike@acme.com' },
        { name: 'You', email: 'you@acme.com' },
      ],
      receivedAt: Date.now() - 2 * 60 * 60 * 1000,
      snippet: 'Great point Mike. I am free tomorrow at 2pm. Does that work for everyone?',
      hasAttachments: false,
      resolutionState: 'awaiting_me',
    },

    // Thread 2 messages
    {
      _id: 'msg-2-1',
      externalThreadId: 'thread-2',
      from: { name: 'Alex Rivera', email: 'alex@client.com' },
      to: [{ name: 'You', email: 'you@acme.com' }],
      receivedAt: Date.now() - 4 * 60 * 60 * 1000,
      snippet: 'Following up on our call yesterday. We need to add user authentication and payment processing to the scope. Can you send an updated quote?',
      hasAttachments: false,
      resolutionState: 'awaiting_me',
      aiClassification: {
        intent: 'scope_change',
        priority: 'medium',
        senderType: 'client',
        explanation: 'Client requesting scope change and quote - requires response',
        confidence: 0.88,
      },
    },

    // Thread 3 messages
    {
      _id: 'msg-3-1',
      externalThreadId: 'thread-3',
      from: { name: 'You', email: 'you@acme.com' },
      to: [
        { name: 'Emily Park', email: 'emily@acme.com' },
        { name: 'David Kim', email: 'david@acme.com' },
      ],
      receivedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      snippet: 'Hey team! Want to grab lunch Friday at that new Thai place? My treat 🍜',
      hasAttachments: false,
      resolutionState: 'awaiting_them',
    },

    // Thread 4 messages
    {
      _id: 'msg-4-1',
      externalThreadId: 'thread-4',
      from: { name: 'Jennifer Lee', email: 'jen@acme.com' },
      to: [{ name: 'You', email: 'you@acme.com' }],
      receivedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      snippet: 'Project Alpha hit 100% completion! All deliverables signed off. Great work team!',
      hasAttachments: true,
      resolutionState: 'resolved',
      aiClassification: {
        intent: 'update',
        priority: 'low',
        senderType: 'internal_team',
        explanation: 'Project completion announcement - informational only',
        confidence: 0.95,
      },
    },

    // Thread 5 messages
    {
      _id: 'msg-5-1',
      externalThreadId: 'thread-5',
      from: { name: 'Accounts Receivable', email: 'billing@vendor.com' },
      to: [{ name: 'You', email: 'you@acme.com' }],
      receivedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      snippet: 'Payment of $4,500 received for Invoice #1234. Thank you for your business!',
      hasAttachments: true,
      resolutionState: 'resolved',
      aiClassification: {
        intent: 'receipt',
        priority: 'low',
        senderType: 'automated',
        explanation: 'Payment confirmation - no action needed',
        confidence: 0.98,
      },
    },

    // Thread 6 messages
    {
      _id: 'msg-6-1',
      externalThreadId: 'thread-6',
      from: { email: 'security@platform.com' },
      to: [{ name: 'You', email: 'you@acme.com' }],
      receivedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      snippet: 'New login detected from San Francisco, CA. If this was not you, please secure your account immediately.',
      hasAttachments: false,
      resolutionState: 'none',
      aiClassification: {
        intent: 'security_alert',
        priority: 'medium',
        senderType: 'automated',
        explanation: 'Security notification - review recommended',
        confidence: 0.94,
      },
    },
  ],
};
