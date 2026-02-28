export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      {message && <p>{message}</p>}
    </div>
  );
}
