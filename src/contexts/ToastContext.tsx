import React, { createContext, useContext, useState, useCallback } from 'react'

type Toast = { id: number; type: 'success' | 'error' | 'info'; msg: string }
const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('ToastCtx missing')
  return ctx
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((t: Omit<Toast,'id'>) => {
    const toast = { ...t, id: Date.now() + Math.random() }
    setToasts(s => [...s, toast])
    setTimeout(() => setToasts(s => s.filter(x => x.id !== toast.id)), 3500)
  }, [])
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id}
            className={`rounded-md px-4 py-2 shadow text-sm
              ${t.type === 'success' ? 'bg-green-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-800 text-white'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
