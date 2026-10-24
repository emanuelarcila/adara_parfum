// ============================================================================
// SECCIÓN 1: IMPORTACIONES Y DEPENDENCIAS
// ============================================================================

import { Product, Order, OrderItem, OrderStatus, PaymentStatus, ProductVariantItem } from './index';

// ============================================================================
// SECCIÓN 2: MODELOS DE DOCUMENTO PARA CLOUD FIRESTORE
// ============================================================================

/**
 * Esquema de datos para el documento de una fragancia en la colección `/products` de Cloud Firestore.
 *
 * @remarks
 * Diseñado a partir del Catálogo Maestro oficial de ADARA PARFUM.
 *
 * Principio rector:
 * Los campos ontológicos (código, marca, acordes, notas olfativas) provienen del Excel.
 * Los campos comerciales (precios en COP, existencias físicas, imágenes verificadas)
 * admiten valores nulos (`null`) y deben parametrizarse en taller antes de la venta pública.
 */
export interface FirestoreProductDocument {
  // 1. Campos verificados del Catálogo Maestro (Excel DB_Perfumes - 80 registros)
  /** Identificador único del documento en Firestore (ej. `'adh-120-afn'`). */
  id: string;
  /** Código numérico interno de la fórmula (ej. `'120'`). */
  code: string;
  /** SKU comercial estandarizado (ej. `'ADH-120-AFN'`). */
  sku: string;
  /** Nombre comercial oficial de la fragancia en ADARA (ej. `'9 PM Pour Femme'`). */
  name: string;
  /** Nombre extendido de catálogo con casa y perfil (ej. `'9 PM Pour femme Afnan - Woman'`). */
  catalogName: string;
  /** Casa perfumista creadora o marca de inspiración (ej. `'Afnan'`). */
  brand: string;
  /** Segmentación de género olfativo. */
  gender: 'Femenino' | 'Masculino' | 'Unisex' | string;
  /** Familia olfativa oficial asignada en el Catálogo Maestro. */
  family: string;
  /** Arreglo estructurado de acordes principales de la fragancia. */
  accords: string[];
  /** Acorde primario. */
  accord1?: string;
  /** Acorde secundario. */
  accord2?: string;
  /** Acorde terciario. */
  accord3?: string;
  /** Notas aromáticas de salida (primer impacto olfativo). */
  notesTop: string[];
  /** Notas aromáticas de corazón (cuerpo y evolución). */
  notesHeart: string[];
  /** Notas aromáticas de fondo (fijación y estela). */
  notesBase: string[];
  /** Clima o estación sugerida para su uso (ej. `'Noches frescas'`, `'Primavera/Verano'`). */
  weather?: string;
  /** Ocasión de uso recomendada (ej. `'Gala / Noche'`, `'Uso diario'`). */
  occasion?: string;
  /** Perfil o carácter olfativo (ej. `'Seductor'`, `'Elegante'`, `'Fresco'`). */
  profile?: string;
  /** Slug amigable para URLs y optimización SEO (ej. `'9-pm-pour-femme-afnan'`). */
  slug: string;
  /** Estado de disponibilidad: active (público), draft (borrador), paused (pausado), sold-out (agotado). */
  status: 'active' | 'draft' | 'paused' | 'sold-out';
  /** Indicador de si el perfume aparece en la selección destacada de portada. */
  featured: boolean;

  // 2. Campos comerciales y operativos
  /** Precio en COP del producto simple. `null` si no ha sido fijado o si se delega a variantes. */
  priceCOP: number | null;
  /** Existencias en taller. 0 por defecto hasta verificación física de inventario. */
  stock: number;
  /** Umbral de existencias para activación de alerta de escasez (por defecto 3). */
  threshold?: number;
  /** Volumen visible para presentación única (ej. `'100 ml'`). */
  volume?: string | null;
  /** Desglose de variantes independientes por presentación volumétrica (30ml, 50ml, 100ml). */
  variants?: ProductVariantItem[];
  /** Redacción editorial de mercadeo y notas de cata. */
  description?: string | null;
  /** Ruta o URL a la imagen fotográfica oficial verificada del perfume. */
  image?: string | null;
  /** Calificación de intensidad y fijación (escala 1 a 5). */
  intensity?: number | null;

  // 3. Auditoría del sistema
  /** Fecha y hora ISO de creación del registro. */
  createdAt?: string;
  /** Fecha y hora ISO de la última actualización. */
  updatedAt?: string;
  /** UID de Firebase Authentication del administrador que ejecutó la última modificación. */
  updatedBy?: string;
}

/**
 * Registro inmutable de auditoría para cada movimiento de inventario en `/inventory_movements`.
 *
 * @remarks
 * Colección con regla de seguridad `append-only` (`allow update, delete: if false`).
 * Preserva la trazabilidad fiscal y contable de cada frasco que ingresa o egresa del taller.
 */
export interface InventoryMovement {
  /** Identificador único del movimiento de auditoría. */
  id: string;
  /** ID de la fragancia afectada. */
  productId: string;
  /** Nombre del perfume al momento del ajuste. */
  productName: string;
  /** Existencias previas antes de aplicar el delta. */
  previousStock: number;
  /** Unidades añadidas (positivo) o restadas (negativo). */
  delta: number;
  /** Nuevo balance resultante tras el movimiento. */
  newStock: number;
  /** Motivo u origen del movimiento (ej. "Venta manual", "Reabastecimiento taller", "Cancelación pedido"). */
  reason: string;
  /** UID del usuario autenticado que autorizó y ejecutó el movimiento. */
  adminUid: string;
  /** Marca de tiempo ISO del ajuste. */
  timestamp: string;
}

// ============================================================================
// SECCIÓN 3: VALIDACIONES DE ESTRUCTURA Y DOMINIO
// ============================================================================

/**
 * Valida si un objeto producto posee un precio positivo válido en COP.
 *
 * @param p - Documento o fragmento de producto.
 * @returns `true` si el precio es un número mayor que 0.
 */
export function isPricedProduct(p: { priceCOP?: number | null } | null | undefined): boolean {
  if (!p) return false;
  return typeof p.priceCOP === 'number' && !isNaN(p.priceCOP) && p.priceCOP > 0;
}

/**
 * Evalúa si una fragancia cumple las reglas comerciales de compra directa para visitantes.
 *
 * @param p - Documento o fragmento de producto.
 * @returns `true` si está activo, tiene precio mayor a cero y existencias disponibles.
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
 * Valida la integridad estructural de los datos de un producto antes de guardarlo en Firestore.
 *
 * @remarks
 * Coincide con las validaciones de tipos y rangos de la regla `isValidProduct(data)` en `firestore.rules`.
 *
 * @param p - Datos parciales o completos del producto a evaluar.
 * @returns Objeto indicando si la estructura es válida y la lista de mensajes de error si los hubiere.
 */
export function validateProductData(p: Partial<FirestoreProductDocument>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!p.name || p.name.trim().length === 0) {
    errors.push('El nombre comercial es obligatorio.');
  }
  if (!p.brand || p.brand.trim().length === 0) {
    errors.push('La marca o casa perfumista es obligatoria.');
  }
  if (p.priceCOP !== undefined && p.priceCOP !== null) {
    if (typeof p.priceCOP !== 'number' || isNaN(p.priceCOP) || p.priceCOP <= 0) {
      errors.push('El precio en COP debe ser un número positivo si está definido.');
    }
  }
  if (p.stock !== undefined && (typeof p.stock !== 'number' || p.stock < 0 || !Number.isInteger(p.stock))) {
    errors.push('El stock debe ser un número entero mayor o igual a cero.');
  }
  if (p.status && !['active', 'draft', 'paused', 'sold-out'].includes(p.status)) {
    errors.push('El estado debe ser: active, draft, paused o sold-out.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================================================
// SECCIÓN 4: MODELOS DE ENTRADA PARA VERIFICACIÓN DE PEDIDOS
// ============================================================================

/** Ítem recibido desde el cliente para verificación previa a la orden. */
export interface OrderValidationInputItem {
  productId: string;
  variantId?: string;
  quantity: number;
  /** Precio remitido por el cliente; permite auditar intentos de manipulación (*tampering*). */
  unitPriceCOP?: number | null;
}

/** Esquema mínimo de producto en catálogo requerido para validar pedidos. */
export interface OrderValidationCatalogItem {
  id: string;
  name: string;
  volume?: string | null;
  priceCOP?: number | null;
  stock?: number;
  status?: string;
  variants?: ProductVariantItem[];
}

// ============================================================================
// SECCIÓN 5: LIQUIDACIÓN Y AUDITORÍA DE TOTALES DE PEDIDOS
// ============================================================================

/**
 * Valida de forma rigurosa las líneas de un pedido contra el catálogo autoritativo y calcula su total en COP.
 *
 * @remarks
 * Principios de seguridad aplicados:
 * 1. Verifica existencia física del producto y estado `'active'`.
 * 2. Si el producto maneja variantes, exige un `variantId` válido, activo y con precio fijado.
 * 3. Valida que la cantidad solicitada sea un entero positivo y no exceda las existencias en taller.
 * 4. Si el cliente envía un precio unitario (`unitPriceCOP`), verifica que coincida exactamente con el precio oficial.
 *    Cualquier discrepancia se clasifica como intento de manipulación y anula la orden.
 *
 * @param items - Arreglo de líneas solicitadas por el comprador.
 * @param catalog - Lista de productos autoritativos contra los cuales cotejar.
 * @returns Objeto con el total liquidado, validez de la orden, líneas normalizadas y desglose de errores.
 */
export function calculateVerifiedOrderTotal(
  items: OrderValidationInputItem[],
  catalog: OrderValidationCatalogItem[]
): { totalCOP: number; isValid: boolean; verifiedItems: OrderItem[]; errors: string[] } {
  const errors: string[] = [];
  const verifiedItems: OrderItem[] = [];
  let totalCOP = 0;

  if (!items || items.length === 0) {
    errors.push('El pedido debe incluir al menos un producto.');
    return { totalCOP: 0, isValid: false, verifiedItems: [], errors };
  }

  for (const item of items) {
    const product = catalog.find((p) => p.id === item.productId);
    if (!product) {
      errors.push(`El producto con ID '${item.productId}' no existe en el catálogo oficial.`);
      continue;
    }
    if (product.status && product.status !== 'active') {
      errors.push(`El producto '${product.name}' no está disponible para la venta.`);
      continue;
    }
    if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push(`Cantidad inválida para '${product.name}'. Debe ser un número entero positivo.`);
      continue;
    }

    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

    if (hasVariants) {
      if (!item.variantId) {
        errors.push(`Debe especificar una variante válida para el producto multi-presentación '${product.name}'.`);
        continue;
      }

      const variant = product.variants!.find((v) => v.id === item.variantId);
      if (!variant) {
        errors.push(`La variante con ID '${item.variantId}' no existe para el producto '${product.name}'.`);
        continue;
      }
      if (variant.status !== 'active') {
        errors.push(`La variante '${variant.volume || variant.id}' de '${product.name}' no está disponible para la venta.`);
        continue;
      }
      if (typeof variant.priceCOP !== 'number' || isNaN(variant.priceCOP) || variant.priceCOP <= 0) {
        errors.push(`La variante '${variant.volume || variant.id}' de '${product.name}' no tiene un precio válido fijado.`);
        continue;
      }
      if (typeof variant.stock === 'number' && item.quantity > variant.stock) {
        errors.push(`Stock insuficiente para '${product.name} (${variant.volume || variant.id})'. Disponibles: ${variant.stock}, solicitados: ${item.quantity}.`);
        continue;
      }
      if (item.unitPriceCOP !== undefined && item.unitPriceCOP !== null && item.unitPriceCOP !== variant.priceCOP) {
        errors.push(`Precio manipulado o inconsistente para '${product.name} (${variant.volume || variant.id})'. Declarado: ${item.unitPriceCOP}, Oficial: ${variant.priceCOP}.`);
        continue;
      }

      const unitPrice = variant.priceCOP;
      const itemTotal = unitPrice * item.quantity;
      totalCOP += itemTotal;
      verifiedItems.push({
        productId: product.id,
        variantId: variant.id,
        volume: variant.volume,
        productName: `${product.name} (${variant.volume})`,
        quantity: item.quantity,
        unitPriceCOP: unitPrice
      });
    } else {
      if (item.variantId) {
        errors.push(`El producto '${product.name}' no maneja variantes, pero se especificó variantId '${item.variantId}'.`);
        continue;
      }
      if (typeof product.priceCOP !== 'number' || isNaN(product.priceCOP) || product.priceCOP <= 0) {
        errors.push(`El producto '${product.name}' no tiene precio fijado o no cuenta con inventario para venta.`);
        continue;
      }
      if (typeof product.stock === 'number' && item.quantity > product.stock) {
        errors.push(`Stock insuficiente para '${product.name}'. Disponibles: ${product.stock}, solicitados: ${item.quantity}.`);
        continue;
      }
      if (item.unitPriceCOP !== undefined && item.unitPriceCOP !== null && item.unitPriceCOP !== product.priceCOP) {
        errors.push(`Precio manipulado o inconsistente para '${product.name}'. Declarado: ${item.unitPriceCOP}, Oficial: ${product.priceCOP}.`);
        continue;
      }

      const unitPrice = product.priceCOP;
      const itemTotal = unitPrice * item.quantity;
      totalCOP += itemTotal;
      const displayName = product.volume ? `${product.name} (${product.volume})` : product.name;
      verifiedItems.push({
        productId: product.id,
        variantId: undefined,
        volume: product.volume || undefined,
        productName: displayName,
        quantity: item.quantity,
        unitPriceCOP: unitPrice
      });
    }
  }

  return {
    totalCOP: errors.length === 0 ? totalCOP : 0,
    isValid: errors.length === 0,
    verifiedItems: errors.length === 0 ? verifiedItems : [],
    errors
  };
}

// ============================================================================
// SECCIÓN 6: INTERFACES DE REPOSITORIO (PATRÓN REPOSITORY)
// ============================================================================

/** Contrato del repositorio de productos para persistencia en Cloud Firestore. */
export interface IProductRepository {
  getPublishedProducts(): Promise<FirestoreProductDocument[]>;
  getAllProducts(): Promise<FirestoreProductDocument[]>;
  getProductById(id: string): Promise<FirestoreProductDocument | null>;
  saveProduct(product: FirestoreProductDocument, adminUid: string): Promise<void>;
  toggleProductStatus(id: string, adminUid: string): Promise<void>;
  deleteProduct(id: string, adminUid: string): Promise<void>;
}

/** Contrato del repositorio de pedidos comerciales para Cloud Firestore. */
export interface IOrderRepository {
  getAllOrders(): Promise<Order[]>;
  createOrder(order: Omit<Order, 'id'>): Promise<string>;
  updateOrderStatus(orderId: string, status: OrderStatus, adminUid: string): Promise<void>;
  updatePaymentStatus(orderId: string, status: PaymentStatus, adminUid: string): Promise<void>;
}

/** Contrato del repositorio de inventario y trazabilidad para Cloud Firestore. */
export interface IInventoryRepository {
  adjustStock(productId: string, delta: number, reason: string, adminUid: string): Promise<void>;
  getInventoryLogs(productId?: string): Promise<InventoryMovement[]>;
}
