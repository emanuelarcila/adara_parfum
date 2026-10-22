import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  ShoppingBag,
  Warehouse,
  ChevronRight,
  X
} from 'lucide-react';
import { Product, Order } from '../../types';
import { AdminTab } from './AdminLayout';
import {
  AdminNotification,
  generateNotifications,
  calculateUnreadCount,
  getStoredReadNotificationIds,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  pruneResolvedNotificationIds
} from '../../services/notificationService';

interface AdminNotificationsCenterProps {
  products: Product[];
  orders: Order[];
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminNotificationsCenter: React.FC<AdminNotificationsCenterProps> = ({
  products,
  orders,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredReadNotificationIds());
  const containerRef = useRef<HTMLDivElement>(null);

  // Generación pura y determinista de notificaciones activas
  const notifications = useMemo(() => {
    return generateNotifications(products, orders, readIds);
  }, [products, orders, readIds]);

  const unreadCount = useMemo(() => {
    return calculateUnreadCount(notifications);
  }, [notifications]);

  // Depuración y sincronización reactiva de IDs leídos cuando se resuelven las alertas
  useEffect(() => {
    setReadIds((prev) => {
      const pruned = pruneResolvedNotificationIds(notifications, prev);
      return pruned.size === prev.size ? prev : pruned;
    });
  }, [notifications]);

  // Cierre al hacer clic fuera del componente
  useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDownOutside);
      document.addEventListener('touchstart', handlePointerDownOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Marcar individual como leída
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const updated = markNotificationAsRead(id, readIds);
    setReadIds(updated);
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = markAllNotificationsAsRead(notifications, readIds);
    setReadIds(updated);
  };

  // Clic en la tarjeta de notificación: marcar como leída y navegar a la pestaña destino
  const handleItemClick = (notification: AdminNotification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    onNavigateTab(notification.targetTab);
  };

  const renderIcon = (notif: AdminNotification) => {
    switch (notif.type) {
      case 'order_pending':
        return <ShoppingBag size={14} color="var(--color-gold)" />;
      case 'order_cancelled':
        return <AlertTriangle size={14} color="var(--color-danger)" />;
      case 'stock_out':
        return <Warehouse size={14} color="var(--color-danger)" />;
      case 'stock_low':
        return <AlertTriangle size={14} color="var(--color-warning)" />;
      default:
        return <Bell size={14} color="var(--color-gold)" />;
    }
  };

  const renderCategoryBadge = (notif: AdminNotification) => {
    let text = 'ALERTA';
    let bg = 'rgba(198, 161, 91, 0.15)';
    let color = 'var(--color-gold)';

    if (notif.type === 'order_pending') {
      text = 'NUEVO PEDIDO';
      bg = 'rgba(198, 161, 91, 0.18)';
      color = 'var(--color-gold)';
    } else if (notif.type === 'order_cancelled') {
      text = 'CANCELACIÓN';
      bg = 'rgba(248, 113, 113, 0.16)';
      color = 'var(--color-danger)';
    } else if (notif.type === 'stock_out') {
      text = 'AGOTADO';
      bg = 'rgba(248, 113, 113, 0.16)';
      color = 'var(--color-danger)';
    } else if (notif.type === 'stock_low') {
      text = 'STOCK BAJO';
      bg = 'rgba(251, 191, 36, 0.16)';
      color = 'var(--color-warning)';
    }

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundColor: bg,
          color
        }}
      >
        {text}
      </span>
    );
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Botón Campana Interactivo */}
      <button
        type="button"
        aria-label="Centro de notificaciones operativas"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'relative',
          padding: '8px',
          borderRadius: '6px',
          border: isOpen
            ? '1px solid var(--color-gold)'
            : '1px solid var(--color-border)',
          backgroundColor: isOpen
            ? 'rgba(198, 161, 91, 0.12)'
            : 'rgba(23, 23, 20, 0.6)',
          color: isOpen ? 'var(--color-gold)' : 'var(--color-ivory)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        title={`Notificaciones operativas (${unreadCount} no leídas)`}
      >
        <Bell size={16} />

        {/* Contador de no leídas */}
        {unreadCount > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '16px',
              height: '16px',
              padding: '0 4px',
              borderRadius: '999px',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-obsidian)',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #090908',
              boxShadow: '0 0 10px rgba(198, 161, 91, 0.5)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          /* Indicador sutil de tranquilidad cuando está todo al día */
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: 'rgba(74, 222, 128, 0.5)'
            }}
          />
        )}
      </button>

      {/* Panel Desplegable (Popover) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 'clamp(320px, 90vw, 400px)',
            backgroundColor: 'rgba(18, 18, 15, 0.97)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--color-border-gold)',
            borderRadius: '8px',
            boxShadow:
              '0 20px 45px -10px rgba(0, 0, 0, 0.85), 0 0 25px rgba(198, 161, 91, 0.08)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.18s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera del Panel */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--color-gold)" />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-ivory)',
                  letterSpacing: '0.02em'
                }}
              >
                Centro de Notificaciones
              </span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor:
                    unreadCount > 0
                      ? 'rgba(198, 161, 91, 0.15)'
                      : 'rgba(74, 222, 128, 0.12)',
                  color:
                    unreadCount > 0
                      ? 'var(--color-gold)'
                      : 'var(--color-success)',
                  fontWeight: 700
                }}
              >
                {unreadCount > 0 ? `${unreadCount} pendientes` : 'Al día'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Marcar todas como leídas"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(198, 161, 91, 0.3)',
                    backgroundColor: 'rgba(198, 161, 91, 0.08)',
                    color: 'var(--color-gold)',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCheck size={12} />
                  <span>Leídas</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar notificaciones"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Lista de Notificaciones */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {notifications.length === 0 ? (
              /* Estado Vacío */
              <div
                style={{
                  padding: '36px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(74, 222, 128, 0.25)'
                  }}
                >
                  <Check size={20} color="var(--color-success)" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-ivory)'
                    }}
                  >
                    Operación al día
                  </div>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      margin: '4px 0 0',
                      maxWidth: '260px',
                      lineHeight: 1.45
                    }}
                  >
                    No hay pedidos pendientes de revisión ni fragancias en umbral crítico de inventario.
                  </p>
                </div>
              </div>
            ) : (
              /* Items de Notificación */
              notifications.map((notif) => {
                const isRead = notif.read;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleItemClick(notif);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(56, 48, 36, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      cursor: 'pointer',
                      backgroundColor: isRead
                        ? 'transparent'
                        : 'rgba(198, 161, 91, 0.04)',
                      transition: 'background-color 0.15s ease',
                      outline: 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isRead
                        ? 'rgba(255, 255, 255, 0.03)'
                        : 'rgba(198, 161, 91, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isRead
                        ? 'transparent'
                        : 'rgba(198, 161, 91, 0.04)';
                    }}
                  >
                    {/* Encabezado del item */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {renderIcon(notif)}
                        {renderCategoryBadge(notif)}
                        {!isRead && (
                          <span
                            title="No leída"
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-gold)',
                              boxShadow: '0 0 6px var(--color-gold)'
                            }}
                          />
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--color-text-tertiary)'
                          }}
                        >
                          {notif.date}
                        </span>

                        {!isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            title="Marcar como leída"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              color: 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--color-gold)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color =
                                'var(--color-text-secondary)';
                            }}
                          >
                            <Check size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Título y Mensaje */}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: isRead ? 500 : 700,
                          color: isRead
                            ? 'var(--color-text-secondary)'
                            : 'var(--color-ivory)',
                          letterSpacing: '0.01em'
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: isRead
                            ? 'var(--color-text-tertiary)'
                            : 'var(--color-text-secondary)',
                          marginTop: '2px',
                          lineHeight: 1.4
                        }}
                      >
                        {notif.message}
                      </div>
                    </div>

                    {/* Enlace o guía de navegación */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-gold)',
                        marginTop: '2px'
                      }}
                    >
                      <span>
                        {notif.targetTab === 'orders'
                          ? 'Revisar en Pedidos'
                          : 'Gestionar en Inventario'}
                      </span>
                      <ChevronRight size={11} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie de Panel Informativo */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--color-border)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              fontSize: '10px',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>
              {notifications.length} {notifications.length === 1 ? 'alerta activa' : 'alertas activas'}
            </span>
            <span style={{ fontStyle: 'italic', fontSize: '9.5px' }}>
              Stock crítico permanece visible hasta reposición
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
