// ============================================================================
// SECCIÓN 1: FAMILIAS OLFATIVAS Y PRESENTACIONES
// ============================================================================

/**
 * Familias olfativas oficiales de ADARA PARFUM.
 *
 * @remarks
 * Combina las familias primarias de la marca con las taxonomías importadas
 * del Catálogo Maestro. Admite extensiones de tipo string abierto `(string & {})`
 * para preservar compatibilidad con nuevas incorporaciones sin perder el autocompletado del IDE.
 */
export type OlfactiveFamily =
  | 'Amaderada'
  | 'Oriental & Ámbar'
  | 'Cuero & Humo'
  | 'Floral Oscuro'
  | 'Cítrico Noble'
  | 'Ámbar Amaderada'
  | 'Ámbar Vainilla'
  | 'Amaderada Aromática'
  | 'Ámbar Especiada'
  | 'Floral Frutal'
  | 'Chipre Frutal'
  | 'Ámbar Floral'
  | 'Aromática Frutal'
  | 'Aromática Acuática'
  | 'Amaderada Especiada'
  | 'Oriental Floral'
  | 'Floral Acuática'
  | 'Cítrica Aromática'
  | 'Aromática Fougère'
  | (string & {});

/**
 * Volúmenes y presentaciones físicas de fragancias disponibles comercialmente.
 *
 * @remarks
 * Las medidas estándar son 30 ml (formato viaje / decant oficial), 50 ml y 100 ml (frasco monolito).
 */
export type ProductVolume = '30ml' | '50ml' | '100ml' | (string & {});

// ============================================================================
// SECCIÓN 2: PRODUCTOS Y VARIANTES MULTI-PRESENTACIÓN
// ============================================================================

/**
 * Estructura de una variante física de producto por tamaño o presentación.
 *
 * @remarks
 * Permite que un mismo perfume gestione precios, existencias y umbrales de alerta
 * independientes para sus diferentes volúmenes sin desincronizar el catálogo general.
 */
export interface ProductVariantItem {
  /** Identificador único de la variante (ej. `'adh-120-30ml'`). */
  id: string;
  /** Presentación volumétrica de la variante. */
  volume: ProductVolume;
  /** SKU comercial opcional de la variante (ej. `'ADH-120-30ML'`). */
  sku?: string;
  /** Precio en pesos colombianos (COP). `null` si aún no ha sido fijado ("Bajo consulta"). */
  priceCOP: number | null;
  /** Unidades físicas disponibles en taller o almacén. */
  stock: number;
  /** Umbral para disparo de alertas de inventario bajo (por defecto 3). */
  threshold?: number;
  /** Estado de comercialización de la variante específica. */
  status: 'active' | 'paused' | 'sold-out';
}

/**
 * Entidad principal de Producto / Fragancia en el catálogo de ADARA PARFUM.
 */
export interface Product {
  /** Identificador único del producto en el catálogo (ej. `'adara-oud-royal'` o `'adh-120-afn'`). */
  id: string;
  /** Nombre comercial o distintivo de la fragancia. */
  name: string;
  /** Subtítulo o edición editorial (ej. `'Extracto de Perfume · Edición Monolito'`). */
  subtitle?: string | null;
  /** Casa perfumista creadora o marca de origen. */
  brand: string;
  /** Volumen visible para productos de presentación única (ej. `'100 ml'`). */
  volume?: string | null;
  /** Precio en COP del producto padre. `null` si delega su precio a variantes o si está bajo consulta. */
  priceCOP: number | null;
  /** Existencias físicas consolidadas. */
  stock: number;
  /** Umbral de alerta de escasez para inventario del producto base. */
  threshold?: number;
  /** Familia olfativa predominante. */
  family: OlfactiveFamily;
  /** Estado operativo de la fragancia. */
  status: 'active' | 'paused' | 'sold-out' | 'draft';
  /** Descripción olfativa y narrativa de marketing. */
  description?: string | null;
  /** Notas aromáticas de salida (primeros 15-30 minutos). */
  notesTop?: string[];
  /** Notas aromáticas de corazón (cuerpo de la fragancia, 2 a 4 horas). */
  notesHeart?: string[];
  /** Notas aromáticas de fondo (fijación prolongada, 6+ horas). */
  notesBase?: string[];
  /** Acordes principales que definen el perfil olfativo. */
  accords?: string[];
  /** Ruta o URL a la imagen oficial del frasco. */
  image?: string | null;
  /** Indicador de si el producto debe destacarse en portada y carruseles. */
  featured: boolean;
  /** Nivel de intensidad y estela (escala de 1 a 5). */
  intensity?: number | null;
  /** Desglose de variantes independientes por mililitros (Fase 2.4A). */
  variants?: ProductVariantItem[];
}

// ============================================================================
// SECCIÓN 3: VALIDACIONES DE PRECIO Y COMPRA DIRECTA
// ============================================================================

/**
 * Determina si un producto cuenta con un precio numérico positivo válido en COP.
 *
 * @param p - Objeto con campo opcional de precio.
 * @returns `true` si el precio es un número mayor que 0; de lo contrario `false`.
 */
export function isPricedProduct(p: { priceCOP?: number | null } | null | undefined): boolean {
  if (!p) return false;
  return typeof p.priceCOP === 'number' && !isNaN(p.priceCOP) && p.priceCOP > 0;
}

/**
 * Determina si un producto reúne las condiciones comerciales mínimas para compra en línea.
 *
 * @remarks
 * Requiere estado activo (`'active'`), precio definido mayor a cero y existencias mayores a cero.
 *
 * @param p - Fragancia a evaluar.
 * @returns `true` si el visitante puede añadirlo al carrito y liquidar; `false` si es bajo consulta o agotado.
 */
export function isPurchasableProduct(
  p: { status?: string; priceCOP?: number | null; stock?: number | null } | null | undefined
): boolean {
  if (!p) return false;
  return (
    p.status === 'active' &&
    typeof p.priceCOP === 'number' &&
    !isNaN(p.priceCOP) &&
    p.priceCOP > 0 &&
    typeof p.stock === 'number' &&
    !isNaN(p.stock) &&
    p.stock > 0
  );
}

/**
 * Valida si una variante específica cuenta con un precio positivo asignado en COP.
 *
 * @param v - Variante a evaluar.
 * @returns `true` si el precio es numérico y positivo.
 */
export function isPricedVariant(v: { priceCOP?: number | null } | null | undefined): boolean {
  if (!v) return false;
  return typeof v.priceCOP === 'number' && !isNaN(v.priceCOP) && v.priceCOP > 0;
}

/**
 * Determina si una variante cumple las condiciones para ser adquirida de inmediato.
 *
 * @param v - Variante de producto.
 * @returns `true` si está activa con precio y existencias positivas.
 */
export function isPurchasableVariant(
  v: { status?: string; priceCOP?: number | null; stock?: number | null } | null | undefined
): boolean {
  if (!v) return false;
  return (
    v.status === 'active' &&
    typeof v.priceCOP === 'number' &&
    !isNaN(v.priceCOP) &&
    v.priceCOP > 0 &&
    typeof v.stock === 'number' &&
    !isNaN(v.stock) &&
    v.stock > 0
  );
}

// ============================================================================
// SECCIÓN 4: MODELO DEL CARRITO DE COMPRAS
// ============================================================================

/**
 * Representa una línea individual dentro del carrito de compras.
 *
 * @remarks
 * Admite tanto productos simples como variantes de tamaño. Dos frascos del mismo
 * perfume con diferente mililitraje conforman dos `CartItem` independientes.
 */
export interface CartItem {
  /** Fragancia vinculada a la línea. */
  product: Product;
  /** Identificador de variante cuando la fragancia es multi-presentación (ej. `'adh-120-30ml'`). */
  variantId?: string;
  /** Volumen descriptivo de la presentación elegida (ej. `'30ml'`, `'50ml'`, `'100ml'`). */
  volume?: string;
  /** Precio unitario oficial en COP al momento de la selección. */
  unitPriceCOP?: number | null;
  /** Unidades solicitadas por el comprador. */
  quantity: number;
}

/**
 * Genera la clave compuesta única para identificar una línea del carrito.
 *
 * @remarks
 * Evita colisiones cuando un cliente agrega 30 ml y 100 ml del mismo perfume.
 *
 * @param productId - ID base de la fragancia.
 * @param variantId - ID opcional de la variante de mililitros.
 * @returns Cadena compuesta `'productId::variantId'` o `'productId'` si es producto simple.
 */
export function getCartItemKey(productId: string, variantId?: string): string {
  return variantId ? `${productId}::${variantId}` : productId;
}

// ============================================================================
// SECCIÓN 5: PEDIDOS, CANALES Y MEDIOS DE PAGO
// ============================================================================

/** Estados logísticos del ciclo de vida de un pedido. */
export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

/** Estados financieros de liquidación del pago. */
export type PaymentStatus = 'paid' | 'pending' | 'on_delivery';

/** Canales de adquisición y venta de la marca. */
export type SalesChannel = 'Tienda Web' | 'WhatsApp' | 'Boutique Bogotá' | 'Distribuidor';

/** Métodos de pago y financiación contemplados en el ecosistema comercial de Colombia. */
export type PaymentMethod =
  | 'whatsapp_concierge'   // Canal actual asistido por WhatsApp
  | 'wompi'                // Pasarela en línea (PSE, tarjetas, Bancolombia)
  | 'addi'                 // Financiación compre ahora, pague después (BNPL)
  | 'sistecredito'         // Financiación retail colombiana
  | 'contra_entrega'       // Pago contra entrega al recibir el paquete
  | 'transferencia'        // Transferencia manual (Nequi, Bancolombia)
  | 'efectivo_boutique'    // Efectivo en tienda física
  | (string & {});

/**
 * Línea de detalle de un pedido cerrado o en proceso.
 */
export interface OrderItem {
  /** ID del producto adquirido. */
  productId: string;
  /** ID de presentación de tamaño si aplica. */
  variantId?: string;
  /** Volumen o presentación formalizada. */
  volume?: string;
  /** Nombre comercial descriptivo con variante incluida (ej. `'Oud Royal (30ml)'`). */
  productName: string;
  /** Cantidad de frascos comprados. */
  quantity: number;
  /** Precio unitario oficial liquidado en COP. */
  unitPriceCOP: number;
}

/**
 * Entidad de Pedido comercial en ADARA PARFUM.
 */
export interface Order {
  /** Identificador único del pedido (ej. `'ord-001'`). */
  id: string;
  /** Referencia legible para el cliente y logística (ej. `'AD-WA-2026-085'`). */
  reference: string;
  /** Fecha y hora de creación (formato 'YYYY-MM-DD HH:mm'). */
  date: string;
  /** Nombre completo del comprador o cliente boutique. */
  customerName: string;
  /** Teléfono o WhatsApp de contacto. */
  customerPhone: string;
  /** Ciudad y departamento de entrega. */
  customerCity: string;
  /** Canal por el cual ingresó el pedido. */
  channel: SalesChannel;
  /** Detalle de fragancias y unidades adquiridas. */
  items: OrderItem[];
  /** Importe total liquidado en pesos colombianos. */
  totalCOP: number;
  /** Estado de cobranza del pedido. */
  paymentStatus: PaymentStatus;
  /** Estado logístico del pedido. */
  orderStatus: OrderStatus;
  /** Notas operativas, preferencias de empaque o instrucciones de entrega. */
  notes?: string;
  /** Indicador de trazabilidad: `true` si el stock ya fue descontado del inventario. */
  inventoryDeducted?: boolean;

  // Preparación arquitectónica Fase 2.5: Medios de Pago y Financiación
  /** Método de pago seleccionado por el cliente o cajero. */
  paymentMethod?: PaymentMethod;
  /** Identificador asignado por la pasarela o procesador de pagos. */
  transactionId?: string;
  /** Importe esperado liquidado para verificación de integridad criptográfica. */
  expectedAmountCOP?: number;
  /** Moneda oficial de liquidación (estrictamente COP). */
  currency?: 'COP';
  /** Fecha y hora de confirmación verificada del pago. */
  paidAt?: string;
  /** Metadatos de auditoría no sensibles devueltos por el proveedor de pago. */
  paymentProviderData?: Record<string, unknown>;
}

// ============================================================================
// SECCIÓN 6: RANGOS DE FECHA Y VENTAS MANUALES
// ============================================================================

/** Intervalos de tiempo para agregación analítica de métricas. */
export type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/** Ítem simplificado para selección de productos en el formulario de venta manual. */
export interface ManualSaleItem {
  productId: string;
  quantity: number;
}
