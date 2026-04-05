import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Play, Pencil, Trash2, Copy } from 'lucide-react';
import { useTestStore } from '../stores/testStore';
import { useExecutionStore } from '../stores/executionStore';
import { testApi } from '../api/client';
import { showToast } from '../components/common/Toast';

export function TestList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tests, fetchTests, deleteTest, saveTest } = useTestStore();
  const { startRun, status } = useExecutionStore();
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const test of tests) {
      for (const tag of test.tags ?? []) set.add(tag);
    }
    return [...set].sort();
  }, [tests]);

  const filteredTests = tagFilter
    ? tests.filter(test => (test.tags ?? []).includes(tagFilter))
    : tests;

  const handleRun = async (filename: string) => {
    await startRun(filename);
    navigate('/execution');
  };

  const handleDuplicate = async (filename: string, name: string) => {
    try {
      const test = await testApi.get(filename);
      await saveTest({ ...test, name: `${name} (Copy)`, filename: null });
      await fetchTests();
      showToast(t('common.duplicated'));
    } catch {
      showToast(t('common.duplicateFailed'), 'error');
    }
  };

  const handleDelete = async (filename: string, name: string) => {
    if (!window.confirm(t('dashboard.deleteTestConfirm', { name }))) return;
    try {
      await deleteTest(filename);
      showToast(t('dashboard.testDeleted'));
    } catch {
      showToast(t('dashboard.testDeleteFailed'), 'error');
    }
  };

  return (
    <div className="test-list">
      <div className="section-header">
        <h2>{t('dashboard.tests')}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {allTags.length > 0 && (
            <select
              className="input"
              value={tagFilter ?? ''}
              onChange={e => setTagFilter(e.target.value || null)}
              style={{ width: 'auto', fontSize: '0.8rem' }}
            >
              <option value="">{t('testList.allTags')}</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/tests/new')}>
            <Plus size={16} />{t('dashboard.newTest')}
          </button>
        </div>
      </div>
      {filteredTests.length === 0 ? (
        <p className="empty-state">{tagFilter ? t('testList.noMatchingTests') : t('dashboard.noTests')}</p>
      ) : (
        <div className="card-grid">
          {filteredTests.map(test => (
            <div key={test.filename} className="card">
              <h3>{test.name}</h3>
              <p className="text-muted">{test.filename} &middot; {test.step_count} steps</p>
              {(test.tags ?? []).length > 0 && (
                <div className="tag-list">
                  {test.tags.map(tag => (
                    <span key={tag} className="tag-pill" onClick={() => setTagFilter(tag)}>{tag}</span>
                  ))}
                </div>
              )}
              <div className="card-actions">
                <button className="btn-icon" onClick={() => handleRun(test.filename)} disabled={status === 'running'} title={t('common.run')}>
                  <Play size={16} />
                </button>
                <button className="btn-icon" onClick={() => navigate(`/tests/${test.filename}/edit`)} title={t('common.edit')}>
                  <Pencil size={16} />
                </button>
                <button className="btn-icon" onClick={() => handleDuplicate(test.filename, test.name)} title={t('common.duplicate')}>
                  <Copy size={16} />
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(test.filename, test.name)} title={t('common.delete')}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
