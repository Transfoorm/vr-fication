/**──────────────────────────────────────────────────────────────────────┐
│  🎟️ INVITES TAB                                                       │
│  /src/features/admin/users-tabs/invites-tab/index.tsx                 │
│                                                                       │
│  Admin user invitations:                                              │
│  - Single invite via Field.verify pill                                │
│  - Batch invite via multi-email input                                 │
│  - CSV upload for bulk invites                                        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './invites-tab.css';
import { useState, useRef } from 'react';
import { Field, Card, T, Stack } from '@/vr';
import { sendInviteLink } from '@/app/(clerk)/actions/invite';

interface BatchResult {
  email: string;
  success: boolean;
  error?: string;
  magicLink?: string;
}

export function InvitesFeature() {
  // Single invite state
  const [lastSentTo, setLastSentTo] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Batch invite state
  const [batchEmails, setBatchEmails] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedEmails, setCopiedEmails] = useState<Set<string>>(new Set());

  // Queue approach state
  const [emailQueue, setEmailQueue] = useState<string[]>([]);
  const [queueInput, setQueueInput] = useState('');

  // CSV upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────────────────────────────
  // Single Invite Handlers
  // ─────────────────────────────────────────────────────────────────────

  const handleSendInvite = async (email: string) => {
    const result = await sendInviteLink(email);

    if (result.error) {
      throw new Error(result.error);
    }

    setLastSentTo(email);
    setMagicLink(result.magicLink || null);
    setCopied(false);
    setHasCopied(false);
  };

  const helperText = lastSentTo
    ? `✓ Invite link created for: ${lastSentTo}`
    : 'Type an email to invite a new user to the platform';

  const handleCopyLink = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setHasCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setLastSentTo(null);
    setMagicLink(null);
    setCopied(false);
    setHasCopied(false);
  };

  const getButtonText = () => {
    if (copied) return 'Copied!';
    if (hasCopied) return 'Clear';
    return 'Copy';
  };

  const handleButtonClick = () => {
    if (copied) return;
    if (hasCopied) {
      handleClear();
    } else {
      handleCopyLink();
    }
  };

  // ─────────────────────────────────────────────────────────────────────
  // Batch Invite Handlers
  // ─────────────────────────────────────────────────────────────────────

  const parseEmails = (input: string): string[] => {
    // Split by comma, newline, semicolon, or space
    const emails = input
      .split(/[,;\n\s]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes('@'));
    // Remove duplicates
    return [...new Set(emails)];
  };

  const handleBatchInvite = async () => {
    const emails = parseEmails(batchEmails);
    if (emails.length === 0) return;

    setIsBatchProcessing(true);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: emails.length });

    const results: BatchResult[] = [];

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      setBatchProgress({ current: i + 1, total: emails.length });

      try {
        const result = await sendInviteLink(email);
        if (result.error) {
          results.push({ email, success: false, error: result.error });
        } else {
          results.push({ email, success: true, magicLink: result.magicLink });
        }
      } catch {
        results.push({ email, success: false, error: 'Failed to send invite' });
      }

      // Update results as we go
      setBatchResults([...results]);
    }

    setIsBatchProcessing(false);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Extract emails from CSV (assumes email is in first column or contains @)
      const lines = text.split('\n');
      const emails: string[] = [];

      for (const line of lines) {
        const cells = line.split(',');
        for (const cell of cells) {
          const trimmed = cell.trim().replace(/"/g, '');
          if (trimmed.includes('@') && trimmed.includes('.')) {
            emails.push(trimmed);
          }
        }
      }

      setBatchEmails(emails.join('\n'));
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearBatch = () => {
    setBatchEmails('');
    setBatchResults([]);
    setBatchProgress({ current: 0, total: 0 });
  };

  // ─────────────────────────────────────────────────────────────────────
  // Queue Approach Handlers
  // ─────────────────────────────────────────────────────────────────────

  const handleAddToQueue = () => {
    const email = queueInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (emailQueue.includes(email)) return; // No duplicates
    setEmailQueue([...emailQueue, email]);
    setQueueInput('');
  };

  const handleRemoveFromQueue = (index: number) => {
    setEmailQueue(emailQueue.filter((_, i) => i !== index));
  };

  const handleSendQueue = async () => {
    if (emailQueue.length === 0) return;

    setIsBatchProcessing(true);
    setBatchResults([]);
    setBatchProgress({ current: 0, total: emailQueue.length });

    const results: BatchResult[] = [];

    for (let i = 0; i < emailQueue.length; i++) {
      const email = emailQueue[i];
      setBatchProgress({ current: i + 1, total: emailQueue.length });

      try {
        const result = await sendInviteLink(email);
        if (result.error) {
          results.push({ email, success: false, error: result.error });
        } else {
          results.push({ email, success: true, magicLink: result.magicLink });
        }
      } catch {
        results.push({ email, success: false, error: 'Failed to send invite' });
      }

      setBatchResults([...results]);
    }

    setIsBatchProcessing(false);
    setEmailQueue([]); // Clear queue after sending
  };

  const handleClearQueue = () => {
    setEmailQueue([]);
    setQueueInput('');
  };

  const successCount = batchResults.filter(r => r.success).length;
  const failCount = batchResults.filter(r => !r.success).length;

  return (
    <Stack>
      {/* Single Invite Card */}
      <Card.standard
        title="Single Invite"
        subtitle="Send one invitation link"
      >
        <div className="vr-field-spacing">
          <div className="vr-field-row">
            <div className={lastSentTo ? 'ft-invitestab__success' : ''}>
              <Field.verify
                label="Send an Invite Link to the user's email"
                value=""
                onCommit={handleSendInvite}
                type="email"
                placeholder="Enter email address"
                helper={helperText}
                variant="send"
              />
            </div>
            <div />
          </div>

          <div className="ft-invitestab__link-box">
            <T.caption className="ft-invitestab__link-label">Invite Link (expires in 24 hours):</T.caption>
            <div className="ft-invitestab__link-row">
              <input
                type="text"
                value={magicLink || ''}
                readOnly
                placeholder="Generate a link above"
                className="ft-invitestab__link-input"
              />
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={!magicLink && !hasCopied}
                className={`ft-invitestab__copy-btn ${copied ? 'ft-invitestab__copy-btn--copied' : ''} ${hasCopied && !copied ? 'ft-invitestab__copy-btn--clear' : ''}`}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      </Card.standard>

      {/* Batch Invite Card */}
      <Card.standard
        title="Batch Invite"
        subtitle="Send multiple invitations at once"
      >
        <div className="vr-field-spacing">
          {/* Method 1: Queue - Add one at a time */}
          <div className="ft-invitestab__queue-section">
            <T.caption className="ft-invitestab__queue-label">Add emails one by one:</T.caption>
            <div className="ft-invitestab__queue-input-row">
              <input
                type="email"
                value={queueInput}
                onChange={(e) => setQueueInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddToQueue()}
                placeholder="Enter email address"
                className="ft-invitestab__queue-input"
                disabled={isBatchProcessing}
              />
              <button
                type="button"
                onClick={handleAddToQueue}
                disabled={isBatchProcessing || !queueInput.includes('@')}
                className="ft-invitestab__send-btn"
              >
                Add
              </button>
            </div>

            {emailQueue.length > 0 && (
              <div className="ft-invitestab__queue-list">
                {emailQueue.map((email, i) => (
                  <div key={i} className="ft-invitestab__queue-item">
                    <T.caption className="ft-invitestab__queue-email">{email}</T.caption>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromQueue(i)}
                      className="ft-invitestab__queue-remove"
                      disabled={isBatchProcessing}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="ft-invitestab__batch-actions">
                  <button
                    type="button"
                    onClick={handleSendQueue}
                    disabled={isBatchProcessing}
                    className="ft-invitestab__send-btn"
                  >
                    {isBatchProcessing
                      ? `Sending ${batchProgress.current}/${batchProgress.total}...`
                      : `Send ${emailQueue.length} Invites`}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearQueue}
                    disabled={isBatchProcessing}
                    className="ft-invitestab__clear-btn"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Method 2: Textarea - Comma/newline separated */}
          <div className="ft-invitestab__queue-section">
            <T.caption className="ft-invitestab__queue-label">Or paste multiple emails:</T.caption>
            <textarea
              value={batchEmails}
              onChange={(e) => setBatchEmails(e.target.value)}
              placeholder="Enter emails separated by commas, newlines, or spaces&#10;&#10;e.g.&#10;john@example.com&#10;jane@example.com, bob@example.com"
              className="ft-invitestab__batch-textarea"
              rows={5}
              disabled={isBatchProcessing}
            />
          </div>

          <div className="ft-invitestab__batch-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvUpload}
              className="ft-invitestab__file-input"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="ft-invitestab__upload-btn">
              Upload CSV
            </label>

            <button
              type="button"
              onClick={handleBatchInvite}
              disabled={isBatchProcessing || parseEmails(batchEmails).length === 0}
              className="ft-invitestab__send-btn"
            >
              {isBatchProcessing
                ? `Sending ${batchProgress.current}/${batchProgress.total}...`
                : `Send ${parseEmails(batchEmails).length || ''} Invites`}
            </button>

            {batchResults.length > 0 && (
              <button
                type="button"
                onClick={handleClearBatch}
                className="ft-invitestab__clear-btn"
              >
                Clear
              </button>
            )}
          </div>

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="ft-invitestab__batch-results">
              <div className="ft-invitestab__batch-summary">
                <T.body weight="semibold" className="ft-invitestab__batch-success">✓ {successCount} Invites Sent</T.body>
                {failCount > 0 && (
                  <T.body weight="semibold" className="ft-invitestab__batch-fail">✗ {failCount} failed</T.body>
                )}
              </div>
              <div className="ft-invitestab__batch-list">
                {batchResults.map((result, i) => (
                  <div
                    key={i}
                    className={`ft-invitestab__batch-item ${result.success ? 'ft-invitestab__batch-item--success' : 'ft-invitestab__batch-item--fail'}`}
                  >
                    <T.caption className={`ft-invitestab__batch-email ${copiedEmails.has(result.email) ? 'ft-invitestab__batch-email--copied' : ''}`}>{result.email}</T.caption>
                    {result.success && result.magicLink ? (
                      <button
                        type="button"
                        className={`ft-invitestab__batch-copy ${copiedIndex === i ? 'ft-invitestab__batch-copy--copied' : ''}`}
                        onClick={() => {
                          navigator.clipboard.writeText(result.magicLink!);
                          setCopiedIndex(i);
                          setCopiedEmails(prev => new Set(prev).add(result.email));
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                      >
                        {copiedIndex === i ? 'Copied!' : 'Copy Link'}
                      </button>
                    ) : result.success ? (
                      <T.caption className="ft-invitestab__batch-status">✓</T.caption>
                    ) : (
                      <T.caption className="ft-invitestab__batch-status">{result.error}</T.caption>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card.standard>
    </Stack>
  );
}
