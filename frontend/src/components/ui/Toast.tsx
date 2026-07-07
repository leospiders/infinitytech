import { useEffect, useState } from 'react';
import { MaterialIcon } from './MaterialIcon';

interface ToastData {
  type: 'success' | 'error';
  message: string;
}

export function Toast({ toast, onClose }: { toast: ToastData | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 bg-surface-container-low border border-outline-variant px-4 py-3 sm:px-6 rounded-lg transition-all duration-300 max-w-[90vw] sm:max-w-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      {toast.type === 'success' ? (
        <MaterialIcon icon="check_circle" fill wght={400} className="text-emerald-400" size={20} />
      ) : (
        <MaterialIcon icon="warning" fill wght={400} className="text-error" size={20} />
      )}
      <span className="text-sm font-semibold text-on-surface">{toast.message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 cursor-pointer">
        <MaterialIcon icon="close" wght={300} className="text-on-surface-variant" size={16} />
      </button>
    </div>
  );
}

export type { ToastData };

