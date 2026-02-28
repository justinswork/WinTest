import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { showToast } from '../components/common/Toast';
import type { ReportData } from '../api/types';

export function ReportViewer() {
  const { t } = useTranslation();
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (reportId) {
      reportApi.get(reportId).then(setReport);
    }
  }, [reportId]);

  const handleDelete = async () => {
    if (!reportId || !window.confirm(t('reports.deleteConfirm'))) return;
    try {
      await reportApi.delete(reportId);
      showToast(t('reports.deleted'));
      navigate('/reports');
    } catch {
      showToast(t('reports.deleteFailed'), 'error');
    }
  };

  if (!report) return <LoadingSpinner message={t('reportViewer.loading')} />;

  return (
    <div className="report-viewer">
      <div className="section-header">
        <h2>{report.task_name}</h2>
        <div className="header-actions">
          <StatusBadge passed={report.passed} />
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>{t('common.delete')}</button>
        </div>
      </div>
      <p className="text-muted">
        {t('reports.passedCount', { passed: report.summary.passed, total: report.summary.total })} &middot; {t('reports.generated', { date: new Date(report.generated_at).toLocaleString() })}
      </p>

      <div className="report-steps">
        {report.steps.map((step, i) => {
          const isExpanded = expandedStep === i;
          const screenshotFile = step.screenshot_path
            ? step.screenshot_path.split(/[/\\]/).pop()
            : null;

          return (
            <div
              key={i}
              className={`step-card ${step.passed ? 'step-passed' : 'step-failed'}`}
              onClick={() => setExpandedStep(isExpanded ? null : i)}
            >
              <div className="step-card-header">
                <span className="step-num">#{i + 1}</span>
                <span className="step-label">{step.description || step.action}</span>
                <StatusBadge passed={step.passed} />
                <span className="step-duration">{step.duration_seconds.toFixed(1)}s</span>
              </div>

              {isExpanded && (
                <div className="step-detail">
                  <p><strong>{t('reportViewer.action')}</strong> {step.action}</p>
                  {step.target && <p><strong>{t('reportViewer.target')}</strong> {step.target}</p>}
                  {step.error && <p className="step-error"><strong>{t('reportViewer.error')}</strong> {step.error}</p>}
                  {step.coordinates && <p><strong>{t('reportViewer.coordinates')}</strong> [{step.coordinates.join(', ')}]</p>}
                  {step.model_response && <p><strong>{t('reportViewer.modelResponse')}</strong> {step.model_response}</p>}
                  {screenshotFile && reportId && (
                    <img
                      src={reportApi.screenshotUrl(reportId, screenshotFile)}
                      alt={t('reportViewer.stepScreenshot', { num: i + 1 })}
                      className="screenshot-img"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
