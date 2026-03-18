import React, { useEffect } from "react";

const Toast = ({ message, type, show, onClose }) => {

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`toast-box ${type}`}>
      {message}
    </div>
  );
};

export default Toast;