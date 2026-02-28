import { useTranslation } from 'react-i18next';

export function StatusBadge({ passed }: { passed: boolean }) {
  const { t } = useTranslation();

  return (
    <span className={`badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
      {passed ? t('common.pass') : t('common.fail')}
    </span>
  );
}
