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
    orderStatus: 'delivered'
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
    notes: 'Pago contra entrega confirmado por chat.'
  }
];

export const SALES_PERIOD_DATA = {
  today: { totalCOP: 1490000, ordersCount: 2, unitsSold: 3, comparison: '+24%' },
  week: { totalCOP: 8940000, ordersCount: 16, unitsSold: 21, comparison: '+18.5%' },
  month: { totalCOP: 34500000, ordersCount: 68, unitsSold: 84, comparison: '+31.2%' },
  quarter: { totalCOP: 98200000, ordersCount: 194, unitsSold: 240, comparison: '+15.8%' },
  year: { totalCOP: 310400000, ordersCount: 612, unitsSold: 780, comparison: '+42.0%' }
};

export const MONTHLY_SALES_CHART = [
  { month: 'Mayo', current: 18200000, previous: 14100000 },
  { month: 'Junio', current: 22400000, previous: 17800000 },
  { month: 'Julio', current: 26100000, previous: 20500000 },
  { month: 'Agosto', current: 29800000, previous: 24300000 },
  { month: 'Septiembre', current: 31900000, previous: 26700000 },
  { month: 'Octubre (Actual)', current: 34500000, previous: 28900000 }
];

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

export const formatProductPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || isNaN(price) || price <= 0) {
    return 'Bajo consulta';
  }
  return formatCOP(price);
};
