import { useEffect, useState } from 'react'
import { useToastStore } from '../../store/useToastStore'

export default function Toast() {
  const [toasts, setToasts] = useState(useToastStore.getState().toasts)

  useEffect(() => useToastStore.subscribe((s) => setToasts(s.toasts)), [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: 'rgba(20, 22, 28, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: 'toast-in 0.2s ease-out',
          }}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
