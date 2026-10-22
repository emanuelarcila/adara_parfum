import {
  registerManualSale,
  confirmOrderInventory,
  cancelOrderInventory,
  updateOrderQuantities,
  adjustManualStock,
  transitionOrderStatus,
  createWhatsAppOrder,
  hasInventoryBeenDeducted
} from '../orderInventoryService';
import { isConfirmedSale, calculateConfirmedSales } from '../commercialAnalyticsService';
import { Product, Order, CartItem } from '../../types';

// ============================================================================
// SUITE DE PRUEBAS CONTROLADAS - FASE 2.4A INTEGRIDAD DE PEDIDOS E INVENTARIO
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

console.log('\n--- INICIO DE PRUEBAS: INTEGRIDAD DE PEDIDOS E INVENTARIO (FASE 2.4A) ---');

// Catálogo base de prueba
const initialCatalog: Product[] = [
  {
    id: 'p-oud',
    name: 'Oud Royal',
    brand: 'ADARA',
    priceCOP: 540000,
    stock: 10,
    family: 'Oriental & Ámbar',
    status: 'active',
    featured: true
  },
  {
    id: 'p-rose',
    name: 'Rose Noire',
    brand: 'ADARA',
    priceCOP: 490000,
    stock: 5,
    family: 'Floral Oscuro',
    status: 'active',
    featured: true
  },
  {
    id: 'p-cuir',
    name: 'Cuir Sauvage',
    brand: 'ADARA',
    priceCOP: 520000,
    stock: 2,
    family: 'Cuero & Humo',
    status: 'active',
    featured: false,
    variants: [
      { id: 'p-cuir-30ml', volume: '30ml', priceCOP: 260000, stock: 4, status: 'active' },
      { id: 'p-cuir-100ml', volume: '100ml', priceCOP: 520000, stock: 2, status: 'active' }
    ]
  }
];

// ----------------------------------------------------------------------------
// 1. Una venta manual descuenta el stock una sola vez y valida existencias
// ----------------------------------------------------------------------------
console.log('\n[Caso 1: Venta manual descuenta stock una sola vez]');
const manualOrder: Order = {
  id: 'ord-m-1',
  reference: 'AD-M-001',
  date: '2026-10-21 10:00',
  customerName: 'Cliente Boutique',
  customerPhone: '+57 300 111 2222',
  customerCity: 'Bogotá',
  channel: 'Boutique Bogotá',
  items: [{ productId: 'p-oud', productName: 'Oud Royal', quantity: 3, unitPriceCOP: 540000 }],
  totalCOP: 1620000,
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const resManual = registerManualSale(initialCatalog, manualOrder);
assert(resManual.success === true, 'La venta manual debe ser exitosa');
const pOudAfter = resManual.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudAfter.stock, 7, 'El stock debe reducirse de 10 a 7');
assert(resManual.updatedOrder?.inventoryDeducted === true, 'El pedido debe quedar con inventoryDeducted: true');
assertEquals(resManual.movements.length, 1, 'Debe generar exactamente 1 movimiento de auditoría');
assertEquals(resManual.movements[0].delta, -3, 'El delta de auditoría debe ser -3');

// ----------------------------------------------------------------------------
// 2. No se permiten cantidades inválidas ni stock negativo en ventas manuales
// ----------------------------------------------------------------------------
console.log('\n[Caso 2: Prevención de stock negativo y cantidades inválidas]');
const overstockOrder: Order = {
  ...manualOrder,
  id: 'ord-overstock',
  items: [{ productId: 'p-rose', productName: 'Rose Noire', quantity: 10, unitPriceCOP: 490000 }] // stock es 5
};
const resOverstock = registerManualSale(initialCatalog, overstockOrder);
assert(resOverstock.success === false, 'Debe rechazar la venta si no hay stock suficiente');
assert(resOverstock.error?.includes('Stock insuficiente') === true, 'El error debe indicar stock insuficiente');
const pRoseUntouched = resOverstock.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseUntouched.stock, 5, 'El stock de Rose Noire debe permanecer intacto');

const invalidQtyOrder: Order = {
  ...manualOrder,
  id: 'ord-invalid-qty',
  items: [{ productId: 'p-rose', productName: 'Rose Noire', quantity: 0, unitPriceCOP: 490000 }]
};
const resInvalidQty = registerManualSale(initialCatalog, invalidQtyOrder);
assert(resInvalidQty.success === false, 'Debe rechazar órdenes con cantidad 0');

// ----------------------------------------------------------------------------
// 3. Confirmación de pedido pendiente descuenta stock una sola vez
// ----------------------------------------------------------------------------
console.log('\n[Caso 3: Confirmación de pedido pendiente]');
const pendingWebOrder: Order = {
  id: 'ord-wa-pending',
  reference: 'AD-WA-101',
  date: '2026-10-21 11:00',
  customerName: 'Cliente Chat',
  customerPhone: '+57 300 333 4444',
  customerCity: 'Medellín',
  channel: 'WhatsApp',
  items: [{ productId: 'p-rose', productName: 'Rose Noire', quantity: 2, unitPriceCOP: 490000 }],
  totalCOP: 980000,
  paymentStatus: 'pending',
  orderStatus: 'pending',
  inventoryDeducted: false
};

const resConfirm = confirmOrderInventory(initialCatalog, pendingWebOrder);
assert(resConfirm.success === true, 'Confirmación debe ser exitosa');
const pRoseAfterConfirm = resConfirm.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseAfterConfirm.stock, 3, 'El stock de Rose Noire debe reducirse de 5 a 3');
assert(resConfirm.updatedOrder?.inventoryDeducted === true, 'El pedido confirmado debe marcar inventoryDeducted: true');

// Idempotencia: confirmar nuevamente NO vuelve a descontar
const resConfirmAgain = confirmOrderInventory(resConfirm.updatedProducts, resConfirm.updatedOrder!);
assert(resConfirmAgain.success === true, 'Segunda confirmación no arroja error');
const pRoseAfterSecondConfirm = resConfirmAgain.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseAfterSecondConfirm.stock, 3, 'El stock no debe reducirse de nuevo (idempotente)');
assertEquals(resConfirmAgain.movements.length, 0, 'No debe generar movimientos duplicados');

// ----------------------------------------------------------------------------
// 4. Cancelación restituye únicamente el stock previamente descontado
// ----------------------------------------------------------------------------
console.log('\n[Caso 4: Cancelación restituye existencias previamente descontadas]');
const confirmedOrderToCancel = resConfirm.updatedOrder!;
const resCancelDeducted = cancelOrderInventory(resConfirm.updatedProducts, confirmedOrderToCancel);
assert(resCancelDeducted.success === true, 'Cancelación exitosa');
const pRoseRestored = resCancelDeducted.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseRestored.stock, 5, 'El stock de Rose Noire debe restituirse a 5');
assertEquals(resCancelDeducted.updatedOrder?.orderStatus, 'cancelled', 'Estado debe ser cancelled');
assertEquals(resCancelDeducted.updatedOrder?.inventoryDeducted, false, 'inventoryDeducted debe ser false');
assertEquals(resCancelDeducted.movements.length, 1, 'Debe generar 1 movimiento de restitución');
assertEquals(resCancelDeducted.movements[0].delta, 2, 'El delta de restitución debe ser +2');

// ----------------------------------------------------------------------------
// 5. Cancelar dos veces NO duplica la restitución (Idempotencia estricta)
// ----------------------------------------------------------------------------
console.log('\n[Caso 5: Cancelar dos veces no duplica la restitución]');
const cancelledOrder = resCancelDeducted.updatedOrder!;
const resCancelAgain = cancelOrderInventory(resCancelDeducted.updatedProducts, cancelledOrder);
assert(resCancelAgain.success === true, 'Segunda cancelación exitosa');
const pRoseDoubleCancel = resCancelAgain.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseDoubleCancel.stock, 5, 'El stock no debe incrementarse de nuevo (permanece en 5)');
assertEquals(resCancelAgain.movements.length, 0, 'No debe generar movimientos en segunda cancelación');

// ----------------------------------------------------------------------------
// 6. Si se cancela un pedido que NUNCA había descontado stock, NO suma existencias
// ----------------------------------------------------------------------------
console.log('\n[Caso 6: Cancelar pedido no descontado no suma existencias]');
const neverDeductedOrder: Order = {
  ...pendingWebOrder,
  id: 'ord-never-deducted',
  inventoryDeducted: false
};
const resCancelNever = cancelOrderInventory(initialCatalog, neverDeductedOrder);
const pRoseNever = resCancelNever.updatedProducts.find((p) => p.id === 'p-rose')!;
assertEquals(pRoseNever.stock, 5, 'El stock no se altera al cancelar un pedido que nunca descontó');
assertEquals(resCancelNever.movements.length, 0, 'No debe generar movimientos');

// ----------------------------------------------------------------------------
// 7. Transición entre estados logísticos activos NO vuelve a descontar
// ----------------------------------------------------------------------------
console.log('\n[Caso 7: Transiciones entre estados activos no vuelven a descontar]');
// Pedido con stock ya descontado en preparación
const preparingOrder: Order = {
  ...manualOrder,
  id: 'ord-prep-transition',
  orderStatus: 'preparing',
  inventoryDeducted: true
};

// Pasar de 'preparing' a 'shipped'
const resToShipped = transitionOrderStatus(resManual.updatedProducts, preparingOrder, 'shipped');
assert(resToShipped.success === true, 'Transición a shipped exitosa');
const pOudShipped = resToShipped.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudShipped.stock, 7, 'El stock sigue en 7, no se descuenta de nuevo');
assertEquals(resToShipped.updatedOrder?.orderStatus, 'shipped', 'Estado actualizado a shipped');

// Pasar de 'shipped' a 'delivered'
const resToDelivered = transitionOrderStatus(resToShipped.updatedProducts, resToShipped.updatedOrder!, 'delivered');
assert(resToDelivered.success === true, 'Transición a delivered exitosa');
const pOudDelivered = resToDelivered.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudDelivered.stock, 7, 'El stock sigue en 7');

// ----------------------------------------------------------------------------
// 8. Modificar cantidades ajusta únicamente la diferencia (delta)
// ----------------------------------------------------------------------------
console.log('\n[Caso 8: Modificar cantidades ajusta únicamente la diferencia]');
// Pedido original tenía 3 unidades de Oud Royal descontadas (stock quedó en 7)
const orderToUpdateQty: Order = {
  ...manualOrder,
  id: 'ord-modify-qty',
  inventoryDeducted: true,
  items: [{ productId: 'p-oud', productName: 'Oud Royal', quantity: 3, unitPriceCOP: 540000 }]
};

// Aumentar de 3 a 5 unidades (+2 adicionales)
const resIncreaseQty = updateOrderQuantities(resManual.updatedProducts, orderToUpdateQty, [
  { productId: 'p-oud', productName: 'Oud Royal', quantity: 5, unitPriceCOP: 540000 }
]);
assert(resIncreaseQty.success === true, 'Aumento de cantidad exitoso');
const pOudIncreased = resIncreaseQty.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudIncreased.stock, 5, 'El stock debe reducirse de 7 a 5 (exactamente 2 unidades más)');
assertEquals(resIncreaseQty.updatedOrder?.totalCOP, 5 * 540000, 'Total recalculado correctamente');

// Disminuir de 5 a 2 unidades (-3 devueltas al inventario)
const resDecreaseQty = updateOrderQuantities(resIncreaseQty.updatedProducts, resIncreaseQty.updatedOrder!, [
  { productId: 'p-oud', productName: 'Oud Royal', quantity: 2, unitPriceCOP: 540000 }
]);
assert(resDecreaseQty.success === true, 'Reducción de cantidad exitosa');
const pOudDecreased = resDecreaseQty.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudDecreased.stock, 8, 'El stock debe aumentar de 5 a 8 (3 unidades devueltas)');
assertEquals(resDecreaseQty.updatedOrder?.totalCOP, 2 * 540000, 'Total recalculado a 1.080.000 COP');

// ----------------------------------------------------------------------------
// 9. Pedidos originados en WhatsApp: registro seguro sin descuento prematuro
// ----------------------------------------------------------------------------
console.log('\n[Caso 9: Creación de pedido WhatsApp]');
const sampleCart: CartItem[] = [
  { product: initialCatalog[0], quantity: 2 } // 2 Oud Royal
];

const resWaOrder = createWhatsAppOrder(sampleCart, '+57 312 999 8888');
assert(resWaOrder.success === true, 'Creación de pedido WhatsApp exitosa');
const waOrder = resWaOrder.order!;
assertEquals(waOrder.orderStatus, 'pending', 'Estado logístico inicial debe ser pending');
assertEquals(waOrder.paymentStatus, 'pending', 'Estado de pago inicial debe ser pending');
assertEquals(waOrder.channel, 'WhatsApp', 'Canal debe ser WhatsApp');
assertEquals(waOrder.inventoryDeducted, false, 'inventoryDeducted DEBE ser false (no descuenta por solo abrir WhatsApp)');
assertEquals(waOrder.totalCOP, 2 * 540000, 'Total COP debe ser 1.080.000');

// Verificar que este pedido WhatsApp NO califica como venta confirmada
assert(isConfirmedSale(waOrder) === false, 'El pedido de WhatsApp pending NO es venta confirmada');
const salesMetrics = calculateConfirmedSales([waOrder]);
assertEquals(salesMetrics.count, 0, 'No suma a ventas confirmadas');
assertEquals(salesMetrics.totalCOP, 0, 'No suma ingresos en COP');

// ----------------------------------------------------------------------------
// 10. Ajuste manual de stock en taller
// ----------------------------------------------------------------------------
console.log('\n[Caso 10: Ajuste manual de inventario]');
const resAdjust = adjustManualStock(initialCatalog, 'p-oud', 5, 'Lote de reposición taller');
assert(resAdjust.success === true, 'Ajuste manual positivo exitoso');
const pOudAdjusted = resAdjust.updatedProducts.find((p) => p.id === 'p-oud')!;
assertEquals(pOudAdjusted.stock, 15, 'El stock subió de 10 a 15');
assertEquals(resAdjust.movements[0].delta, 5, 'Movimiento delta +5');

const resAdjustNegative = adjustManualStock(initialCatalog, 'p-oud', -20, 'Ajuste excesivo');
assert(resAdjustNegative.success === false, 'Debe rechazar ajuste que cause stock negativo');

// ----------------------------------------------------------------------------
// 11. Soporte para variantes de tamaño (30ml vs 100ml)
// ----------------------------------------------------------------------------
console.log('\n[Caso 11: Soporte de variantes por presentación]');
const variantOrder: Order = {
  id: 'ord-var-1',
  reference: 'AD-VAR-001',
  date: '2026-10-21 12:00',
  customerName: 'Cliente Variante',
  customerPhone: '+57 300 777 6666',
  customerCity: 'Cali',
  channel: 'Boutique Bogotá',
  items: [
    {
      productId: 'p-cuir',
      variantId: 'p-cuir-30ml', // Variante de 30ml con stock inicial 4
      productName: 'Cuir Sauvage (30ml)',
      quantity: 2,
      unitPriceCOP: 260000
    }
  ],
  totalCOP: 520000,
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const resVariantSale = registerManualSale(initialCatalog, variantOrder);
assert(resVariantSale.success === true, 'Venta de variante exitosa');
const pCuirUpdated = resVariantSale.updatedProducts.find((p) => p.id === 'p-cuir')!;
const v30ml = pCuirUpdated.variants?.find((v) => v.id === 'p-cuir-30ml');
const v100ml = pCuirUpdated.variants?.find((v) => v.id === 'p-cuir-100ml');
assertEquals(v30ml?.stock, 2, 'El stock de 30ml se redujo de 4 a 2');
assertEquals(v100ml?.stock, 2, 'El stock de 100ml permanece intacto en 2');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${passedTests + failedTests}`);
console.log(`ÉXITO: ${passedTests} superadas`);
console.log(`FALLOS: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE INTEGRIDAD DE PEDIDOS E INVENTARIO PASARON CON ÉXITO.');
}
