'use client';

import React from 'react';
import { useApp } from '../AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-glass border text-sm font-medium min-w-[280px] animate-fadeInUp ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : toast.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-brand-card border-brand-border text-white'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="flex-1">{toast.message}</div>
          <button 
            onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
