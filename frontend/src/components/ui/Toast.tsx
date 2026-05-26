import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

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
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 glass-panel px-4 py-3 sm:px-6 rounded-2xl shadow-xl transition-all duration-300 max-w-[90vw] sm:max-w-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      {toast.type === 'success' ? (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-danger" />
      )}
      <span className="text-sm font-semibold">{toast.message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2">
        <X className="h-4 w-4 text-dim" />
      </button>
    </div>
  );
}

export type { ToastData };
