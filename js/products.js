/*
 * Add verified products here. The catalog stays in launch mode while this list
 * is empty. Never publish unconfirmed prices, sizes, availability, or claims.
 *
 * Product shape:
 * {
 *   id: 'unique-id', name: 'Product name', brand: 'ADARA PARFUM',
 *   volume: '50 ml', priceCOP: 0, availability: 'available',
 *   description: 'Approved product description', notes: ['...'],
 *   family: 'Confirmed fragrance family',
 *   image: 'assets/product-image.webp', imageAlt: 'Accurate image description',
 *   featured: true
 * }
 * availability values: 'available' or 'sold-out'. Price must be a COP integer.
 */
window.ADARA_PRODUCTS = [];
