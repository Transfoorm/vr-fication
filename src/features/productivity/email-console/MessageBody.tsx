'use client';

/**──────────────────────────────────────────────────────────────────────┐
│  MESSAGE BODY - Displays email HTML content (Iframe Isolated)         │
│  /src/features/productivity/email-console/MessageBody.tsx             │
│                                                                        │
│  3-LAYER ARCHITECTURE: Content sandbox (Layer 3)                      │
│  - Email HTML renders in isolated iframe (CSS sovereignty)            │
│  - Fixed height, internal scroll (no height measurement)              │
│  - No ResizeObserver, no MutationObserver, no polling                 │
│  - Zero CSS cascade crossover between email and app                   │
│                                                                        │
│  Layer 1: .ft-email__reading (resize owner)                           │
│  Layer 2: .ft-email__reading-scroll (scroll container)                │
│  Layer 3: This iframe (content sandbox)                               │
│                                                                        │
│  DECOUPLED DISPLAY (Outlook pattern):                                 │
│  - Fetch is triggered by parent (useEmailBodySync in index.tsx)       │
│  - This component only displays - receives displayedMessageId         │
│  - Old email stays visible until new body is ready                    │
│                                                                        │
│  LOADING STATES:                                                       │
│  - loading: "Loading email..."                                        │
│  - rate_limited: "Loading email (retrying...)"                        │
│  - error: "Failed to load email"                                      │
│  - loaded: Shows email body                                           │
└────────────────────────────────────────────────────────────────────────*/

import { useRef, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import type { Id } from '@/convex/_generated/dataModel';

interface MessageBodyProps {
  messageId: Id<'productivity_email_Index'>;
  onContextMenu?: (x: number, y: number) => void;
}

/**
 * MessageBody - Displays full email HTML content in isolated iframe
 *
 * Pure display component. Fetch triggered by parent.
 * The iframe is a sandbox - it never affects parent layout.
 * Shows loading/error states based on emailBodyStatus.
 */
export function MessageBody({ messageId, onContextMenu }: MessageBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Read from FUSE (fetch triggered by parent)
  const htmlContent = useFuse((state) => state.emailBodyCache.emailBodies?.[messageId]);
  const status = useFuse((state) => state.emailBodyCache.emailBodyStatus?.[messageId]);

  // Listen for postMessage from iframe for context menu
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'email-contextmenu') {
        const iframe = iframeRef.current;
        if (!iframe) return;

        // Convert iframe coordinates to parent window coordinates
        const iframeRect = iframe.getBoundingClientRect();
        const x = iframeRect.left + event.data.clientX;
        const y = iframeRect.top + event.data.clientY;

        onContextMenu?.(x, y);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onContextMenu]);

  // Loading state - show feedback
  if (status === 'loading') {
    return (
      <div className="ft-email__loading">
        <T.body>Loading email...</T.body>
      </div>
    );
  }

  if (status === 'rate_limited') {
    return (
      <div className="ft-email__loading">
        <T.body>Loading email (retrying...)</T.body>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="ft-email__error">
        <T.body>Failed to load email. Try selecting another email.</T.body>
      </div>
    );
  }

  // No content and no status - not yet triggered
  if (!htmlContent && !status) {
    return null;
  }

  // Empty content but loaded (404 case) - message deleted
  if (!htmlContent && status === 'loaded') {
    return (
      <div className="ft-email__empty">
        <T.body>This message is no longer available.</T.body>
      </div>
    );
  }

  // Email HTML with internal scroll + styled scrollbar
  // Script sends postMessage to parent for context menu handling
  const iframeContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<style>
* { box-sizing: border-box; }
html {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}
body {
  margin: 0;
  padding: 4px 12px;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.12) transparent;
}
body::-webkit-scrollbar { width: 4px !important; }
body::-webkit-scrollbar-track { background: transparent !important; }
body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12) !important; border-radius: 2px !important; }
body::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2) !important; }
img { max-width: 100%; height: auto; }
a { color: #0066cc; }
pre, code { overflow-x: auto; }
table { max-width: 100%; }
</style>
<script>
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  window.parent.postMessage({ type: 'email-contextmenu', x: e.screenX, y: e.screenY, clientX: e.clientX, clientY: e.clientY }, '*');
});
</script>
</head>
<body>${htmlContent}</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      key={messageId}
      srcDoc={iframeContent}
      className="ft-email__message-iframe"
      title="Email content"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
