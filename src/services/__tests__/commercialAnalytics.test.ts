import {
  isConfirmedSale,
  calculateConfirmedSales,
  countOrdersByChannel,
  calculateUnitsSoldAndDispatched,
  groupSalesByMonth,
  getTopSellingFragrances,
  filterOrdersByPeriod,
  calculateDashboardMetrics,
  getPeriodInterval,
  parseOrderTimestamp
} from '../commercialAnalyticsService';
import { Order } from '../../types';

// ============================================================================
// SUITE DE PRUEBAS CONTROLADAS - FASE 2.2 ANALÍTICA COMERCIAL
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

// Fecha de referencia fija para pruebas deterministas: Miércoles 21 de Octubre de 2026 a las 15:00 Colombia
const REF_DATE = new Date('2026-10-21T15:00:00-05:00');

console.log('\n--- INICIO DE PRUEBAS: SERVICIO DE ANALÍTICA COMERCIAL ---');

// ----------------------------------------------------------------------------
// 1. Pedido pendiente que no debe contarse como venta confirmada
// ----------------------------------------------------------------------------
console.log('\n[Caso 1: Pedido pendiente]');
const pendingOrder: Order = {
  id: 'ord-test-pending',
  reference: 'AD-TEST-001',
  date: '2026-10-21 10:00',
  customerName: 'Cliente Pendiente',
  customerPhone: '+57 300 111 2233',
  customerCity: 'Bogotá',
  channel: 'Tienda Web',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 1, unitPriceCOP: 540000 }],
  totalCOP: 540000,
  paymentStatus: 'pending',
  orderStatus: 'pending'
};

assert(isConfirmedSale(pendingOrder) === false, 'isConfirmedSale debe retornar false para orden con paymentStatus pending');
const resPending = calculateConfirmedSales([pendingOrder]);
assertEquals(resPending.count, 0, 'No debe registrarse ninguna venta confirmada');
assertEquals(resPending.totalCOP, 0, 'El monto de ventas confirmadas debe ser 0 COP');
const unitsPending = calculateUnitsSoldAndDispatched([pendingOrder]);
assertEquals(unitsPending.unitsSold, 0, 'Unidades vendidas debe ser 0 para orden pendiente');
assertEquals(unitsPending.unitsDispatched, 0, 'Unidades despachadas debe ser 0 para orden pendiente');

// ----------------------------------------------------------------------------
// 2. Venta pagada y no cancelada
// ----------------------------------------------------------------------------
console.log('\n[Caso 2: Venta pagada y no cancelada]');
const paidOrder: Order = {
  id: 'ord-test-paid',
  reference: 'AD-TEST-002',
  date: '2026-10-21 11:30',
  customerName: 'Cliente Pagado',
  customerPhone: '+57 300 222 3344',
  customerCity: 'Medellín',
  channel: 'Tienda Web',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 1, unitPriceCOP: 540000 }],
  totalCOP: 540000,
  paymentStatus: 'paid',
  orderStatus: 'preparing'
};

assert(isConfirmedSale(paidOrder) === true, 'isConfirmedSale debe retornar true para orden pagada y no cancelada');
const resPaid = calculateConfirmedSales([paidOrder]);
assertEquals(resPaid.count, 1, 'Debe registrar 1 venta confirmada');
assertEquals(resPaid.totalCOP, 540000, 'Debe sumar 540.000 COP en ventas confirmadas');

// ----------------------------------------------------------------------------
// 3. Pedido cancelado
// ----------------------------------------------------------------------------
console.log('\n[Caso 3: Pedido cancelado]');
const cancelledOrder: Order = {
  id: 'ord-test-cancelled',
  reference: 'AD-TEST-003',
  date: '2026-10-21 12:00',
  customerName: 'Cliente Cancelado',
  customerPhone: '+57 300 333 4455',
  customerCity: 'Cali',
  channel: 'Tienda Web',
  items: [{ productId: 'p2', productName: 'Rose Noire', quantity: 2, unitPriceCOP: 490000 }],
  totalCOP: 980000,
  paymentStatus: 'paid', // Aunque estuviera marcado como pagado, si fue cancelado NO debe sumar
  orderStatus: 'cancelled'
};

assert(isConfirmedSale(cancelledOrder) === false, 'isConfirmedSale debe ser false para orden cancelada');
const resCancelled = calculateConfirmedSales([cancelledOrder]);
assertEquals(resCancelled.count, 0, 'Orden cancelada no debe sumar a ventas confirmadas');
assertEquals(resCancelled.totalCOP, 0, 'Orden cancelada no debe sumar ingresos');
const unitsCancelled = calculateUnitsSoldAndDispatched([cancelledOrder]);
assertEquals(unitsCancelled.unitsSold, 0, 'Orden cancelada no debe sumar a unidades vendidas');
assertEquals(unitsCancelled.unitsDispatched, 0, 'Orden cancelada no debe sumar a unidades despachadas');

const channelMetricsCancel = countOrdersByChannel([cancelledOrder]);
assertEquals(channelMetricsCancel.totalReceived, 1, 'Orden cancelada permanece en el recuento histórico de pedidos recibidos');
assertEquals(channelMetricsCancel.activeReceived, 0, 'No hay pedidos activos');
assertEquals(channelMetricsCancel.cancelledCount, 1, 'Orden cancelada debe sumarse en cancelledCount');

// ----------------------------------------------------------------------------
// 4. Pedido con varias unidades
// ----------------------------------------------------------------------------
console.log('\n[Caso 4: Pedido con varias unidades]');
const multiItemOrder: Order = {
  id: 'ord-test-multi',
  reference: 'AD-TEST-004',
  date: '2026-10-21 13:00',
  customerName: 'Cliente Multi',
  customerPhone: '+57 300 444 5566',
  customerCity: 'Barranquilla',
  channel: 'Boutique Bogotá',
  items: [
    { productId: 'p1', productName: 'Oud Royal', quantity: 3, unitPriceCOP: 540000 },
    { productId: 'p2', productName: 'Rose Noire', quantity: 2, unitPriceCOP: 490000 }
  ],
  totalCOP: 3 * 540000 + 2 * 490000, // 1.620.000 + 980.000 = 2.600.000
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const unitsMulti = calculateUnitsSoldAndDispatched([multiItemOrder]);
assertEquals(unitsMulti.unitsSold, 5, 'Debe sumar 5 unidades vendidas en total (3 Oud + 2 Rose)');
assertEquals(unitsMulti.unitsDispatched, 5, 'Al estar delivered debe sumar 5 unidades despachadas');
const salesMulti = calculateConfirmedSales([multiItemOrder]);
assertEquals(salesMulti.totalCOP, 2600000, 'Debe totalizar 2.600.000 COP correctamente');

// ----------------------------------------------------------------------------
// 5. Venta manual y pedido web
// ----------------------------------------------------------------------------
console.log('\n[Caso 5: Venta manual vs pedido web]');
const webOrder: Order = {
  id: 'ord-web-1',
  reference: 'AD-WEB-001',
  date: '2026-10-21 10:00',
  customerName: 'Comprador Online',
  customerPhone: '+57 300 555 6677',
  customerCity: 'Bogotá',
  channel: 'Tienda Web',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 1, unitPriceCOP: 540000 }],
  totalCOP: 540000,
  paymentStatus: 'paid',
  orderStatus: 'preparing'
};

const manualSale: Order = {
  id: 'ord-manual-1',
  reference: 'AD-MAN-001',
  date: '2026-10-21 11:00',
  customerName: 'Comprador Boutique',
  customerPhone: '+57 300 666 7788',
  customerCity: 'Bogotá',
  channel: 'Boutique Bogotá',
  items: [{ productId: 'p3', productName: 'Ambre Impérial', quantity: 1, unitPriceCOP: 475000 }],
  totalCOP: 475000,
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const channelMetrics = countOrdersByChannel([webOrder, manualSale]);
assertEquals(channelMetrics.webOrders, 1, 'Debe haber exactamente 1 pedido web');
assertEquals(channelMetrics.manualOrders, 1, 'Debe haber exactamente 1 venta manual');
assertEquals(channelMetrics.totalReceived, 2, 'Total de operaciones recibidas debe ser 2');
assertEquals(channelMetrics.byChannel['Tienda Web'].ordersCount, 1, 'Canal Tienda Web debe tener 1 pedido');
assertEquals(channelMetrics.byChannel['Boutique Bogotá'].ordersCount, 1, 'Canal Boutique Bogotá debe tener 1 venta');

// ----------------------------------------------------------------------------
// 6. Pedido despachado frente a pedido todavía en preparación
// ----------------------------------------------------------------------------
console.log('\n[Caso 6: Despachado vs en preparación]');
const preparingOrder: Order = {
  id: 'ord-prep',
  reference: 'AD-PREP',
  date: '2026-10-21 09:00',
  customerName: 'Cliente Preparación',
  customerPhone: '+57 300 777 8899',
  customerCity: 'Cali',
  channel: 'Tienda Web',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 2, unitPriceCOP: 540000 }],
  totalCOP: 1080000,
  paymentStatus: 'paid',
  orderStatus: 'preparing'
};

const shippedOrder: Order = {
  id: 'ord-ship',
  reference: 'AD-SHIP',
  date: '2026-10-21 09:30',
  customerName: 'Cliente Despacho',
  customerPhone: '+57 300 888 9900',
  customerCity: 'Medellín',
  channel: 'Tienda Web',
  items: [{ productId: 'p2', productName: 'Rose Noire', quantity: 3, unitPriceCOP: 490000 }],
  totalCOP: 1470000,
  paymentStatus: 'paid',
  orderStatus: 'shipped'
};

const unitsPrepVsShip = calculateUnitsSoldAndDispatched([preparingOrder, shippedOrder]);
assertEquals(unitsPrepVsShip.unitsSold, 5, 'Total vendidas debe ser 5 (2 en prep + 3 shipped)');
assertEquals(unitsPrepVsShip.unitsDispatched, 3, 'Total despachadas debe ser únicamente 3 (las shipped)');
assertEquals(unitsPrepVsShip.unitsInPreparation, 2, 'Unidades en preparación debe ser exactamente 2');

// ----------------------------------------------------------------------------
// 7. Pedidos dentro y fuera del periodo seleccionado
// ----------------------------------------------------------------------------
console.log('\n[Caso 7: Filtrado por periodos en Colombia (America/Bogota)]');
// REF_DATE es 2026-10-21 (Miércoles de Octubre de 2026)
const orderToday: Order = {
  ...paidOrder,
  id: 'ord-today',
  date: '2026-10-21 08:30' // Mismo día
};

const orderYesterday: Order = {
  ...paidOrder,
  id: 'ord-yesterday',
  date: '2026-10-20 16:45' // Ayer (misma semana y mes)
};

const orderLastWeek: Order = {
  ...paidOrder,
  id: 'ord-last-week',
  date: '2026-10-12 11:00' // Semana pasada (mismo mes Octubre)
};

const orderLastMonth: Order = {
  ...paidOrder,
  id: 'ord-last-month',
  date: '2026-09-15 14:00' // Septiembre (mes pasado, T3)
};

const orderLastYear: Order = {
  ...paidOrder,
  id: 'ord-last-year',
  date: '2025-11-20 10:00' // Año anterior (2025)
};

const allPeriodOrders = [orderToday, orderYesterday, orderLastWeek, orderLastMonth, orderLastYear];

// Filtro 'today': solo debe incluir orderToday
const filterToday = filterOrdersByPeriod(allPeriodOrders, 'today', REF_DATE);
assertEquals(filterToday.length, 1, 'Periodo today debe contener exactamente 1 orden');
assertEquals(filterToday[0].id, 'ord-today', 'La orden de today debe ser ord-today');

// Filtro 'week': semana del lunes 19 al domingo 25 de Octubre 2026
const filterWeek = filterOrdersByPeriod(allPeriodOrders, 'week', REF_DATE);
assertEquals(filterWeek.length, 2, 'Periodo week debe contener 2 órdenes (today y yesterday)');

// Filtro 'month': todo Octubre 2026
const filterMonth = filterOrdersByPeriod(allPeriodOrders, 'month', REF_DATE);
assertEquals(filterMonth.length, 3, 'Periodo month debe contener 3 órdenes (today, yesterday, last-week)');

// Filtro 'quarter': T4 2026 (Octubre, Noviembre, Diciembre)
const filterQuarter = filterOrdersByPeriod(allPeriodOrders, 'quarter', REF_DATE);
assertEquals(filterQuarter.length, 3, 'Periodo quarter (T4) debe contener las 3 órdenes de Octubre');

// Filtro 'year': Año 2026 completo (excluye la de 2025)
const filterYear = filterOrdersByPeriod(allPeriodOrders, 'year', REF_DATE);
assertEquals(filterYear.length, 4, 'Periodo year (2026) debe contener las 4 órdenes de 2026');

// ----------------------------------------------------------------------------
// 8. Periodo sin ventas
// ----------------------------------------------------------------------------
console.log('\n[Caso 8: Periodo sin ventas]');
const emptyOrders: Order[] = [];
const metricsEmpty = calculateDashboardMetrics(emptyOrders, 'month', REF_DATE);

assertEquals(metricsEmpty.confirmedSales.count, 0, 'Ventas confirmadas debe ser 0');
assertEquals(metricsEmpty.confirmedSales.totalCOP, 0, 'Total COP debe ser 0');
assertEquals(metricsEmpty.ordersReceived.total, 0, 'Pedidos recibidos debe ser 0');
assertEquals(metricsEmpty.units.sold, 0, 'Unidades vendidas debe ser 0');
assertEquals(metricsEmpty.units.dispatched, 0, 'Unidades despachadas debe ser 0');
assertEquals(metricsEmpty.averageTicketCOP, 0, 'Ticket promedio debe ser 0 sin arrojar NaN ni error');
assertEquals(metricsEmpty.topFragrances.length, 0, 'Fragancias más vendidas debe ser un arreglo vacío');
assertEquals(metricsEmpty.monthlyTrend.length, 6, 'La tendencia mensual debe generar los 6 meses base con ceros');

// ----------------------------------------------------------------------------
// 9. Fragancias con ventas iguales (Desempate determinista)
// ----------------------------------------------------------------------------
console.log('\n[Caso 9: Fragancias con ventas iguales - desempate]');
const tiedOrder1: Order = {
  id: 'ord-tie-1',
  reference: 'AD-TIE-1',
  date: '2026-10-21 14:00',
  customerName: 'Cliente Empate 1',
  customerPhone: '+57 300 999 0000',
  customerCity: 'Bogotá',
  channel: 'Tienda Web',
  items: [
    // 2 unidades a 500.000 = 1.000.000 COP
    { productId: 'frag-z', productName: 'Zafiro Imperial', quantity: 2, unitPriceCOP: 500000 }
  ],
  totalCOP: 1000000,
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const tiedOrder2: Order = {
  id: 'ord-tie-2',
  reference: 'AD-TIE-2',
  date: '2026-10-21 14:10',
  customerName: 'Cliente Empate 2',
  customerPhone: '+57 300 999 1111',
  customerCity: 'Bogotá',
  channel: 'Tienda Web',
  items: [
    // 2 unidades a 500.000 = 1.000.000 COP (mismo revenue y mismas unidades)
    { productId: 'frag-a', productName: 'Ámbar Ancestral', quantity: 2, unitPriceCOP: 500000 }
  ],
  totalCOP: 1000000,
  paymentStatus: 'paid',
  orderStatus: 'delivered'
};

const topTied = getTopSellingFragrances([tiedOrder1, tiedOrder2], 5);
assertEquals(topTied.length, 2, 'Deben listarse 2 fragancias');
assertEquals(topTied[0].productName, 'Ámbar Ancestral', 'Ante igualdad de ingresos y unidades, debe desempatar alfabéticamente (Ámbar antes que Zafiro)');
assertEquals(topTied[1].productName, 'Zafiro Imperial', 'Segunda posición alfabética para Zafiro');
assertEquals(topTied[0].percentOfRevenue, 50, 'Cada una debe representar el 50% de las ventas');
assertEquals(topTied[1].percentOfRevenue, 50, 'Cada una debe representar el 50% de las ventas');

// ----------------------------------------------------------------------------
// 10. Pago contra entrega ('on_delivery') con entrega confirmada vs en camino
// ----------------------------------------------------------------------------
console.log('\n[Caso 10: Pago contra entrega (on_delivery)]');
const onDeliveryPending: Order = {
  id: 'ord-cod-pending',
  reference: 'AD-COD-1',
  date: '2026-10-21 15:00',
  customerName: 'Contra Entrega en Tránsito',
  customerPhone: '+57 300 123 4567',
  customerCity: 'Bucaramanga',
  channel: 'WhatsApp',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 1, unitPriceCOP: 540000 }],
  totalCOP: 540000,
  paymentStatus: 'on_delivery',
  orderStatus: 'shipped' // En camino, aún no cobrado ni entregado
};

assert(isConfirmedSale(onDeliveryPending) === false, 'on_delivery en tránsito (shipped) NO es venta confirmada aún');

const onDeliveryDelivered: Order = {
  id: 'ord-cod-delivered',
  reference: 'AD-COD-2',
  date: '2026-10-21 15:30',
  customerName: 'Contra Entrega Entregado',
  customerPhone: '+57 300 123 7890',
  customerCity: 'Pereira',
  channel: 'WhatsApp',
  items: [{ productId: 'p1', productName: 'Oud Royal', quantity: 1, unitPriceCOP: 540000 }],
  totalCOP: 540000,
  paymentStatus: 'on_delivery',
  orderStatus: 'delivered' // Ya entregado y cobrado por transportadora
};

assert(isConfirmedSale(onDeliveryDelivered) === true, 'on_delivery con estado delivered SÍ califica como venta confirmada');

// ----------------------------------------------------------------------------
// 11. Resumen General de Métricas de Dashboard (Master)
// ----------------------------------------------------------------------------
console.log('\n[Caso 11: Resumen Master calculateDashboardMetrics]');
const masterMetrics = calculateDashboardMetrics(
  [paidOrder, multiItemOrder, manualSale, preparingOrder, shippedOrder, cancelledOrder, pendingOrder],
  'month',
  REF_DATE
);

// Órdenes confirmadas en el mes:
// - paidOrder: 1 ud, 540.000 COP
// - multiItemOrder: 5 uds, 2.600.000 COP
// - manualSale: 1 ud, 475.000 COP
// - preparingOrder: 2 uds, 1.080.000 COP
// - shippedOrder: 3 uds, 1.470.000 COP
// Total confirmadas: 5 órdenes
// Total unidades vendidas: 1 + 5 + 1 + 2 + 3 = 12 uds
// Total ingresos: 540k + 2600k + 475k + 1080k + 1470k = 6.165.000 COP
assertEquals(masterMetrics.confirmedSales.count, 5, 'Debe haber 5 órdenes confirmadas');
assertEquals(masterMetrics.confirmedSales.totalCOP, 6165000, 'Ingresos totales confirmados debe ser 6.165.000 COP');
assertEquals(masterMetrics.units.sold, 12, 'Total frascos vendidos debe ser 12');
assertEquals(masterMetrics.units.dispatched, 9, 'Total frascos despachados debe ser 9');
assertEquals(masterMetrics.units.inPreparation, 3, 'Total frascos en preparación debe ser 3');
assertEquals(masterMetrics.averageTicketCOP, Math.round(6165000 / 5), 'Ticket promedio debe ser 1.233.000 COP');
assertEquals(masterMetrics.ordersReceived.total, 7, 'Total recibidos incluye las 7 órdenes históricas (activas y cancelada)');
assertEquals(masterMetrics.ordersReceived.active, 6, 'Total activas es 6');
assertEquals(masterMetrics.ordersReceived.cancelled, 1, 'Debe registrar 1 pedido cancelado');

// ----------------------------------------------------------------------------
// 12. Desglose dinámico por familias olfativas
// ----------------------------------------------------------------------------
console.log('\n[Caso 12: Desglose por Familia Olfativa]');
import { calculateRevenueByOlfactiveFamily } from '../commercialAnalyticsService';
import { Product } from '../../types';

const testProducts: Product[] = [
  { id: 'p1', name: 'Oud Royal', brand: 'ADARA', priceCOP: 540000, stock: 10, family: 'Oriental & Ámbar', status: 'active', featured: true },
  { id: 'p2', name: 'Rose Noire', brand: 'ADARA', priceCOP: 490000, stock: 10, family: 'Floral Oscuro', status: 'active', featured: true },
  { id: 'p3', name: 'Ambre Impérial', brand: 'ADARA', priceCOP: 475000, stock: 10, family: 'Oriental & Ámbar', status: 'active', featured: true }
];

const familyRevenue = calculateRevenueByOlfactiveFamily(
  [paidOrder, multiItemOrder, manualSale, preparingOrder, shippedOrder],
  testProducts
);

assert(familyRevenue.length > 0, 'Debe retornar desglose de familias');
assert(familyRevenue.some((f) => f.family === 'Oriental & Ámbar'), 'Debe incluir Oriental & Ámbar');
assert(familyRevenue.some((f) => f.family === 'Floral Oscuro'), 'Debe incluir Floral Oscuro');

// ----------------------------------------------------------------------------
// 13. Comparativa frente a periodo anterior
// ----------------------------------------------------------------------------
console.log('\n[Caso 13: Comparativa con Periodo Anterior]');
import { calculatePeriodComparison } from '../commercialAnalyticsService';

const compToday = calculatePeriodComparison([orderToday, orderYesterday], 'today', REF_DATE);
assert(compToday.currentTotalCOP > 0, 'Ventas de hoy deben ser mayores a 0');
assert(typeof compToday.comparisonLabel === 'string', 'Debe generar etiqueta de comparativa');

// ----------------------------------------------------------------------------
// 14. Modificación dinámica de métricas al cambiar el periodo
// ----------------------------------------------------------------------------
console.log('\n[Caso 14: Cambio de periodo modifica métricas dinámicamente]');
const metricsToday = calculateDashboardMetrics(allPeriodOrders, 'today', REF_DATE);
const metricsMonth = calculateDashboardMetrics(allPeriodOrders, 'month', REF_DATE);
const metricsYear = calculateDashboardMetrics(allPeriodOrders, 'year', REF_DATE);

assert(metricsToday.confirmedSales.count < metricsMonth.confirmedSales.count, 'El mes debe acumular más ventas que el día de hoy');
assert(metricsMonth.confirmedSales.count < metricsYear.confirmedSales.count, 'El año debe acumular más ventas que el mes');
assertEquals(metricsToday.confirmedSales.count, 1, 'Today tiene 1 venta');
assertEquals(metricsMonth.confirmedSales.count, 3, 'Month tiene 3 ventas');
assertEquals(metricsYear.confirmedSales.count, 4, 'Year tiene 4 ventas');

// ----------------------------------------------------------------------------
// 15. Las gráficas reciben datos dinámicos y los meses sin ventas marcan cero
// ----------------------------------------------------------------------------
console.log('\n[Caso 15: Gráficas de tendencia mensual dinámica]');
// REF_DATE es Octubre de 2026. Tendencia de 6 meses cubre Mayo 2026 a Octubre 2026.
const trendWithOrders = groupSalesByMonth(
  [
    orderToday,        // Octubre 2026: 540.000 COP
    orderYesterday,    // Octubre 2026: 540.000 COP
    orderLastMonth,    // Septiembre 2026: 540.000 COP
    orderLastYear      // Noviembre 2025 (año anterior)
  ],
  6,
  REF_DATE
);

assertEquals(trendWithOrders.length, 6, 'La serie debe generar exactamente 6 meses');
const octPoint = trendWithOrders.find((p) => p.monthKey === '2026-10');
assert(octPoint !== undefined, 'Debe incluir el punto para 2026-10');
assertEquals(octPoint!.current, 1080000, 'Octubre 2026 debe registrar exactamente 1.080.000 COP (2 órdenes)');
assertEquals(octPoint!.unitsSold, 2, 'Octubre 2026 debe registrar 2 unidades vendidas');

const sepPoint = trendWithOrders.find((p) => p.monthKey === '2026-09');
assert(sepPoint !== undefined, 'Debe incluir el punto para 2026-09');
assertEquals(sepPoint!.current, 540000, 'Septiembre 2026 debe registrar 540.000 COP (1 orden)');
assertEquals(sepPoint!.unitsSold, 1, 'Septiembre 2026 debe registrar 1 unidad vendida');

// Meses anteriores sin ventas (por ej. Mayo, Junio, Julio, Agosto 2026) deben tener 0, sin cifras inventadas
const augustPoint = trendWithOrders.find((p) => p.monthKey === '2026-08');
assert(augustPoint !== undefined, 'Debe incluir el punto para 2026-08');
assertEquals(augustPoint!.current, 0, 'Agosto 2026 sin ventas debe ser estrictamente 0 COP');
assertEquals(augustPoint!.unitsSold, 0, 'Agosto 2026 sin ventas debe reportar 0 unidades');
assertEquals(augustPoint!.ordersCount, 0, 'Agosto 2026 sin ventas debe reportar 0 órdenes');

// ----------------------------------------------------------------------------
// 16. Compatibilidad con el registro de ventas manuales y preservación de inventario
// ----------------------------------------------------------------------------
console.log('\n[Caso 16: Registro de ventas manuales y compatibilidad con inventario]');
const inventoryStockBefore = 15;
const productForSale: Product = {
  id: 'frag-cuir',
  name: 'Cuir Sauvage',
  brand: 'ADARA',
  priceCOP: 520000,
  stock: inventoryStockBefore,
  family: 'Cuero & Humo',
  status: 'active',
  featured: false
};

// Venta manual registrada en Boutique Bogotá
const boutiqueManualSaleOrder: Order = {
  id: 'ord-boutique-001',
  reference: 'AD-BOUTIQUE-001',
  date: '2026-10-21 16:00',
  customerName: 'Cliente Presencial Boutique',
  customerPhone: '+57 311 234 5678',
  customerCity: 'Bogotá',
  channel: 'Boutique Bogotá',
  items: [{ productId: productForSale.id, productName: productForSale.name, quantity: 2, unitPriceCOP: 520000 }],
  totalCOP: 1040000,
  paymentStatus: 'paid',
  orderStatus: 'delivered',
  notes: 'Venta física en mostrador'
};

// Validar que la venta manual es procesada correctamente por el servicio
assert(isConfirmedSale(boutiqueManualSaleOrder) === true, 'Venta manual en mostrador es venta confirmada');
const boutiqueUnits = calculateUnitsSoldAndDispatched([boutiqueManualSaleOrder]);
assertEquals(boutiqueUnits.unitsSold, 2, 'Debe sumar 2 unidades vendidas para la venta manual');
assertEquals(boutiqueUnits.unitsDispatched, 2, 'Al ser presencial delivered debe sumar 2 unidades despachadas');

const boutiqueChannels = countOrdersByChannel([boutiqueManualSaleOrder]);
assertEquals(boutiqueChannels.manualOrders, 1, 'Debe contarse como orden manual');
assertEquals(boutiqueChannels.webOrders, 0, 'No debe contarse como web');
assertEquals(boutiqueChannels.byChannel['Boutique Bogotá'].confirmedSalesCount, 1, 'Canal Boutique Bogotá registra 1 venta confirmada');
assertEquals(boutiqueChannels.byChannel['Boutique Bogotá'].revenueCOP, 1040000, 'Canal Boutique Bogotá registra 1.040.000 COP');

// Simulación de deducción de stock estándar en la aplicación
const updatedProductStock = productForSale.stock - boutiqueManualSaleOrder.items[0].quantity;
assertEquals(updatedProductStock, 13, 'El stock remanente debe ser exactamente 13 unidades');
assertEquals(productForSale.stock, 15, 'El objeto original no fue mutado indebidamente');

// ----------------------------------------------------------------------------
// 17. Informes comerciales: familias olfativas y ausencia de cifras ficticias
// ----------------------------------------------------------------------------
console.log('\n[Caso 17: Informes comerciales sin datos ficticios en estados vacíos]');
// Cuando no hay órdenes, calculateRevenueByOlfactiveFamily retorna arreglo vacío
const emptyFamilies = calculateRevenueByOlfactiveFamily([], [productForSale]);
assertEquals(emptyFamilies.length, 0, 'Sin órdenes no debe inventar porcentajes fijos');

// Con órdenes, retorna las familias reales calculadas
const activeFamilies = calculateRevenueByOlfactiveFamily([boutiqueManualSaleOrder], [productForSale]);
assertEquals(activeFamilies.length, 1, 'Debe retornar exactamente 1 familia olfativa');
assertEquals(activeFamilies[0].family, 'Cuero & Humo', 'La familia debe ser Cuero & Humo');
assertEquals(activeFamilies[0].revenueCOP, 1040000, 'Ingresos de la familia deben ser 1.040.000 COP');
assertEquals(activeFamilies[0].percent, 100, 'Representa el 100% de las ventas');
assertEquals(activeFamilies[0].unitsSold, 2, 'Representa 2 unidades vendidas');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${passedTests + failedTests}`);
console.log(`ÉXITO: ${passedTests} superadas`);
console.log(`FALLOS: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE ANALÍTICA COMERCIAL PASARON CON ÉXITO.');
}

