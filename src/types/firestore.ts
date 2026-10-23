import { Product, Order, OrderItem, OrderStatus, PaymentStatus, ProductVariantItem } from './index';

/**
 * ADARA PARFUM — Modelos y Tipos de Persistencia para Cloud Firestore
 *
 * Diseñados estrictamente a partir de los datos reales del Catálogo Maestro
 * (Catalogo_Maestro_Adhara_Parfum.xlsx) y de los requerimientos de seguridad.
 *
 * PRINCIPIO RECTOR:
 * No inventar datos, precios, existencias ni rutas de imágenes.
 * Los campos no provistos por el Excel se declaran explícitamente como opcionales/nulos
 * y requieren parametrización administrativa en el panel de control.
 */

// Documento Firestore para el Catálogo de Fragancias
export interface FirestoreProductDocument {
  // 1. Campos verificados del Catálogo Maestro (Excel DB_Perfumes - 80 registros)
  id: string;                                          // Identificador único (ej. 'adh-120-afn')
  code: string;                                        // Código numérico interno (ej. '120')
  sku: string;                                         // SKU comercial (ej. 'ADH-120-AFN')
  name: string;                                        // Nombre Comercial (ej. '9 PM Pour Femme')
  catalogName: string;                                 // Nombre Catálogo (ej. '9 PM Pour femme Afnan - Woman')
  brand: string;                                       // Casa perfumista (ej. 'Afnan')
  gender: 'Femenino' | 'Masculino' | 'Unisex' | string;
  family: string;                                      // Familia olfativa oficial del Excel
  accords: string[];                                   // Desglose de acordes principales
  accord1?: string;
  accord2?: string;
  accord3?: string;
  notesTop: string[];                                  // Notas de salida
  notesHeart: string[];                                // Notas de corazón
  notesBase: string[];                                 // Notas de fondo
  weather?: string;                                    // Clima / Estación sugerida
  occasion?: string;                                   // Ocasión de uso recomendada
  profile?: string;                                    // Perfil / Estilo olfativo
  slug: string;                                        // Slug web para URLs y SEO
  status: 'active' | 'draft' | 'paused' | 'sold-out';  // Mapeado de 'Activo' (TRUE -> active, FALSE -> draft)
  featured: boolean;                                   // Mapeado de 'Destacado'

  // 2. Campos comerciales y operativos (PENDIENTES: No existen en el Excel)
  priceCOP: number | null;                             // null = precio no fijado. No se inventa valor.
  stock: number;                                       // 0 por defecto hasta verificación física en taller.
  threshold?: number;                                  // Umbral de stock bajo (por defecto 3 si se define).
  volume?: string | null;                              // Presentación física (ej. '100 ml', '50 ml' o null si pendiente).
  variants?: ProductVariantItem[];                     // Desglose de variantes independientes (30ml, 50ml, 100ml)
  description?: string | null;                         // Redacción editorial de marketing (null si pendiente).
  image?: string | null;                               // Ruta de imagen verificada (null = sin imagen física asignada).
  intensity?: number | null;                           // Intensidad 1-5 (null si no calificada).

  // 3. Auditoría del sistema
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;                                  // UID del administrador que editó
}

// Registro inmutable de auditoría para movimientos de inventario
export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  previousStock: number;
  delta: number;
  newStock: number;
  reason: string;
  adminUid: string;
  timestamp: string;
}

// Criterio de validación de precio
export function isPricedProduct(p: { priceCOP?: number | null } | null | undefined): boolean {
  if (!p) return false;
  return typeof p.priceCOP === 'number' && !isNaN(p.priceCOP) && p.priceCOP > 0;
}

// Criterio de validación de compra para visitantes
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

// Validación estricta de estructura de productos para altas y ediciones
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

// Tipos de entrada para validación de pedidos contra catálogo oficial
export interface OrderValidationInputItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPriceCOP?: number | null; // Precio enviado por el cliente para auditoría de tampering
}

export interface OrderValidationCatalogItem {
  id: string;
  name: string;
  volume?: string | null;
  priceCOP?: number | null;
  stock?: number;
  status?: string;
  variants?: ProductVariantItem[];
}

// Validación estricta de pedidos y cálculo del total a partir de precios y existencias confiables
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

// Interfaces de Repositorio para desacoplar componentes de Firestore
export interface IProductRepository {
  getPublishedProducts(): Promise<FirestoreProductDocument[]>;
  getAllProducts(): Promise<FirestoreProductDocument[]>;
  getProductById(id: string): Promise<FirestoreProductDocument | null>;
  saveProduct(product: FirestoreProductDocument, adminUid: string): Promise<void>;
  toggleProductStatus(id: string, adminUid: string): Promise<void>;
  deleteProduct(id: string, adminUid: string): Promise<void>;
}

export interface IOrderRepository {
  getAllOrders(): Promise<Order[]>;
  createOrder(order: Omit<Order, 'id'>): Promise<string>;
  updateOrderStatus(orderId: string, status: OrderStatus, adminUid: string): Promise<void>;
  updatePaymentStatus(orderId: string, status: PaymentStatus, adminUid: string): Promise<void>;
}

export interface IInventoryRepository {
  adjustStock(productId: string, delta: number, reason: string, adminUid: string): Promise<void>;
  getInventoryLogs(productId?: string): Promise<InventoryMovement[]>;
}
