/**
 * ADARA PARFUM — Sistema de Notificaciones Toast en Pantalla
 *
 * Renderiza alertas flotantes no bloqueantes en la esquina inferior izquierda
 * para informar resultados de operaciones (éxito, advertencia o información).
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/** Estructura de un mensaje toast encolado. */
export interface ToastMessage {
  /** Identificador único del mensaje. */
  id: string;
  /** Tipo de alerta para selección de color e icono. */
  type: 'success' | 'warning' | 'info';
  /** Título principal destacado. */
  title: string;
  /** Detalle opcional del evento. */
  message?: string;
}

/** Propiedades del contenedor de toasts. */
interface ToastProps {
  /** Lista de mensajes activos por mostrar. */
  toasts: ToastMessage[];
  /** Callback para descartar y remover una notificación por ID. */
  onDismiss: (id: string) => void;
}

/**
 * Contenedor de notificaciones flotantes temporales.
 */
export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        left: '28px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px'
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="liquid-glass animate-rise"
          style={{
            padding: '14px 18px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            borderLeft: `3px solid ${
              toast.type === 'success'
                ? 'var(--color-gold)'
                : toast.type === 'warning'
                ? 'var(--color-warning)'
                : 'var(--color-info)'
            }`
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />}
          {toast.type === 'warning' && <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />}
          {toast.type === 'info' && <Info size={18} color="var(--color-info)" style={{ flexShrink: 0, marginTop: '2px' }} />}

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--color-ivory)' }}>
              {toast.title}
            </p>
            {toast.message && (
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {toast.message}
              </p>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-tertiary)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

