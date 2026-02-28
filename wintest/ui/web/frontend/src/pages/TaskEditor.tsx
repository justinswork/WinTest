import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { useExecutionStore } from '../stores/executionStore';
import { StepList } from '../components/tasks/StepList';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { Task, Step } from '../api/types';
import { newStep } from '../api/types';

export function TaskEditor() {
  const { filename } = useParams<{ filename: string }>();
  const navigate = useNavigate();
  const { fetchTask, fetchActions, saveTask, validateTask, validation, loading } = useTaskStore();
  const { startRun } = useExecutionStore();
  const isEditing = !!filename;

  const [task, setTask] = useState<Task>({
    name: '',
    filename: null,
    application: null,
    steps: [newStep()],
    settings: {},
  });
  const [appEnabled, setAppEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFilename, setSavedFilename] = useState<string | null>(filename ?? null);

  useEffect(() => {
    fetchActions();
    if (filename) {
      fetchTask(filename).then(() => {
        const store = useTaskStore.getState();
        if (store.currentTask) {
          setTask(store.currentTask);
          setAppEnabled(!!store.currentTask.application);
        }
      });
    }
  }, [filename, fetchTask, fetchActions]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveTask(task, savedFilename ?? undefined);
      setSavedFilename(saved);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (savedFilename) {
      await handleSave();
      await validateTask(savedFilename);
    }
  };

  const handleRun = async () => {
    if (savedFilename) {
      await handleSave();
      await startRun(savedFilename);
      navigate('/execution');
    }
  };

  const handleStepsChange = (steps: Step[]) => {
    setTask({ ...task, steps });
  };

  const addStep = () => {
    setTask({ ...task, steps: [...task.steps, newStep()] });
  };

  if (loading && isEditing) return <LoadingSpinner message="Loading task..." />;

  return (
    <div className="task-editor">
      <div className="section-header">
        <h2>{isEditing ? `Edit: ${task.name}` : 'New Task'}</h2>
        <div className="header-actions">
          {savedFilename && (
            <button className="btn btn-secondary" onClick={handleValidate}>Validate</button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !task.name}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          {savedFilename && (
            <button className="btn btn-success" onClick={handleRun}>Save & Run</button>
          )}
        </div>
      </div>

      {validation && (
        <div className={`validation-box ${validation.valid ? 'valid' : 'invalid'}`}>
          {validation.valid ? (
            <p>Task is valid.</p>
          ) : (
            <ul>{validation.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Task Name</label>
        <input
          className="input"
          value={task.name}
          onChange={e => setTask({ ...task, name: e.target.value })}
          placeholder="e.g. Notepad Basic Test"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={appEnabled}
            onChange={e => {
              setAppEnabled(e.target.checked);
              if (!e.target.checked) setTask({ ...task, application: null });
              else setTask({ ...task, application: { path: '', title: '', wait_after_launch: 3 } });
            }}
          />
          {' '}Launch Application
        </label>
        {appEnabled && task.application && (
          <div className="app-config">
            <input
              className="input"
              placeholder="Application path (e.g. notepad.exe)"
              value={(task.application.path as string) ?? ''}
              onChange={e => setTask({ ...task, application: { ...task.application!, path: e.target.value } })}
            />
            <input
              className="input"
              placeholder="Window title (optional)"
              value={(task.application.title as string) ?? ''}
              onChange={e => setTask({ ...task, application: { ...task.application!, title: e.target.value } })}
            />
            <input
              className="input"
              type="number"
              placeholder="Wait after launch (seconds)"
              value={(task.application.wait_after_launch as number) ?? 3}
              onChange={e => setTask({ ...task, application: { ...task.application!, wait_after_launch: parseFloat(e.target.value) || 3 } })}
            />
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Steps</label>
        <StepList steps={task.steps} onChange={handleStepsChange} />
        <button className="btn btn-secondary" onClick={addStep} style={{ marginTop: '0.5rem' }}>
          + Add Step
        </button>
      </div>
    </div>
  );
}
