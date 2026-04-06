import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, Trash2, Save, Square, Camera, FolderOpen } from 'lucide-react';
import { builderApi, fileApi } from '../api/client';
import { useTestStore } from '../stores/testStore';
import { showToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/StatusBadge';
import type { Step } from '../api/types';
import { newStep } from '../api/types';

interface BuilderStep {
  step: Step;
  passed: boolean;
  error: string | null;
  coordinates: number[] | null;
  model_response: string | null;
  duration_seconds: number;
  screenshot_base64: string | null;
}

export function TestBuilder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { saveTest } = useTestStore();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [steps, setSteps] = useState<BuilderStep[]>([]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [lastStepTime, setLastStepTime] = useState<number | null>(null);
  const [pendingStep, setPendingStep] = useState<{ step: BuilderStep; stepData: Record<string, unknown> } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [action, setAction] = useState('launch_application');
  const [target, setTarget] = useState('');
  const [text, setText] = useState('');
  const [key, setKey] = useState('');
  const [keys, setKeys] = useState('');
  const [scrollAmount, setScrollAmount] = useState(3);
  const [waitSeconds, setWaitSeconds] = useState(1);
  const [appPath, setAppPath] = useState('');
  const [appTitle, setAppTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleStart = async () => {
    setLoading(true);
    try {
      await builderApi.start();
      setActive(true);
      setSteps([]);
      setScreenshot(null);
      showToast(t('builder.started'));
    } catch {
      showToast(t('builder.startFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      await builderApi.stop();
    } catch { /* ignore */ }
    setActive(false);
    showToast(t('builder.stopped'));
  };

  const handleCapture = async () => {
    try {
      const res = await builderApi.screenshot();
      setScreenshot(res.screenshot_base64);
      setSelectedStep(null);

      // If the last step was launch_application, compute elapsed time
      // and set it as wait_seconds on that step
      if (lastStepTime && steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        if (lastStep.step.action === 'launch_application') {
          const elapsed = Math.round((Date.now() - lastStepTime) / 1000);
          setSteps(prev => prev.map((s, i) =>
            i === prev.length - 1
              ? { ...s, step: { ...s.step, wait_seconds: elapsed }, screenshot_base64: res.screenshot_base64 }
              : s
          ));
        }
      }
      setLastStepTime(null);
    } catch {
      showToast(t('builder.captureFailed'), 'error');
    }
  };

  const buildStepFromForm = (): Record<string, unknown> => {
    const step: Record<string, unknown> = { action, description: description || undefined };
    switch (action) {
      case 'click':
      case 'double_click':
      case 'right_click':
      case 'verify':
        step.target = target;
        break;
      case 'type':
        step.text = text;
        break;
      case 'press_key':
        step.key = key;
        break;
      case 'hotkey':
        step.keys = keys.split(',').map(k => k.trim()).filter(Boolean);
        break;
      case 'scroll':
        step.scroll_amount = scrollAmount;
        break;
      case 'wait':
        step.wait_seconds = waitSeconds;
        break;
      case 'launch_application':
        step.app_path = appPath;
        step.app_title = appTitle || undefined;
        step.wait_seconds = 1; // minimal wait; real value set when user clicks Screenshot
        break;
    }
    return step;
  };

  const buildStepRecord = (data: Record<string, unknown>): Step => {
    return {
      ...newStep(),
      ...data,
    } as Step;
  };

  const acceptPendingStep = () => {
    if (!pendingStep) return;
    setSteps(prev => [...prev, pendingStep.step]);
    setSelectedStep(steps.length);
    setPendingStep(null);
    // Reset for next step
    setAction('click');
    setTarget('');
    setText('');
    setKey('');
    setKeys('');
    setAppPath('');
    setAppTitle('');
    setDescription('');
  };

  const retryPendingStep = () => {
    // Keep the current action/target so user can adjust and retry
    setPendingStep(null);
    setScreenshot(null);
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const stepData = buildStepFromForm();
      const result = await builderApi.step(stepData);
      const builderStep: BuilderStep = {
        step: buildStepRecord(stepData),
        passed: result.passed,
        error: result.error,
        coordinates: result.coordinates ?? null,
        model_response: result.model_response ?? null,
        duration_seconds: result.duration_seconds ?? 0,
        screenshot_base64: result.screenshot_base64,
      };

      setLastStepTime(Date.now());

      if (result.needs_confirmation) {
        // Show annotated screenshot and wait for user to accept or retry
        setPendingStep({ step: builderStep, stepData });
        if (result.screenshot_base64) {
          setScreenshot(result.screenshot_base64);
          setSelectedStep(null);
        }
      } else {
        // Non-vision steps (type, wait, launch, etc.) — accept immediately
        setSteps(prev => [...prev, builderStep]);
        setSelectedStep(steps.length);

        if (action !== 'launch_application' && result.screenshot_base64) {
          setScreenshot(result.screenshot_base64);
        }

        // Reset for next step
        setAction('click');
        setTarget('');
        setText('');
        setKey('');
        setKeys('');
        setAppPath('');
        setAppTitle('');
        setDescription('');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Step failed';
      showToast(msg, 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
    if (selectedStep === index) setSelectedStep(null);
    else if (selectedStep !== null && selectedStep > index) setSelectedStep(selectedStep - 1);
  };

  const handleSaveAsTest = async () => {
    const testName = window.prompt(t('builder.testNamePrompt'), 'New Test');
    if (!testName) return;
    try {
      const test = {
        name: testName,
        filename: null,
        steps: steps.map(s => s.step),
        settings: {},
        variables: {},
        tags: [],
      };
      await saveTest(test);
      showToast(t('builder.saved'));
      navigate('/tests');
    } catch {
      showToast(t('builder.saveFailed'), 'error');
    }
  };

  // Focus input when session starts
  useEffect(() => {
    if (active && inputRef.current) inputRef.current.focus();
  }, [active]);

  const displayedScreenshot = selectedStep !== null && steps[selectedStep]?.screenshot_base64
    ? steps[selectedStep].screenshot_base64
    : screenshot;

  const renderFieldsForAction = () => {
    switch (action) {
      case 'click':
      case 'double_click':
      case 'right_click':
      case 'verify':
        return (
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder={t('builder.targetPlaceholder')}
            value={target}
            onChange={e => setTarget(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && target) handleExecute(); }}
            disabled={executing}
          />
        );
      case 'type':
        return (
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder={t('builder.textPlaceholder')}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && text) handleExecute(); }}
            disabled={executing}
          />
        );
      case 'press_key':
        return (
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder={t('builder.keyPlaceholder')}
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && key) handleExecute(); }}
            disabled={executing}
          />
        );
      case 'hotkey':
        return (
          <input
            ref={inputRef}
            className="input flex-1"
            placeholder={t('builder.keysPlaceholder')}
            value={keys}
            onChange={e => setKeys(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && keys) handleExecute(); }}
            disabled={executing}
          />
        );
      case 'scroll':
        return (
          <input
            className="input"
            type="number"
            value={scrollAmount}
            onChange={e => setScrollAmount(parseInt(e.target.value) || 0)}
            style={{ width: 100 }}
            disabled={executing}
          />
        );
      case 'wait':
        return (
          <input
            className="input"
            type="number"
            step="0.5"
            value={waitSeconds}
            onChange={e => setWaitSeconds(parseFloat(e.target.value) || 0)}
            style={{ width: 100 }}
            disabled={executing}
          />
        );
      case 'launch_application':
        return (
          <>
            <input
              ref={inputRef}
              className="input flex-1"
              placeholder={t('builder.appPathPlaceholder')}
              value={appPath}
              onChange={e => setAppPath(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && appPath) handleExecute(); }}
              disabled={executing}
            />
            <button
              className="btn-icon"
              onClick={async () => { try { setAppPath(await fileApi.pickExecutable()); } catch { /* cancelled */ } }}
              title={t('builder.browse')}
              disabled={executing}
            >
              <FolderOpen size={16} />
            </button>
            <input
              className="input"
              placeholder={t('builder.appTitlePlaceholder')}
              value={appTitle}
              onChange={e => setAppTitle(e.target.value)}
              style={{ width: 150 }}
              disabled={executing}
            />
            <input
              className="input"
              type="number"
              step="0.5"
              value={waitSeconds}
              onChange={e => setWaitSeconds(parseFloat(e.target.value) || 0)}
              style={{ width: 80 }}
              title={t('builder.waitAfterLaunch')}
              disabled={executing}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="builder-page">
      <div className="section-header">
        <h2>{t('builder.title')}</h2>
        <div className="header-actions">
          {!active ? (
            <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
              <Play size={16} />{loading ? t('builder.starting') : t('builder.start')}
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleCapture}>
                <Camera size={16} />{t('builder.capture')}
              </button>
              {steps.length > 0 && (
                <button className="btn btn-success" onClick={handleSaveAsTest}>
                  <Save size={16} />{t('builder.saveAsTest')}
                </button>
              )}
              <button className="btn btn-danger" onClick={handleStop}>
                <Square size={16} />{t('builder.stop')}
              </button>
            </>
          )}
        </div>
      </div>

      {!active && !loading && (
        <div className="empty-state">
          <p>{t('builder.instructions')}</p>
        </div>
      )}

      {loading && (
        <div className="info-banner">{t('builder.loadingModel')}</div>
      )}

      {active && (
        <div className="builder-layout">
          {/* Step list */}
          <div className="builder-steps">
            {steps.length === 0 ? (
              <p className="text-muted" style={{ padding: '0.5rem' }}>{t('builder.noSteps')}</p>
            ) : (
              steps.map((s, i) => (
                <div
                  key={i}
                  className={`builder-step-item ${selectedStep === i ? 'selected' : ''}`}
                  onClick={() => setSelectedStep(selectedStep === i ? null : i)}
                >
                  <span className="step-num">#{i + 1}</span>
                  <span className="step-label">
                    <strong>{s.step.action}</strong>
                    {s.step.target && <> &mdash; {s.step.target}</>}
                    {s.step.text && <> &mdash; "{s.step.text}"</>}
                    {s.step.app_path && <> &mdash; {s.step.app_path}</>}
                  </span>
                  <StatusBadge passed={s.passed} />
                  <button className="btn-icon danger" onClick={(e) => { e.stopPropagation(); handleRemoveStep(i); }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Screenshot */}
          <div className="builder-screenshot">
            {displayedScreenshot ? (
              <img
                src={`data:image/png;base64,${displayedScreenshot}`}
                alt="Current screen"
                className="screenshot-img"
              />
            ) : (
              <div className="screenshot-placeholder">
                <p>{t('builder.screenshotPlaceholder')}</p>
              </div>
            )}

            {pendingStep && (
              <div className="builder-confirm-bar">
                <div className="builder-confirm-info">
                  <span>{t('builder.confirmPrompt')}</span>
                  {pendingStep.step.coordinates && (
                    <span className="text-muted">
                      Clicked at ({pendingStep.step.coordinates.join(', ')})
                    </span>
                  )}
                </div>
                <div className="builder-confirm-actions">
                  <button className="btn btn-success btn-sm" onClick={acceptPendingStep}>
                    {t('builder.accept')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={retryPendingStep}>
                    {t('builder.retry')}
                  </button>
                </div>
              </div>
            )}

            {!pendingStep && selectedStep !== null && steps[selectedStep] && (
              <StepDetail step={steps[selectedStep]} index={selectedStep} />
            )}
          </div>
        </div>
      )}

      {/* Command input bar */}
      {active && !pendingStep && (
        <div className="builder-input-bar">
          <select
            className="input"
            value={action}
            onChange={e => setAction(e.target.value)}
            style={{ width: 160 }}
            disabled={executing}
          >
            <option value="launch_application">launch app</option>
            <option value="click">click</option>
            <option value="double_click">double click</option>
            <option value="right_click">right click</option>
            <option value="type">type</option>
            <option value="press_key">press key</option>
            <option value="hotkey">hotkey</option>
            <option value="scroll">scroll</option>
            <option value="wait">wait</option>
            <option value="verify">verify</option>
          </select>
          {renderFieldsForAction()}
          <input
            className="input builder-desc-input"
            placeholder={t('builder.descriptionPlaceholder')}
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={executing}
          />
          <button className="btn btn-primary" onClick={handleExecute} disabled={executing}>
            <Play size={16} />{executing ? t('builder.executing') : t('builder.execute')}
          </button>
        </div>
      )}
    </div>
  );
}

function StepDetail({ step, index }: { step: BuilderStep; index: number }) {
  return (
    <div className="builder-step-detail">
      <div className="builder-detail-header">
        <strong>#{index + 1} {step.step.action}</strong>
        <span className={`badge-sm ${step.passed ? 'badge-pass' : 'badge-fail'}`}>
          {step.passed ? 'PASS' : 'FAIL'}
        </span>
        <span className="text-muted">{step.duration_seconds.toFixed(1)}s</span>
      </div>
      {step.step.target && (
        <div className="builder-detail-row">
          <span className="builder-detail-label">Target:</span> {step.step.target}
        </div>
      )}
      {step.step.text && (
        <div className="builder-detail-row">
          <span className="builder-detail-label">Text:</span> {step.step.text}
        </div>
      )}
      {step.step.app_path && (
        <div className="builder-detail-row">
          <span className="builder-detail-label">App:</span> {step.step.app_path}
        </div>
      )}
      {step.coordinates && (
        <div className="builder-detail-row">
          <span className="builder-detail-label">Clicked at:</span> ({step.coordinates.join(', ')})
        </div>
      )}
      {step.error && (
        <div className="builder-detail-row builder-step-error">
          <span className="builder-detail-label">Error:</span> {step.error}
        </div>
      )}
      {step.model_response && (
        <div className="builder-detail-row">
          <span className="builder-detail-label">Model:</span>
          <code className="builder-model-response">{step.model_response}</code>
        </div>
      )}
    </div>
  );
}
