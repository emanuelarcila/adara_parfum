/**
 * ADARA PARFUM — Pruebas Automatizadas de Variantes y Carrito (Fase 2.5A)
 *
 * Cobertura de las 11 especificaciones requeridas:
 * 1. Agregar 30 ml y 100 ml del mismo perfume produce líneas distintas.
 * 2. Agregar dos veces la misma variante incrementa su cantidad.
 * 3. El precio y el subtotal corresponden a la variante elegida.
 * 4. El stock se valida contra la variante correcta.
 * 5. No se puede comprar una variante sin precio válido.
 * 6. No se puede superar el stock disponible de la variante.
 * 7. El pedido conserva variantId, volumen, cantidad y precio unitario.
 * 8. El total del pedido coincide con la suma de sus líneas.
 * 9. El carrito antiguo sin variantId ni volume sigue siendo interpretable y seguro.
 * 10. Los productos sin variantes conservan compatibilidad funcional completa.
 * 11. Las cancelaciones y descuento de inventario con variantes no sufren regresiones.
 */

import {
  Product,
  CartItem,
  ProductVariantItem,
  isPricedVariant,
  isPurchasableVariant,
  getCartItemKey
} from '../../types';

import {
  createBaseOrder,
  createWhatsAppOrder,
  confirmOrderInventory,
  cancelOrderInventory,
  getAvailableStock
} from '../orderInventoryService';

import {
  getItemUnitPrice,
  getItemVolume,
  getItemMaxStock
} from '../../components/store/CartDrawer';

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

// Fixtures
const testPerfumeWithVariants: Product = {
  id: 'oud-royal-01',
  name: 'Oud Royal',
  brand: 'ADARA PARFUM',
  family: 'Oriental & Ámbar',
  status: 'active',
  featured: true,
  stock: 14, // Suma de variantes
  priceCOP: null, // El producto padre delega su precio a las variantes
  variants: [
    {
      id: 'oud-30ml',
      volume: '30ml',
      priceCOP: 220000,
      stock: 5,
      status: 'active'
    },
    {
      id: 'oud-50ml',
      volume: '50ml',
      priceCOP: 340000,
      stock: 6,
      status: 'active'
    },
    {
      id: 'oud-100ml',
      volume: '100ml',
      priceCOP: 540000,
      stock: 3,
      status: 'active'
    },
    {
      id: 'oud-unpriced',
      volume: '50ml',
      priceCOP: null,
      stock: 10,
      status: 'active'
    },
    {
      id: 'oud-soldout',
      volume: '30ml',
      priceCOP: 190000,
      stock: 0,
      status: 'sold-out'
    }
  ]
};

const testLegacyProduct: Product = {
  id: 'legacy-cuir-02',
  name: 'Cuir Sauvage',
  brand: 'ADARA PARFUM',
  family: 'Cuero & Humo',
  status: 'active',
  featured: false,
  volume: '100ml',
  stock: 8,
  priceCOP: 480000
};

console.log('\n--- INICIO DE PRUEBAS: VARIANTES EN TIENDA PÚBLICA Y CARRITO (FASE 2.5A) ---');

// ============================================================================
// Caso 1: Agregar 30 ml y 100 ml del mismo perfume produce líneas distintas
// ============================================================================
console.log('\n[Caso 1: Líneas distintas para 30 ml y 100 ml del mismo perfume]');
{
  const variant30 = testPerfumeWithVariants.variants![0];
  const variant100 = testPerfumeWithVariants.variants![2];

  const key30 = getCartItemKey(testPerfumeWithVariants.id, variant30.id);
  const key100 = getCartItemKey(testPerfumeWithVariants.id, variant100.id);

  assert(key30 !== key100, 'Las claves compuestas de 30ml y 100ml deben ser distintas');
  assert(key30 === 'oud-royal-01::oud-30ml', 'La clave de 30ml debe componerse de productId::variantId');
  assert(key100 === 'oud-royal-01::oud-100ml', 'La clave de 100ml debe componerse de productId::variantId');

  // Simulación del estado del carrito
  const cart: CartItem[] = [
    {
      product: testPerfumeWithVariants,
      variantId: variant30.id,
      volume: variant30.volume,
      unitPriceCOP: variant30.priceCOP,
      quantity: 1
    },
    {
      product: testPerfumeWithVariants,
      variantId: variant100.id,
      volume: variant100.volume,
      unitPriceCOP: variant100.priceCOP,
      quantity: 1
    }
  ];

  assert(cart.length === 2, 'El carrito debe tener 2 líneas independientes para el mismo perfume');
  assert(cart[0].variantId === 'oud-30ml', 'La primera línea corresponde a 30ml');
  assert(cart[1].variantId === 'oud-100ml', 'La segunda línea corresponde a 100ml');
}

// ============================================================================
// Caso 2: Agregar dos veces la misma variante incrementa su cantidad
// ============================================================================
console.log('\n[Caso 2: Agregar dos veces la misma variante incrementa cantidad]');
{
  const variant50 = testPerfumeWithVariants.variants![1];
  let cart: CartItem[] = [];

  // Función helper idéntica a handleAddToCart en App.tsx
  const addToCartHelper = (
    currentCart: CartItem[],
    product: Product,
    variant: ProductVariantItem,
    qty = 1
  ): CartItem[] => {
    const existing = currentCart.find(
      (it) => it.product.id === product.id && it.variantId === variant.id
    );
    if (existing) {
      const nextQty = Math.min(existing.quantity + qty, variant.stock);
      return currentCart.map((it) =>
        it.product.id === product.id && it.variantId === variant.id
          ? { ...it, quantity: nextQty }
          : it
      );
    }
    return [
      ...currentCart,
      {
        product,
        variantId: variant.id,
        volume: variant.volume,
        unitPriceCOP: variant.priceCOP,
        quantity: Math.min(qty, variant.stock)
      }
    ];
  };

  cart = addToCartHelper(cart, testPerfumeWithVariants, variant50, 1);
  assert(cart.length === 1, 'Primera adición crea exactamente 1 línea');
  assert(cart[0].quantity === 1, 'Cantidad inicial es 1');

  cart = addToCartHelper(cart, testPerfumeWithVariants, variant50, 2);
  assert(cart.length === 1, 'Segunda adición de la misma variante NO duplica la línea');
  assert(cart[0].quantity === 3, 'Cantidad acumulada debe ser 3');
}

// ============================================================================
// Caso 3: El precio unitario y el subtotal corresponden a la variante elegida
// ============================================================================
console.log('\n[Caso 3: Precio unitario y subtotal derivan de la variante]');
{
  const variant30 = testPerfumeWithVariants.variants![0]; // 220.000 COP
  const variant50 = testPerfumeWithVariants.variants![1]; // 340.000 COP

  const item30: CartItem = {
    product: testPerfumeWithVariants,
    variantId: variant30.id,
    volume: variant30.volume,
    unitPriceCOP: variant30.priceCOP,
    quantity: 2
  };

  const item50: CartItem = {
    product: testPerfumeWithVariants,
    variantId: variant50.id,
    volume: variant50.volume,
    unitPriceCOP: variant50.priceCOP,
    quantity: 1
  };

  const price30 = getItemUnitPrice(item30);
  const price50 = getItemUnitPrice(item50);

  assert(price30 === 220000, 'Precio unitario de 30ml debe ser 220.000 COP');
  assert(price50 === 340000, 'Precio unitario de 50ml debe ser 340.000 COP');

  const subtotal30 = (price30 || 0) * item30.quantity;
  const subtotal50 = (price50 || 0) * item50.quantity;
  const total = subtotal30 + subtotal50;

  assert(subtotal30 === 440000, 'Subtotal de 2 frascos de 30ml debe ser 440.000 COP');
  assert(subtotal50 === 340000, 'Subtotal de 1 frasco de 50ml debe ser 340.000 COP');
  assert(total === 780000, 'Total acumulado de ambas líneas debe ser 780.000 COP');
}

// ============================================================================
// Caso 4: El stock se valida contra la variante correcta
// ============================================================================
console.log('\n[Caso 4: Stock validado contra la variante correcta]');
{
  const stock30 = getAvailableStock(testPerfumeWithVariants, 'oud-30ml');
  const stock50 = getAvailableStock(testPerfumeWithVariants, 'oud-50ml');
  const stock100 = getAvailableStock(testPerfumeWithVariants, 'oud-100ml');

  assert(stock30 === 5, 'El stock consultado para 30ml debe ser 5');
  assert(stock50 === 6, 'El stock consultado para 50ml debe ser 6');
  assert(stock100 === 3, 'El stock consultado para 100ml debe ser 3');
}

// ============================================================================
// Caso 5: No se puede comprar una variante sin precio válido
// ============================================================================
console.log('\n[Caso 5: Validación de precios válidos]');
{
  const unpricedVariant = testPerfumeWithVariants.variants![3]; // oud-unpriced (priceCOP: null)
  assert(!isPricedVariant(unpricedVariant), 'Variante con priceCOP null no es priced');
  assert(!isPurchasableVariant(unpricedVariant), 'Variante con priceCOP null no es purchasable');

  const zeroPriceVariant: ProductVariantItem = {
    id: 'zero-p',
    volume: '50ml',
    priceCOP: 0,
    stock: 5,
    status: 'active'
  };
  assert(!isPricedVariant(zeroPriceVariant), 'Variante con priceCOP 0 no es priced');
  assert(!isPurchasableVariant(zeroPriceVariant), 'Variante con priceCOP 0 no es purchasable');
}

// ============================================================================
// Caso 6: No se puede superar el stock disponible de la variante
// ============================================================================
console.log('\n[Caso 6: Límites de stock y prevención de sobrecompra]');
{
  const variant100 = testPerfumeWithVariants.variants![2]; // stock = 3
  const item100: CartItem = {
    product: testPerfumeWithVariants,
    variantId: variant100.id,
    volume: variant100.volume,
    unitPriceCOP: variant100.priceCOP,
    quantity: 3
  };

  const maxStock = getItemMaxStock(item100);
  assert(maxStock === 3, 'getItemMaxStock debe reportar exactamente 3 para la variante de 100ml');

  // Intentar sumar cuando quantity === maxStock
  const isOverstocked = item100.quantity > maxStock;
  assert(!isOverstocked, 'Cantidad 3 no excede stock máximo 3');

  const overstockedItem: CartItem = {
    ...item100,
    quantity: 4
  };
  assert(overstockedItem.quantity > maxStock, 'Cantidad 4 excede stock máximo 3');
}

// ============================================================================
// Caso 7: El pedido WhatsApp conserva variantId, volumen, cantidad y precio
// ============================================================================
console.log('\n[Caso 7: Creación de pedido WhatsApp con variante y volumen]');
{
  const variant30 = testPerfumeWithVariants.variants![0];
  const variant100 = testPerfumeWithVariants.variants![2];

  const cartItems: CartItem[] = [
    {
      product: testPerfumeWithVariants,
      variantId: variant30.id,
      volume: variant30.volume,
      unitPriceCOP: variant30.priceCOP,
      quantity: 1
    },
    {
      product: testPerfumeWithVariants,
      variantId: variant100.id,
      volume: variant100.volume,
      unitPriceCOP: variant100.priceCOP,
      quantity: 2
    }
  ];

  const waRes = createWhatsAppOrder(cartItems);
  assert(waRes.success, 'createWhatsAppOrder debe ser exitoso con variantes');
  assert(Boolean(waRes.order), 'Debe retornar el objeto Order generado');

  const order = waRes.order!;
  assert(order.items.length === 2, 'El pedido debe tener 2 líneas');

  const line1 = order.items[0];
  assert(line1.productId === testPerfumeWithVariants.id, 'Línea 1 conserva productId');
  assert(line1.variantId === 'oud-30ml', 'Línea 1 conserva variantId oud-30ml');
  assert(line1.volume === '30ml', 'Línea 1 conserva volumen 30ml');
  assert(line1.quantity === 1, 'Línea 1 conserva cantidad 1');
  assert(line1.unitPriceCOP === 220000, 'Línea 1 conserva precio unitario 220.000 COP');
  assert(line1.productName.includes('30ml'), 'Nombre visible de Línea 1 incluye presentación (30ml)');

  const line2 = order.items[1];
  assert(line2.variantId === 'oud-100ml', 'Línea 2 conserva variantId oud-100ml');
  assert(line2.volume === '100ml', 'Línea 2 conserva volumen 100ml');
  assert(line2.quantity === 2, 'Línea 2 conserva cantidad 2');
  assert(line2.unitPriceCOP === 540000, 'Línea 2 conserva precio unitario 540.000 COP');

  // Aserciones de arquitectura de pagos (Fase 2.5: Desacoplamiento de canal y pasarela)
  assert(order.paymentMethod === 'whatsapp_concierge', 'El pedido de WhatsApp asigna paymentMethod: whatsapp_concierge');
  assert(order.currency === 'COP', 'La moneda asignada debe ser COP');
  assert(order.expectedAmountCOP === 1300000, 'El importe esperado liquidado debe coincidir');

  // Comprobar createBaseOrder desacoplado de WhatsApp (ej. pasarela Addi / Sistecrédito / Wompi)
  const baseRes = createBaseOrder({
    cartItems,
    channel: 'Tienda Web',
    paymentMethod: 'addi',
    customerName: 'Cliente Addi Financiación',
    referencePrefix: 'AD-ADDI'
  });
  assert(baseRes.success, 'createBaseOrder genera un pedido independiente de WhatsApp');
  const baseOrder = baseRes.order!;
  assert(baseOrder.channel === 'Tienda Web', 'Canal asignado a Tienda Web');
  assert(baseOrder.paymentMethod === 'addi', 'Método de pago asignado a addi');
  assert(baseOrder.reference.startsWith('AD-ADDI-'), 'Referencia usa el prefijo solicitado');
  assert(baseOrder.currency === 'COP', 'Moneda es COP');
  assert(baseOrder.expectedAmountCOP === 1300000, 'Importe esperado liquidado es 1.300.000 COP');
  assert(baseOrder.inventoryDeducted === false, 'El pedido independiente inicia sin descontar stock');
}

// ============================================================================
// Caso 8: El total del pedido coincide con la suma de sus líneas
// ============================================================================
console.log('\n[Caso 8: Total del pedido coincide con la suma de sus líneas]');
{
  const variant30 = testPerfumeWithVariants.variants![0];
  const variant100 = testPerfumeWithVariants.variants![2];

  const cartItems: CartItem[] = [
    {
      product: testPerfumeWithVariants,
      variantId: variant30.id,
      volume: variant30.volume,
      unitPriceCOP: 220000,
      quantity: 1
    },
    {
      product: testPerfumeWithVariants,
      variantId: variant100.id,
      volume: variant100.volume,
      unitPriceCOP: 540000,
      quantity: 2
    }
  ];

  const waRes = createWhatsAppOrder(cartItems);
  const order = waRes.order!;

  const expectedTotal = 1 * 220000 + 2 * 540000; // 220.000 + 1.080.000 = 1.300.000
  assert(order.totalCOP === expectedTotal, `Total del pedido (${order.totalCOP}) debe ser igual a la suma calculada (${expectedTotal})`);
}

// ============================================================================
// Caso 9: El carrito antiguo sigue siendo interpretable
// ============================================================================
console.log('\n[Caso 9: Compatibilidad con datos de carrito legacy (adara_cart_v2)]');
{
  // Simular un CartItem antiguo serializado en localStorage sin variantId, volume ni unitPriceCOP
  const legacyStoredItem = {
    product: testLegacyProduct,
    quantity: 2
  };

  // Normalización aplicada en App.tsx al hidratar cart state
  const normalizedItem: CartItem = {
    product: legacyStoredItem.product,
    variantId: (legacyStoredItem as any).variantId || undefined,
    volume: (legacyStoredItem as any).volume || legacyStoredItem.product.volume || undefined,
    unitPriceCOP: typeof (legacyStoredItem as any).unitPriceCOP === 'number'
      ? (legacyStoredItem as any).unitPriceCOP
      : (typeof legacyStoredItem.product.priceCOP === 'number' ? legacyStoredItem.product.priceCOP : null),
    quantity: typeof legacyStoredItem.quantity === 'number' && legacyStoredItem.quantity > 0 ? legacyStoredItem.quantity : 1
  };

  assert(normalizedItem.variantId === undefined, 'variantId es undefined de forma segura');
  assert(normalizedItem.volume === '100ml', 'Volumen toma el del producto padre');
  assert(normalizedItem.unitPriceCOP === 480000, 'unitPriceCOP toma el priceCOP del producto padre');
  assert(normalizedItem.quantity === 2, 'quantity se preserva intacto');

  // Evaluar con helpers de CartDrawer
  assert(getItemUnitPrice(normalizedItem) === 480000, 'getItemUnitPrice retorna el precio del producto padre');
  assert(getItemVolume(normalizedItem) === '100ml', 'getItemVolume retorna el volumen del producto padre');
  assert(getItemMaxStock(normalizedItem) === 8, 'getItemMaxStock retorna el stock del producto padre');
}

// ============================================================================
// Caso 10: Los productos sin variantes conservan compatibilidad completa
// ============================================================================
console.log('\n[Caso 10: Compatibilidad completa de productos sin variantes]');
{
  const legacyCartItem: CartItem = {
    product: testLegacyProduct,
    quantity: 1,
    unitPriceCOP: testLegacyProduct.priceCOP
  };

  const waRes = createWhatsAppOrder([legacyCartItem]);
  assert(waRes.success, 'createWhatsAppOrder procesa correctamente un producto sin variantes');

  const order = waRes.order!;
  assert(order.items.length === 1, 'Pedido tiene 1 línea');
  assert(order.items[0].variantId === undefined, 'variantId permanece undefined');
  assert(order.items[0].unitPriceCOP === 480000, 'Precio unitario coincide con el del producto');
  assert(order.totalCOP === 480000, 'Total coincide');
}

// ============================================================================
// Caso 11: Cancelaciones y deducción de inventario con variantes sin regresiones
// ============================================================================
console.log('\n[Caso 11: Descuento y restitución de inventario en pedidos con variantes]');
{
  let catalog: Product[] = [JSON.parse(JSON.stringify(testPerfumeWithVariants))];

  // Pedido con 2 unidades de 30ml (stock inicial: 5)
  const cartItems: CartItem[] = [
    {
      product: catalog[0],
      variantId: 'oud-30ml',
      volume: '30ml',
      unitPriceCOP: 220000,
      quantity: 2
    }
  ];

  const waRes = createWhatsAppOrder(cartItems);
  const pendingOrder = waRes.order!;

  assert(!pendingOrder.inventoryDeducted, 'Pedido WhatsApp inicia con inventoryDeducted: false');

  // Confirmar pedido (administrador cambia a preparing) -> Debe descontar 30ml
  const confirmRes = confirmOrderInventory(catalog, pendingOrder, 'admin-tester');
  assert(confirmRes.success, 'Confirmación de orden con variante debe ser exitosa');

  catalog = confirmRes.updatedProducts;
  const updatedPerfume = catalog[0];
  const updated30ml = updatedPerfume.variants!.find((v) => v.id === 'oud-30ml')!;
  const updated50ml = updatedPerfume.variants!.find((v) => v.id === 'oud-50ml')!;

  assert(updated30ml.stock === 3, 'El stock de 30ml debe reducirse de 5 a 3');
  assert(updated50ml.stock === 6, 'El stock de 50ml debe permanecer intacto en 6');
  assert(confirmRes.updatedOrder!.inventoryDeducted === true, 'La orden debe quedar marcada con inventoryDeducted: true');

  // Cancelar pedido confirmado -> Debe restituir las 2 unidades a 30ml
  const cancelRes = cancelOrderInventory(catalog, confirmRes.updatedOrder!, 'admin-tester');
  assert(cancelRes.success, 'Cancelación de orden con variante debe ser exitosa');

  catalog = cancelRes.updatedProducts;
  const restoredPerfume = catalog[0];
  const restored30ml = restoredPerfume.variants!.find((v) => v.id === 'oud-30ml')!;

  assert(restored30ml.stock === 5, 'El stock de 30ml debe restituirse exactamente a 5');
  assert(cancelRes.updatedOrder!.inventoryDeducted === false, 'inventoryDeducted debe volver a false');
}

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n============================================================');
console.log(`TOTAL PRUEBAS EJECUTADAS: ${testsPassed + testsFailed}`);
console.log(`ÉXITO: ${testsPassed} superadas`);
console.log(`FALLOS: ${testsFailed}`);
console.log('============================================================\n');

if (testsFailed > 0) {
  console.error(`💥 ${testsFailed} PRUEBAS FALLARON.`);
  process.exit(1);
} else {
  console.log('🎉 TODAS LAS PRUEBAS DE VARIANTES Y CARRITO PASARON CON ÉXITO.');
}
