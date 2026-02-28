import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportApi } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { showToast } from '../components/common/Toast';
import type { ReportSummary } from '../api/types';

export function ReportList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    reportApi.list().then(setReports);
  }, []);

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await reportApi.delete(reportId);
      setReports(prev => prev.filter(r => r.report_id !== reportId));
      showToast('Report deleted');
    } catch {
      showToast('Failed to delete report', 'error');
    }
  };

  return (
    <div className="report-list">
      <h2>Reports</h2>
      {reports.length === 0 ? (
        <p className="empty-state">No reports yet.</p>
      ) : (
        <div className="card-grid">
          {reports.map(report => (
            <div
              key={report.report_id}
              className="card card-clickable"
              onClick={() => navigate(`/reports/${report.report_id}`)}
            >
              <div className="card-row">
                <h3>{report.task_name}</h3>
                <StatusBadge passed={report.passed} />
              </div>
              <p className="text-muted">
                {report.passed_count}/{report.total} passed &middot; {report.failed_count} failed
              </p>
              <p className="text-muted">
                {new Date(report.generated_at).toLocaleString()}
              </p>
              <div className="card-actions">
                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(e, report.report_id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
