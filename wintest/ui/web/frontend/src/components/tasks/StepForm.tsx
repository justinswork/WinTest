import type { Step } from '../../api/types';
import { ActionPicker } from './ActionPicker';

interface Props {
  step: Step;
  index: number;
  onChange: (index: number, step: Step) => void;
  onDelete: (index: number) => void;
}

const NEEDS_TARGET = ['click', 'double_click', 'right_click', 'verify'];
const NEEDS_TEXT = ['type'];
const NEEDS_KEY = ['press_key'];
const NEEDS_KEYS = ['hotkey'];
const NEEDS_SCROLL = ['scroll'];
const NEEDS_WAIT = ['wait'];

export function StepForm({ step, index, onChange, onDelete }: Props) {
  const update = (field: string, value: unknown) => {
    onChange(index, { ...step, [field]: value });
  };

  return (
    <div className="step-form">
      <div className="step-form-header">
        <span className="step-number">#{index + 1}</span>
        <ActionPicker value={step.action} onChange={v => update('action', v)} />
        <input
          className="input flex-1"
          placeholder="Description (optional)"
          value={step.description}
          onChange={e => update('description', e.target.value)}
        />
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(index)}>Delete</button>
      </div>

      <div className="step-form-fields">
        {NEEDS_TARGET.includes(step.action) && (
          <input
            className="input"
            placeholder="Target element (e.g. 'File menu')"
            value={step.target ?? ''}
            onChange={e => update('target', e.target.value || null)}
          />
        )}
        {NEEDS_TEXT.includes(step.action) && (
          <input
            className="input"
            placeholder="Text to type"
            value={step.text ?? ''}
            onChange={e => update('text', e.target.value || null)}
          />
        )}
        {NEEDS_KEY.includes(step.action) && (
          <input
            className="input"
            placeholder="Key (e.g. 'enter', 'tab')"
            value={step.key ?? ''}
            onChange={e => update('key', e.target.value || null)}
          />
        )}
        {NEEDS_KEYS.includes(step.action) && (
          <input
            className="input"
            placeholder="Keys (e.g. 'ctrl, c')"
            value={step.keys?.join(', ') ?? ''}
            onChange={e => update('keys', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
          />
        )}
        {NEEDS_SCROLL.includes(step.action) && (
          <input
            className="input"
            type="number"
            placeholder="Scroll amount (positive=up, negative=down)"
            value={step.scroll_amount}
            onChange={e => update('scroll_amount', parseInt(e.target.value) || 0)}
          />
        )}
        {NEEDS_WAIT.includes(step.action) && (
          <input
            className="input"
            type="number"
            step="0.5"
            placeholder="Seconds to wait"
            value={step.wait_seconds}
            onChange={e => update('wait_seconds', parseFloat(e.target.value) || 0)}
          />
        )}
      </div>
    </div>
  );
}
