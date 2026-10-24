/**
 * ADARA PARFUM — Suite de Pruebas Automatizadas de Resiliencia del Catálogo
 *
 * @remarks
 * Script ejecutable vía Node/tsx para validar de manera autónoma los contratos de resiliencia:
 * 1. Productos sin precio (`priceCOP: null`) y su etiqueta ("Bajo consulta").
 * 2. Criterios de compra directa (`isPurchasableProduct`).
 * 3. Tolerancia a campos opcionales nulos (`description: null`, notas ausentes).
 * 4. Algoritmos de ordenamiento deterministas con precios nulos al final.
 * 5. Familias olfativas dinámicas detectadas automáticamente.
 *
 * @module scripts/test-catalog-resilience
 */

import { Product, isPricedProduct, isPurchasableProduct } from '../src/types';
import { formatCOP, formatProductPrice } from '../src/data/mockData';

/**
 * Estructura de resultado de una aserción de prueba.
 */
interface TestResult {
  /** Nombre del escenario o caso de prueba. */
  name: string;
  /** Indicador booleano de superación de la aserción. */
  passed: boolean;
  /** Mensaje de contexto o diagnóstico. */
  details: string;
}

const results: TestResult[] = [];

/**
 * Función de aserción síncrona para la suite de pruebas del catálogo.
 *
 * @param name - Nombre descriptivo del escenario evaluado.
 * @param condition - Expresión lógica evaluada.
 * @param details - Explicación de la condición esperada.
 */
function assert(name: string, condition: boolean, details: string) {
  results.push({ name, passed: condition, details });
  const status = condition ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (!condition) {
    console.error(`   Detalle del fallo: ${details}`);
  }
}

console.log('================================================================');
console.log('ADARA PARFUM — EJECUCIÓN DE PRUEBAS AUTOMATIZADAS (FASE 2.1.2)');
console.log('================================================================\n');

// -----------------------------------------------------------------------
// ESCENARIO 1: Producto con precio válido
// -----------------------------------------------------------------------
const productPriced: Product = {
  id: 'test-priced',
  name: 'Oud Royal',
  brand: 'ADARA PARFUM',
  family: 'Oriental & Ámbar',
  priceCOP: 540000,
  stock: 8,
  status: 'active',
  featured: true
};

assert(
  'Escenario 1.1: isPricedProduct detecta precio positivo válido',
  isPricedProduct(productPriced) === true,
  `priceCOP=${productPriced.priceCOP} debe ser reconocido como válido.`
);

assert(
  'Escenario 1.2: isPurchasableProduct aprueba producto activo con precio y stock',
  isPurchasableProduct(productPriced) === true,
  'Producto con precio y stock > 0 debe ser comprable.'
);

assert(
  'Escenario 1.3: formatProductPrice formatea correctamente valor COP sin "Bajo consulta"',
  formatProductPrice(productPriced.priceCOP).includes('540') && !formatProductPrice(productPriced.priceCOP).includes('consulta'),
  `Salida: ${formatProductPrice(productPriced.priceCOP)}`
);

// -----------------------------------------------------------------------
// ESCENARIO 2: Producto con precio null
// -----------------------------------------------------------------------
const productUnpriced: Product = {
  id: 'test-unpriced',
  name: '9 PM Pour Femme',
  brand: 'Afnan',
  family: 'Ámbar Vainilla',
  priceCOP: null,
  stock: 12,
  status: 'active',
  featured: false
};

assert(
  'Escenario 2.1: isPricedProduct rechaza precio null',
  isPricedProduct(productUnpriced) === false,
  'priceCOP null no debe considerarse con precio fijado.'
);

assert(
  'Escenario 2.2: isPurchasableProduct deshabilita compra directa si precio es null',
  isPurchasableProduct(productUnpriced) === false,
  'Un producto sin precio no debe ser comprable ni admitir adición directa a bolsa.'
);

assert(
  'Escenario 2.3: formatProductPrice muestra exactamente "Bajo consulta" y no "$ 0"',
  formatProductPrice(productUnpriced.priceCOP) === 'Bajo consulta',
  `Salida real: "${formatProductPrice(productUnpriced.priceCOP)}"`
);

// -----------------------------------------------------------------------
// ESCENARIO 3: Producto con stock cero
// -----------------------------------------------------------------------
const productZeroStock: Product = {
  id: 'test-zero-stock',
  name: 'Rose Noire',
  brand: 'ADARA PARFUM',
  family: 'Floral Oscuro',
  priceCOP: 490000,
  stock: 0,
  status: 'active',
  featured: false
};

assert(
  'Escenario 3.1: isPurchasableProduct rechaza compra directa si stock es 0',
  isPurchasableProduct(productZeroStock) === false,
  'Stock cero debe impedir la compra aunque el precio sea válido.'
);

// -----------------------------------------------------------------------
// ESCENARIO 4: Descripción ausente (null / undefined)
// -----------------------------------------------------------------------
const productNoDesc: Product = {
  id: 'test-no-desc',
  name: 'Club de Nuit Intense',
  brand: 'Armaf',
  family: 'Chipre Frutal',
  priceCOP: 380000,
  stock: 5,
  status: 'active',
  featured: false,
  description: null
};

// Función de búsqueda resiliente de StoreCollection
function executeSafeSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  const nameMatch = (p.name || '').toLowerCase().includes(q);
  const brandMatch = (p.brand || '').toLowerCase().includes(q);
  const descMatch = (p.description || '').toLowerCase().includes(q);
  const familyMatch = (p.family || '').toLowerCase().includes(q);
  const notes = [
    ...(p.notesTop || []),
    ...(p.notesHeart || []),
    ...(p.notesBase || []),
    ...(p.accords || [])
  ];
  const notesMatch = notes.some((note) => (note || '').toLowerCase().includes(q));
  return nameMatch || brandMatch || descMatch || familyMatch || notesMatch;
}

let searchThrewError = false;
let searchMatched = false;
try {
  searchMatched = executeSafeSearch(productNoDesc, 'Armaf');
} catch (e) {
  searchThrewError = true;
}

assert(
  'Escenario 4.1: Búsqueda no lanza excepción con description=null',
  searchThrewError === false,
  'product.description nula no debe romper la aplicación.'
);

assert(
  'Escenario 4.2: Búsqueda encuentra por marca aun con descripción nula',
  searchMatched === true,
  'Debe localizar el producto mediante los otros atributos disponibles.'
);

// -----------------------------------------------------------------------
// ESCENARIO 5: Notas olfativas ausentes (null / undefined) con fallback a acordes
// -----------------------------------------------------------------------
const productNoNotes: Product = {
  id: 'test-no-notes',
  name: 'Amber Oud Gold',
  brand: 'Al Haramain',
  family: 'Ámbar Amaderada',
  priceCOP: 520000,
  stock: 4,
  status: 'active',
  featured: false,
  notesTop: undefined,
  notesHeart: undefined,
  notesBase: undefined,
  accords: ['Dulce', 'Afrutado', 'Ámbar']
};

let notesSearchThrewError = false;
let notesSearchMatched = false;
try {
  notesSearchMatched = executeSafeSearch(productNoNotes, 'Dulce');
} catch {
  notesSearchThrewError = true;
}

assert(
  'Escenario 5.1: Operación con notas ausentes no lanza excepción de iterabilidad',
  notesSearchThrewError === false,
  'notesTop undefined no debe causar TypeError al hacer spread.'
);

assert(
  'Escenario 5.2: Búsqueda por acordes funciona cuando notas olfativas están ausentes',
  notesSearchMatched === true,
  'Debe buscar en accords cuando notesTop/Heart/Base no estén definidas.'
);

// -----------------------------------------------------------------------
// ESCENARIO 6: Ordenamiento por precio con productos sin precio
// -----------------------------------------------------------------------
const mixedProducts: Product[] = [
  { id: '1', name: 'Zeta (Sin precio)', brand: 'B', family: 'F', priceCOP: null, stock: 5, status: 'active', featured: false },
  { id: '2', name: 'Perfume Caro', brand: 'B', family: 'F', priceCOP: 800000, stock: 5, status: 'active', featured: false },
  { id: '3', name: 'Alfa (Sin precio)', brand: 'B', family: 'F', priceCOP: null, stock: 5, status: 'active', featured: false },
  { id: '4', name: 'Perfume Económico', brand: 'B', family: 'F', priceCOP: 250000, stock: 5, status: 'active', featured: false },
  { id: '5', name: 'Perfume Medio', brand: 'B', family: 'F', priceCOP: 500000, stock: 5, status: 'active', featured: false }
];

function sortProductsByPrice(products: Product[], direction: 'asc' | 'desc'): Product[] {
  return [...products].sort((a, b) => {
    const priceA = a.priceCOP && a.priceCOP > 0 ? a.priceCOP : null;
    const priceB = b.priceCOP && b.priceCOP > 0 ? b.priceCOP : null;
    if (direction === 'asc') {
      if (priceA !== null && priceB !== null) return priceA - priceB;
      if (priceA !== null && priceB === null) return -1;
      if (priceA === null && priceB !== null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    } else {
      if (priceA !== null && priceB !== null) return priceB - priceA;
      if (priceA !== null && priceB === null) return -1;
      if (priceA === null && priceB !== null) return 1;
      return (a.name || '').localeCompare(b.name || '');
    }
  });
}

const sortedAsc = sortProductsByPrice(mixedProducts, 'asc');
const ascOrderValid =
  sortedAsc[0].priceCOP === 250000 &&
  sortedAsc[1].priceCOP === 500000 &&
  sortedAsc[2].priceCOP === 800000 &&
  sortedAsc[3].name === 'Alfa (Sin precio)' &&
  sortedAsc[4].name === 'Zeta (Sin precio)';

assert(
  'Escenario 6.1: Ordenamiento precio ascendente ubica productos con precio primero y sin precio al final ordenados por nombre',
  ascOrderValid,
  `Orden obtenido: ${sortedAsc.map(p => `${p.name} ($${p.priceCOP})`).join(' -> ')}`
);

const sortedDesc = sortProductsByPrice(mixedProducts, 'desc');
const descOrderValid =
  sortedDesc[0].priceCOP === 800000 &&
  sortedDesc[1].priceCOP === 500000 &&
  sortedDesc[2].priceCOP === 250000 &&
  sortedDesc[3].name === 'Alfa (Sin precio)' &&
  sortedDesc[4].name === 'Zeta (Sin precio)';

assert(
  'Escenario 6.2: Ordenamiento precio descendente ubica mayor a menor primero y sin precio al final ordenados por nombre',
  descOrderValid,
  `Orden obtenido: ${sortedDesc.map(p => `${p.name} ($${p.priceCOP})`).join(' -> ')}`
);

// -----------------------------------------------------------------------
// ESCENARIO 7: Cantidad solicitada superior al stock disponible
// -----------------------------------------------------------------------
function calculateClampedQuantity(requestedQuantity: number, productStock: number): number {
  if (productStock <= 0) return 0;
  return Math.min(requestedQuantity, productStock);
}

const clampedForStock3 = calculateClampedQuantity(10, 3);
assert(
  'Escenario 7.1: Solicitud de 10 unidades sobre producto con stock 3 se acota a 3',
  clampedForStock3 === 3,
  `Cantidad calculada: ${clampedForStock3}`
);

const clampedForStock0 = calculateClampedQuantity(5, 0);
assert(
  'Escenario 7.2: Solicitud sobre producto con stock 0 resulta en 0 unidades permitidas',
  clampedForStock0 === 0,
  `Cantidad calculada: ${clampedForStock0}`
);

// -----------------------------------------------------------------------
// ESCENARIO 8: Producto con familia olfativa no contemplada anteriormente (de las 14 de Excel)
// -----------------------------------------------------------------------
const productExoticFamily: Product = {
  id: 'test-excel-family',
  name: 'Hawas for Him',
  brand: 'Rasasi',
  family: 'Aromática Acuática', // Familia oficial del Excel
  priceCOP: 420000,
  stock: 6,
  status: 'active',
  featured: false
};

const catalogWithExotic = [...mixedProducts, productExoticFamily];

// Generación dinámica de familias (lógica de StoreCollection)
const dynamicFamilies = Array.from(
  new Set(
    catalogWithExotic
      .map((p) => p.family)
      .filter((fam): fam is string => Boolean(fam && typeof fam === 'string' && fam.trim().length > 0))
  )
).sort((a, b) => a.localeCompare(b, 'es'));

assert(
  'Escenario 8.1: Familias dinámicas detectan e incluyen "Aromática Acuática" automáticamente',
  dynamicFamilies.includes('Aromática Acuática'),
  `Familias detectadas: ${dynamicFamilies.join(', ')}`
);

const filterMatch = catalogWithExotic.filter(p => p.family === 'Aromática Acuática');
assert(
  'Escenario 8.2: Filtrado por la nueva familia retorna el producto exacto sin descartarlo',
  filterMatch.length === 1 && filterMatch[0].id === 'test-excel-family',
  `Productos filtrados: ${filterMatch.length}`
);

// -----------------------------------------------------------------------
// RESUMEN FINAL
// -----------------------------------------------------------------------
const totalTests = results.length;
const passedTests = results.filter(r => r.passed).length;
const failedTests = totalTests - passedTests;

console.log('\n================================================================');
console.log(`TOTAL DE PRUEBAS: ${totalTests} | PASADAS: ${passedTests} | FALLIDAS: ${failedTests}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE.');
  process.exit(0);
}
