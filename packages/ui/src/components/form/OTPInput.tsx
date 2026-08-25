import { type ClipboardEvent, type KeyboardEvent, useId, useRef } from 'react';
import { cn } from '../../utils/cn';
import { FieldLabel, FieldFooter } from './shared';

export interface OTPInputProps {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  /** Number of digits/characters. @default 6 */
  length?: number;
  /** Current code. Shorter than `length` is fine (renders as trailing empty boxes). */
  value: string;
  onChange: (value: string) => void;
  /** Called once when the code reaches `length` characters. */
  onComplete?: (value: string) => void;
  /** Restrict input (and paste) to digits only. @default true */
  numericOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * Segmented one-time-passcode field — one single-character box per
 * digit, auto-advances on type, Backspace steps back and clears,
 * arrow keys move focus, and pasting a full code distributes it across
 * every box at once. Each box is `autoComplete="one-time-code"` so
 * mobile browsers/SMS autofill can fill the whole group from one box.
 */
export function OTPInput({
  label,
  hint,
  error,
  required,
  length = 6,
  value,
  onChange,
  onComplete,
  numericOnly = true,
  disabled,
  className,
}: OTPInputProps) {
  const groupId = useId();
  const hintId = `${groupId}-hint`;
  const errorId = `${groupId}-error`;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const pattern = numericOnly ? /^[0-9]$/ : /^.$/;

  const setChar = (index: number, char: string) => {
    const chars = value.split('');
    chars[index] = char;
    const next = chars.join('').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[index]) {
        e.preventDefault();
        setChar(index, '');
      } else if (index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
        setChar(index - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    } else if (pattern.test(e.key)) {
      e.preventDefault();
      setChar(index, e.key);
      if (index < length - 1) inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    const filtered = numericOnly ? pasted.replace(/\D/g, '') : pasted;
    const next = filtered.slice(0, length);
    if (!next) return;
    onChange(next);
    if (next.length === length) {
      onComplete?.(next);
      inputsRef.current[length - 1]?.focus();
    } else {
      inputsRef.current[next.length]?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={`${groupId}-0`} required={required}>
        {label}
      </FieldLabel>
      <div
        role="group"
        aria-label={typeof label === 'string' ? label : 'One-time code'}
        className={cn('flex gap-2', className)}
      >
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            id={`${groupId}-${i}`}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            value={value[i] ?? ''}
            onChange={() => {
              /* All writes happen in onKeyDown/onPaste — this only
                 suppresses the "missing onChange on controlled input"
                 warning for the native change event we don't use. */
            }}
            onKeyDown={handleKeyDown(i)}
            onPaste={handlePaste}
            disabled={disabled}
            inputMode={numericOnly ? 'numeric' : 'text'}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            required={required}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={!!error || undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'w-11 h-12 text-center text-lg font-semibold rounded-md border bg-surface text-text-primary',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:bg-surface-secondary disabled:text-text-disabled disabled:cursor-not-allowed',
              error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary',
            )}
          />
        ))}
      </div>
      <FieldFooter hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
