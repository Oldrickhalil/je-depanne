"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, AlertCircle, X } from 'lucide-react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO' | 'WARNING';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-8 fade-in duration-300 min-w-[280px] max-w-sm ${
              toast.type === 'SUCCESS' ? 'bg-[#0a0a0a] border-green-500/20 shadow-green-500/10' :
              toast.type === 'ERROR' ? 'bg-[#0a0a0a] border-red-500/20 shadow-red-500/10' :
              toast.type === 'WARNING' ? 'bg-[#0a0a0a] border-amber-500/20 shadow-amber-500/10' :
              'bg-[#0a0a0a] border-primary/20 shadow-primary/10'
            }`}
          >
            <div className={`mt-0.5 shrink-0 ${
              toast.type === 'SUCCESS' ? 'text-green-500' :
              toast.type === 'ERROR' ? 'text-red-500' :
              toast.type === 'WARNING' ? 'text-amber-500' :
              'text-primary'
            }`}>
              {toast.type === 'SUCCESS' && <CheckCircle2 size={18} />}
              {toast.type === 'ERROR' && <XCircle size={18} />}
              {toast.type === 'WARNING' && <AlertCircle size={18} />}
              {toast.type === 'INFO' && <Info size={18} />}
            </div>
            
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white leading-relaxed">
                {toast.message}
              </p>
            </div>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-gray-500 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
