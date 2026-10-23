/**
 * ADARA PARFUM — Pruebas Unitarias de Validación Estricta de Pedidos
 *
 * Cobertura exhaustiva para `calculateVerifiedOrderTotal`:
 * 1. Productos sin variantes (cálculo exacto, stock y precio autoritativo).
 * 2. Variantes válidas (cálculo multidimensional por presentación 30ml / 100ml).
 * 3. Variantes inexistentes (variantId no encontrado, variantId omitido o variantId en producto plano).
 * 4. Cantidades inválidas (cero, números negativos, decimales y no numéricos).
 * 5. Stock insuficiente (en producto plano y en presentación específica).
 * 6. Precios manipulados (detección de tampering de precio en producto plano y variante).
 * 7. Casos adicionales de integridad (pedido vacío, producto inexistente, producto o variante inactiva).
 */

import {
  calculateVerifiedOrderTotal,
  OrderValidationInputItem,
  OrderValidationCatalogItem
} from '../../types/firestore';

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
// Catálogo de prueba para validación de pedidos
// ============================================================================
const testCatalog: OrderValidationCatalogItem[] = [
  // 1. Producto sin variantes (Plano)
  {
    id: 'prod-santal-blanc',
    name: 'Santal Blanc',
    volume: '100ml',
    priceCOP: 540000,
    stock: 5,
    status: 'active'
  },
  // 2. Producto con múltiples presentaciones independientes
  {
    id: 'prod-cuir-sauvage',
    name: 'Cuir Sauvage',
    status: 'active',
    variants: [
      {
        id: 'var-cuir-30ml',
        volume: '30ml',
        priceCOP: 260000,
        stock: 4,
        status: 'active'
      },
      {
        id: 'var-cuir-100ml',
        volume: '100ml',
        priceCOP: 520000,
        stock: 2,
        status: 'active'
      },
      {
        id: 'var-cuir-sample',
        volume: '5ml',
        priceCOP: 45000,
        stock: 0,
        status: 'sold-out'
      }
    ]
  },
  // 3. Producto inactivo / en borrador
  {
    id: 'prod-rose-noire',
    name: 'Rose Noire',
    priceCOP: 480000,
    stock: 10,
    status: 'draft'
  }
];

console.log('--- INICIO DE PRUEBAS: calculateVerifiedOrderTotal ---');

// ── 1. Productos sin variantes ──────────────────────────────────────────────
console.log('\n[Caso 1: Productos sin variantes válidos]');
const validSimpleOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: 2, unitPriceCOP: 540000 }
];
const simpleRes = calculateVerifiedOrderTotal(validSimpleOrder, testCatalog);

assert(simpleRes.isValid, 'Pedido de producto simple es válido');
assertEquals(simpleRes.errors.length, 0, 'No genera errores para producto simple válido');
assertEquals(simpleRes.totalCOP, 1080000, 'Total calculado exactamente (2 * 540.000 = 1.080.000 COP)');
assertEquals(simpleRes.verifiedItems.length, 1, 'Genera exactamente 1 ítem verificado');
assertEquals(simpleRes.verifiedItems[0].productId, 'prod-santal-blanc', 'ID de producto coincide');
assertEquals(simpleRes.verifiedItems[0].variantId, undefined, 'variantId es undefined en producto simple');
assertEquals(simpleRes.verifiedItems[0].quantity, 2, 'Cantidad autorizada es 2');
assertEquals(simpleRes.verifiedItems[0].unitPriceCOP, 540000, 'Precio unitario verificado es 540.000 COP');
assertEquals(simpleRes.verifiedItems[0].productName, 'Santal Blanc (100ml)', 'Nombre incluye presentación de catálogo');

// ── 2. Variantes válidas ───────────────────────────────────────────────────
console.log('\n[Caso 2: Variantes válidas con cálculo multidimensional]');
const validVariantOrder: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-30ml', quantity: 2, unitPriceCOP: 260000 },
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-100ml', quantity: 1, unitPriceCOP: 520000 }
];
const variantRes = calculateVerifiedOrderTotal(validVariantOrder, testCatalog);

assert(variantRes.isValid, 'Pedido con variantes es válido');
assertEquals(variantRes.errors.length, 0, 'No genera errores para variantes válidas');
// 2 * 260.000 + 1 * 520.000 = 520.000 + 520.000 = 1.040.000 COP
assertEquals(variantRes.totalCOP, 1040000, 'Total liquidado coincide con suma de variantes (1.040.000 COP)');
assertEquals(variantRes.verifiedItems.length, 2, 'Genera 2 ítems verificados');
assertEquals(variantRes.verifiedItems[0].variantId, 'var-cuir-30ml', 'Primer ítem conserva variantId de 30ml');
assertEquals(variantRes.verifiedItems[0].volume, '30ml', 'Primer ítem conserva volumen 30ml');
assertEquals(variantRes.verifiedItems[0].productName, 'Cuir Sauvage (30ml)', 'Nombre formateado con variante');
assertEquals(variantRes.verifiedItems[1].variantId, 'var-cuir-100ml', 'Segundo ítem conserva variantId de 100ml');
assertEquals(variantRes.verifiedItems[1].unitPriceCOP, 520000, 'Precio oficial de 100ml verificado');

// ── 3. Variantes inexistentes ──────────────────────────────────────────────
console.log('\n[Caso 3: Variantes inexistentes, omitidas o aplicadas a productos sin variantes]');
// Subcaso 3A: variantId no existe en el producto
const invalidVariantOrder: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-fantasma-50ml', quantity: 1 }
];
const invVariantRes = calculateVerifiedOrderTotal(invalidVariantOrder, testCatalog);
assert(!invVariantRes.isValid, 'Rechaza variante inexistente');
assert(invVariantRes.errors.some((e) => e.includes("no existe para el producto 'Cuir Sauvage'")), 'Error indica variante inexistente');
assertEquals(invVariantRes.totalCOP, 0, 'Total es 0 ante orden inválida');

// Subcaso 3B: producto tiene variantes pero el cliente omitió variantId
const omittedVariantOrder: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', quantity: 1 }
];
const omittedVariantRes = calculateVerifiedOrderTotal(omittedVariantOrder, testCatalog);
assert(!omittedVariantRes.isValid, 'Rechaza orden cuando se omite variantId en producto multi-presentación');
assert(omittedVariantRes.errors.some((e) => e.includes('Debe especificar una variante válida')), 'Error orienta a especificar variante');

// Subcaso 3C: producto plano pero el cliente envía variantId
const flatWithVariantOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', variantId: 'var-intrusa', quantity: 1 }
];
const flatWithVariantRes = calculateVerifiedOrderTotal(flatWithVariantOrder, testCatalog);
assert(!flatWithVariantRes.isValid, 'Rechaza variantId en producto que no maneja variantes');
assert(flatWithVariantRes.errors.some((e) => e.includes('no maneja variantes')), 'Error explica que el producto no maneja variantes');

// ── 4. Cantidades inválidas ────────────────────────────────────────────────
console.log('\n[Caso 4: Cantidades inválidas (cero, negativas, decimales, no numéricas)]');
const zeroQtyOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: 0 }
];
assert(!calculateVerifiedOrderTotal(zeroQtyOrder, testCatalog).isValid, 'Rechaza cantidad 0');

const negativeQtyOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: -3 }
];
assert(!calculateVerifiedOrderTotal(negativeQtyOrder, testCatalog).isValid, 'Rechaza cantidad negativa (-3)');

const decimalQtyOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: 1.5 }
];
const decimalRes = calculateVerifiedOrderTotal(decimalQtyOrder, testCatalog);
assert(!decimalRes.isValid, 'Rechaza cantidad decimal (1.5)');
assert(decimalRes.errors.some((e) => e.includes('Debe ser un número entero positivo')), 'Error exige número entero positivo');

const nanQtyOrder = [
  { productId: 'prod-santal-blanc', quantity: NaN }
] as unknown as OrderValidationInputItem[];
assert(!calculateVerifiedOrderTotal(nanQtyOrder, testCatalog).isValid, 'Rechaza cantidad NaN');

// ── 5. Stock insuficiente ──────────────────────────────────────────────────
console.log('\n[Caso 5: Stock insuficiente]');
// Subcaso 5A: Producto simple solicita 6 cuando hay 5
const simpleStockExceeded: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: 6 }
];
const simpleStockRes = calculateVerifiedOrderTotal(simpleStockExceeded, testCatalog);
assert(!simpleStockRes.isValid, 'Rechaza pedido que supera stock de producto simple');
assert(simpleStockRes.errors.some((e) => e.includes('Disponibles: 5, solicitados: 6')), 'Mensaje detalla existencias disponibles y solicitadas');

// Subcaso 5B: Variante 100ml solicita 3 cuando hay 2
const variantStockExceeded: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-100ml', quantity: 3 }
];
const variantStockRes = calculateVerifiedOrderTotal(variantStockExceeded, testCatalog);
assert(!variantStockRes.isValid, 'Rechaza pedido que supera stock de la variante');
assert(variantStockRes.errors.some((e) => e.includes('Disponibles: 2, solicitados: 3')), 'Mensaje detalla existencias de la variante específica');

// Subcaso 5C: Variante agotada / sold-out
const variantSoldOut: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-sample', quantity: 1 }
];
const soldOutRes = calculateVerifiedOrderTotal(variantSoldOut, testCatalog);
assert(!soldOutRes.isValid, 'Rechaza variante con status sold-out');

// ── 6. Precios manipulados (Tampering) ──────────────────────────────────────
console.log('\n[Caso 6: Precios manipulados o adulterados por el cliente]');
// Subcaso 6A: Tampering en producto sin variantes (oficial 540.000, envía 10.000)
const tamperedSimpleOrder: OrderValidationInputItem[] = [
  { productId: 'prod-santal-blanc', quantity: 1, unitPriceCOP: 10000 }
];
const tamperedSimpleRes = calculateVerifiedOrderTotal(tamperedSimpleOrder, testCatalog);
assert(!tamperedSimpleRes.isValid, 'Rechaza precio manipulado en producto simple');
assert(
  tamperedSimpleRes.errors.some((e) => e.includes('Precio manipulado') && e.includes('Declarado: 10000, Oficial: 540000')),
  'Mensaje documenta precio adulterado vs oficial'
);

// Subcaso 6B: Tampering en variante (oficial 260.000, envía 50.000)
const tamperedVariantOrder: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-30ml', quantity: 1, unitPriceCOP: 50000 }
];
const tamperedVariantRes = calculateVerifiedOrderTotal(tamperedVariantOrder, testCatalog);
assert(!tamperedVariantRes.isValid, 'Rechaza precio manipulado en variante');
assert(
  tamperedVariantRes.errors.some((e) => e.includes('Precio manipulado') && e.includes('Declarado: 50000, Oficial: 260000')),
  'Mensaje documenta precio adulterado en variante específica'
);

// Subcaso 6C: Cliente no envía precio (unitPriceCOP omitido o null) -> toma el oficial sin error
const noPriceProvidedOrder: OrderValidationInputItem[] = [
  { productId: 'prod-cuir-sauvage', variantId: 'var-cuir-30ml', quantity: 1 }
];
const noPriceRes = calculateVerifiedOrderTotal(noPriceProvidedOrder, testCatalog);
assert(noPriceRes.isValid, 'Acepta ítem sin precio previo y le asigna el oficial');
assertEquals(noPriceRes.totalCOP, 260000, 'Total liquidado con precio oficial del catálogo');
assertEquals(noPriceRes.verifiedItems[0].unitPriceCOP, 260000, 'Ítem verificado recibe precio oficial');

// ── 7. Casos de integridad adicionales ─────────────────────────────────────
console.log('\n[Caso 7: Casos límite de integridad]');
// Pedido vacío
const emptyRes = calculateVerifiedOrderTotal([], testCatalog);
assert(!emptyRes.isValid, 'Rechaza pedido vacío');
assert(emptyRes.errors.includes('El pedido debe incluir al menos un producto.'), 'Error de pedido vacío');

// Producto no registrado en el catálogo
const notFoundRes = calculateVerifiedOrderTotal([{ productId: 'prod-inexistente', quantity: 1 }], testCatalog);
assert(!notFoundRes.isValid, 'Rechaza producto inexistente');
assert(notFoundRes.errors.some((e) => e.includes("no existe en el catálogo oficial")), 'Error de producto no registrado');

// Producto inactivo o en borrador
const draftRes = calculateVerifiedOrderTotal([{ productId: 'prod-rose-noire', quantity: 1 }], testCatalog);
assert(!draftRes.isValid, 'Rechaza producto en borrador');
assert(draftRes.errors.some((e) => e.includes("no está disponible para la venta")), 'Error de producto inactivo');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${testsPassed + testsFailed}`);
console.log(`ÉXITO: ${testsPassed} superadas`);
console.log(`FALLOS: ${testsFailed}`);
console.log('============================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE VALIDACIÓN DE PEDIDOS PASARON CON ÉXITO.');
}
