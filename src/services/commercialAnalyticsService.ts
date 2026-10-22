import { Order, Product, DateRange, SalesChannel } from '../types';

/**
 * ADARA PARFUM — Servicio de Analítica y Estadísticas Comerciales
 *
 * Módulo independiente para el cálculo de estadísticas dinámicas del negocio.
 * Diseñado conforme a las reglas comerciales de la Fase 2.2 y Fase 2.3:
 * 1. Zona horaria unificada para Colombia (America/Bogota, UTC-5 constante sin cambio de horario).
 * 2. Exclusión estricta de pedidos cancelados de los ingresos, unidades vendidas y despachos.
 * 3. Conservación de pedidos cancelados en el recuento histórico de pedidos recibidos.
 * 4. Separación clara de pedidos web vs. ventas manuales/boutique.
 * 5. Diferenciación estricta entre unidades vendidas (comprometidas) y unidades despachadas (enviadas/entregadas).
 * 6. Criterios deterministas para ordenamiento y desempate de fragancias.
 * 7. Desglose dinámico por familias olfativas y comparativa con el periodo anterior.
 */

// ============================================================================
// TIPOS E INTERFACES DEL SERVICIO
// ============================================================================

export interface DateInterval {
  period: DateRange;
  start: Date;
  end: Date;
  startTimestamp: number;
  endTimestamp: number;
  label: string;
}

export interface ConfirmedSalesResult {
  count: number;
  totalCOP: number;
  orders: Order[];
}

export interface UnitsResult {
  unitsSold: number;
  unitsDispatched: number;
  unitsInPreparation: number;
}

export interface ChannelMetrics {
  totalReceived: number;       // Todos los pedidos recibidos históricamente (incluye cancelados)
  activeReceived: number;      // Pedidos activos (excluye cancelados)
  webOrders: number;           // Recibidos por canales web / chat
  manualOrders: number;        // Registrados por personal / boutique / distribuidores
  cancelledCount: number;      // Pedidos cancelados
  byChannel: Record<
    SalesChannel,
    {
      ordersCount: number;
      confirmedSalesCount: number;
      revenueCOP: number;
    }
  >;
}

export interface MonthlySalesDataPoint {
  monthKey: string;      // Formato: 'YYYY-MM'
  month: string;         // Nombre para etiqueta: 'Mayo', 'Junio', etc.
  current: number;       // Ventas en COP del año en curso
  previous: number;      // Ventas en COP del año anterior
  ordersCount: number;
  unitsSold: number;
}

export interface TopFragranceItem {
  productId: string;
  productName: string;
  unitsSold: number;
  revenueCOP: number;
  percentOfRevenue: number;
}

export interface OlfactiveFamilyRevenue {
  family: string;
  revenueCOP: number;
  percent: number;
  unitsSold: number;
  color: string;
}

export interface PeriodComparison {
  currentTotalCOP: number;
  previousTotalCOP: number;
  diffPercent: number | null;
  comparisonLabel: string;
  isPositive: boolean;
}

export interface DashboardMetricsSummary {
  period: DateRange;
  interval: DateInterval;
  confirmedSales: {
    count: number;
    totalCOP: number;
  };
  ordersReceived: {
    total: number;
    active: number;
    web: number;
    manual: number;
    cancelled: number;
  };
  units: {
    sold: number;
    dispatched: number;
    inPreparation: number;
  };
  averageTicketCOP: number;
  comparison: PeriodComparison;
  topFragrances: TopFragranceItem[];
  monthlyTrend: MonthlySalesDataPoint[];
  channelMetrics: ChannelMetrics;
}

// ============================================================================
// CONSTANTES Y UTILIDADES DE FECHA (ZONA HORARIA COLOMBIA: UTC-5)
// ============================================================================

export const COLOMBIA_TIMEZONE = 'America/Bogota';
export const COLOMBIA_UTC_OFFSET_HOURS = -5;

const SPANISH_MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

/**
 * Paleta de colores consistente con la identidad de lujo ADARA para gráficos de familias
 */
const OLFACTIVE_FAMILY_COLORS: Record<string, string> = {
  'Oriental & Ámbar': 'var(--color-gold)',
  'Floral Oscuro': 'var(--color-gold-deep)',
  'Amaderada': '#a68345',
  'Amaderada Noble': '#a68345',
  'Cuero & Humo': 'var(--color-border)',
  'Cítrico Noble': '#e6cb95',
  'Ámbar Amaderada': '#bfa063',
  'Otras Familias': '#524b3e'
};

/**
 * Extrae de forma segura los componentes de fecha correspondientes a la hora local
 * de Colombia (America/Bogota), sin depender de la configuración del sistema operativo.
 */
export function getColombiaDateParts(date: Date = new Date()): {
  year: number;
  month: number; // 1 - 12
  day: number;   // 1 - 31
  hours: number; // 0 - 23
  minutes: number;
  seconds: number;
  dayOfWeek: number; // 0 (Dom) - 6 (Sáb)
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: COLOMBIA_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  let hours = parseInt(getPart('hour'), 10);
  if (hours === 24) hours = 0;

  return {
    year: parseInt(getPart('year'), 10),
    month: parseInt(getPart('month'), 10),
    day: parseInt(getPart('day'), 10),
    hours,
    minutes: parseInt(getPart('minute'), 10),
    seconds: parseInt(getPart('second'), 10),
    dayOfWeek: weekdayMap[getPart('weekday')] ?? 0
  };
}

/**
 * Convierte componentes de fecha en hora de Colombia a un timestamp UTC en milisegundos.
 * En Colombia (UTC-5), las 00:00:00 equivalen a las 05:00:00 UTC del mismo día.
 */
export function createColombiaTimestamp(
  year: number,
  month: number, // 1-12
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): number {
  return Date.UTC(year, month - 1, day, hours + 5, minutes, seconds, ms);
}

/**
 * Parsea una cadena de fecha de una orden a timestamp UTC.
 * Soporta formatos:
 * - 'YYYY-MM-DD HH:mm' (ejemplo estándar en ADARA)
 * - 'YYYY-MM-DDTHH:mm:ss...' (ISO estándar)
 * - 'YYYY-MM-DD'
 * Si no incluye zona horaria explícita, se asume hora local de Colombia (-05:00).
 */
export function parseOrderTimestamp(dateInput: string | Date | undefined | null): number {
  if (!dateInput) return NaN;
  if (dateInput instanceof Date) return dateInput.getTime();

  const trimmed = String(dateInput).trim();
  if (!trimmed) return NaN;

  // Si ya tiene zona horaria explícita (Z o offset +/-HH:mm)
  if (/([Zz]|[+-]\d{2}(:?\d{2})?)$/.test(trimmed)) {
    const ts = new Date(trimmed).getTime();
    return isNaN(ts) ? NaN : ts;
  }

  // Si es formato YYYY-MM-DD HH:mm o YYYY-MM-DDTHH:mm
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const isoBase = trimmed.replace(' ', 'T');
    const withSecs = isoBase.length === 16 ? `${isoBase}:00` : isoBase;
    return new Date(`${withSecs}-05:00`).getTime();
  }

  // Si es formato simple YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00-05:00`).getTime();
  }

  const fallback = new Date(trimmed).getTime();
  return isNaN(fallback) ? NaN : fallback;
}

/**
 * Calcula los límites de inicio y fin (timestamp) para cada periodo admitido
 * en la zona horaria de Colombia.
 */
export function getPeriodInterval(
  period: DateRange,
  referenceDate: Date = new Date(),
  customStart?: string,
  customEnd?: string
): DateInterval {
  const parts = getColombiaDateParts(referenceDate);
  const { year, month, day, dayOfWeek } = parts;

  let startTs: number;
  let endTs: number;
  let label: string;

  switch (period) {
    case 'today': {
      startTs = createColombiaTimestamp(year, month, day, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, month, day, 23, 59, 59, 999);
      label = `Hoy (${day}/${month}/${year})`;
      break;
    }

    case 'week': {
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      startTs = createColombiaTimestamp(year, month, day - daysSinceMonday, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, month, day - daysSinceMonday + 6, 23, 59, 59, 999);
      label = 'Esta Semana';
      break;
    }

    case 'month': {
      startTs = createColombiaTimestamp(year, month, 1, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, month + 1, 0, 23, 59, 59, 999);
      label = `${SPANISH_MONTH_NAMES[month - 1]} ${year}`;
      break;
    }

    case 'quarter': {
      const qIndex = Math.floor((month - 1) / 3);
      const qStartMonth = qIndex * 3 + 1;
      const qEndMonth = qStartMonth + 2;

      startTs = createColombiaTimestamp(year, qStartMonth, 1, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, qEndMonth + 1, 0, 23, 59, 59, 999);
      label = `T${qIndex + 1} ${year}`;
      break;
    }

    case 'year': {
      startTs = createColombiaTimestamp(year, 1, 1, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, 12, 31, 23, 59, 59, 999);
      label = `Año ${year}`;
      break;
    }

    case 'custom': {
      startTs = customStart ? parseOrderTimestamp(customStart) : createColombiaTimestamp(year, month, 1, 0, 0, 0, 0);
      endTs = customEnd ? parseOrderTimestamp(customEnd) : createColombiaTimestamp(year, month, day, 23, 59, 59, 999);
      label = 'Personalizado';
      break;
    }

    default: {
      startTs = createColombiaTimestamp(year, month, 1, 0, 0, 0, 0);
      endTs = createColombiaTimestamp(year, month + 1, 0, 23, 59, 59, 999);
      label = `${SPANISH_MONTH_NAMES[month - 1]} ${year}`;
    }
  }

  return {
    period,
    start: new Date(startTs),
    end: new Date(endTs),
    startTimestamp: startTs,
    endTimestamp: endTs,
    label
  };
}

/**
 * Obtiene el intervalo del periodo anterior consecutivo para comparativas (vs período anterior)
 */
export function getPreviousPeriodInterval(
  period: DateRange,
  referenceDate: Date = new Date()
): DateInterval {
  const parts = getColombiaDateParts(referenceDate);
  const { year, month, day, dayOfWeek } = parts;

  switch (period) {
    case 'today': {
      // Día de ayer
      const prevDate = new Date(createColombiaTimestamp(year, month, day - 1, 12, 0, 0));
      return getPeriodInterval('today', prevDate);
    }
    case 'week': {
      // Semana anterior (-7 días)
      const prevWeekDate = new Date(createColombiaTimestamp(year, month, day - 7, 12, 0, 0));
      return getPeriodInterval('week', prevWeekDate);
    }
    case 'month': {
      // Mes anterior
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevDate = new Date(createColombiaTimestamp(prevYear, prevMonth, 15, 12, 0, 0));
      return getPeriodInterval('month', prevDate);
    }
    case 'quarter': {
      // Trimestre anterior (-3 meses)
      const qIndex = Math.floor((month - 1) / 3);
      let prevQMonth = (qIndex - 1) * 3 + 1;
      let prevQYear = year;
      if (prevQMonth < 1) {
        prevQMonth += 12;
        prevQYear -= 1;
      }
      const prevDate = new Date(createColombiaTimestamp(prevQYear, prevQMonth, 15, 12, 0, 0));
      return getPeriodInterval('quarter', prevDate);
    }
    case 'year': {
      // Año anterior
      const prevDate = new Date(createColombiaTimestamp(year - 1, 6, 15, 12, 0, 0));
      return getPeriodInterval('year', prevDate);
    }
    default: {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevDate = new Date(createColombiaTimestamp(prevYear, prevMonth, 15, 12, 0, 0));
      return getPeriodInterval('month', prevDate);
    }
  }
}

// ============================================================================
// FUNCIONES DE CÁLCULO Y FILTRADO COMERCIAL
// ============================================================================

/**
 * Filtra pedidos según el intervalo de tiempo en la hora local de Colombia.
 */
export function filterOrdersByPeriod(
  orders: Order[],
  period: DateRange,
  referenceDate: Date = new Date(),
  customStart?: string,
  customEnd?: string
): Order[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const interval = getPeriodInterval(period, referenceDate, customStart, customEnd);

  return orders.filter((order) => {
    const ts = parseOrderTimestamp(order.date);
    if (isNaN(ts)) return false;
    return ts >= interval.startTimestamp && ts <= interval.endTimestamp;
  });
}

/**
 * Determina si una orden califica como venta comercialmente confirmada:
 * - NO debe estar cancelada (`orderStatus !== 'cancelled'`).
 * - Su cobro debe estar verificado (`paymentStatus === 'paid'`) O
 *   haber sido entregada con cobro contra entrega (`paymentStatus === 'on_delivery' && orderStatus === 'delivered'`).
 */
export function isConfirmedSale(order: Order): boolean {
  if (!order) return false;
  if (order.orderStatus === 'cancelled') return false;

  if (order.paymentStatus === 'paid') {
    return true;
  }

  if (order.paymentStatus === 'on_delivery' && order.orderStatus === 'delivered') {
    return true;
  }

  return false;
}

/**
 * Calcula las ventas confirmadas y el monto total en COP.
 */
export function calculateConfirmedSales(orders: Order[]): ConfirmedSalesResult {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { count: 0, totalCOP: 0, orders: [] };
  }

  const confirmed = orders.filter(isConfirmedSale);
  const totalCOP = confirmed.reduce((acc, o) => {
    const amount = typeof o.totalCOP === 'number' && !isNaN(o.totalCOP) ? o.totalCOP : 0;
    return acc + amount;
  }, 0);

  return {
    count: confirmed.length,
    totalCOP,
    orders: confirmed
  };
}

/**
 * Cuenta pedidos recibidos clasificados por canal de venta.
 * IMPORTANTE (Regla de negocio Fase 2.3):
 * Un pedido cancelado SE CONTABILIZA en el recuento histórico de pedidos recibidos (`totalReceived`),
 * pero se aísla en `cancelledCount` y queda excluido de `confirmedSalesCount` e ingresos.
 */
export function countOrdersByChannel(orders: Order[]): ChannelMetrics {
  const initialByChannel: ChannelMetrics['byChannel'] = {
    'Tienda Web': { ordersCount: 0, confirmedSalesCount: 0, revenueCOP: 0 },
    'WhatsApp': { ordersCount: 0, confirmedSalesCount: 0, revenueCOP: 0 },
    'Boutique Bogotá': { ordersCount: 0, confirmedSalesCount: 0, revenueCOP: 0 },
    'Distribuidor': { ordersCount: 0, confirmedSalesCount: 0, revenueCOP: 0 }
  };

  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalReceived: 0,
      activeReceived: 0,
      webOrders: 0,
      manualOrders: 0,
      cancelledCount: 0,
      byChannel: initialByChannel
    };
  }

  let totalReceived = 0;
  let activeReceived = 0;
  let webOrders = 0;
  let manualOrders = 0;
  let cancelledCount = 0;

  for (const order of orders) {
    totalReceived++;

    if (order.orderStatus === 'cancelled') {
      cancelledCount++;
    } else {
      activeReceived++;
    }

    // Clasificación de canal de origen histórico
    if (order.channel === 'Tienda Web' || order.channel === 'WhatsApp') {
      webOrders++;
    } else {
      manualOrders++;
    }

    const ch = order.channel as SalesChannel;
    if (initialByChannel[ch]) {
      initialByChannel[ch].ordersCount++;
      if (isConfirmedSale(order)) {
        initialByChannel[ch].confirmedSalesCount++;
        initialByChannel[ch].revenueCOP += order.totalCOP || 0;
      }
    }
  }

  return {
    totalReceived,
    activeReceived,
    webOrders,
    manualOrders,
    cancelledCount,
    byChannel: initialByChannel
  };
}

/**
 * Calcula de forma independiente las unidades vendidas (comprometidas en ventas confirmadas)
 * y las unidades despachadas (físicamente enviadas o entregadas).
 */
export function calculateUnitsSoldAndDispatched(orders: Order[]): UnitsResult {
  if (!Array.isArray(orders) || orders.length === 0) {
    return { unitsSold: 0, unitsDispatched: 0, unitsInPreparation: 0 };
  }

  let unitsSold = 0;
  let unitsDispatched = 0;

  for (const order of orders) {
    if (!isConfirmedSale(order)) continue;

    const orderUnits = (order.items || []).reduce((acc, item) => {
      const q = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 0;
      return acc + q;
    }, 0);

    unitsSold += orderUnits;

    if (order.orderStatus === 'shipped' || order.orderStatus === 'delivered') {
      unitsDispatched += orderUnits;
    }
  }

  return {
    unitsSold,
    unitsDispatched,
    unitsInPreparation: Math.max(0, unitsSold - unitsDispatched)
  };
}

/**
 * Agrupa ventas confirmadas por mes cronológico en hora de Colombia.
 * Devuelve un arreglo continuo de los últimos `monthsCount` meses (por defecto 6),
 * mapeando `current` para el año actual y `previous` para el año anterior.
 */
export function groupSalesByMonth(
  orders: Order[],
  monthsCount = 6,
  referenceDate: Date = new Date()
): MonthlySalesDataPoint[] {
  const parts = getColombiaDateParts(referenceDate);
  const result: MonthlySalesDataPoint[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    let y = parts.year;
    let m = parts.month - i;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }

    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const month = `${SPANISH_MONTH_NAMES[m - 1]}${i === 0 ? ' (Actual)' : ''}`;

    result.push({
      monthKey,
      month,
      current: 0,
      previous: 0,
      ordersCount: 0,
      unitsSold: 0
    });
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return result;
  }

  const currentMap = new Map<string, MonthlySalesDataPoint>();
  for (const item of result) {
    currentMap.set(item.monthKey, item);
  }

  for (const order of orders) {
    if (!isConfirmedSale(order)) continue;

    const ts = parseOrderTimestamp(order.date);
    if (isNaN(ts)) continue;

    const oParts = getColombiaDateParts(new Date(ts));
    const currentKey = `${oParts.year}-${String(oParts.month).padStart(2, '0')}`;
    const prevKey = `${oParts.year + 1}-${String(oParts.month).padStart(2, '0')}`;

    // Si coincide con un mes del año actual
    const currentPoint = currentMap.get(currentKey);
    if (currentPoint) {
      currentPoint.current += order.totalCOP || 0;
      currentPoint.ordersCount += 1;
      const units = (order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
      currentPoint.unitsSold += units;
    }

    // Si coincide con el año anterior de un mes mostrado
    const previousPoint = currentMap.get(prevKey);
    if (previousPoint) {
      previousPoint.previous += order.totalCOP || 0;
    }
  }

  return result;
}

/**
 * Obtiene las fragancias con mayor volumen de ventas en el conjunto de pedidos entregado.
 * Aplica desempate determinista: 1º Ingresos desc, 2º Unidades desc, 3º Nombre alfabético asc.
 */
export function getTopSellingFragrances(orders: Order[], limit = 4): TopFragranceItem[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const confirmed = orders.filter(isConfirmedSale);
  if (confirmed.length === 0) return [];

  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      unitsSold: number;
      revenueCOP: number;
    }
  >();

  let totalSalesRevenue = 0;

  for (const order of confirmed) {
    for (const item of order.items || []) {
      const pid = item.productId || 'desconocido';
      const cleanName = item.productName ? item.productName.replace(/\s*\([^)]*\)$/, '') : pid;
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 0;
      const unitPrice = item.unitPriceCOP && item.unitPriceCOP > 0 ? item.unitPriceCOP : 0;
      const lineRevenue = qty * unitPrice;

      totalSalesRevenue += lineRevenue;

      const existing = productMap.get(pid);
      if (existing) {
        existing.unitsSold += qty;
        existing.revenueCOP += lineRevenue;
      } else {
        productMap.set(pid, {
          productId: pid,
          productName: cleanName,
          unitsSold: qty,
          revenueCOP: lineRevenue
        });
      }
    }
  }

  const items = Array.from(productMap.values());

  items.sort((a, b) => {
    if (b.revenueCOP !== a.revenueCOP) {
      return b.revenueCOP - a.revenueCOP;
    }
    if (b.unitsSold !== a.unitsSold) {
      return b.unitsSold - a.unitsSold;
    }
    return a.productName.localeCompare(b.productName);
  });

  const sliced = items.slice(0, limit);

  return sliced.map((frag) => ({
    productId: frag.productId,
    productName: frag.productName,
    unitsSold: frag.unitsSold,
    revenueCOP: frag.revenueCOP,
    percentOfRevenue:
      totalSalesRevenue > 0
        ? Number(((frag.revenueCOP / totalSalesRevenue) * 100).toFixed(1))
        : 0
  }));
}

/**
 * Calcula la distribución real de ingresos por familia olfativa a partir de las órdenes confirmadas.
 */
export function calculateRevenueByOlfactiveFamily(
  orders: Order[],
  products: Product[]
): OlfactiveFamilyRevenue[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];

  const confirmed = orders.filter(isConfirmedSale);
  if (confirmed.length === 0) return [];

  const productFamilyMap = new Map<string, string>();
  for (const p of products) {
    productFamilyMap.set(p.id, p.family || 'Otras Familias');
  }

  const familyMap = new Map<string, { revenueCOP: number; unitsSold: number }>();
  let totalRevenue = 0;

  for (const order of confirmed) {
    for (const item of order.items || []) {
      const family = productFamilyMap.get(item.productId) || 'Otras Familias';
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 0;
      const unitPrice = item.unitPriceCOP && item.unitPriceCOP > 0 ? item.unitPriceCOP : 0;
      const lineRev = qty * unitPrice;

      totalRevenue += lineRev;

      const existing = familyMap.get(family);
      if (existing) {
        existing.revenueCOP += lineRev;
        existing.unitsSold += qty;
      } else {
        familyMap.set(family, { revenueCOP: lineRev, unitsSold: qty });
      }
    }
  }

  const entries = Array.from(familyMap.entries()).map(([family, data]) => ({
    family,
    revenueCOP: data.revenueCOP,
    unitsSold: data.unitsSold,
    percent: totalRevenue > 0 ? Math.round((data.revenueCOP / totalRevenue) * 100) : 0,
    color: OLFACTIVE_FAMILY_COLORS[family] || 'var(--color-gold)'
  }));

  entries.sort((a, b) => b.revenueCOP - a.revenueCOP);
  return entries;
}

/**
 * Calcula la comparativa de ingresos de ventas confirmadas frente al periodo consecutivo anterior.
 */
export function calculatePeriodComparison(
  orders: Order[],
  period: DateRange,
  referenceDate: Date = new Date()
): PeriodComparison {
  const currentOrders = filterOrdersByPeriod(orders, period, referenceDate);
  const currentSales = calculateConfirmedSales(currentOrders);

  const prevInterval = getPreviousPeriodInterval(period, referenceDate);
  const prevOrders = orders.filter((o) => {
    const ts = parseOrderTimestamp(o.date);
    if (isNaN(ts)) return false;
    return ts >= prevInterval.startTimestamp && ts <= prevInterval.endTimestamp;
  });
  const prevSales = calculateConfirmedSales(prevOrders);

  const currentTotal = currentSales.totalCOP;
  const prevTotal = prevSales.totalCOP;

  if (prevTotal === 0) {
    if (currentTotal > 0) {
      return {
        currentTotalCOP: currentTotal,
        previousTotalCOP: 0,
        diffPercent: 100,
        comparisonLabel: '+100%',
        isPositive: true
      };
    }
    return {
      currentTotalCOP: 0,
      previousTotalCOP: 0,
      diffPercent: null,
      comparisonLabel: '0%',
      isPositive: true
    };
  }

  const diff = ((currentTotal - prevTotal) / prevTotal) * 100;
  const isPositive = diff >= 0;
  const sign = isPositive ? '+' : '';
  const label = `${sign}${diff.toFixed(1)}%`;

  return {
    currentTotalCOP: currentTotal,
    previousTotalCOP: prevTotal,
    diffPercent: Number(diff.toFixed(1)),
    comparisonLabel: label,
    isPositive
  };
}

/**
 * Función maestra de consolidación de métricas para el Dashboard.
 */
export function calculateDashboardMetrics(
  orders: Order[],
  period: DateRange,
  referenceDate: Date = new Date(),
  customStart?: string,
  customEnd?: string
): DashboardMetricsSummary {
  const interval = getPeriodInterval(period, referenceDate, customStart, customEnd);
  const periodOrders = filterOrdersByPeriod(orders, period, referenceDate, customStart, customEnd);

  const confirmed = calculateConfirmedSales(periodOrders);
  const units = calculateUnitsSoldAndDispatched(periodOrders);
  const channelMetrics = countOrdersByChannel(periodOrders);
  const topFragrances = getTopSellingFragrances(periodOrders, 4);
  const monthlyTrend = groupSalesByMonth(orders, 6, referenceDate);
  const comparison = calculatePeriodComparison(orders, period, referenceDate);

  const averageTicketCOP =
    confirmed.count > 0 ? Math.round(confirmed.totalCOP / confirmed.count) : 0;

  return {
    period,
    interval,
    confirmedSales: {
      count: confirmed.count,
      totalCOP: confirmed.totalCOP
    },
    ordersReceived: {
      total: channelMetrics.totalReceived,
      active: channelMetrics.activeReceived,
      web: channelMetrics.webOrders,
      manual: channelMetrics.manualOrders,
      cancelled: channelMetrics.cancelledCount
    },
    units: {
      sold: units.unitsSold,
      dispatched: units.unitsDispatched,
      inPreparation: units.unitsInPreparation
    },
    averageTicketCOP,
    comparison,
    topFragrances,
    monthlyTrend,
    channelMetrics
  };
}
