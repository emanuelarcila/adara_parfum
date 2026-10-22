/**
 * ADARA PARFUM — Servicio del Centro de Notificaciones Administrativo (Fase 2.4B)
 *
 * Maneja la generación determinista, deduplicación y persistencia de alertas
 * operativas para el panel de control:
 * 1. Pedidos pendientes de revisión (tienda web, WhatsApp, etc.).
 * 2. Pedidos cancelados recientes que requieren atención o verificación de inventario.
 * 3. Productos con existencias iguales o inferiores al umbral mínimo de seguridad.
 * 4. Productos completamente agotados (0 unidades).
 * 5. Evaluación de variantes independientes (30ml, 50ml, 100ml) cuando aplique.
 * 6. Persistencia del estado leído/no leído en localStorage de forma segura e idempotente.
 */

import { Product, Order } from '../types';
import { parseOrderTimestamp } from './commercialAnalyticsService';

/** Ventana máxima para alertar sobre cancelaciones (7 días en milisegundos) */
export const CANCELLATION_NOTIFICATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type NotificationType =
  | 'order_pending'
  | 'order_cancelled'
  | 'stock_low'
  | 'stock_out';

export type NotificationSeverity = 'warning' | 'danger' | 'info';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  targetTab: 'orders' | 'inventory';
  targetId?: string;
  severity: NotificationSeverity;
  skuOrVolume?: string;
}

export const NOTIFICATIONS_STORAGE_KEY = 'adara_notifications_read_v1';

/**
 * Lee de forma segura los IDs de notificaciones leídas desde localStorage.
 */
export function getStoredReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined' || !window.localStorage) {
    return new Set<string>();
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set<string>(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch (error) {
    console.warn('ADARA: Error al leer notificaciones leídas de localStorage', error);
  }

  return new Set<string>();
}

/**
 * Guarda de forma segura los IDs de notificaciones leídas en localStorage.
 */
export function saveStoredReadNotificationIds(ids: Set<string> | string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const list = Array.isArray(ids) ? ids : Array.from(ids);
    window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.warn('ADARA: Error al persistir notificaciones leídas en localStorage', error);
  }
}

/**
 * Agrega un ID al conjunto de leídos y lo persiste en localStorage.
 */
export function markNotificationAsRead(id: string, currentReadIds: Set<string>): Set<string> {
  const updated = new Set(currentReadIds);
  updated.add(id);
  saveStoredReadNotificationIds(updated);
  return updated;
}

/**
 * Marca todas las notificaciones activas como leídas y persiste el estado.
 */
export function markAllNotificationsAsRead(
  notifications: AdminNotification[],
  currentReadIds: Set<string>
): Set<string> {
  const updated = new Set(currentReadIds);
  for (const notif of notifications) {
    updated.add(notif.id);
  }
  saveStoredReadNotificationIds(updated);
  return updated;
}

/**
 * Genera la lista completa y deduplicada de notificaciones activas
 * en base al estado actual de productos, pedidos y lectura.
 *
 * Características deterministas:
 * - Los IDs son estables e idempotentes entre renders.
 * - Una recarga o re-render NO genera notificaciones duplicadas.
 * - Una alerta de inventario leída permanece visible mientras el stock siga bajo/agotado.
 * - Si el stock se restituye por encima del umbral, la alerta desaparece automáticamente.
 * - Si un pedido pendiente pasa a otro estado, la alerta pendiente desaparece automáticamente.
 */
export function generateNotifications(
  products: Product[],
  orders: Order[],
  readIds: Set<string> = new Set(),
  referenceDate?: Date | number
): AdminNotification[] {
  const notifications: AdminNotification[] = [];

  // ==========================================================================
  // A. NOTIFICACIONES DE PEDIDOS
  // ==========================================================================
  if (Array.isArray(orders)) {
    for (const order of orders) {
      if (!order || !order.id) continue;

      const totalItems = Array.isArray(order.items)
        ? order.items.reduce((acc, it) => acc + (it.quantity || 0), 0)
        : 0;

      // 1. Pedidos en estado 'pending' (requieren revisión o confirmación)
      if (order.orderStatus === 'pending') {
        const id = `notif-order-pending-${order.id}`;
        notifications.push({
          id,
          type: 'order_pending',
          title: `Pedido pendiente: ${order.reference}`,
          message: `${order.customerName || 'Cliente'} · ${order.channel || 'Canal'} (${totalItems} uds) · $${(order.totalCOP || 0).toLocaleString('es-CO')}`,
          date: order.date || 'Reciente',
          read: readIds.has(id),
          targetTab: 'orders',
          targetId: order.id,
          severity: 'warning'
        });
      }

      // 2. Pedidos en estado 'cancelled' (requieren atención / verificación solo si son recientes <= 7 días)
      // Este filtro NO modifica ni elimina pedidos históricos de la colección de pedidos
      if (order.orderStatus === 'cancelled') {
        const orderTs = parseOrderTimestamp(order.date);
        const refTs = referenceDate
          ? (typeof referenceDate === 'number' ? referenceDate : referenceDate.getTime())
          : Date.now();

        // Ventana de 7 días: (refTs - orderTs) entre 0 y 7 días (con 1 hora de margen)
        const isRecentCancellation = !isNaN(orderTs)
          ? refTs - orderTs >= -3600000 && refTs - orderTs <= CANCELLATION_NOTIFICATION_WINDOW_MS
          : order.date === 'Reciente';

        if (isRecentCancellation) {
          const id = `notif-order-cancelled-${order.id}`;
          notifications.push({
            id,
            type: 'order_cancelled',
            title: `Cancelación: ${order.reference}`,
            message: `${order.customerName || 'Cliente'} · Pedido cancelado (${totalItems} uds). Revisar atención al cliente y stock.`,
            date: order.date || 'Reciente',
            read: readIds.has(id),
            targetTab: 'orders',
            targetId: order.id,
            severity: 'danger'
          });
        }
      }
    }
  }

  // ==========================================================================
  // B. NOTIFICACIONES DE INVENTARIO Y STOCK
  // ==========================================================================
  if (Array.isArray(products)) {
    for (const product of products) {
      if (!product || !product.id) continue;

      // Si el producto tiene variantes parametrizadas (30ml, 50ml, 100ml),
      // evaluamos el stock de cada variante por separado.
      if (Array.isArray(product.variants) && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (!variant || !variant.id) continue;

          const threshold = typeof variant.threshold === 'number'
            ? variant.threshold
            : typeof product.threshold === 'number'
            ? product.threshold
            : 3;

          const variantStock = typeof variant.stock === 'number' ? variant.stock : 0;
          const volLabel = variant.volume || 'Presentación';

          if (variantStock === 0) {
            const id = `notif-stock-out-${product.id}-${variant.id}`;
            notifications.push({
              id,
              type: 'stock_out',
              title: `Agotado: ${product.name} (${volLabel})`,
              message: `0 unidades en taller Bogotá. Requiere orden de reposición inmediata.`,
              date: 'Alerta activa',
              read: readIds.has(id),
              targetTab: 'inventory',
              targetId: product.id,
              severity: 'danger',
              skuOrVolume: volLabel
            });
          } else if (variantStock <= threshold) {
            const id = `notif-stock-low-${product.id}-${variant.id}`;
            notifications.push({
              id,
              type: 'stock_low',
              title: `Stock bajo: ${product.name} (${volLabel})`,
              message: `Quedan ${variantStock} uds en taller (umbral mínimo: ${threshold} uds).`,
              date: 'Alerta activa',
              read: readIds.has(id),
              targetTab: 'inventory',
              targetId: product.id,
              severity: 'warning',
              skuOrVolume: volLabel
            });
          }
        }
      } else {
        // Evaluación estándar a nivel de producto principal
        const threshold = typeof product.threshold === 'number' ? product.threshold : 3;
        const stock = typeof product.stock === 'number' ? product.stock : 0;

        if (stock === 0) {
          const id = `notif-stock-out-${product.id}`;
          notifications.push({
            id,
            type: 'stock_out',
            title: `Agotado: ${product.name}`,
            message: `0 unidades disponibles en taller Bogotá. Requiere reposición inmediata.`,
            date: 'Alerta activa',
            read: readIds.has(id),
            targetTab: 'inventory',
            targetId: product.id,
            severity: 'danger',
            skuOrVolume: product.volume || undefined
          });
        } else if (stock <= threshold) {
          const id = `notif-stock-low-${product.id}`;
          notifications.push({
            id,
            type: 'stock_low',
            title: `Stock bajo: ${product.name}`,
            message: `Quedan ${stock} unidades en taller (umbral mínimo: ${threshold} uds).`,
            date: 'Alerta activa',
            read: readIds.has(id),
            targetTab: 'inventory',
            targetId: product.id,
            severity: 'warning',
            skuOrVolume: product.volume || undefined
          });
        }
      }
    }
  }

  // ==========================================================================
  // C. ORDENAMIENTO DETERMINISTA Y PRIORIDAD
  // ==========================================================================
  // Prioridad:
  // 1. No leídas primero (read === false antes que read === true).
  // 2. Severidad 'danger' antes que 'warning'.
  // 3. Orden alfabético o de fecha para estabilidad entre renders.
  const severityRank: Record<NotificationSeverity, number> = {
    danger: 1,
    warning: 2,
    info: 3
  };

  return notifications.sort((a, b) => {
    // 1. No leídas arriba
    if (a.read !== b.read) {
      return a.read ? 1 : -1;
    }

    // 2. Severidad
    const rankA = severityRank[a.severity] ?? 99;
    const rankB = severityRank[b.severity] ?? 99;
    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 3. Estabilidad por ID
    return a.id.localeCompare(b.id);
  });
}

/**
 * Calcula el número de notificaciones no leídas activas.
 */
export function calculateUnreadCount(notifications: AdminNotification[]): number {
  if (!Array.isArray(notifications)) return 0;
  return notifications.reduce((acc, notif) => (notif && !notif.read ? acc + 1 : acc), 0);
}

/**
 * Sincroniza y depura los IDs leídos en localStorage para eliminar alertas que ya se resolvieron
 * (por ejemplo, producto cuyo stock se recuperó o pedido cancelado que superó los 7 días).
 * Esto garantiza que:
 * 1. Si en el futuro la condición vuelve a cumplirse, reaparezca como NO leída.
 * 2. El almacenamiento en localStorage no crezca indefinidamente.
 * 3. Mientras la alerta siga activa, permanezca leída sin desaparecer del panel.
 */
export function pruneResolvedNotificationIds(
  activeNotifications: AdminNotification[],
  currentReadIds: Set<string>
): Set<string> {
  const activeIdSet = new Set(activeNotifications.map((n) => n.id));
  const pruned = new Set<string>();

  for (const id of currentReadIds) {
    if (activeIdSet.has(id)) {
      pruned.add(id);
    }
  }

  if (pruned.size !== currentReadIds.size) {
    saveStoredReadNotificationIds(pruned);
  }

  return pruned;
}
