import { useEffect } from 'react';
import { useExecutionStore } from '../stores/executionStore';
import { useExecutionWebSocket } from '../api/ws';
import { StatusBadge } from '../components/common/StatusBadge';

export function ExecutionViewer() {
  const store = useExecutionStore();
  const { handleWsMessage, fetchStatus } = store;

  useExecutionWebSocket(handleWsMessage);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const latestScreenshot = store.stepResults.length > 0
    ? store.stepResults[store.stepResults.length - 1]?.screenshot_base64
    : null;

  return (
    <div className="execution-viewer">
      <div className="section-header">
        <h2>Execution {store.taskName && `- ${store.taskName}`}</h2>
        <span className={`execution-status status-${store.status}`}>
          {store.status.toUpperCase()}
        </span>
      </div>

      {store.modelStatus === 'loading' && (
        <div className="info-banner">Loading AI model... This may take a minute.</div>
      )}

      {store.error && (
        <div className="error-banner">{store.error}</div>
      )}

      {store.status === 'idle' && !store.runId && (
        <div className="empty-state">
          <p>No active execution. Go to the Dashboard to run a task.</p>
        </div>
      )}

      <div className="execution-layout">
        <div className="step-list-panel">
          {store.totalSteps > 0 && (
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${(store.stepResults.length / store.totalSteps) * 100}%` }}
              />
              <span className="progress-text">
                {store.stepResults.length} / {store.totalSteps}
              </span>
            </div>
          )}

          {store.currentLabel && store.status === 'running' && store.currentStep > store.stepResults.length && (
            <div className="step-card step-running">
              <span className="step-num">#{store.currentStep}</span>
              <span className="step-label">{store.currentLabel}</span>
              <span className="step-status">Running...</span>
            </div>
          )}

          {[...store.stepResults].reverse().map((result) => (
            <div
              key={result.step_num}
              className={`step-card ${result.passed ? 'step-passed' : 'step-failed'}`}
            >
              <div className="step-card-header">
                <span className="step-num">#{result.step_num}</span>
                <span className="step-label">{result.description || result.action}</span>
                <StatusBadge passed={result.passed} />
                <span className="step-duration">{result.duration_seconds.toFixed(1)}s</span>
              </div>
              {result.error && <p className="step-error">{result.error}</p>}
              {result.coordinates && (
                <p className="step-coords">Clicked at: [{result.coordinates.join(', ')}]</p>
              )}
            </div>
          ))}
        </div>

        <div className="screenshot-panel">
          {latestScreenshot ? (
            <img
              src={`data:image/png;base64,${latestScreenshot}`}
              alt="Latest screenshot"
              className="screenshot-img"
            />
          ) : (
            <div className="screenshot-placeholder">
              <p>Screenshots will appear here during execution</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
