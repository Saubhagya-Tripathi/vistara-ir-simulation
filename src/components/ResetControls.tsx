/**
 * Reset control with mandatory confirmation (RESET → CONFIRM → reset).
 * Uses the store's existing resetSession logic.
 */
export function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      className="btn-ghost header-btn"
      onClick={onReset}
      title="Reset simulation progress"
    >
      Reset
    </button>
  );
}

export function ResetConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Reset simulation">
      <div className="modal-card modal-confirm">
        <h2>Reset simulation?</h2>
        <p>
          This will permanently clear all current simulation progress — submitted
          answers, evidence state, notes, and elapsed time. This cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            Reset simulation
          </button>
        </div>
      </div>
    </div>
  );
}
