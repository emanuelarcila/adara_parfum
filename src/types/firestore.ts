import { Product, Order, OrderItem, OrderStatus, PaymentStatus } from './index';

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

// Validación estricta de pedidos y cálculo del total a partir de precios confiables
export function calculateVerifiedOrderTotal(
  items: { productId: string; quantity: number }[],
  catalog: { id: string; name: string; priceCOP?: number | null; stock?: number; status?: string }[]
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
    if (!isPurchasableProduct(product)) {
      errors.push(`El producto '${product.name}' no tiene precio fijado o no cuenta con inventario para venta.`);
      continue;
    }
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      errors.push(`Cantidad inválida para '${product.name}'. Debe ser un número entero positivo.`);
      continue;
    }
    if (typeof product.stock === 'number' && item.quantity > product.stock) {
      errors.push(`Stock insuficiente para '${product.name}'. Disponibles: ${product.stock}, solicitados: ${item.quantity}.`);
      continue;
    }

    const unitPrice = product.priceCOP as number;
    const itemTotal = unitPrice * item.quantity;
    totalCOP += itemTotal;
    verifiedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPriceCOP: unitPrice
    });
  }

  return {
    totalCOP,
    isValid: errors.length === 0,
    verifiedItems,
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
