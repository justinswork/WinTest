import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reportApi } from '../api/client';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { ReportData } from '../api/types';

export function ReportViewer() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    if (reportId) {
      reportApi.get(reportId).then(setReport);
    }
  }, [reportId]);

  if (!report) return <LoadingSpinner message="Loading report..." />;

  return (
    <div className="report-viewer">
      <div className="section-header">
        <h2>{report.task_name}</h2>
        <StatusBadge passed={report.passed} />
      </div>
      <p className="text-muted">
        {report.summary.passed}/{report.summary.total} passed &middot; Generated {new Date(report.generated_at).toLocaleString()}
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
                  <p><strong>Action:</strong> {step.action}</p>
                  {step.target && <p><strong>Target:</strong> {step.target}</p>}
                  {step.error && <p className="step-error"><strong>Error:</strong> {step.error}</p>}
                  {step.coordinates && <p><strong>Coordinates:</strong> [{step.coordinates.join(', ')}]</p>}
                  {step.model_response && <p><strong>Model response:</strong> {step.model_response}</p>}
                  {screenshotFile && reportId && (
                    <img
                      src={reportApi.screenshotUrl(reportId, screenshotFile)}
                      alt={`Step ${i + 1} screenshot`}
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
