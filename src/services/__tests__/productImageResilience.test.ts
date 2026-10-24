import { strict as assert } from 'assert';
import { INITIAL_PRODUCTS, OFFICIAL_PRODUCT_IMAGES, getProductImageUrl } from '../../data/mockData';
import { Product } from '../../types';

console.log('--- INICIO DE PRUEBAS: RESILIENCIA Y RESOLUCIÓN DE IMÁGENES (ADARA PARFUM) ---');

// 1. Verificación de imágenes oficiales asignadas en INITIAL_PRODUCTS
console.log('\n[Caso 1: Las 6 fragancias del catálogo cuentan con imagen oficial válida]');
assert.equal(INITIAL_PRODUCTS.length, 6, 'El catálogo inicial contiene 6 fragancias');

for (const product of INITIAL_PRODUCTS) {
  assert.ok(product.image, `El producto ${product.name} debe tener una propiedad image definida`);
  assert.ok(product.image.startsWith('/images/'), `La imagen de ${product.name} debe iniciar con /images/`);
  assert.ok(product.image.endsWith('.jpg'), `La imagen de ${product.name} debe ser un archivo .jpg`);
  console.log(`✅ ${product.name}: ${product.image}`);
}

// 2. Comprobación del mapa oficial de imágenes
console.log('\n[Caso 2: Resolución directa por ID de producto]');
assert.equal(getProductImageUrl({ id: 'adara-oud-royal' }), '/images/oud_royal.jpg');
assert.equal(getProductImageUrl({ id: 'adara-rose-noire' }), '/images/rose_noire.jpg');
assert.equal(getProductImageUrl({ id: 'adara-ambre-imperial' }), '/images/ambre_imperial.jpg');
assert.equal(getProductImageUrl({ id: 'adara-cuir-sauvage' }), '/images/cuir_sauvage.jpg');
assert.equal(getProductImageUrl({ id: 'adara-santal-blanc' }), '/images/santal_blanc.jpg');
assert.equal(getProductImageUrl({ id: 'adara-vetiver-nocturne' }), '/images/hero_adara.jpg');
console.log('✅ Coincidencias por ID exacto resueltas con éxito');

// 3. Resolución de productos con image: null o vacío (caso crítico de localStorage corrupto)
console.log('\n[Caso 3: Recuperación de productos con image: null o vacía (caso localStorage)]');
const corruptedOud: Partial<Product> = { id: 'adara-oud-royal', name: 'Oud Royal', image: null };
const corruptedRose: Partial<Product> = { id: 'adara-rose-noire', name: 'Rose Noire', image: '' };
const corruptedAmbre: Partial<Product> = { id: 'adara-ambre-imperial', name: 'Ambre Impérial', image: undefined };

assert.equal(getProductImageUrl(corruptedOud), '/images/oud_royal.jpg', 'Recupera imagen de Oud Royal');
assert.equal(getProductImageUrl(corruptedRose), '/images/rose_noire.jpg', 'Recupera imagen de Rose Noire');
assert.equal(getProductImageUrl(corruptedAmbre), '/images/ambre_imperial.jpg', 'Recupera imagen de Ambre Impérial');
console.log('✅ Rehidratación automática de productos con image null/vacía superada');

// 4. Fallback temático por familia olfativa para productos nuevos sin ID oficial
console.log('\n[Caso 4: Fallbacks temáticos por familia olfativa]');
assert.equal(getProductImageUrl({ name: 'Fragancia Floral Nueva', family: 'Floral Oscuro', image: null }), '/images/rose_noire.jpg');
assert.equal(getProductImageUrl({ name: 'Cuero Misterioso', family: 'Cuero & Humo', image: null }), '/images/cuir_sauvage.jpg');
assert.equal(getProductImageUrl({ name: 'Ámbar del Desierto', family: 'Oriental & Ámbar', image: null }), '/images/ambre_imperial.jpg');
assert.equal(getProductImageUrl({ name: 'Sándalo Suave', family: 'Amaderada', image: null }), '/images/santal_blanc.jpg');
console.log('✅ Fallbacks temáticos por familia verificados');

// 5. Preservación de URLs externas o imágenes personalizadas válidas
console.log('\n[Caso 5: Preservación de imágenes personalizadas explícitas]');
const customProduct: Partial<Product> = {
  id: 'custom-1',
  name: 'Perfume Personalizado',
  image: 'https://images.unsplash.com/photo-luxury-perfume'
};
assert.equal(getProductImageUrl(customProduct), 'https://images.unsplash.com/photo-luxury-perfume');

const relativeProduct: Partial<Product> = {
  id: 'rel-1',
  name: 'Perfume Relativo',
  image: 'images/oud_royal.jpg'
};
assert.equal(getProductImageUrl(relativeProduct), '/images/oud_royal.jpg', 'Normaliza rutas sin slash inicial');
console.log('✅ Preservación y normalización de URLs personalizadas verificada');

console.log('\n============================================================');
console.log('🎉 TODAS LAS PRUEBAS DE RESOLUCIÓN DE IMÁGENES PASARON CON ÉXITO.');
console.log('============================================================\n');
