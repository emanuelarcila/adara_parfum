// ============================================================================
// SECCIÓN 1: IMPORTACIONES Y DEPENDENCIAS
// ============================================================================

import { Product, CartItem, ProductVariantItem } from '../types';

// ============================================================================
// SECCIÓN 2: TIPOS Y NOTIFICACIONES DE VALIDACIÓN
// ============================================================================

/**
 * Notificación emitida cuando se detecta una discrepancia entre el estado local
 * del carrito y la verdad autoritativa del catálogo de productos.
 *
 * @remarks
 * Los avisos permiten retroalimentar al usuario de forma transparente cuando un precio
 * se corrige, un stock se acota al límite físico disponible o un ítem inactivo se remueve.
 */
export interface CartValidationNotice {
  /** ID del producto que presentó la discrepancia. */
  productId: string;
  /** ID de la presentación o variante si aplica. */
  variantId?: string;
  /** Nombre visible del producto para el mensaje al comprador. */
  productName: string;
  /** Categoría técnica de la inconsistencia detectada. */
  type: 'price_corrected' | 'quantity_clamped' | 'item_removed' | 'variant_missing';
  /** Mensaje explicativo legible para interfaz de usuario. */
  message: string;
  /** Valor numérico anterior en el carrito (precio o cantidad). */
  previousValue?: number;
  /** Valor numérico oficial corregido y autorizado. */
  newValue?: number;
}

/**
 * Resultado estructurado de la reconciliación del carrito contra el catálogo.
 */
export interface CartValidationResult {
  /** Lista depurada de ítems con precios y existencias autorizadas. */
  validItems: CartItem[];
  /** Avisos de ajustes o correcciones realizadas durante el cotejo. */
  notices: CartValidationNotice[];
  /** `true` si se aplicó al menos una corrección sobre los ítems del carrito. */
  hasChanges: boolean;
  /** Subtotal consolidado en COP de las líneas válidas. */
  totalCOP: number;
}

// ============================================================================
// SECCIÓN 3: RECONCILIACIÓN Y AUDITORÍA ANTI-MANIPULACIÓN
// ============================================================================

/**
 * NOTA DE SEGURIDAD ARQUITECTÓNICA (FASE PRE-FIRESTORE):
 *
 * Esta validación y reconciliación en el cliente garantiza que la interfaz de usuario,
 * el carrito persistido en localStorage y los resúmenes de checkout reflejen siempre
 * los precios, existencias y variantes autoritativas del catálogo actual, neutralizando
 * manipulaciones locales accidentales o intencionales (ej. tampering de localStorage).
 *
 * ADVERTENCIA CRÍTICA:
 * En una aplicación web comercial, ninguna validación ejecutada exclusivamente en el navegador
 * se considera prueba definitiva contra fraude. Cuando ADARA PARFUM active la persistencia en
 * Firebase Firestore y pasarelas de pago (Addi, Sistecrédito, Wompi, etc.), esta misma lógica
 * DEBE ejecutarse en el backend (Cloud Functions / Transacciones de Firestore) para verificar
 * los precios y existencias en la base de datos antes de autorizar cualquier transacción o pedido.
 */

/**
 * Valida y reconcilia un arreglo de ítems del carrito contra el catálogo autoritativo de productos.
 *
 * @remarks
 * Reglas de integridad aplicadas:
 * 1. Si el producto ya no existe en el catálogo o no está activo (`'active'`), se remueve de la bolsa.
 * 2. Si el ítem tiene variante (`variantId`):
 *    - Se verifica que la variante exista y no esté descontinuada.
 *    - Se toma el precio real de la variante como fuente de verdad (`variant.priceCOP`).
 *    - Si el precio local difería, se actualiza al precio autoritativo.
 *    - Se valida el stock disponible de la variante; si la cantidad supera el stock, se ajusta al máximo posible.
 * 3. Si el ítem no tiene variante:
 *    - Se toma el precio real del producto (`product.priceCOP`).
 *    - Si el precio local difería, se actualiza al precio autoritativo.
 *    - Se valida el stock del producto principal.
 * 4. La cantidad se normaliza como entero positivo (mínimo 1).
 *
 * @param cartItems - Ítems persistidos o en memoria del carrito del usuario.
 * @param catalog - Lista de productos autoritativos oficiales del catálogo.
 * @returns Objeto {@link CartValidationResult} con ítems válidos, avisos y total recalculado.
 */
export function reconcileCartWithCatalog(
  cartItems: CartItem[],
  catalog: Product[]
): CartValidationResult {
  const validItems: CartItem[] = [];
  const notices: CartValidationNotice[] = [];
  let hasChanges = false;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { validItems: [], notices: [], hasChanges: false, totalCOP: 0 };
  }

  for (const item of cartItems) {
    if (!item || !item.product || !item.product.id) {
      hasChanges = true;
      continue;
    }

    // 1. Buscar producto en catálogo autoritativo
    const authoritativeProduct = catalog.find((p) => p.id === item.product.id);
    if (!authoritativeProduct || authoritativeProduct.status !== 'active') {
      hasChanges = true;
      notices.push({
        productId: item.product.id,
        variantId: item.variantId,
        productName: item.product.name || 'Fragancia',
        type: 'item_removed',
        message: `'${item.product.name}' ya no está disponible en el catálogo activo y se removió de la bolsa.`
      });
      continue;
    }

    // Cantidad normalizada como entero >= 1
    const rawQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? Math.floor(item.quantity) : 1;
    let effectiveQty = Math.max(1, rawQty);
    if (effectiveQty !== item.quantity) {
      hasChanges = true;
    }

    // 2. Manejo de variantes multi-presentación (30ml, 50ml, 100ml)
    if (item.variantId && Array.isArray(authoritativeProduct.variants) && authoritativeProduct.variants.length > 0) {
      const authoritativeVariant = authoritativeProduct.variants.find((v) => v.id === item.variantId);

      if (!authoritativeVariant || authoritativeVariant.status === 'paused') {
        hasChanges = true;
        notices.push({
          productId: authoritativeProduct.id,
          variantId: item.variantId,
          productName: authoritativeProduct.name,
          type: 'variant_missing',
          message: `La presentación seleccionada de '${authoritativeProduct.name}' ya no está disponible.`
        });
        continue;
      }

      // Validar precio autoritativo de la variante
      const expectedPrice = typeof authoritativeVariant.priceCOP === 'number' && authoritativeVariant.priceCOP > 0
        ? authoritativeVariant.priceCOP
        : null;

      if (expectedPrice !== null && item.unitPriceCOP !== expectedPrice) {
        hasChanges = true;
        notices.push({
          productId: authoritativeProduct.id,
          variantId: authoritativeVariant.id,
          productName: `${authoritativeProduct.name} (${authoritativeVariant.volume})`,
          type: 'price_corrected',
          message: `El precio de '${authoritativeProduct.name} (${authoritativeVariant.volume})' se actualizó al valor oficial del catálogo.`,
          previousValue: item.unitPriceCOP ?? undefined,
          newValue: expectedPrice
        });
      }

      // Validar stock disponible de la variante
      const maxVariantStock = typeof authoritativeVariant.stock === 'number' ? authoritativeVariant.stock : 0;
      if (maxVariantStock > 0 && effectiveQty > maxVariantStock) {
        hasChanges = true;
        notices.push({
          productId: authoritativeProduct.id,
          variantId: authoritativeVariant.id,
          productName: `${authoritativeProduct.name} (${authoritativeVariant.volume})`,
          type: 'quantity_clamped',
          message: `La cantidad solicitada de '${authoritativeProduct.name} (${authoritativeVariant.volume})' superaba las ${maxVariantStock} uds disponibles y fue ajustada.`,
          previousValue: effectiveQty,
          newValue: maxVariantStock
        });
        effectiveQty = maxVariantStock;
      }

      validItems.push({
        product: authoritativeProduct,
        variantId: authoritativeVariant.id,
        volume: authoritativeVariant.volume || item.volume,
        unitPriceCOP: expectedPrice,
        quantity: effectiveQty
      });
    } else {
      // 3. Manejo estándar de producto sin variantes
      const expectedPrice = typeof authoritativeProduct.priceCOP === 'number' && authoritativeProduct.priceCOP > 0
        ? authoritativeProduct.priceCOP
        : null;

      if (expectedPrice !== null && item.unitPriceCOP !== expectedPrice) {
        hasChanges = true;
        notices.push({
          productId: authoritativeProduct.id,
          productName: authoritativeProduct.name,
          type: 'price_corrected',
          message: `El precio de '${authoritativeProduct.name}' se actualizó al valor oficial del catálogo.`,
          previousValue: item.unitPriceCOP ?? undefined,
          newValue: expectedPrice
        });
      }

      const maxProductStock = typeof authoritativeProduct.stock === 'number' ? authoritativeProduct.stock : 0;
      if (maxProductStock > 0 && effectiveQty > maxProductStock) {
        hasChanges = true;
        notices.push({
          productId: authoritativeProduct.id,
          productName: authoritativeProduct.name,
          type: 'quantity_clamped',
          message: `La cantidad de '${authoritativeProduct.name}' se ajustó a las ${maxProductStock} unidades disponibles.`,
          previousValue: effectiveQty,
          newValue: maxProductStock
        });
        effectiveQty = maxProductStock;
      }

      validItems.push({
        product: authoritativeProduct,
        variantId: undefined,
        volume: authoritativeProduct.volume || item.volume || undefined,
        unitPriceCOP: expectedPrice,
        quantity: effectiveQty
      });
    }
  }

  // Recalcular subtotal consolidado sobre precios verificados
  const totalCOP = validItems.reduce((acc, it) => {
    const p = it.unitPriceCOP && it.unitPriceCOP > 0 ? it.unitPriceCOP : 0;
    return acc + p * it.quantity;
  }, 0);

  return {
    validItems,
    notices,
    hasChanges,
    totalCOP
  };
}
