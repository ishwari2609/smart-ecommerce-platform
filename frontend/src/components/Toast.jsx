import { useEffect } from "react";
import "./Toast.css";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-hide after 4 seconds

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">
        {type === "success" && <span className="toast-icon">✅</span>}
        {type === "error" && <span className="toast-icon">❌</span>}
        {type === "info" && <span className="toast-icon">ℹ️</span>}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

export default Toast;
