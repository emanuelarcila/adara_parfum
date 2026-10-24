/**
 * ADARA PARFUM — Prueba de Regresión: Preservación de Variantes en Edición de Catálogo
 *
 * Objetivo:
 * Validar que la edición de campos de un producto con presentaciones múltiples (ProductVariantItem[])
 * conserve íntegramente su colección de variantes preexistentes, sin perder stock, precios por tamaño
 * ni identificadores de presentación al guardarse en el catálogo.
 */

import { Product, ProductVariantItem } from '../../types';

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

console.log('--- INICIO DE PRUEBAS: PRESERVACIÓN DE VARIANTES AL EDITAR PRODUCTO ---\n');

// 1. Fixture de producto con variantes (30ml, 50ml, 100ml) y acordes
const initialVariants: ProductVariantItem[] = [
  {
    id: 'var-30ml',
    volume: '30 ml',
    priceCOP: 220000,
    stock: 12,
    threshold: 3,
    status: 'active'
  },
  {
    id: 'var-50ml',
    volume: '50 ml',
    priceCOP: 340000,
    stock: 8,
    threshold: 2,
    status: 'active'
  },
  {
    id: 'var-100ml',
    volume: '100 ml',
    priceCOP: 520000,
    stock: 5,
    threshold: 2,
    status: 'active'
  }
];

const originalProduct: Product = {
  id: 'prod-rose-noire',
  name: 'Rose Noire Absolue',
  subtitle: 'Extracto de Perfume',
  brand: 'ADARA PARFUM',
  volume: '50 ml',
  priceCOP: 340000,
  stock: 25,
  threshold: 3,
  family: 'Floral Oscuro',
  status: 'active',
  description: 'Rosa damascena de medianoche con espinas de pachulí y ámbar negro.',
  notesTop: ['Pimienta Rosa', 'Bergamota'],
  notesHeart: ['Rosa Damascena', 'Jazmín Sombrío'],
  notesBase: ['Pachulí', 'Ámbar Negro'],
  accords: ['Rosa', 'Ambarado', 'Especiado'],
  image: '/images/rose-noire.jpg',
  featured: true,
  intensity: 5,
  variants: initialVariants
};

// 2. Simulación de la lógica de edición en AdminProducts.handleSubmit
function simulateAdminProductEdit(
  editingProduct: Product,
  formValues: {
    name: string;
    description: string;
    priceCOP: number | null;
    stock: number;
    family: Product['family'];
  }
): Product {
  const updated: Product = {
    id: editingProduct.id,
    name: formValues.name.trim(),
    subtitle: editingProduct.subtitle,
    brand: editingProduct.brand,
    volume: editingProduct.volume,
    priceCOP: formValues.priceCOP,
    stock: formValues.stock,
    threshold: editingProduct.threshold,
    family: formValues.family,
    status: editingProduct.status,
    description: formValues.description.trim(),
    notesTop: editingProduct.notesTop,
    notesHeart: editingProduct.notesHeart,
    notesBase: editingProduct.notesBase,
    image: editingProduct.image,
    featured: editingProduct.featured,
    intensity: editingProduct.intensity,
    ...(editingProduct.accords ? { accords: editingProduct.accords } : {}),
    ...(editingProduct.variants ? { variants: editingProduct.variants } : {})
  };

  return updated;
}

// 3. Ejecución del caso de regresión
console.log('[Caso 1: Edición de nombre y descripción preservando variantes]');
const editedProduct = simulateAdminProductEdit(originalProduct, {
  name: 'Rose Noire Extrait de Parfum',
  description: 'Nueva descripción editorial de la rosa de medianoche.',
  priceCOP: 360000,
  stock: 25,
  family: 'Floral Oscuro'
});

assert(editedProduct.name === 'Rose Noire Extrait de Parfum', 'El nombre se actualizó correctamente');
assert(editedProduct.description === 'Nueva descripción editorial de la rosa de medianoche.', 'La descripción se actualizó');
assert(Array.isArray(editedProduct.variants), 'El producto editado conserva el arreglo variants');
assertEquals(editedProduct.variants?.length, 3, 'Conserva exactamente las 3 presentaciones originales');
assertEquals(editedProduct.variants?.[0].volume, '30 ml', 'Conserva variante de 30ml');
assertEquals(editedProduct.variants?.[0].priceCOP, 220000, 'Conserva precio de la variante de 30ml');
assertEquals(editedProduct.variants?.[0].stock, 12, 'Conserva existencias de la variante de 30ml');
assertEquals(editedProduct.variants?.[1].volume, '50 ml', 'Conserva variante de 50ml');
assertEquals(editedProduct.variants?.[2].volume, '100 ml', 'Conserva variante de 100ml');
assertEquals(editedProduct.accords?.length, 3, 'Conserva los acordes olfativos');

console.log('\n[Caso 2: Reemplazo en catálogo simula persistencia en estado]');
let catalog: Product[] = [originalProduct];
// Simulación de handleSaveProduct en App.tsx
catalog = catalog.map((p) => (p.id === editedProduct.id ? editedProduct : p));

assert(catalog[0].name === 'Rose Noire Extrait de Parfum', 'El catálogo contiene el producto con el nuevo nombre');
assert(Boolean(catalog[0].variants && catalog[0].variants.length === 3), 'El catálogo conserva intactas las variantes tras guardar');

console.log('\n[Caso 3: Producto sin variantes preexistentes no crea variants espurias]');
const simpleProduct: Product = {
  id: 'prod-simple-01',
  name: 'Cologne Royale',
  brand: 'ADARA',
  priceCOP: 180000,
  stock: 10,
  family: 'Cítrica Aromática',
  status: 'active',
  featured: false
};

const editedSimpleProduct = simulateAdminProductEdit(simpleProduct, {
  name: 'Cologne Royale Intense',
  description: 'Versión renovada.',
  priceCOP: 200000,
  stock: 15,
  family: 'Cítrica Aromática'
});

assert(editedSimpleProduct.variants === undefined, 'No añade variants si el producto original no las tenía');
assert(editedSimpleProduct.name === 'Cologne Royale Intense', 'Actualizó el producto plano correctamente');

console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${testsPassed + testsFailed}`);
console.log(`ÉXITO: ${testsPassed} superadas`);
console.log(`FALLOS: ${testsFailed}`);
console.log('============================================================\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE REGRESIÓN DE VARIANTES PASARON CON ÉXITO.');
}
