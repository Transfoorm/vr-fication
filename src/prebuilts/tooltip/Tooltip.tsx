/**──────────────────────────────────────────────────────────────────────┐
│  💬 TOOLTIP CARET VARIANT - Simple Dark Tooltip                       │
│  /src/prebuilts/tooltip/TooltipCaret.tsx                              │
│                                                                        │
│  Dark tooltip with portal rendering to avoid DOM clipping.            │
│                                                                        │
│  Usage:                                                                │
│  import { Tooltip } from '@/prebuilts/tooltip';                       │
│  <Tooltip.caret content="Help text">                                  │
│    <button>Hover me</button>                                          │
│  </Tooltip.caret>                                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './tooltip.css';

interface TooltipCaretProps {
  content: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  side?: 'top' | 'bottom' | 'left' | 'right';
  followCursor?: boolean;
  fullWidth?: boolean;
  trigger?: 'hover' | 'click';
  closeOnMouseLeave?: boolean;
  dismissOnClick?: boolean;
}

export default function TooltipCaret({ content, children, size = 'sm', side = 'top', followCursor = false, fullWidth = false, trigger = 'hover', closeOnMouseLeave = false, dismissOnClick = false }: TooltipCaretProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate position based on trigger element
  const calculatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = rect.top - 6;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
        break;
    }

    setPosition({ top, left });
  };

  const handleClick = () => {
    if (trigger === 'click') {
      calculatePosition();
      setIsVisible(!isVisible);
    } else if (dismissOnClick) {
      setIsVisible(false);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 50);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (trigger !== 'hover') return;

    if (followCursor) {
      const top = e.clientY - 8;
      const left = e.clientX;
      setPosition({ top, left });
    } else if (!isVisible) {
      calculatePosition();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    } else if (trigger === 'click' && closeOnMouseLeave) {
      setIsVisible(false);
    }
  };

  // Close tooltip when clicking outside (for click trigger mode)
  useEffect(() => {
    if (trigger !== 'click' || !isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [trigger, isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipElement = isVisible && isMounted ? (
    <div
      className={`vr-tooltip-caret-content vr-tooltip-caret-content--${size} vr-tooltip-caret-content--${side}`}
      style={
        {
          '--tooltip-top': `${position.top}px`,
          '--tooltip-left': `${position.left}px`,
        } as React.CSSProperties
      }
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`vr-tooltip-caret ${fullWidth ? 'vr-tooltip-caret--full-width' : ''}`}
      >
        {children}
      </span>

      {isMounted && tooltipElement && createPortal(tooltipElement, document.body)}
    </>
  );
}
