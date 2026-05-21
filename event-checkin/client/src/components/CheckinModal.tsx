type Props = {
  open: boolean;
  customerName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function CheckinModal({ open, customerName, loading, onCancel, onConfirm }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <p className="modal-text">{customerName} 様のチェックインを確定しますか？</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={onCancel} disabled={loading}>
            キャンセル
          </button>
          <button className="primary-button" onClick={onConfirm} disabled={loading}>
            {loading ? "送信中..." : "確定する"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckinModal;
