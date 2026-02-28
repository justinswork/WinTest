export function StatusBadge({ passed }: { passed: boolean }) {
  return (
    <span className={`badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}
