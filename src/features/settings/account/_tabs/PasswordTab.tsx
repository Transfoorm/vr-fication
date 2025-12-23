/**──────────────────────────────────────────────────────────────────────┐
│  🔱 PASSWORD FIELDS - Account Security Feature                         │
│  /src/features/account/PasswordFields/index.tsx                        │
│                                                                        │
│  Sovereign Feature for identity-grade password changes.                │
│  Owns the entire two-box ceremony + server action wiring.              │
│                                                                        │
│  STAGES:                                                               │
│  - fresh: Box 1 idle (dots), Box 2 dormant (opaque, dead)              │
│  - typing: Box 1 editing, Box 2 alive but disabled                     │
│  - valid: Box 1 valid (green), Box 2 ready (can edit)                  │
│  - confirming: Both boxes active, typing confirmation                  │
│  - committing: Calling server action                                   │
│  - success: Password changed                                           │
│                                                                        │
│  SOVEREIGNTY: No Clerk imports - Golden Bridge enforced                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon, T, Card } from '@/vr';
import { changePassword } from '@/app/(clerk)/actions/password';
import '../account.css';

type CeremonyStage = 'fresh' | 'typing' | 'valid' | 'confirming' | 'committing' | 'success';

export function PasswordFields() {
  // ─────────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<CeremonyStage>('fresh');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Refs for click detection and focus
  const box1Ref = useRef<HTMLDivElement>(null);
  const box2Ref = useRef<HTMLDivElement>(null);
  const box2InputRef = useRef<HTMLInputElement>(null);
  const ceremonyRef = useRef<HTMLDivElement>(null);
  const clickedBox2Ref = useRef(false);

  // ─────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────
  const isPasswordValid = useCallback((pw: string) => {
    return pw.length >= 6 && pw.length <= 32 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw);
  }, []);

  const passwordMeetsRequirements = isPasswordValid(password);

  // ─────────────────────────────────────────────────────────────────────
  // Reset to fresh state
  // ─────────────────────────────────────────────────────────────────────
  const resetToFresh = useCallback(() => {
    setStage('fresh');
    setPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setConfirmError(null);
    setShowPassword(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Auto-focus box 2 input when entering confirm stage
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage === 'confirming') {
      // Small delay to ensure input is rendered
      setTimeout(() => box2InputRef.current?.focus(), 0);
    }
  }, [stage]);

  // ─────────────────────────────────────────────────────────────────────
  // Click outside detection (like a modal)
  // ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Only listen when not fresh
    if (stage === 'fresh') return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // If click is inside ceremony (either box), ignore
      if (ceremonyRef.current?.contains(target)) {
        return;
      }

      // Click outside - reset
      resetToFresh();
    };

    // Use mousedown so it fires before blur
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [stage, resetToFresh]);

  // ─────────────────────────────────────────────────────────────────────
  // Box 1 Handlers
  // ─────────────────────────────────────────────────────────────────────
  const handleBox1Focus = useCallback(() => {
    if (stage === 'fresh') {
      setStage('typing');
    }
    setPasswordError(null);
  }, [stage]);

  const handleBox1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Block input beyond 32 characters
    if (value.length > 32) {
      setPassword(value.slice(0, 32));
      setPasswordError('Password must be 32 characters or less');
      return;
    }

    setPassword(value);
    setPasswordError(null);

    // Update stage based on validity
    if (isPasswordValid(value)) {
      setStage('valid');
    } else if (stage === 'valid') {
      setStage('typing');
    }
  }, [stage, isPasswordValid]);

  // Blur handler - document click listener handles reset, this is just for cleanup
  const handleBox1Blur = useCallback(() => {
    // Reset is handled by document click listener
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Box 2 Handlers
  // ─────────────────────────────────────────────────────────────────────
  const handleBox2Click = useCallback(() => {
    // Set ref FIRST - before blur fires
    clickedBox2Ref.current = true;

    // If password doesn't meet requirements, show error
    if (!passwordMeetsRequirements) {
      if (password.length > 0) {
        // Specific error for too long
        if (password.length > 32) {
          setPasswordError('Password must be 32 characters or less');
        } else {
          setPasswordError('Password must be at least 6 characters with 1 uppercase, 1 number, 1 symbol');
        }
      }
      return; // Don't allow focus
    }

    // Password is valid - allow editing box 2
    setStage('confirming');
  }, [passwordMeetsRequirements, password]);

  const handleBox2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    setConfirmError(null);
  }, []);

  // Blur handler - document click listener handles reset
  const handleBox2Blur = useCallback(() => {
    // Reset is handled by document click listener
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Commit Handler
  // ─────────────────────────────────────────────────────────────────────
  const handleCommit = useCallback(async () => {
    // Validate match
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    // Validate requirements (double-check)
    if (!passwordMeetsRequirements) {
      setPasswordError('Password does not meet requirements');
      return;
    }

    setStage('committing');
    setConfirmError(null);

    try {
      const result = await changePassword(password);

      if (result.error) {
        setConfirmError(result.error);
        setStage('confirming');
        return;
      }

      // Success
      setStage('success');
      setTimeout(() => {
        resetToFresh();
      }, 2000);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Failed to change password');
      setStage('confirming');
    }
  }, [password, confirmPassword, passwordMeetsRequirements, resetToFresh]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && stage === 'confirming' && confirmPassword) {
      handleCommit();
    } else if (e.key === 'Escape') {
      resetToFresh();
    }
  }, [stage, confirmPassword, handleCommit, resetToFresh]);

  // ─────────────────────────────────────────────────────────────────────
  // Derived States
  // ─────────────────────────────────────────────────────────────────────
  const box1State = {
    isIdle: stage === 'fresh',
    isEditing: stage !== 'fresh',
    isValid: passwordMeetsRequirements && password.length > 0,
    hasError: !!passwordError,
  };

  // Check if passwords match (for green state on box 2)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Box 2 should show input if it has content OR if we're in confirming/committing stage
  const box2HasContent = confirmPassword.length > 0;

  // Mismatch = box 2 has content but doesn't match box 1 (show orange focus)
  const isMismatch = box2HasContent && !passwordsMatch;

  const box2State = {
    isDormant: stage === 'fresh',
    isDisabled: stage === 'typing' || (stage === 'valid' && !passwordMeetsRequirements),
    isReady: stage === 'valid' && passwordMeetsRequirements && !box2HasContent,
    isEditing: stage === 'confirming' || stage === 'committing' || box2HasContent,
    isSuccess: stage === 'success',
    isValid: passwordsMatch,
    isMismatch: isMismatch,
  };

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────
  return (
    <Card.standard
      title="Password Settings"
      subtitle="Update your account password"
    >
      <div ref={ceremonyRef} className="ft-passwordtab" onKeyDown={handleKeyDown}>
      {/* BOX 1: Change Password */}
      <div
        ref={box1Ref}
        className={[
          'ft-passwordtab__box',
          box1State.isIdle && 'ft-passwordtab__box--idle',
          box1State.isValid && 'ft-passwordtab__box--valid',
          box1State.hasError && 'ft-passwordtab__box--error',
        ].filter(Boolean).join(' ')}
      >
        <label className="ft-passwordtab__label"><T.body size="sm" weight="medium">Change Password</T.body></label>
        <div className="ft-passwordtab__input-wrapper">
          {box1State.isIdle ? (
            <div
              className="ft-passwordtab__input ft-passwordtab__input--masked"
              onClick={() => {
                setStage('typing');
                // Focus will happen naturally
              }}
            >
              <T.body>••••••••••••</T.body>
            </div>
          ) : (
            <input
              type={showPassword ? 'text' : 'password'}
              className="ft-passwordtab__input"
              value={password}
              onChange={handleBox1Change}
              onFocus={handleBox1Focus}
              onBlur={handleBox1Blur}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey && passwordMeetsRequirements) {
                  e.preventDefault();
                  setStage('confirming');
                  // Focus will be set by the useEffect that watches for 'confirming' stage
                }
              }}
              autoFocus
              autoComplete="new-password"
              placeholder="Enter new password"
            />
          )}
          {box1State.isEditing && (
            <button
              type="button"
              className="ft-passwordtab__eye"
              onClick={() => setShowPassword(!showPassword)}
              onMouseDown={(e) => e.preventDefault()}
              tabIndex={-1}
            >
              <Icon variant={showPassword ? 'eye-off' : 'eye'} size="xs" />
            </button>
          )}
          {!box1State.isEditing && (
            <button
              type="button"
              className="ft-passwordtab__pill ft-passwordtab__pill--empty"
              onClick={() => setStage('typing')}
            >
              <T.caption size="xs" weight="medium">Change</T.caption>
            </button>
          )}
        </div>
        {passwordError ? (
          <div className="ft-passwordtab__error"><T.caption>{passwordError}</T.caption></div>
        ) : (
          <div className="ft-passwordtab__helper">
            <T.caption>* At least 6 characters with 1 uppercase, 1 number, 1 symbol</T.caption>
          </div>
        )}
      </div>

      {/* BOX 2: Retype Password */}
      <div
        ref={box2Ref}
        className={[
          'ft-passwordtab__box',
          box2State.isDormant && 'ft-passwordtab__box--dormant',
          box2State.isDisabled && !box2State.isMismatch && 'ft-passwordtab__box--disabled',
          box2State.isReady && 'ft-passwordtab__box--ready',
          box2State.isSuccess && 'ft-passwordtab__box--success',
          box2State.isValid && 'ft-passwordtab__box--valid',
          box2State.isMismatch && 'ft-passwordtab__box--mismatch',
          confirmError && 'ft-passwordtab__box--error',
        ].filter(Boolean).join(' ')}
        onMouseDown={!box2State.isEditing ? handleBox2Click : undefined}
      >
        <label className="ft-passwordtab__label"><T.body size="sm" weight="medium">Confirm Password</T.body></label>
        <div className="ft-passwordtab__input-wrapper">
          {box2State.isEditing ? (
            <input
              ref={box2InputRef}
              type={showPassword ? 'text' : 'password'}
              className="ft-passwordtab__input"
              value={confirmPassword}
              onChange={handleBox2Change}
              onBlur={handleBox2Blur}
              autoComplete="new-password"
              placeholder="Retype new password"
            />
          ) : (
            <div className="ft-passwordtab__input ft-passwordtab__input--empty">
              {box2State.isDormant ? '' : <T.body size="sm">Retype new password</T.body>}
            </div>
          )}
          {/* Only show pill when passwords match, committing, success, or error */}
          {(passwordsMatch || stage === 'committing' || stage === 'success' || confirmError) && (
            <button
              type="button"
              className={[
                'ft-passwordtab__pill',
                box2State.isSuccess && 'ft-passwordtab__pill--success',
                stage === 'committing' && 'ft-passwordtab__pill--committing',
                passwordsMatch && !box2State.isSuccess && stage !== 'committing' && 'ft-passwordtab__pill--active',
                confirmError && 'ft-passwordtab__pill--error',
              ].filter(Boolean).join(' ')}
              onClick={passwordsMatch ? handleCommit : undefined}
              disabled={stage === 'committing' || stage === 'success'}
            >
              <T.caption size="xs" weight="medium">
                {stage === 'success' ? 'Changed ✓' :
                 stage === 'committing' ? <span className="ft-passwordtab__typing">Updating...</span> :
                 confirmError ? 'Invalid' :
                 'Update →'}
              </T.caption>
            </button>
          )}
        </div>
        {confirmError && (
          <div className="ft-passwordtab__error"><T.caption>{confirmError}</T.caption></div>
        )}
      </div>
      </div>
    </Card.standard>
  );
}
