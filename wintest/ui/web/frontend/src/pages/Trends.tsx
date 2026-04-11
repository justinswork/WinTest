import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { reportApi } from '../api/client';
import type { ReportSummary } from '../api/types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function Trends() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTest = searchParams.get('test');
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const setSelectedTest = (name: string | null) => {
    if (name) {
      navigate(`/trends?test=${encodeURIComponent(name)}`);
    } else {
      navigate('/trends');
    }
  };

  useEffect(() => {
    reportApi.list().then(data => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  // Reports come newest-first; reverse for chronological order
  const allReports = useMemo(() => [...reports].reverse(), [reports]);

  // Group by test name
  const testGroups = useMemo(() => {
    const map = new Map<string, ReportSummary[]>();
    for (const r of allReports) {
      const list = map.get(r.test_name) ?? [];
      list.push(r);
      map.set(r.test_name, list);
    }
    return map;
  }, [allReports]);

  const testNames = useMemo(() => [...testGroups.keys()].sort(), [testGroups]);

  if (loading) return <LoadingSpinner message={t('trends.loading')} />;

  if (selectedTest) {
    const runs = testGroups.get(selectedTest) ?? [];
    return <TestDetail name={selectedTest} runs={runs} onBack={() => setSelectedTest(null)} />;
  }

  return (
    <div className="trends-page">
      <div className="section-header">
        <h2>{t('trends.title')}</h2>
      </div>

      {testNames.length === 0 ? (
        <p className="empty-state">{t('trends.noData')}</p>
      ) : (
        <div className="trends-card-grid">
          {testNames.map(name => (
            <TestCard
              key={name}
              name={name}
              runs={testGroups.get(name)!}
              onClick={() => setSelectedTest(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TestCard({ name, runs, onClick }: { name: string; runs: ReportSummary[]; onClick: () => void }) {
  const { t } = useTranslation();
  const totalRuns = runs.length;
  const passCount = runs.filter(r => r.passed).length;
  const passRate = totalRuns > 0 ? Math.round((passCount / totalRuns) * 100) : 0;
  const passedRuns = runs.filter(r => r.passed);
  const avgDuration = passedRuns.length > 0
    ? Math.round(passedRuns.reduce((s, r) => s + r.duration_seconds, 0) / passedRuns.length * 10) / 10
    : 0;

  // Last 10 runs for status boxes
  const recent = runs.slice(-10);

  return (
    <div className="trends-test-card" onClick={onClick}>
      <div className="trends-test-card-header">
        <h3>{name}</h3>
        <span className={`trends-rate ${passRate >= 80 ? 'rate-good' : passRate >= 50 ? 'rate-warn' : 'rate-bad'}`}>
          {passRate}%
        </span>
      </div>
      <div className="trends-test-card-meta">
        {totalRuns} {t('trends.runs')} &middot; {t('trends.avgDurationCol')}: {avgDuration}s
      </div>
      <div className="trends-status-boxes">
        {recent.map((r, i) => (
          <div
            key={i}
            className={`status-box ${r.passed ? 'status-pass' : 'status-fail'}`}
            title={`${new Date(r.generated_at).toLocaleDateString()} — ${r.passed ? 'PASS' : 'FAIL'} (${r.duration_seconds.toFixed(1)}s)`}
          />
        ))}
      </div>
    </div>
  );
}

function StatusDot(props: { cx?: number; cy?: number; payload?: { passed: boolean; date: string; duration: number } }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const color = payload.passed ? '#22c55e' : '#ef4444';
  return (
    <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={2} />
  );
}

function DurationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; duration: number; passed: boolean; stepsLabel: string } }> }) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="trends-tooltip">
      <div className="trends-tooltip-date">{data.label}</div>
      <div className="trends-tooltip-row">
        <span className={`badge-sm ${data.passed ? 'badge-pass' : 'badge-fail'}`}>
          {data.passed ? 'PASS' : 'FAIL'}
        </span>
        <span>{data.duration}s</span>
        <span className="text-muted">{data.stepsLabel}</span>
      </div>
    </div>
  );
}

function buildGradientStops(data: Array<{ passed: boolean }>): Array<{ offset: string; color: string }> {
  if (data.length < 2) return [];
  const stops: Array<{ offset: string; color: string }> = [];
  for (let i = 0; i < data.length; i++) {
    const pct = (i / (data.length - 1)) * 100;
    const color = data[i].passed ? '#22c55e' : '#ef4444';
    stops.push({ offset: `${pct}%`, color });
  }
  return stops;
}

function TestDetail({ name, runs, onBack }: { name: string; runs: ReportSummary[]; onBack: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const totalRuns = runs.length;
  const passCount = runs.filter(r => r.passed).length;
  const passRate = totalRuns > 0 ? Math.round((passCount / totalRuns) * 100) : 0;
  const passedRuns = runs.filter(r => r.passed);
  const avgDuration = passedRuns.length > 0
    ? Math.round(passedRuns.reduce((s, r) => s + r.duration_seconds, 0) / passedRuns.length * 10) / 10
    : 0;

  const chartData = runs.map((r, i) => {
    const d = new Date(r.generated_at);
    return {
      index: i,
      label: `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      duration: Math.round(r.duration_seconds * 10) / 10,
      passed: r.passed,
      stepsLabel: `${r.passed_count}/${r.total} steps`,
    };
  });

  const gradientStops = buildGradientStops(chartData);

  return (
    <div className="trends-page">
      <div className="section-header">
        <h2>{name}</h2>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>{t('trends.allTests')}</button>
      </div>

      {/* Overview cards */}
      <div className="trends-overview">
        <div className="trends-stat-card">
          <div className="trends-stat-value">{totalRuns}</div>
          <div className="trends-stat-label">{t('trends.totalRuns')}</div>
        </div>
        <div className="trends-stat-card">
          <div className="trends-stat-value" style={{ color: '#22c55e' }}>{passRate}%</div>
          <div className="trends-stat-label">{t('trends.passRate')}</div>
        </div>
        <div className="trends-stat-card">
          <div className="trends-stat-value">{avgDuration}s</div>
          <div className="trends-stat-label">{t('trends.avgDuration')}</div>
        </div>
      </div>

      {/* Run history table */}
      <div className="trends-section">
        <h3>{t('trends.runHistory')}</h3>
        <div className="trends-table-wrapper">
          <table className="trends-table">
            <thead>
              <tr>
                <th>{t('trends.date')}</th>
                <th>{t('trends.status')}</th>
                <th>{t('trends.duration')}</th>
                <th>{t('trends.steps')}</th>
              </tr>
            </thead>
            <tbody>
              {[...runs].reverse().map((r, i) => (
                <tr key={i} className="trends-table-row" onClick={() => navigate(`/reports/${r.report_id}`)}>
                  <td>{new Date(r.generated_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge-sm ${r.passed ? 'badge-pass' : 'badge-fail'}`}>
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td>{r.duration_seconds.toFixed(1)}s</td>
                  <td>{r.passed_count}/{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Duration chart with gradient line and color-coded dots */}
      <div className="trends-section">
        <h3>{t('trends.durationHistory')}</h3>
        <div className="trends-chart">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="statusGradient" x1="0" y1="0" x2="1" y2="0">
                  {gradientStops.map((stop, i) => (
                    <stop key={i} offset={stop.offset} stopColor={stop.color} />
                  ))}
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 10 }}
                tickFormatter={(i: number) => chartData[i]?.label ?? ''}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} unit="s" />
              <Tooltip content={<DurationTooltip />} />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="url(#statusGradient)"
                strokeWidth={2.5}
                dot={<StatusDot />}
                activeDot={<StatusDot />}
                name={t('trends.duration')}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
