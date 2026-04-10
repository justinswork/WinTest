import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Pencil, Check, X, FolderOpen } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';
import { settingsApi, fileApi } from '../api/client';
import { showToast } from '../components/common/Toast';
import type { ReactNode } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  size: string;
}

const THEME_OPTIONS: { value: ThemePreference; icon: ReactNode; labelKey: string; descKey: string }[] = [
  { value: 'light', icon: <Sun size={20} />, labelKey: 'settings.light', descKey: 'settings.lightDescription' },
  { value: 'dark', icon: <Moon size={20} />, labelKey: 'settings.dark', descKey: 'settings.darkDescription' },
  { value: 'system', icon: <Monitor size={20} />, labelKey: 'settings.system', descKey: 'settings.systemDescription' },
];

const AVAILABLE_LANGUAGES: { code: string; name: string }[] = [
  { code: 'en', name: 'English' },
];

export function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useThemeStore();
  const [currentModel, setCurrentModel] = useState<string>('');
  const [modelStatus, setModelStatus] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [customModel, setCustomModel] = useState('');
  const [workspacePaths, setWorkspacePaths] = useState<Record<string, string>>({});
  const [editingWorkspace, setEditingWorkspace] = useState(false);
  const [workspaceInput, setWorkspaceInput] = useState('');

  useEffect(() => {
    settingsApi.getModel().then(data => {
      setCurrentModel(data.model_path);
      setModelStatus(data.model_status);
      setAvailableModels(data.available_models);
    });
    settingsApi.getWorkspace().then(setWorkspacePaths);
  }, []);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('wintest-language', lang);
  };

  const handleModelChange = async (modelPath: string) => {
    try {
      const result = await settingsApi.setModel(modelPath);
      setCurrentModel(result.model_path);
      setModelStatus(result.model_status);
      if (result.needs_reload) {
        showToast(t('settings.modelChanged'));
      }
    } catch {
      showToast(t('settings.modelChangeFailed'), 'error');
    }
  };

  const handleCustomModelApply = () => {
    if (customModel.trim()) {
      handleModelChange(customModel.trim());
      setCustomModel('');
    }
  };

  return (
    <div className="settings-page">
      <div className="section-header">
        <h2>{t('settings.title')}</h2>
      </div>

      <div className="card">
        <h3>{t('settings.workspace')}</h3>
        <p className="text-muted">{t('settings.workspaceDescription')}</p>

        {/* Workspace path editor — always visible */}
        <div className="workspace-paths" style={{ marginTop: '0.5rem' }}>
          <div className="workspace-path-row">
            <span className="workspace-path-label">{t('settings.workspaceRoot')}</span>
            {editingWorkspace || !workspacePaths.root ? (
              <>
                <input
                  className="input flex-1"
                  value={workspaceInput}
                  onChange={e => setWorkspaceInput(e.target.value)}
                  placeholder={t('settings.workspacePlaceholder')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && workspaceInput) {
                      settingsApi.setWorkspace(workspaceInput).then(data => {
                        setWorkspacePaths(data);
                        setEditingWorkspace(false);
                        showToast(t('settings.workspaceChanged'));
                      });
                    }
                    if (e.key === 'Escape' && workspacePaths.root) setEditingWorkspace(false);
                  }}
                  autoFocus
                />
                <button className="btn-icon" onClick={async () => {
                  try {
                    const path = await fileApi.pickFolder();
                    setWorkspaceInput(path);
                  } catch { /* cancelled */ }
                }} title={t('settings.browseFolder')}><FolderOpen size={14} /></button>
                <button className="btn-icon" onClick={() => {
                  if (!workspaceInput) return;
                  settingsApi.setWorkspace(workspaceInput).then(data => {
                    setWorkspacePaths(data);
                    setEditingWorkspace(false);
                    showToast(t('settings.workspaceChanged'));
                  });
                }}><Check size={14} /></button>
                {workspacePaths.root && (
                  <button className="btn-icon" onClick={() => setEditingWorkspace(false)}><X size={14} /></button>
                )}
              </>
            ) : (
              <>
                <code className="workspace-path-value">{workspacePaths.root}</code>
                <button className="btn-icon" onClick={() => { setWorkspaceInput(workspacePaths.root); setEditingWorkspace(true); }} title={t('common.edit')}>
                  <Pencil size={14} />
                </button>
              </>
            )}
          </div>

          {/* Show subdirectory paths only when configured */}
          {workspacePaths.root && (
            <>
              <div className="workspace-path-row">
                <span className="workspace-path-label">{t('settings.testsDir')}</span>
                <code className="workspace-path-value">{workspacePaths.tests_dir}</code>
              </div>
              <div className="workspace-path-row">
                <span className="workspace-path-label">{t('settings.suitesDir')}</span>
                <code className="workspace-path-value">{workspacePaths.suites_dir}</code>
              </div>
              <div className="workspace-path-row">
                <span className="workspace-path-label">{t('settings.reportsDir')}</span>
                <code className="workspace-path-value">{workspacePaths.reports_dir}</code>
              </div>
              <div className="workspace-path-row">
                <span className="workspace-path-label">{t('settings.configDir')}</span>
                <code className="workspace-path-value">{workspacePaths.config_dir}</code>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3>{t('settings.visionModel')}</h3>
        <p className="text-muted">{t('settings.visionModelDescription')}</p>

        <div className="model-options">
          {availableModels.map(model => (
            <div
              key={model.id}
              className={`model-option${currentModel === model.id ? ' active' : ''}`}
              onClick={() => handleModelChange(model.id)}
            >
              <div className="model-option-header">
                <strong>{model.name}</strong>
                <span className="text-muted">{model.size}</span>
              </div>
              <p className="text-muted">{model.description}</p>
            </div>
          ))}
        </div>

        <div className="model-custom">
          <p className="text-muted" style={{ marginBottom: '0.4rem', fontSize: '0.8rem' }}>
            {t('settings.customModelHint')}
          </p>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              className="input"
              placeholder={t('settings.customModelPlaceholder')}
              value={customModel}
              onChange={e => setCustomModel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCustomModelApply(); }}
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary btn-sm" onClick={handleCustomModelApply}>
              {t('settings.apply')}
            </button>
          </div>
        </div>

        {currentModel && (
          <p className="text-muted" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
            {t('settings.currentModel')}: <code>{currentModel}</code> ({modelStatus})
          </p>
        )}
      </div>

      <div className="card">
        <h3>{t('settings.theme')}</h3>
        <p className="text-muted">{t('settings.themeDescription')}</p>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`theme-option${theme === opt.value ? ' active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              <span className="theme-icon">{opt.icon}</span>
              <span className="theme-label">{t(opt.labelKey)}</span>
              <span className="theme-description">{t(opt.descKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>{t('settings.language')}</h3>
        <p className="text-muted">{t('settings.languageDescription')}</p>
        <select
          className="input"
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          style={{ maxWidth: '300px' }}
        >
          {AVAILABLE_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
