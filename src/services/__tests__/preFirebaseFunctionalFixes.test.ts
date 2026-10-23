/**
 * ADARA PARFUM — Pruebas de Integridad Pre-Firestore (Correcciones de Auditoría)
 *
 * Cobertura de las prioridades 2 a 6:
 * 1. Generación centralizada de referencias (generateOrderReference): año dinámico, prefijos y colisiones.
 * 2. Protección de inventario al ajustar stock: obligatoriedad de variantId en productos multi-variante.
 * 3. Sincronización exacta de stock consolidado tras ajuste de variante.
 * 4. Ajuste directo en productos sin variantes.
 * 5. Reconciliación de precios adulterados o desactualizados en el carrito (cartValidationService).
 * 6. Clamping de cantidades del carrito ante escasez de existencias en catálogo.
 * 7. Depuración de productos inactivos o eliminados en el carrito.
 * 8. Reconciliación segura de ítems legacy de carrito sin variantId.
 */

import { Product, CartItem, Order } from '../../types';
import {
  generateOrderReference,
  adjustManualStock,
  createBaseOrder,
  createWhatsAppOrder,
  getColombiaNowString
} from '../orderInventoryService';
import { reconcileCartWithCatalog } from '../cartValidationService';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`✅ PASÓ: ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ FALLÓ: ${message}`);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    testsPassed++;
    console.log(`✅ PASÓ: ${message}`);
  } else {
    testsFailed++;
    console.error(`❌ FALLÓ: ${message} (esperado: ${expectedStr}, obtenido: ${actualStr})`);
  }
}

// ============================================================================
// Catálogo de prueba para validaciones
// ============================================================================
const sampleCatalog: Product[] = [
  {
    id: 'prod-santal',
    name: 'Santal Blanc',
    brand: 'ADARA PARFUM',
    priceCOP: 540000,
    stock: 8,
    family: 'Amaderada Cálida',
    status: 'active',
    featured: true
  },
  {
    id: 'prod-cuir',
    name: 'Cuir Sauvage',
    brand: 'ADARA PARFUM',
    priceCOP: 520000,
    stock: 6,
    family: 'Cuero & Humo',
    status: 'active',
    featured: false,
    variants: [
      { id: 'var-cuir-30ml', volume: '30ml', priceCOP: 260000, stock: 4, status: 'active' },
      { id: 'var-cuir-100ml', volume: '100ml', priceCOP: 520000, stock: 2, status: 'active' }
    ]
  },
  {
    id: 'prod-inactive',
    name: 'Edición Descontinuada',
    brand: 'ADARA PARFUM',
    priceCOP: 700000,
    stock: 0,
    family: 'Floral Oscuro',
    status: 'paused',
    featured: false
  }
];

console.log('\n--- INICIO DE PRUEBAS: CORRECCIONES FUNCIONALES PRE-FIRESTORE ---');

// ── 1. Referencias Centralizadas y Dinámicas ───────────────────────────────
console.log('\n[Caso 1: Generación centralizada de referencias (generateOrderReference)]');
const refAD = generateOrderReference('AD');
const refWA = generateOrderReference('AD-WA');
const refMV = generateOrderReference('AD-MV');
const currentYear = getColombiaNowString().split('-')[0];

assert(refAD.startsWith(`AD-${currentYear}-`), `Referencia estándar incluye año dinámico ${currentYear}`);
assert(refWA.startsWith(`AD-WA-${currentYear}-`), 'Referencia WhatsApp respeta prefijo AD-WA y año dinámico');
assert(refMV.startsWith(`AD-MV-${currentYear}-`), 'Referencia Venta Manual respeta prefijo AD-MV y año dinámico');

// Prueba de colisión: generar 500 referencias y verificar unicidad
const generatedRefs = new Set<string>();
for (let i = 0; i < 500; i++) {
  generatedRefs.add(generateOrderReference('TEST'));
}
assertEquals(generatedRefs.size, 500, '500 referencias generadas consecutivamente no presentan colisiones');

// ── 2. Integridad de Inventario con Variantes en AdminInventory ─────────────
console.log('\n[Caso 2: Protección contra desincronización de variantes en adjustManualStock]');
// Intentar ajustar stock en producto con variantes SIN pasar variantId debe ser RECHAZADO
const resMissingVariant = adjustManualStock(sampleCatalog, 'prod-cuir', 2, 'Ajuste no calificado');
assert(!resMissingVariant.success, 'Rechaza ajuste en producto con variantes si no se especifica variantId');
assert(
  resMissingVariant.error?.includes('especificar la presentación') || false,
  'Mensaje de error orienta al administrador a seleccionar la presentación'
);

// Ajustar stock CON variantId especificado
const resValidVariantAdjust = adjustManualStock(sampleCatalog, 'prod-cuir', 3, 'Lote 30ml', 'admin-test', 'var-cuir-30ml');
assert(resValidVariantAdjust.success, 'Ajuste de variante específica es exitoso');
const updatedCuir = resValidVariantAdjust.updatedProducts.find((p) => p.id === 'prod-cuir')!;
const v30 = updatedCuir.variants?.find((v) => v.id === 'var-cuir-30ml');
const v100 = updatedCuir.variants?.find((v) => v.id === 'var-cuir-100ml');
assertEquals(v30?.stock, 7, 'Variante 30ml incrementó de 4 a 7 uds');
assertEquals(v100?.stock, 2, 'Variante 100ml permanece inalterada en 2 uds');
assertEquals(updatedCuir.stock, 9, 'Stock consolidado del producto padre se recalculó exactamente (7 + 2 = 9)');

// Ajustar producto estándar sin variantes
const resStandardAdjust = adjustManualStock(sampleCatalog, 'prod-santal', -2, 'Merma taller');
assert(resStandardAdjust.success, 'Ajuste de producto sin variantes es exitoso');
const updatedSantal = resStandardAdjust.updatedProducts.find((p) => p.id === 'prod-santal')!;
assertEquals(updatedSantal.stock, 6, 'Stock de Santal Blanc redujo de 8 a 6 uds');

// ── 3. Reconciliación y Validación del Carrito (cartValidationService) ───────
console.log('\n[Caso 3: Detección y corrección de manipulación de precios en el carrito]');
const tamperedCart: CartItem[] = [
  {
    // Precio adulterado intencionalmente en localStorage a 10.000 COP en vez de 540.000 COP
    product: sampleCatalog[0],
    unitPriceCOP: 10000,
    quantity: 2
  },
  {
    // Precio adulterado en variante a 50.000 COP en vez de 260.000 COP
    product: sampleCatalog[1],
    variantId: 'var-cuir-30ml',
    volume: '30ml',
    unitPriceCOP: 50000,
    quantity: 1
  }
];

const reconcilePriceRes = reconcileCartWithCatalog(tamperedCart, sampleCatalog);
assert(reconcilePriceRes.hasChanges, 'Detectó cambios y manipulaciones en el carrito');
assertEquals(reconcilePriceRes.validItems[0].unitPriceCOP, 540000, 'Precio de Santal Blanc corregido al valor oficial (540.000 COP)');
assertEquals(reconcilePriceRes.validItems[1].unitPriceCOP, 260000, 'Precio de Cuir Sauvage (30ml) corregido al valor oficial (260.000 COP)');
assertEquals(reconcilePriceRes.totalCOP, 540000 * 2 + 260000, 'Total liquidado coincide con precios autoritativos (1.340.000 COP)');

console.log('\n[Caso 4: Clamping de cantidad ante excedente de stock]');
const overstockCart: CartItem[] = [
  {
    product: sampleCatalog[0], // Stock es 8
    unitPriceCOP: 540000,
    quantity: 20 // Pide 20
  },
  {
    product: sampleCatalog[1],
    variantId: 'var-cuir-100ml', // Stock es 2
    volume: '100ml',
    unitPriceCOP: 520000,
    quantity: 5 // Pide 5
  }
];

const reconcileStockRes = reconcileCartWithCatalog(overstockCart, sampleCatalog);
assert(reconcileStockRes.hasChanges, 'Detectó exceso de cantidad sobre stock real');
assertEquals(reconcileStockRes.validItems[0].quantity, 8, 'Cantidad de Santal Blanc ajustada al stock máximo disponible (8)');
assertEquals(reconcileStockRes.validItems[1].quantity, 2, 'Cantidad de variante 100ml ajustada al stock máximo disponible (2)');

console.log('\n[Caso 5: Depuración de productos descontinuados o inactivos]');
const inactiveCart: CartItem[] = [
  {
    product: sampleCatalog[2], // Producto pausado / inactivo
    unitPriceCOP: 700000,
    quantity: 1
  },
  {
    product: { id: 'prod-deleted', name: 'Fragancia Fantasma', brand: 'ADARA', priceCOP: 100000, stock: 10, family: 'Cítrica Aromática', status: 'active', featured: false },
    unitPriceCOP: 100000,
    quantity: 1
  }
];

const reconcileInactiveRes = reconcileCartWithCatalog(inactiveCart, sampleCatalog);
assertEquals(reconcileInactiveRes.validItems.length, 0, 'Eliminó productos inexistentes o pausados del carrito');
assertEquals(reconcileInactiveRes.notices.length, 2, 'Generó 2 notificaciones explicando el retiro');

console.log('\n[Caso 6: Compatibilidad con carrito legacy sin variantId]');
const legacyCartItem: CartItem = {
  product: sampleCatalog[0],
  unitPriceCOP: null,
  quantity: 3
};
const reconcileLegacyRes = reconcileCartWithCatalog([legacyCartItem], sampleCatalog);
assertEquals(reconcileLegacyRes.validItems.length, 1, 'Procesó ítem legacy correctamente');
assertEquals(reconcileLegacyRes.validItems[0].unitPriceCOP, 540000, 'Asignó precio autoritativo al ítem legacy');
assertEquals(reconcileLegacyRes.validItems[0].quantity, 3, 'Conservó cantidad solicitada dentro del margen de stock');

// ── 4. Generación y Creación de Pedido con createBaseOrder ─────────────────
console.log('\n[Caso 7: createBaseOrder y createWhatsAppOrder con referencia centralizada]');
const baseOrderRes = createBaseOrder({
  cartItems: reconcilePriceRes.validItems,
  channel: 'Boutique Bogotá',
  paymentMethod: 'bancolombia_qr',
  referencePrefix: 'AD-BOUTIQUE'
});
assert(baseOrderRes.success, 'createBaseOrder exitoso');
assert(Boolean(baseOrderRes.order?.reference.startsWith(`AD-BOUTIQUE-${currentYear}-`)), 'Referencia de pedido incluye prefijo y año actual');
assertEquals(baseOrderRes.order?.inventoryDeducted, false, 'Inicia con inventoryDeducted: false');

const waRes = createWhatsAppOrder(reconcilePriceRes.validItems);
assert(waRes.success, 'createWhatsAppOrder exitoso');
assert(Boolean(waRes.order?.reference.startsWith(`AD-WA-${currentYear}-`)), 'createWhatsAppOrder genera referencia AD-WA con año dinámico');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${testsPassed + testsFailed}`);
console.log(`ÉXITO: ${testsPassed} superadas`);
console.log(`FALLOS: ${testsFailed}`);
console.log('============================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE CORRECCIONES FUNCIONALES PASARON CON ÉXITO.');
}
