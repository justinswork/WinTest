import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Circle, Square } from 'lucide-react';

type Mode = 'single' | 'combo';

interface Props {
  value: string;
  onChange: (value: string) => void;
  mode: Mode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onEnter?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

// Map browser KeyboardEvent.key values to the names PyAutoGUI accepts.
// Anything not listed falls through as `key.toLowerCase()` — which covers
// letters, digits, and most punctuation.
const KEY_ALIASES: Record<string, string> = {
  ' ': 'space',
  Enter: 'enter',
  Tab: 'tab',
  Escape: 'escape',
  Backspace: 'backspace',
  Delete: 'delete',
  Insert: 'insert',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  CapsLock: 'capslock',
  NumLock: 'numlock',
  ScrollLock: 'scrolllock',
  PrintScreen: 'printscreen',
  Pause: 'pause',
  Control: 'ctrl',
  Shift: 'shift',
  Alt: 'alt',
  Meta: 'win',
  ContextMenu: 'apps',
};

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function pyautoguiName(key: string): string {
  if (key in KEY_ALIASES) return KEY_ALIASES[key];
  if (/^F\d{1,2}$/.test(key)) return key.toLowerCase();
  return key.toLowerCase();
}

export function KeyRecorder({
  value,
  onChange,
  mode,
  placeholder,
  className,
  disabled,
  onEnter,
  inputRef,
}: Props) {
  const { t } = useTranslation();
  const [recording, setRecording] = useState(false);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? fallbackRef;

  // Capture the next keypress while recording.
  useEffect(() => {
    if (!recording) return;
    const handler = (e: KeyboardEvent) => {
      // Always swallow keys while recording so they don't fire shortcuts.
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape' && mode === 'single' && !value) {
        // Allow Escape to cancel recording when no key has been chosen yet
        // (only ambiguous in single mode where Escape is also a valid key —
        // but in single mode we capture immediately, so this branch is rare).
      }

      if (MODIFIER_KEYS.has(e.key)) {
        // Wait for the non-modifier keypress that completes the chord.
        return;
      }

      if (mode === 'single') {
        onChange(pyautoguiName(e.key));
      } else {
        const parts: string[] = [];
        if (e.ctrlKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        if (e.metaKey) parts.push('win');
        parts.push(pyautoguiName(e.key));
        onChange(parts.join(', '));
      }
      setRecording(false);
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recording, mode, onChange, value]);

  const toggleRecording = () => {
    if (disabled) return;
    setRecording(r => !r);
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
      <input
        ref={ref}
        className={className ?? 'input flex-1'}
        placeholder={recording ? t('keyRecorder.pressAKey') : placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (recording) return; // recording handler takes over via window listener
          if (e.key === 'Enter' && value && onEnter) onEnter();
        }}
        disabled={disabled || recording}
      />
      <button
        type="button"
        className={`btn btn-sm ${recording ? 'btn-danger' : 'btn-secondary'}`}
        onClick={toggleRecording}
        disabled={disabled}
        title={recording ? t('keyRecorder.stop') : t('keyRecorder.record')}
      >
        {recording ? <Square size={14} /> : <Circle size={14} />}
        {recording ? t('keyRecorder.stop') : t('keyRecorder.record')}
      </button>
    </span>
  );
}
