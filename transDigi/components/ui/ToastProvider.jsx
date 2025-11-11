import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = toast.id || Math.random().toString(36).slice(2);
    const ttl = toast.ttl ?? 3000;
    setToasts((prev) => [...prev, { id, type: toast.type || 'info', title: toast.title || '', message: toast.message || '', ttl }]);
    if (ttl > 0) {
      setTimeout(() => remove(id), ttl);
    }
  }, [remove]);

  const api = useMemo(() => ({
    show: (opts) => push(opts),
    success: (message, title = 'Succès') => push({ type: 'success', title, message }),
    error: (message, title = 'Erreur') => push({ type: 'error', title, message, ttl: 5000 }),
    info: (message, title = 'Info') => push({ type: 'info', title, message }),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
        {toasts.map(t => (
          <div key={t.id} className={`shadow-sm border rounded-3 bg-white`} style={{ overflow: 'hidden' }}>
            <div className="d-flex align-items-start p-3" style={{ gap: 8 }}>
              <div className={`rounded-circle flex-shrink-0`} style={{ width: 10, height: 10, marginTop: 6, backgroundColor: t.type === 'success' ? '#28A745' : t.type === 'error' ? '#DC3545' : '#0D6EFD' }} />
              <div className="flex-grow-1">
                {t.title && <div className="fw-semibold" style={{ fontSize: 14 }}>{t.title}</div>}
                {t.message && <div className="text-muted" style={{ fontSize: 13 }}>{t.message}</div>}
              </div>
              <button className="btn btn-sm btn-link text-muted" onClick={() => remove(t.id)} aria-label="Fermer">×</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
