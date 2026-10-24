import { Product, Order } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'adara-oud-royal',
    name: 'Oud Royal',
    subtitle: 'Extracto de Perfume · Edición Monolito',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 540000,
    stock: 14,
    threshold: 5,
    family: 'Oriental & Ámbar',
    status: 'active',
    description:
      'Una silueta olfativa de presencia hipnótica. Oud de Assam envejecido en resina de benjuí, velado por humo de incienso somalí y un susurro de azafrán dorado sobre pizarra negra.',
    notesTop: ['Azafrán de Persia', 'Bergamota ahumada', 'Nuez moscada'],
    notesHeart: ['Oud de Assam silvestre', 'Cuero negro', 'Cedro del Atlas'],
    notesBase: ['Resina de Benjuí', 'Ámbar gris', 'Almizcle de bosque'],
    image: '/images/oud_royal.jpg',
    featured: true,
    intensity: 5
  },
  {
    id: 'adara-rose-noire',
    name: 'Rose Noire',
    subtitle: 'Extrait de Parfum · Noche Perpetua',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 490000,
    stock: 8,
    threshold: 4,
    family: 'Floral Oscuro',
    status: 'active',
    description:
      'La rosa despojada de inocencia. Pétalos de rosa de Damasco macerados en licor de cassis, pimienta de Sichuan y pachulí oscuro mineral sobre un lecho de terciopelo nocturno.',
    notesTop: ['Cassis silvestre', 'Pimienta de Sichuan', 'Pera caramelizada'],
    notesHeart: ['Rosa de Damasco negra', 'Violeta nocturna', 'Iris pallida'],
    notesBase: ['Pachulí indonesio', 'Vainilla Bourbon ahumada', 'Madera de ébano'],
    image: '/images/rose_noire.jpg',
    featured: true,
    intensity: 4
  },
  {
    id: 'adara-ambre-imperial',
    name: 'Ambre Impérial',
    subtitle: 'Eau de Parfum · Resina Dorada',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 475000,
    stock: 3, // Bajo stock para activar alerta en admin
    threshold: 5,
    family: 'Oriental & Ámbar',
    status: 'active',
    description:
      'El calor de un lingote incandescente. Ámbar fosilizado enriquecido con canela de Ceilán, miel oscura de castaño y un velo balsámico de ládano andaluz.',
    notesTop: ['Mandarina amarga', 'Cardamomo de Guatemala', 'Canela de Ceilán'],
    notesHeart: ['Ládano español', 'Miel oscura', 'Tabaco rubio'],
    notesBase: ['Ámbar fósil', 'Haba tonka tostada', 'Sándalo cremoso'],
    image: '/images/ambre_imperial.jpg',
    featured: true,
    intensity: 4
  },
  {
    id: 'adara-cuir-sauvage',
    name: 'Cuir Sauvage',
    subtitle: 'Extrait de Parfum · Fuego & Carbón',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 520000,
    stock: 19,
    threshold: 6,
    family: 'Cuero & Humo',
    status: 'active',
    description:
      'Fuerza telúrica y magnetismo implacable. Cuero toscano curtido sobre brasas de enebro, envuelto en humo de vetiver de Haití y pimienta negra de Madagascar.',
    notesTop: ['Pimienta negra', 'Ciprés toscano', 'Flor de tomillo'],
    notesHeart: ['Cuero curtido', 'Alquitrán de abedul', 'Iris raíz'],
    notesBase: ['Vetiver de Haití', 'Ciste ládano', 'Musgo de roble'],
    image: '/images/cuir_sauvage.jpg',
    featured: false,
    intensity: 5
  },
  {
    id: 'adara-santal-blanc',
    name: 'Santal Blanc',
    subtitle: 'Eau de Parfum · Calma Mineral',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 460000,
    stock: 22,
    threshold: 5,
    family: 'Amaderada',
    status: 'active',
    description:
      'Serenidad arquitectónica. Madera de sándalo australiano pulida como mármol blanco, matizada con cardamomo verde, leche de higo y almizcles blancos envolventes.',
    notesTop: ['Cardamomo verde', 'Semilla de zanahoria', 'Leche de higo'],
    notesHeart: ['Sándalo blanco de Australia', 'Papiro egipcio', 'Lirio'],
    notesBase: ['Almizcle blanco vegetal', 'Ambroxan', 'Cedro de Virginia'],
    image: '/images/santal_blanc.jpg',
    featured: false,
    intensity: 3
  },
  {
    id: 'adara-vetiver-nocturne',
    name: 'Vetiver Nocturne',
    subtitle: 'Eau de Parfum · Bruma Sombría',
    brand: 'ADARA PARFUM',
    volume: '100 ml / 3.4 FL.OZ.',
    priceCOP: 440000,
    stock: 1, // Bajo stock para alerta
    threshold: 4,
    family: 'Amaderada',
    status: 'active',
    description:
      'La frescura austera de una noche de niebla. Raíces terrosas de vetiver con toronja amarga, hojas de violeta mojadas y resina de incienso frío.',
    notesTop: ['Toronja amarga', 'Pimienta rosa', 'Cáscara de bergamota'],
    notesHeart: ['Hoja de violeta', 'Incienso olíbano', 'Geranio'],
    notesBase: ['Vetiver de Java', 'Pachulí terroso', 'Cedro ahumado'],
    image: '/images/hero_adara.jpg',
    featured: false,
    intensity: 4
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-001',
    reference: 'AD-2026-089',
    date: '2026-10-21 14:15',
    customerName: 'Valentina Restrepo',
    customerPhone: '+57 312 884 9201',
    customerCity: 'Medellín, El Poblado',
    channel: 'Tienda Web',
    items: [
      { productId: 'adara-oud-royal', productName: 'Oud Royal (100ml)', quantity: 1, unitPriceCOP: 540000 }
    ],
    totalCOP: 540000,
    paymentStatus: 'paid',
    orderStatus: 'preparing',
    inventoryDeducted: true,
    notes: 'Empaque de lujo para regalo con sello de lacre dorado.'
  },
  {
    id: 'ord-002',
    reference: 'AD-2026-088',
    date: '2026-10-21 11:30',
    customerName: 'Santiago Morales',
    customerPhone: '+57 300 452 1988',
    customerCity: 'Bogotá, Chicó Reservado',
    channel: 'WhatsApp',
    items: [
      { productId: 'adara-rose-noire', productName: 'Rose Noire (100ml)', quantity: 1, unitPriceCOP: 490000 },
      { productId: 'adara-santal-blanc', productName: 'Santal Blanc (100ml)', quantity: 1, unitPriceCOP: 460000 }
    ],
    totalCOP: 950000,
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    inventoryDeducted: true,
    notes: 'Transferencia Bancolombia verificada.'
  },
  {
    id: 'ord-003',
    reference: 'AD-2026-087',
    date: '2026-10-20 18:40',
    customerName: 'Camila Echeverri',
    customerPhone: '+57 315 720 3341',
    customerCity: 'Cali, Ciudad Jardín',
    channel: 'Boutique Bogotá',
    items: [
      { productId: 'adara-ambre-imperial', productName: 'Ambre Impérial (100ml)', quantity: 2, unitPriceCOP: 475000 }
    ],
    totalCOP: 950000,
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    inventoryDeducted: true
  },
  {
    id: 'ord-004',
    reference: 'AD-2026-086',
    date: '2026-10-20 09:12',
    customerName: 'Nicolás Gómez',
    customerPhone: '+57 310 998 2210',
    customerCity: 'Barranquilla, Alto Prado',
    channel: 'Distribuidor',
    items: [
      { productId: 'adara-cuir-sauvage', productName: 'Cuir Sauvage (100ml)', quantity: 3, unitPriceCOP: 520000 },
      { productId: 'adara-oud-royal', productName: 'Oud Royal (100ml)', quantity: 2, unitPriceCOP: 540000 }
    ],
    totalCOP: 2640000,
    paymentStatus: 'paid',
    orderStatus: 'shipped',
    inventoryDeducted: true,
    notes: 'Venta corporativa boutique aliada.'
  },
  {
    id: 'ord-005',
    reference: 'AD-2026-085',
    date: '2026-10-19 16:50',
    customerName: 'Mariana Arango',
    customerPhone: '+57 320 665 1422',
    customerCity: 'Cartagena, Bocagrande',
    channel: 'WhatsApp',
    items: [
      { productId: 'adara-santal-blanc', productName: 'Santal Blanc (100ml)', quantity: 1, unitPriceCOP: 460000 }
    ],
    totalCOP: 460000,
    paymentStatus: 'on_delivery',
    orderStatus: 'pending',
    inventoryDeducted: false,
    notes: 'Pago contra entrega confirmado por chat.'
  }
];

// ============================================================================
// SECCIÓN 3: DATOS ESTÁTICOS DE RENDIMIENTO Y GRÁFICOS
// ============================================================================

/** Datos agregados de muestra para inicialización o demostración rápida en dashboard. */
export const SALES_PERIOD_DATA = {
  today: { totalCOP: 1490000, ordersCount: 2, unitsSold: 3, comparison: '+24%' },
  week: { totalCOP: 8940000, ordersCount: 16, unitsSold: 21, comparison: '+18.5%' },
  month: { totalCOP: 34500000, ordersCount: 68, unitsSold: 84, comparison: '+31.2%' },
  quarter: { totalCOP: 98200000, ordersCount: 194, unitsSold: 240, comparison: '+15.8%' },
  year: { totalCOP: 310400000, ordersCount: 612, unitsSold: 780, comparison: '+42.0%' }
};

/** Tendencia mensual de ventas de muestra para visualización gráfica. */
export const MONTHLY_SALES_CHART = [
  { month: 'Mayo', current: 18200000, previous: 14100000 },
  { month: 'Junio', current: 22400000, previous: 17800000 },
  { month: 'Julio', current: 26100000, previous: 20500000 },
  { month: 'Agosto', current: 29800000, previous: 24300000 },
  { month: 'Septiembre', current: 31900000, previous: 26700000 },
  { month: 'Octubre (Actual)', current: 34500000, previous: 28900000 }
];

// ============================================================================
// SECCIÓN 4: FORMATEADORES MONETARIOS OFICIALES (COLOMBIA - COP)
// ============================================================================

/**
 * Formatea un valor numérico a pesos colombianos oficiales (COP).
 *
 * @remarks
 * Aplica formato estándar de Colombia (`es-CO`) sin decimales ni centavos (ej. `$ 540.000`).
 * Ante valores nulos, indefinidos o NaN, retorna de forma segura `$ 0`.
 *
 * @param amount - Valor numérico a formatear en pesos.
 * @returns Cadena formateada en moneda COP.
 */
export const formatCOP = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formatea el precio comercial de una fragancia para su visualización en tienda y panel.
 *
 * @remarks
 * Si el precio es nulo, cero o menor a cero, devuelve exactamente `'Bajo consulta'`
 * en lugar de `$ 0`, cumpliendo con el principio comercial de exclusividad de ADARA.
 *
 * @param price - Precio numérico en COP o null.
 * @returns Cadena con el precio formateado o `'Bajo consulta'`.
 */
export const formatProductPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price) || price <= 0) {
    return 'Bajo consulta';
  }
  return formatCOP(price);
};

// ============================================================================
// SECCIÓN 5: GESTIÓN Y RESOLUCIÓN RESILIENTE DE IMÁGENES
// ============================================================================

/**
 * Catálogo de imágenes oficiales de alta definición disponibles en la carpeta pública del proyecto.
 */
export const OFFICIAL_PRODUCT_IMAGES: Record<string, string> = {
  'adara-oud-royal': '/images/oud_royal.jpg',
  'adara-rose-noire': '/images/rose_noire.jpg',
  'adara-ambre-imperial': '/images/ambre_imperial.jpg',
  'adara-cuir-sauvage': '/images/cuir_sauvage.jpg',
  'adara-santal-blanc': '/images/santal_blanc.jpg',
  'adara-vetiver-nocturne': '/images/hero_adara.jpg'
};

/**
 * Resuelve y garantiza una ruta de imagen válida para cualquier producto o variante.
 *
 * @remarks
 * Si el producto no tiene una imagen configurada, si el valor almacenado en `localStorage`
 * quedó como nulo/vacío, o si se añade un producto sin URL, esta función rehidrata automáticamente
 * la imagen correspondiente del catálogo oficial o selecciona una alternativa estética basada
 * en la familia olfativa del perfume.
 *
 * @param product - Objeto parcial de producto con propiedades identificadoras y olfativas.
 * @returns Ruta absoluta accesible hacia la imagen en formato JPG o URL web.
 */
export const getProductImageUrl = (
  product?: Partial<Product> | null
): string => {
  if (!product) return '/images/hero_adara.jpg';

  // 1. Si cuenta con una imagen asignada explícita válida y no vacía
  if (product.image && typeof product.image === 'string' && product.image.trim() !== '') {
    const trimmed = product.image.trim();
    // Normalizar si le falta el slash inicial
    if (trimmed.startsWith('images/')) return `/${trimmed}`;
    return trimmed;
  }

  // 2. Coincidencia directa por ID de catálogo oficial
  if (product.id && OFFICIAL_PRODUCT_IMAGES[product.id]) {
    return OFFICIAL_PRODUCT_IMAGES[product.id];
  }

  // 3. Coincidencia por nombre en INITIAL_PRODUCTS o palabras clave
  if (product.name) {
    const normName = product.name.trim().toLowerCase();
    const match = INITIAL_PRODUCTS.find((p) => p.name.trim().toLowerCase() === normName);
    if (match?.image) return match.image;

    if (normName.includes('oud')) return '/images/oud_royal.jpg';
    if (normName.includes('rose') || normName.includes('rosa')) return '/images/rose_noire.jpg';
    if (normName.includes('ambre') || normName.includes('ámbar') || normName.includes('ambar')) return '/images/ambre_imperial.jpg';
    if (normName.includes('cuir') || normName.includes('cuero')) return '/images/cuir_sauvage.jpg';
    if (normName.includes('santal') || normName.includes('sándalo') || normName.includes('sandalo')) return '/images/santal_blanc.jpg';
    if (normName.includes('vetiver')) return '/images/hero_adara.jpg';
  }

  // 4. Fallback contextual por familia olfativa
  const family = (product.family || '').toLowerCase();
  if (family.includes('floral')) return '/images/rose_noire.jpg';
  if (family.includes('cuero') || family.includes('humo')) return '/images/cuir_sauvage.jpg';
  if (family.includes('ámbar') || family.includes('ambar') || family.includes('oriental')) return '/images/ambre_imperial.jpg';
  if (family.includes('amaderada')) return '/images/santal_blanc.jpg';

  // 5. Fallback monolito de marca ADARA
  return '/images/oud_royal.jpg';
};

