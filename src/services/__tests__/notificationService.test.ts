import {
  generateNotifications,
  calculateUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getStoredReadNotificationIds,
  saveStoredReadNotificationIds,
  NOTIFICATIONS_STORAGE_KEY,
  AdminNotification
} from '../notificationService';
import { Product, Order } from '../../types';

// ============================================================================
// SUITE DE PRUEBAS CONTROLADAS - FASE 2.4B CENTRO DE NOTIFICACIONES
// ============================================================================

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`✅ PASÓ: ${message}`);
    passedTests++;
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    console.error(`❌ FALLÓ: ${message} -> Esperado: ${expectedStr}, Obtenido: ${actualStr}`);
    failedTests++;
    throw new Error(`${message}: expected ${expectedStr}, got ${actualStr}`);
  } else {
    console.log(`✅ PASÓ: ${message}`);
    passedTests++;
  }
}

console.log('\n--- INICIO DE PRUEBAS: CENTRO DE NOTIFICACIONES ADMINISTRATIVO (FASE 2.4B) ---');

// Mock localStorage en entorno Node.js
const mockLocalStorageMap: Record<string, string> = {};
(global as any).window = {
  localStorage: {
    getItem: (key: string) => mockLocalStorageMap[key] || null,
    setItem: (key: string, val: string) => {
      mockLocalStorageMap[key] = val;
    },
    removeItem: (key: string) => {
      delete mockLocalStorageMap[key];
    },
    clear: () => {
      for (const k in mockLocalStorageMap) delete mockLocalStorageMap[k];
    }
  }
};

// Fixtures
const testProducts: Product[] = [
  {
    id: 'prod-oud',
    name: 'Oud Royal',
    brand: 'ADARA',
    priceCOP: 540000,
    stock: 12,
    threshold: 4,
    family: 'Oriental & Ámbar',
    status: 'active',
    featured: true
  },
  {
    id: 'prod-ambre',
    name: 'Ambre Impérial',
    brand: 'ADARA',
    priceCOP: 475000,
    stock: 3, // <= threshold (alerta de stock bajo)
    threshold: 5,
    family: 'Oriental & Ámbar',
    status: 'active',
    featured: true
  },
  {
    id: 'prod-santal',
    name: 'Santal Blanc',
    brand: 'ADARA',
    priceCOP: 460000,
    stock: 0, // 0 unidades (alerta de producto agotado)
    threshold: 3,
    family: 'Amaderada',
    status: 'sold-out',
    featured: false
  },
  {
    id: 'prod-cuir',
    name: 'Cuir Sauvage',
    brand: 'ADARA',
    priceCOP: 520000,
    stock: 10,
    threshold: 3,
    family: 'Cuero & Humo',
    status: 'active',
    featured: false,
    variants: [
      { id: 'cuir-30', volume: '30ml', priceCOP: 220000, stock: 1, threshold: 2, status: 'active' }, // Stock bajo
      { id: 'cuir-50', volume: '50ml', priceCOP: 340000, stock: 0, threshold: 2, status: 'sold-out' }, // Agotado
      { id: 'cuir-100', volume: '100ml', priceCOP: 520000, stock: 8, threshold: 3, status: 'active' } // Normal
    ]
  }
];

const testOrders: Order[] = [
  {
    id: 'ord-101',
    reference: 'AD-2026-101',
    date: '2026-10-21 15:30',
    customerName: 'Carolina Mendoza',
    customerPhone: '+57 311 000 1122',
    customerCity: 'Bogotá',
    channel: 'Tienda Web',
    items: [{ productId: 'prod-oud', productName: 'Oud Royal', quantity: 2, unitPriceCOP: 540000 }],
    totalCOP: 1080000,
    paymentStatus: 'paid',
    orderStatus: 'pending', // Alerta de nuevo pedido pendiente
    inventoryDeducted: true
  },
  {
    id: 'ord-102',
    reference: 'AD-2026-102',
    date: '2026-10-21 14:00',
    customerName: 'Andrés Gil',
    customerPhone: '+57 300 123 4567',
    customerCity: 'Medellín',
    channel: 'WhatsApp',
    items: [{ productId: 'prod-ambre', productName: 'Ambre Impérial', quantity: 1, unitPriceCOP: 475000 }],
    totalCOP: 475000,
    paymentStatus: 'paid',
    orderStatus: 'shipped', // Estado normal: NO genera alerta
    inventoryDeducted: true
  },
  {
    id: 'ord-103',
    reference: 'AD-2026-103',
    date: '2026-10-21 12:15',
    customerName: 'Laura Ospina',
    customerPhone: '+57 320 987 6543',
    customerCity: 'Cali',
    channel: 'Tienda Web',
    items: [{ productId: 'prod-santal', productName: 'Santal Blanc', quantity: 1, unitPriceCOP: 460000 }],
    totalCOP: 460000,
    paymentStatus: 'pending',
    orderStatus: 'cancelled', // Alerta de pedido cancelado
    inventoryDeducted: false
  }
];

// ----------------------------------------------------------------------------
console.log('\n[Caso 1: Detección precisa de alertas de pedidos]');
// ----------------------------------------------------------------------------
const notifs1 = generateNotifications(testProducts, testOrders);
const pendingOrderNotif = notifs1.find((n) => n.id === 'notif-order-pending-ord-101');
const cancelledOrderNotif = notifs1.find((n) => n.id === 'notif-order-cancelled-ord-103');
const shippedOrderNotif = notifs1.find((n) => n.id === 'notif-order-shipped-ord-102');

assert(pendingOrderNotif !== undefined, 'Debe generar alerta para el pedido en estado pending');
assertEquals(pendingOrderNotif?.type, 'order_pending', 'El tipo debe ser order_pending');
assertEquals(pendingOrderNotif?.targetTab, 'orders', 'Debe apuntar a la pestaña orders');
assertEquals(pendingOrderNotif?.severity, 'warning', 'Severidad de pending debe ser warning');

assert(cancelledOrderNotif !== undefined, 'Debe generar alerta para el pedido cancelado');
assertEquals(cancelledOrderNotif?.type, 'order_cancelled', 'El tipo debe ser order_cancelled');
assertEquals(cancelledOrderNotif?.severity, 'danger', 'Severidad de cancelado debe ser danger');

assert(shippedOrderNotif === undefined, 'No debe generar alertas para pedidos despachados/normales');

// ----------------------------------------------------------------------------
console.log('\n[Caso 2: Detección de inventario bajo y agotado (catálogo estándar)]');
// ----------------------------------------------------------------------------
const lowStockNotif = notifs1.find((n) => n.id === 'notif-stock-low-prod-ambre');
const outStockNotif = notifs1.find((n) => n.id === 'notif-stock-out-prod-santal');
const normalStockNotif = notifs1.find((n) => n.id === 'notif-stock-low-prod-oud');

assert(lowStockNotif !== undefined, 'Debe generar alerta para producto con stock <= threshold');
assertEquals(lowStockNotif?.type, 'stock_low', 'Tipo de alerta debe ser stock_low');
assertEquals(lowStockNotif?.severity, 'warning', 'Severidad debe ser warning');
assertEquals(lowStockNotif?.targetTab, 'inventory', 'Debe apuntar a inventario');

assert(outStockNotif !== undefined, 'Debe generar alerta para producto con stock === 0');
assertEquals(outStockNotif?.type, 'stock_out', 'Tipo de alerta debe ser stock_out');
assertEquals(outStockNotif?.severity, 'danger', 'Severidad debe ser danger');

assert(normalStockNotif === undefined, 'No debe generar alertas para productos con stock saludable');

// ----------------------------------------------------------------------------
console.log('\n[Caso 3: Evaluación de variantes independientes (30ml, 50ml, 100ml)]');
// ----------------------------------------------------------------------------
const varLowNotif = notifs1.find((n) => n.id === 'notif-stock-low-prod-cuir-cuir-30');
const varOutNotif = notifs1.find((n) => n.id === 'notif-stock-out-prod-cuir-cuir-50');
const varNormalNotif = notifs1.find((n) => n.id === 'notif-stock-low-prod-cuir-cuir-100');

assert(varLowNotif !== undefined, 'Debe generar alerta para variante 30ml con stock bajo (1 <= 2)');
assert(varOutNotif !== undefined, 'Debe generar alerta para variante 50ml agotada (0 uds)');
assert(varNormalNotif === undefined, 'No debe generar alerta para variante 100ml con stock normal (8 uds)');
assert(
  !notifs1.some((n) => n.id === 'notif-stock-low-prod-cuir' || n.id === 'notif-stock-out-prod-cuir'),
  'No debe generar alerta del producto padre cuando tiene variantes parametrizadas'
);

// ----------------------------------------------------------------------------
console.log('\n[Caso 4: Cálculo de contador de no leídas y deduplicación entre renders]');
// ----------------------------------------------------------------------------
// Total de alertas generadas:
// - Pedido 101 pending
// - Pedido 103 cancelled
// - Ambre Impérial low stock
// - Santal Blanc out stock
// - Cuir 30ml low stock
// - Cuir 50ml out stock
// = 6 alertas activas en total
assertEquals(notifs1.length, 6, 'Deben haber exactamente 6 alertas generadas');
assertEquals(calculateUnreadCount(notifs1), 6, 'Inicialmente todas las alertas deben estar no leídas');

// Re-render sin cambios de estado:
const notifs1SecondRender = generateNotifications(testProducts, testOrders);
assertEquals(notifs1SecondRender.length, 6, 'Un segundo render no debe duplicar alertas');
assertEquals(calculateUnreadCount(notifs1SecondRender), 6, 'Contador permanece intacto tras re-render');

// ----------------------------------------------------------------------------
console.log('\n[Caso 5: Marcar alerta individual como leída y persistencia]');
// ----------------------------------------------------------------------------
let readIds = new Set<string>();
readIds = markNotificationAsRead('notif-order-pending-ord-101', readIds);

const notifsAfterRead1 = generateNotifications(testProducts, testOrders, readIds);
const readPending = notifsAfterRead1.find((n) => n.id === 'notif-order-pending-ord-101');
const unreadCancelled = notifsAfterRead1.find((n) => n.id === 'notif-order-cancelled-ord-103');

assertEquals(readPending?.read, true, 'La notificación marcada debe tener read: true');
assertEquals(unreadCancelled?.read, false, 'Las demás notificaciones deben permanecer read: false');
assertEquals(calculateUnreadCount(notifsAfterRead1), 5, 'El contador de no leídas debe decrementar a 5');

// Verificar persistencia en localStorage
const storedIds = getStoredReadNotificationIds();
assert(storedIds.has('notif-order-pending-ord-101'), 'El ID leído debe persistir en localStorage');

// ----------------------------------------------------------------------------
console.log('\n[Caso 6: Marcar todas como leídas]');
// ----------------------------------------------------------------------------
readIds = markAllNotificationsAsRead(notifsAfterRead1, readIds);
const notifsAfterReadAll = generateNotifications(testProducts, testOrders, readIds);

assertEquals(calculateUnreadCount(notifsAfterReadAll), 0, 'Al marcar todas, contador no leídas debe ser 0');
assert(
  notifsAfterReadAll.every((n) => n.read === true),
  'Todas las notificaciones deben tener read === true'
);
assertEquals(notifsAfterReadAll.length, 6, 'Todas las 6 alertas siguen presentes en la lista aunque estén leídas');

// ----------------------------------------------------------------------------
console.log('\n[Caso 7: Distinción entre leer aviso y resolver condición de inventario]');
// ----------------------------------------------------------------------------
// Alerta de Santal Blanc agotado está en readIds (leída por el admin)
assert(readIds.has('notif-stock-out-prod-santal'), 'Santal Blanc está marcado como leído');

// Mientras stock sea 0, la notificación debe seguir apareciendo en la lista:
const santalAlertStillVisible = notifsAfterReadAll.find((n) => n.id === 'notif-stock-out-prod-santal');
assert(santalAlertStillVisible !== undefined, 'Alerta leída de Santal Blanc debe permanecer visible mientras siga agotado');
assertEquals(santalAlertStillVisible?.read, true, 'Sigue visible pero con estado leído');

// Ahora simulamos que llega un lote de producción y el stock sube de 0 a 15 (> threshold 3):
const resolvedProducts = testProducts.map((p) => {
  if (p.id === 'prod-santal') {
    return { ...p, stock: 15, status: 'active' as const };
  }
  return p;
});

const notifsAfterStockResolved = generateNotifications(resolvedProducts, testOrders, readIds);
const santalAlertAfterResolved = notifsAfterStockResolved.find((n) => n.id === 'notif-stock-out-prod-santal');
assert(
  santalAlertAfterResolved === undefined,
  'Al restituir el stock por encima del umbral, la alerta de inventario desaparece automáticamente'
);

// ----------------------------------------------------------------------------
console.log('\n[Caso 8: Resolución de pedidos pendientes]');
// ----------------------------------------------------------------------------
// Pedido ord-101 cambia de pending a preparing:
const resolvedOrders = testOrders.map((ord) => {
  if (ord.id === 'ord-101') {
    return { ...ord, orderStatus: 'preparing' as const };
  }
  return ord;
});

const notifsAfterOrderResolved = generateNotifications(resolvedProducts, resolvedOrders, readIds);
const orderAlertAfterResolved = notifsAfterOrderResolved.find((n) => n.id === 'notif-order-pending-ord-101');
assert(
  orderAlertAfterResolved === undefined,
  'Al atender el pedido (cambio de pending a preparing), la notificación se resuelve y desaparece'
);

// ----------------------------------------------------------------------------
console.log('\n[Caso 9: Estado vacío cuando no hay alertas]');
// ----------------------------------------------------------------------------
const emptyNotifs = generateNotifications([], []);
assertEquals(emptyNotifs.length, 0, 'Catálogo y pedidos vacíos deben retornar 0 notificaciones');
assertEquals(calculateUnreadCount(emptyNotifs), 0, 'Contador de estado vacío debe ser 0');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${passedTests + failedTests}`);
console.log(`ÉXITO: ${passedTests} superadas`);
console.log(`FALLOS: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DEL CENTRO DE NOTIFICACIONES PASARON CON ÉXITO.');
}
