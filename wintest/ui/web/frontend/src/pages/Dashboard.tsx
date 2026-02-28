import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../stores/taskStore';
import { useExecutionStore } from '../stores/executionStore';
import { reportApi } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { showToast } from '../components/common/Toast';
import type { ReportSummary } from '../api/types';

export function Dashboard() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, deleteTask } = useTaskStore();
  const { modelStatus, loadModel, fetchStatus, startRun, status } = useExecutionStore();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchStatus();
    reportApi.list().then(setReports);
  }, [fetchTasks, fetchStatus]);

  const handleRun = async (filename: string) => {
    await startRun(filename);
    navigate('/execution');
  };

  const handleDeleteTask = async (filename: string, name: string) => {
    if (!window.confirm(`Delete task "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTask(filename);
      showToast('Task deleted');
    } catch {
      showToast('Failed to delete task', 'error');
    }
  };

  return (
    <div className="dashboard">
      <div className="section">
        <div className="section-header">
          <h2>Model Status</h2>
        </div>
        <div className="model-status-card">
          <span className={`model-indicator model-${modelStatus}`} />
          <span>{modelStatus === 'loaded' ? 'Model Loaded' : modelStatus === 'loading' ? 'Loading...' : 'Not Loaded'}</span>
          {modelStatus === 'not_loaded' && (
            <button className="btn btn-secondary" onClick={loadModel}>Pre-load Model</button>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Tasks</h2>
          <button className="btn btn-primary" onClick={() => navigate('/tasks/new')}>New Task</button>
        </div>
        {tasks.length === 0 ? (
          <p className="empty-state">No task files found in examples/</p>
        ) : (
          <div className="card-grid">
            {tasks.map(task => (
              <div key={task.filename} className="card">
                <h3>{task.name}</h3>
                <p className="text-muted">{task.filename} &middot; {task.step_count} steps</p>
                <div className="card-actions">
                  <button className="btn btn-primary" onClick={() => handleRun(task.filename)} disabled={status === 'running'}>
                    Run
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/tasks/${task.filename}/edit`)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(task.filename, task.name)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Recent Reports</h2>
          {reports.length > 0 && (
            <button className="btn btn-secondary" onClick={() => navigate('/reports')}>View All</button>
          )}
        </div>
        {reports.length === 0 ? (
          <p className="empty-state">No reports yet. Run a task to generate one.</p>
        ) : (
          <div className="card-grid">
            {reports.slice(0, 5).map(report => (
              <div key={report.report_id} className="card card-clickable" onClick={() => navigate(`/reports/${report.report_id}`)}>
                <div className="card-row">
                  <h3>{report.task_name}</h3>
                  <StatusBadge passed={report.passed} />
                </div>
                <p className="text-muted">
                  {report.passed_count}/{report.total} passed &middot; {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
