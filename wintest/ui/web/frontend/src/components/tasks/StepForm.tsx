import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
const NEEDS_WAIT = ['wait', 'launch_application'];
const NEEDS_APP_PATH = ['launch_application'];
const NEEDS_EXPECTED = ['verify'];

export function StepForm({ step, index, onChange, onDelete }: Props) {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (field: string, value: unknown) => {
    onChange(index, { ...step, [field]: value });
  };

  const hasNonDefaultAdvanced =
    step.retry_attempts !== 3 ||
    step.retry_delay !== 2.0 ||
    step.timeout !== null;

  return (
    <div className="step-form">
      <div className="step-form-header">
        <span className="step-number">#{index + 1}</span>
        <ActionPicker value={step.action} onChange={v => update('action', v)} />
        <Link to={`/help#action-${step.action}`} className="help-btn" title={t('stepForm.helpTooltip')}>?</Link>
        <input
          className="input flex-1"
          placeholder={t('stepForm.descriptionPlaceholder')}
          value={step.description}
          onChange={e => update('description', e.target.value)}
        />
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(index)}>{t('common.delete')}</button>
      </div>

      <div className="step-form-fields">
        {NEEDS_APP_PATH.includes(step.action) && (
          <>
            <input
              className="input"
              placeholder={t('stepForm.appPathPlaceholder')}
              value={step.app_path ?? ''}
              onChange={e => update('app_path', e.target.value || null)}
            />
            <input
              className="input"
              placeholder={t('stepForm.appTitlePlaceholder')}
              value={step.app_title ?? ''}
              onChange={e => update('app_title', e.target.value || null)}
            />
          </>
        )}
        {NEEDS_TARGET.includes(step.action) && (
          <input
            className="input"
            placeholder={t('stepForm.targetPlaceholder')}
            value={step.target ?? ''}
            onChange={e => update('target', e.target.value || null)}
          />
        )}
        {NEEDS_TEXT.includes(step.action) && (
          <input
            className="input"
            placeholder={t('stepForm.textPlaceholder')}
            value={step.text ?? ''}
            onChange={e => update('text', e.target.value || null)}
          />
        )}
        {NEEDS_KEY.includes(step.action) && (
          <input
            className="input"
            placeholder={t('stepForm.keyPlaceholder')}
            value={step.key ?? ''}
            onChange={e => update('key', e.target.value || null)}
          />
        )}
        {NEEDS_KEYS.includes(step.action) && (
          <input
            className="input"
            placeholder={t('stepForm.keysPlaceholder')}
            value={step.keys?.join(', ') ?? ''}
            onChange={e => update('keys', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
          />
        )}
        {NEEDS_SCROLL.includes(step.action) && (
          <input
            className="input"
            type="number"
            placeholder={t('stepForm.scrollPlaceholder')}
            value={step.scroll_amount}
            onChange={e => update('scroll_amount', parseInt(e.target.value) || 0)}
          />
        )}
        {NEEDS_WAIT.includes(step.action) && (
          <input
            className="input"
            type="number"
            step="0.5"
            placeholder={t('stepForm.waitPlaceholder')}
            value={step.wait_seconds}
            onChange={e => update('wait_seconds', parseFloat(e.target.value) || 0)}
          />
        )}
        {NEEDS_EXPECTED.includes(step.action) && (
          <label className="step-checkbox">
            <input
              type="checkbox"
              checked={step.expected}
              onChange={e => update('expected', e.target.checked)}
            />
            {t('stepForm.expectedLabel')}
          </label>
        )}
      </div>

      <button
        className="step-advanced-toggle"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? t('stepForm.hideAdvanced') : t('stepForm.showAdvanced')}
        {!showAdvanced && hasNonDefaultAdvanced && <span className="advanced-indicator" />}
      </button>

      {showAdvanced && (
        <div className="step-advanced">
          <div className="step-advanced-row">
            <label>
              {t('stepForm.retryAttempts')}
              <input
                className="input"
                type="number"
                min="0"
                value={step.retry_attempts}
                onChange={e => update('retry_attempts', parseInt(e.target.value) || 0)}
              />
            </label>
            <label>
              {t('stepForm.retryDelay')}
              <input
                className="input"
                type="number"
                min="0"
                step="0.5"
                value={step.retry_delay}
                onChange={e => update('retry_delay', parseFloat(e.target.value) || 0)}
              />
            </label>
            <label>
              {t('stepForm.timeout')}
              <input
                className="input"
                type="number"
                min="0"
                step="1"
                placeholder={t('stepForm.timeoutPlaceholder')}
                value={step.timeout ?? ''}
                onChange={e => {
                  const v = e.target.value;
                  update('timeout', v === '' ? null : parseFloat(v) || null);
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
