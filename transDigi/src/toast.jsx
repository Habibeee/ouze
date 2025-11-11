import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext({ notify: () => {}, success: () => {}, error: () => {}, info: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }, [])

  const notify = useCallback(({ title, message, type = 'info', duration = 2200 }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const t = { id, title, message, type }
    setToasts((prev) => [t, ...prev])
    window.setTimeout(() => remove(id), duration)
  }, [remove])

  const api = useMemo(() => ({
    notify,
    success: (msg, opts = {}) => notify({ title: 'Succès', message: msg, type: 'success', ...(opts||{}) }),
    error: (msg, opts = {}) => notify({ title: 'Erreur', message: msg, type: 'error', ...(opts||{}) }),
    info: (msg, opts = {}) => notify({ title: 'Info', message: msg, type: 'info', ...(opts||{}) }),
  }), [notify])

  const bg = (type) => type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#e5f2ff'
  const fg = (type) => type === 'success' ? '#065f46' : type === 'error' ? '#7f1d1d' : '#0c4a6e'
  const br = (type) => type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1080, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className="shadow" style={{ minWidth: 280, maxWidth: 380, backgroundColor: bg(t.type), color: fg(t.type), borderLeft: `4px solid ${br(t.type)}`, borderRadius: 12, padding: 12 }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-bold">{t.title}</div>
                {t.message && <div className="small" style={{ lineHeight: 1.3 }}>{t.message}</div>}
              </div>
              <button type="button" className="btn btn-sm btn-link" onClick={() => remove(t.id)} style={{ color: fg(t.type) }}>Fermer</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
