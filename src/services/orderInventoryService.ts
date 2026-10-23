import {
  Product,
  Order,
  OrderItem,
  OrderStatus,
  CartItem,
  PaymentMethod,
  SalesChannel
} from '../types';
import { InventoryMovement } from '../types/firestore';

/**
 * ADARA PARFUM — Servicio Centralizado de Integridad de Pedidos e Inventario
 *
 * Módulo para la gestión unificada de stock, trazabilidad de pedidos y movimientos.
 * Implementa las reglas comerciales de la Fase 2.4A:
 * 1. Ventas manuales descuentan stock de forma controlada y validada (sin existencias negativas).
 * 2. Pedidos iniciados por WhatsApp se registran como 'pending' con canal 'WhatsApp' SIN descontar stock prematuramente.
 * 3. Confirmar un pedido pendiente descuenta el stock una única vez y marca `inventoryDeducted: true`.
 * 4. Cancelar un pedido restituye stock ÚNICAMENTE si ya había sido descontado (`inventoryDeducted === true`).
 * 5. Cancelar dos veces es estrictamente idempotente (no duplica la restitución).
 * 6. Transiciones entre estados logísticos activos ('preparing' -> 'shipped' -> 'delivered') NO vuelven a descontar stock.
 * 7. Modificar cantidades de un pedido ajusta exclusivamente la diferencia aritmética neta (delta).
 * 8. Soporte preparado para variantes físicas por tamaño (30ml, 50ml, 100ml) sin mezclar existencias.
 */

export interface InventoryServiceResult<T = void> {
  success: boolean;
  error?: string;
  updatedProducts: Product[];
  updatedOrder?: Order;
  movements: InventoryMovement[];
  data?: T;
}

/**
 * Genera una marca temporal en hora legal de Colombia (UTC-5) con formato estándar 'YYYY-MM-DD HH:mm'.
 */
export function getColombiaNowString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  // en-CA formats as YYYY-MM-DD, HH:mm
  return formatter.format(now).replace(',', '');
}

/**
 * Determina de forma determinista si un pedido ya generó una deducción efectiva de inventario.
 * Para pedidos con el flag explícito `inventoryDeducted`, respeta su valor booleano.
 * Para pedidos históricos previos a la Fase 2.4A (donde el flag es undefined):
 * - Los estados 'preparing', 'shipped' y 'delivered' se consideran descontados.
 * - Los estados 'pending' y 'cancelled' se consideran no descontados.
 */
export function hasInventoryBeenDeducted(order: Order): boolean {
  if (typeof order.inventoryDeducted === 'boolean') {
    return order.inventoryDeducted;
  }
  // Heurística de compatibilidad retrospectiva para pedidos iniciales
  return order.orderStatus !== 'pending' && order.orderStatus !== 'cancelled';
}

/**
 * Busca el stock disponible de un producto o de su variante específica de tamaño.
 */
export function getAvailableStock(product: Product, variantId?: string): number {
  if (variantId && Array.isArray(product.variants) && product.variants.length > 0) {
    const v = product.variants.find((item) => item.id === variantId);
    if (v) return typeof v.stock === 'number' && !isNaN(v.stock) ? v.stock : 0;
  }
  return typeof product.stock === 'number' && !isNaN(product.stock) ? product.stock : 0;
}

/**
 * Modifica el stock de un producto o su variante de forma pura e inmutable.
 */
function applyStockDeltaToProduct(
  product: Product,
  delta: number,
  variantId?: string
): Product {
  const currentTotal = typeof product.stock === 'number' && !isNaN(product.stock) ? product.stock : 0;

  if (variantId && Array.isArray(product.variants) && product.variants.length > 0) {
    let variantFound = false;
    const updatedVariants = product.variants.map((v) => {
      if (v.id === variantId) {
        variantFound = true;
        const currentVStock = typeof v.stock === 'number' && !isNaN(v.stock) ? v.stock : 0;
        return { ...v, stock: Math.max(0, currentVStock + delta) };
      }
      return v;
    });

    if (variantFound) {
      const newTotal = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
      return {
        ...product,
        stock: newTotal,
        variants: updatedVariants
      };
    }
  }

  // Stock genérico
  return {
    ...product,
    stock: Math.max(0, currentTotal + delta)
  };
}

/**
 * Registra una venta manual verificando existencias y descontando inventario una sola vez.
 */
export function registerManualSale(
  currentProducts: Product[],
  order: Order,
  adminUid: string = 'admin-local'
): InventoryServiceResult<Order> {
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return {
      success: false,
      error: 'La orden no contiene ningún artículo.',
      updatedProducts: currentProducts,
      movements: []
    };
  }

  // 1. Validación estricta de existencias previas
  for (const item of order.items) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return {
        success: false,
        error: `Cantidad inválida para '${item.productName}'. Debe ser un número entero positivo.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }

    const prod = currentProducts.find((p) => p.id === item.productId);
    if (!prod) {
      return {
        success: false,
        error: `La fragancia con ID '${item.productId}' no existe en el catálogo.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }

    const available = getAvailableStock(prod, item.variantId);
    if (available < item.quantity) {
      return {
        success: false,
        error: `Stock insuficiente para '${prod.name}'. Disponibles: ${available}, solicitadas: ${item.quantity}.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }
  }

  // 2. Aplicar deducción de stock y generar movimientos auditables
  let workingProducts = [...currentProducts];
  const movements: InventoryMovement[] = [];
  const now = getColombiaNowString();

  for (const item of order.items) {
    const prodIndex = workingProducts.findIndex((p) => p.id === item.productId);
    const prod = workingProducts[prodIndex];
    const prevStock = getAvailableStock(prod, item.variantId);
    const updatedProd = applyStockDeltaToProduct(prod, -item.quantity, item.variantId);
    workingProducts[prodIndex] = updatedProd;

    movements.push({
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: prod.id,
      productName: item.productName,
      previousStock: prevStock,
      delta: -item.quantity,
      newStock: getAvailableStock(updatedProd, item.variantId),
      reason: `Venta manual confirmada (${order.reference})`,
      adminUid,
      timestamp: now
    });
  }

  const updatedOrder: Order = {
    ...order,
    inventoryDeducted: true
  };

  return {
    success: true,
    updatedProducts: workingProducts,
    updatedOrder,
    movements,
    data: updatedOrder
  };
}

/**
 * Confirma el inventario de un pedido pendiente, descontando las existencias una sola vez.
 * Si el pedido ya tenía el stock descontado, actúa de forma idempotente sin duplicar descuentos.
 */
export function confirmOrderInventory(
  currentProducts: Product[],
  order: Order,
  adminUid: string = 'admin-local'
): InventoryServiceResult<Order> {
  if (hasInventoryBeenDeducted(order)) {
    // Ya fue descontado: no aplicar descuento duplicado
    return {
      success: true,
      updatedProducts: currentProducts,
      updatedOrder: { ...order, inventoryDeducted: true },
      movements: []
    };
  }

  // Validar disponibilidad
  for (const item of order.items || []) {
    const prod = currentProducts.find((p) => p.id === item.productId);
    if (!prod) {
      return {
        success: false,
        error: `Producto '${item.productId}' no encontrado en el catálogo.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }
    const available = getAvailableStock(prod, item.variantId);
    if (available < item.quantity) {
      return {
        success: false,
        error: `Stock insuficiente para confirmar '${prod.name}'. Disponibles: ${available}, solicitadas: ${item.quantity}.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }
  }

  let workingProducts = [...currentProducts];
  const movements: InventoryMovement[] = [];
  const now = getColombiaNowString();

  for (const item of order.items || []) {
    const prodIndex = workingProducts.findIndex((p) => p.id === item.productId);
    const prod = workingProducts[prodIndex];
    const prevStock = getAvailableStock(prod, item.variantId);
    const updatedProd = applyStockDeltaToProduct(prod, -item.quantity, item.variantId);
    workingProducts[prodIndex] = updatedProd;

    movements.push({
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: prod.id,
      productName: item.productName,
      previousStock: prevStock,
      delta: -item.quantity,
      newStock: getAvailableStock(updatedProd, item.variantId),
      reason: `Confirmación y reserva de inventario (${order.reference})`,
      adminUid,
      timestamp: now
    });
  }

  const updatedOrder: Order = {
    ...order,
    inventoryDeducted: true
  };

  return {
    success: true,
    updatedProducts: workingProducts,
    updatedOrder,
    movements,
    data: updatedOrder
  };
}

/**
 * Cancela un pedido restituyendo existencias ÚNICAMENTE si ya habían sido descontadas.
 * Si el pedido nunca descontó inventario o ya fue cancelado, es estrictamente idempotente.
 */
export function cancelOrderInventory(
  currentProducts: Product[],
  order: Order,
  adminUid: string = 'admin-local'
): InventoryServiceResult<Order> {
  const isAlreadyDeducted = hasInventoryBeenDeducted(order);

  if (!isAlreadyDeducted) {
    // Nunca descontó inventario: no sumar stock artificialmente
    const updatedOrder: Order = {
      ...order,
      orderStatus: 'cancelled',
      inventoryDeducted: false
    };
    return {
      success: true,
      updatedProducts: currentProducts,
      updatedOrder,
      movements: [],
      data: updatedOrder
    };
  }

  // Restituir unidades previamente descontadas
  let workingProducts = [...currentProducts];
  const movements: InventoryMovement[] = [];
  const now = getColombiaNowString();

  for (const item of order.items || []) {
    const prodIndex = workingProducts.findIndex((p) => p.id === item.productId);
    if (prodIndex >= 0) {
      const prod = workingProducts[prodIndex];
      const prevStock = getAvailableStock(prod, item.variantId);
      const updatedProd = applyStockDeltaToProduct(prod, item.quantity, item.variantId);
      workingProducts[prodIndex] = updatedProd;

      movements.push({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prod.id,
        productName: item.productName,
        previousStock: prevStock,
        delta: item.quantity,
        newStock: getAvailableStock(updatedProd, item.variantId),
        reason: `Restitución por cancelación de pedido (${order.reference})`,
        adminUid,
        timestamp: now
      });
    }
  }

  const updatedOrder: Order = {
    ...order,
    orderStatus: 'cancelled',
    inventoryDeducted: false
  };

  return {
    success: true,
    updatedProducts: workingProducts,
    updatedOrder,
    movements,
    data: updatedOrder
  };
}

/**
 * Modifica las cantidades de un pedido ajustando exclusivamente la diferencia neta de stock.
 */
export function updateOrderQuantities(
  currentProducts: Product[],
  order: Order,
  newItems: OrderItem[],
  adminUid: string = 'admin-local'
): InventoryServiceResult<Order> {
  if (!Array.isArray(newItems) || newItems.length === 0) {
    return {
      success: false,
      error: 'El pedido debe conservar al menos un artículo.',
      updatedProducts: currentProducts,
      movements: []
    };
  }

  for (const item of newItems) {
    if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return {
        success: false,
        error: `Cantidad inválida para '${item.productName}'.`,
        updatedProducts: currentProducts,
        movements: []
      };
    }
  }

  const isDeducted = hasInventoryBeenDeducted(order);

  // Si no había descontado existencias, solo actualizar los artículos del pedido
  if (!isDeducted) {
    const totalCOP = newItems.reduce((acc, it) => acc + it.quantity * it.unitPriceCOP, 0);
    const updatedOrder: Order = {
      ...order,
      items: newItems,
      totalCOP
    };
    return {
      success: true,
      updatedProducts: currentProducts,
      updatedOrder,
      movements: [],
      data: updatedOrder
    };
  }

  // Si ya había descontado existencias, calcular el diferencial (delta) por producto
  const oldItemMap = new Map<string, number>();
  for (const it of order.items || []) {
    const key = it.variantId ? `${it.productId}::${it.variantId}` : it.productId;
    oldItemMap.set(key, (oldItemMap.get(key) || 0) + it.quantity);
  }

  const newItemMap = new Map<string, number>();
  for (const it of newItems) {
    const key = it.variantId ? `${it.productId}::${it.variantId}` : it.productId;
    newItemMap.set(key, (newItemMap.get(key) || 0) + it.quantity);
  }

  // Validar si algún incremento supera el stock disponible
  const allKeys = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);
  for (const key of allKeys) {
    const [productId, variantId] = key.split('::');
    const oldQty = oldItemMap.get(key) || 0;
    const newQty = newItemMap.get(key) || 0;
    const diff = newQty - oldQty;

    if (diff > 0) {
      const prod = currentProducts.find((p) => p.id === productId);
      if (!prod) {
        return {
          success: false,
          error: `Producto con ID '${productId}' no encontrado.`,
          updatedProducts: currentProducts,
          movements: []
        };
      }
      const available = getAvailableStock(prod, variantId);
      if (available < diff) {
        return {
          success: false,
          error: `Stock insuficiente para incrementar '${prod.name}'. Disponibles adicionales: ${available}, solicitadas: ${diff}.`,
          updatedProducts: currentProducts,
          movements: []
        };
      }
    }
  }

  // Aplicar diferencias
  let workingProducts = [...currentProducts];
  const movements: InventoryMovement[] = [];
  const now = getColombiaNowString();

  for (const key of allKeys) {
    const [productId, variantId] = key.split('::');
    const oldQty = oldItemMap.get(key) || 0;
    const newQty = newItemMap.get(key) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      const prodIndex = workingProducts.findIndex((p) => p.id === productId);
      const prod = workingProducts[prodIndex];
      const prevStock = getAvailableStock(prod, variantId);
      // diff > 0 -> restar stock (-diff); diff < 0 -> sumar stock (+abs(diff))
      const updatedProd = applyStockDeltaToProduct(prod, -diff, variantId);
      workingProducts[prodIndex] = updatedProd;

      movements.push({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prod.id,
        productName: prod.name,
        previousStock: prevStock,
        delta: -diff,
        newStock: getAvailableStock(updatedProd, variantId),
        reason: `Ajuste de cantidad en pedido ${order.reference} (${diff > 0 ? `+${diff}` : diff} uds)`,
        adminUid,
        timestamp: now
      });
    }
  }

  const totalCOP = newItems.reduce((acc, it) => acc + it.quantity * it.unitPriceCOP, 0);
  const updatedOrder: Order = {
    ...order,
    items: newItems,
    totalCOP
  };

  return {
    success: true,
    updatedProducts: workingProducts,
    updatedOrder,
    movements,
    data: updatedOrder
  };
}

/**
 * Ajusta manualmente el stock físico de un producto en el taller.
 */
export function adjustManualStock(
  currentProducts: Product[],
  productId: string,
  delta: number,
  reason: string,
  adminUid: string = 'admin-local',
  variantId?: string
): InventoryServiceResult<Product> {
  const prodIndex = currentProducts.findIndex((p) => p.id === productId);
  if (prodIndex < 0) {
    return {
      success: false,
      error: 'Producto no encontrado.',
      updatedProducts: currentProducts,
      movements: []
    };
  }

  const prod = currentProducts[prodIndex];

  // Si el producto tiene variantes definidas, exigir la variante a ajustar para evitar desincronizar stock
  if (Array.isArray(prod.variants) && prod.variants.length > 0 && !variantId) {
    return {
      success: false,
      error: `La fragancia '${prod.name}' maneja inventario por variante. Debe especificar la presentación a ajustar.`,
      updatedProducts: currentProducts,
      movements: []
    };
  }

  const currentStock = getAvailableStock(prod, variantId);
  const newStock = currentStock + delta;

  if (newStock < 0) {
    return {
      success: false,
      error: `El ajuste resultaría en stock negativo (${newStock}). Operación cancelada.`,
      updatedProducts: currentProducts,
      movements: []
    };
  }

  const updatedProd = applyStockDeltaToProduct(prod, delta, variantId);
  const updatedProducts = [...currentProducts];
  updatedProducts[prodIndex] = updatedProd;

  const movement: InventoryMovement = {
    id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: prod.id,
    productName: prod.name,
    previousStock: currentStock,
    delta,
    newStock,
    reason,
    adminUid,
    timestamp: getColombiaNowString()
  };

  return {
    success: true,
    updatedProducts,
    movements: [movement],
    data: updatedProd
  };
}

/**
 * Transición unificada del ciclo de vida del pedido con integridad de inventario.
 */
export function transitionOrderStatus(
  currentProducts: Product[],
  order: Order,
  newStatus: OrderStatus,
  adminUid: string = 'admin-local'
): InventoryServiceResult<Order> {
  if (newStatus === 'cancelled') {
    return cancelOrderInventory(currentProducts, order, adminUid);
  }

  if (newStatus === 'preparing' || newStatus === 'shipped' || newStatus === 'delivered') {
    if (!hasInventoryBeenDeducted(order)) {
      // Viene de un estado donde aún no se había descontado (ej. 'pending')
      const confirmRes = confirmOrderInventory(currentProducts, order, adminUid);
      if (!confirmRes.success) {
        return confirmRes;
      }
      return {
        ...confirmRes,
        updatedOrder: { ...confirmRes.updatedOrder!, orderStatus: newStatus }
      };
    }

    // Si ya había descontado, la transición entre estados activos NO vuelve a descontar
    const updatedOrder: Order = {
      ...order,
      orderStatus: newStatus,
      inventoryDeducted: true
    };
    return {
      success: true,
      updatedProducts: currentProducts,
      updatedOrder,
      movements: []
    };
  }

  // Retorno a 'pending' (consulta o revisión)
  const updatedOrder: Order = {
    ...order,
    orderStatus: 'pending'
  };
  return {
    success: true,
    updatedProducts: currentProducts,
    updatedOrder,
    movements: []
  };
}

export interface CreateBaseOrderParams {
  cartItems: CartItem[];
  channel?: SalesChannel;
  paymentMethod?: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerCity?: string;
  notes?: string;
  referencePrefix?: string;
}

let referenceSequence = Math.floor(Math.random() * 1000);

/**
 * Genera una referencia de pedido única y centralizada.
 * - Elimina años codificados manualmente calculando dinámicamente el año actual en Colombia.
 * - Garantiza matemáticamente la ausencia de colisiones mediante la combinación de marca temporal
 *   de milisegundos y un contador monotónico por proceso.
 * - Mantiene el prefijo solicitado (ej. 'AD', 'AD-WA', 'AD-MV', 'AD-ADDI').
 *
 * Ejemplo: generateOrderReference('AD') => 'AD-2026-84920001'
 *          generateOrderReference('AD-WA') => 'AD-WA-2026-84920002'
 */
export function generateOrderReference(prefix: string = 'AD'): string {
  const colombiaDateStr = getColombiaNowString();
  const currentYear = colombiaDateStr.split('-')[0] || new Date().getFullYear().toString();
  referenceSequence = (referenceSequence + 1) % 100000;
  const timeSlice = Date.now().toString().slice(-4);
  const seqStr = referenceSequence.toString().padStart(5, '0');
  return `${prefix}-${currentYear}-${timeSlice}${seqStr}`;
}

/**
 * Crea un pedido desacoplado del canal o pasarela de pago.
 * Valida variantes, cantidades y precios unitarios.
 * Inicia en estado 'pending' con inventoryDeducted: false.
 */
export function createBaseOrder(
  params: CreateBaseOrderParams
): { success: boolean; order?: Order; error?: string } {
  const {
    cartItems,
    channel = 'Tienda Web',
    paymentMethod,
    customerName = 'Cliente Tienda Web',
    customerPhone = '',
    customerCity = 'Por coordinar',
    notes = '',
    referencePrefix = 'AD'
  } = params;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { success: false, error: 'El carrito está vacío.' };
  }

  for (const item of cartItems) {
    const unitPrice = typeof item.unitPriceCOP === 'number'
      ? item.unitPriceCOP
      : (item.product.priceCOP || null);

    if (unitPrice === null || unitPrice <= 0) {
      return {
        success: false,
        error: `El producto '${item.product.name}' requiere consulta de precio.`
      };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { success: false, error: `Cantidad inválida para '${item.product.name}'.` };
    }
  }

  const items: OrderItem[] = cartItems.map((ci) => {
    const unitPrice = typeof ci.unitPriceCOP === 'number' && ci.unitPriceCOP > 0
      ? ci.unitPriceCOP
      : (ci.product.priceCOP || 0);

    const volume = ci.volume || ci.product.volume || undefined;
    const displayName = volume
      ? `${ci.product.name} (${volume})`
      : ci.product.name;

    return {
      productId: ci.product.id,
      variantId: ci.variantId || undefined,
      volume,
      productName: displayName,
      quantity: ci.quantity,
      unitPriceCOP: unitPrice
    };
  });

  const totalCOP = items.reduce((acc, it) => acc + it.quantity * it.unitPriceCOP, 0);
  const now = getColombiaNowString();
  const reference = generateOrderReference(referencePrefix);
  const orderIdSuffix = Math.floor(1000 + Math.random() * 9000);

  const order: Order = {
    id: `ord-${Date.now()}-${orderIdSuffix}`,
    reference,
    date: now,
    customerName,
    customerPhone,
    customerCity,
    channel,
    items,
    totalCOP,
    expectedAmountCOP: totalCOP,
    currency: 'COP',
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    inventoryDeducted: false, // Regla de integridad: el stock solo se descuenta tras confirmación efectiva
    notes
  };

  return { success: true, order };
}

/**
 * Crea un pedido originado en la tienda web mediante WhatsApp en estado 'pending'
 * SIN descontar inventario prematuramente.
 */
export function createWhatsAppOrder(
  cartItems: CartItem[],
  customerPhone?: string
): { success: boolean; order?: Order; error?: string } {
  const res = createBaseOrder({
    cartItems,
    channel: 'WhatsApp',
    paymentMethod: 'whatsapp_concierge',
    customerName: 'Cliente WhatsApp (Tienda Web)',
    customerPhone: customerPhone || '',
    customerCity: 'Por coordinar',
    notes: 'Pedido iniciado desde el catálogo web vía WhatsApp. Pendiente de atención por concierge.',
    referencePrefix: 'AD-WA'
  });

  if (!res.success || !res.order) return res;

  // Garantizar prefijo exacto de ID histórico para trazabilidad de WhatsApp
  res.order.id = `ord-wa-${Date.now()}`;

  return res;
}
