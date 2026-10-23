import React, { useState } from 'react';
import {
  Product,
  ProductVariantItem,
  Order,
  SalesChannel,
  PaymentStatus,
  CartItem
} from '../../types';
import { formatCOP } from '../../data/mockData';
import { createBaseOrder, getColombiaNowString } from '../../services/orderInventoryService';
import { Plus, Trash2, CheckCircle2, User, Phone, MapPin } from 'lucide-react';

interface AdminManualSaleProps {
  products: Product[];
  onCompleteSale: (newOrder: Order) => boolean | void;
  /** Muestra un mensaje de error tipo toast desde el padre. */
  onError?: (message: string) => void;
}

/**
 * Una línea del formulario de venta manual.
 * variantId es opcional: solo existe cuando el producto seleccionado tiene variantes.
 */
interface SaleLine {
  productId: string;
  /** ID de variante seleccionada (solo cuando el producto tiene variants). */
  variantId: string | undefined;
  quantity: number;
}

/** Devuelve las variantes activas de un producto, o [] si no tiene variantes. */
function getActiveVariants(product: Product | undefined): ProductVariantItem[] {
  if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return [];
  return product.variants.filter((v) => v.status === 'active' || v.status === 'sold-out');
}

/** Precio unitario para la línea: preferencia variante > producto padre. */
function getLineUnitPrice(product: Product | undefined, variantId: string | undefined): number {
  if (!product) return 0;
  if (variantId && Array.isArray(product.variants)) {
    const v = product.variants.find((vr) => vr.id === variantId);
    if (v && typeof v.priceCOP === 'number' && v.priceCOP > 0) return v.priceCOP;
  }
  return typeof product.priceCOP === 'number' && product.priceCOP > 0 ? product.priceCOP : 0;
}

/** Stock disponible para la línea: variante si aplica, producto padre si no. */
function getLineStock(product: Product | undefined, variantId: string | undefined): number {
  if (!product) return 0;
  if (variantId && Array.isArray(product.variants)) {
    const v = product.variants.find((vr) => vr.id === variantId);
    if (v && typeof v.stock === 'number') return v.stock;
  }
  return typeof product.stock === 'number' ? product.stock : 0;
}

export const AdminManualSale: React.FC<AdminManualSaleProps> = ({
  products,
  onCompleteSale,
  onError
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('Bogotá, D.C.');
  const [channel, setChannel] = useState<SalesChannel>('WhatsApp');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancolombia / Nequi');
  const [notes, setNotes] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const firstProductId = products[0]?.id || '';
  const firstVariant = getActiveVariants(products[0])?.[0];

  const [lines, setLines] = useState<SaleLine[]>([
    {
      productId: firstProductId,
      variantId: firstVariant?.id,
      quantity: 1
    }
  ]);

  // ── Handlers de líneas ──────────────────────────────────────────────────

  const handleAddLine = () => {
    const firstV = getActiveVariants(products[0])?.[0];
    setLines((prev) => [
      ...prev,
      { productId: firstProductId, variantId: firstV?.id, quantity: 1 }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    const firstV = getActiveVariants(product)?.[0];
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? { productId, variantId: firstV?.id, quantity: 1 }
          : line
      )
    );
  };

  const handleUpdateLineVariant = (index: number, variantId: string) => {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, variantId, quantity: 1 } : line
      )
    );
  };

  const handleUpdateLineQuantity = (index: number, delta: number) => {
    const line = lines[index];
    const product = products.find((p) => p.id === line.productId);
    const maxStock = getLineStock(product, line.variantId);
    // Limitar al stock disponible (máx 99 si no hay stock definido)
    const effectiveMax = maxStock > 0 ? maxStock : 99;
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== index) return l;
        const newQty = Math.max(1, Math.min(l.quantity + delta, effectiveMax));
        return { ...l, quantity: newQty };
      })
    );
  };

  // ── Cálculos de vista ───────────────────────────────────────────────────

  const lineDetails = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId) || products[0];
    const variant = line.variantId
      ? product?.variants?.find((v) => v.id === line.variantId)
      : undefined;
    const unitPrice = getLineUnitPrice(product, line.variantId);
    const stock = getLineStock(product, line.variantId);
    const subtotal = unitPrice * line.quantity;
    const volume = variant?.volume || product?.volume || undefined;
    return { ...line, product, variant, unitPrice, stock, subtotal, volume };
  });

  const grandTotal = lineDetails.reduce((acc, d) => acc + d.subtotal, 0);
  const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0);

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!customerName.trim()) {
      setLocalError('El nombre del cliente es obligatorio.');
      return;
    }

    // Validación de stock y precio antes de construir la orden
    for (const d of lineDetails) {
      if (!d.product) {
        setLocalError('Hay líneas con un producto no válido.');
        return;
      }
      if (d.unitPrice <= 0) {
        const label = d.variant
          ? `${d.product.name} (${d.variant.volume})`
          : d.product.name;
        setLocalError(
          `'${label}' no tiene precio definido. Define el precio en el catálogo antes de registrar la venta.`
        );
        return;
      }
      if (d.quantity > d.stock) {
        const label = d.variant
          ? `${d.product.name} (${d.variant.volume})`
          : d.product.name;
        setLocalError(
          `Stock insuficiente para '${label}'. Disponibles en taller: ${d.stock} uds, solicitadas: ${d.quantity}.`
        );
        return;
      }
    }

    // Construir CartItem[] para usar createBaseOrder (centraliza la referencia y el ID)
    const cartItems: CartItem[] = lineDetails.map((d) => ({
      product: d.product!,
      variantId: d.variantId,
      volume: d.volume,
      unitPriceCOP: d.unitPrice,
      quantity: d.quantity
    }));

    const baseRes = createBaseOrder({
      cartItems,
      channel,
      paymentMethod: paymentMethod as any,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '',
      customerCity: customerCity.trim() || 'Por coordinar',
      notes: notes ? `${notes} · Método: ${paymentMethod}` : `Método: ${paymentMethod}`,
      referencePrefix: 'AD-MV'
    });

    if (!baseRes.success || !baseRes.order) {
      const msg = baseRes.error || 'No fue posible crear el pedido.';
      setLocalError(msg);
      if (onError) onError(msg);
      return;
    }

    // La venta manual se registra directamente en estado 'preparing'
    // con inventoryDeducted: true (registerManualSale en App.tsx descontará el stock)
    const finalOrder: Order = {
      ...baseRes.order,
      orderStatus: 'preparing',
      paymentStatus,
      inventoryDeducted: true,
      date: getColombiaNowString()
    };

    const saleSuccess = onCompleteSale(finalOrder);
    if (saleSuccess === false) {
      // La operación fue rechazada por App.tsx (ej. stock insuficiente), no mostrar éxito ni limpiar
      return;
    }
    setFeedbackSuccess(true);

    setTimeout(() => {
      setFeedbackSuccess(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      const firstV = getActiveVariants(products[0])?.[0];
      setLines([{ productId: firstProductId, variantId: firstV?.id, quantity: 1 }]);
    }, 2200);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
          Registro Rápido de Venta Manual
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
          Para transacciones directas por WhatsApp, concierge boutique, distribuidores o eventos
        </p>
      </div>

      {/* Feedback de éxito */}
      {feedbackSuccess && (
        <div
          className="liquid-glass animate-rise"
          style={{
            padding: '16px 20px',
            borderRadius: '6px',
            backgroundColor: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.4)',
            color: 'var(--color-success)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={20} />
          <span>¡Venta registrada con éxito! El stock y las estadísticas se han actualizado automáticamente.</span>
        </div>
      )}

      {/* Error local (no usa alert()) */}
      {localError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            backgroundColor: 'rgba(248, 113, 113, 0.12)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            color: 'var(--color-danger)',
            fontSize: '13px'
          }}
        >
          ⚠ {localError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Step 1: Datos del comprador */}
        <div
          className="liquid-glass-card"
          style={{ padding: '28px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: 600 }}>
            1. Datos del Comprador &amp; Canal
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="responsive-3col">
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Nombre del Cliente *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '10px 12px', gap: '8px' }}>
                <User size={15} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Ej: Camila Echeverri"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setLocalError(null); }}
                  required
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                WhatsApp / Teléfono
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '10px 12px', gap: '8px' }}>
                <Phone size={15} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="+57 312 000 0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Ciudad / Destino
              </label>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '10px 12px', gap: '8px' }}>
                <MapPin size={15} color="var(--color-text-tertiary)" />
                <input
                  type="text"
                  placeholder="Bogotá, Medellín, etc."
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '13px', width: '100%', outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="responsive-3col">
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Canal de Venta
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
                style={{ width: '100%', padding: '11px 12px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="WhatsApp">WhatsApp Oficial</option>
                <option value="Boutique Bogotá">Boutique Bogotá</option>
                <option value="Distribuidor">Distribuidor Aliado</option>
                <option value="Tienda Web">Tienda Web (Manual)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="Transferencia Bancolombia / Nequi">Transferencia Bancolombia / Nequi</option>
                <option value="Wompi / Tarjeta de Crédito">Wompi / Tarjeta de Crédito</option>
                <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                <option value="Datáfono Boutique">Datáfono Boutique</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Estado del Pago
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                style={{ width: '100%', padding: '11px 12px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
              >
                <option value="paid">Pagado / Confirmado</option>
                <option value="pending">Pendiente de Pago</option>
                <option value="on_delivery">Contra Entrega</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Fragancias del pedido */}
        <div
          className="liquid-glass-card"
          style={{ padding: '28px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: 600 }}>
              2. Fragancias del Pedido (Multi-línea)
            </div>
            <button
              type="button"
              onClick={handleAddLine}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: 'rgba(198, 161, 91, 0.12)',
                border: '1px solid var(--color-border-gold)',
                color: 'var(--color-gold)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              <Plus size={14} />
              <span>Añadir Otra Fragancia</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {lineDetails.map((line, idx) => {
              const variants = getActiveVariants(line.product);
              const hasVariants = variants.length > 0;
              const isOverStock = line.quantity > line.stock && line.stock > 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(11, 11, 10, 0.7)',
                    border: isOverStock
                      ? '1px solid rgba(248, 113, 113, 0.5)'
                      : '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.6fr) minmax(140px, 1fr) 100px 120px 36px', gap: '12px', alignItems: 'end' }}>
                    {/* Selector de producto */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                        Fragancia
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) => { handleUpdateLineProduct(idx, e.target.value); setLocalError(null); }}
                        style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1a1a18', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}{p.volume && !Array.isArray(p.variants) ? ` · ${p.volume}` : ''} — (Stock: {p.stock} uds)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de variante (solo si el producto tiene variantes) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                        Presentación
                      </label>
                      {hasVariants ? (
                        <select
                          value={line.variantId || ''}
                          onChange={(e) => { handleUpdateLineVariant(idx, e.target.value); setLocalError(null); }}
                          style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1a1a18', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
                        >
                          {variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.volume} — {v.priceCOP && v.priceCOP > 0 ? formatCOP(v.priceCOP) : 'Bajo consulta'} (Stock: {v.stock})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ padding: '8px 10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                          {line.product?.volume || 'Presentación única'}
                        </div>
                      )}
                    </div>

                    {/* Stepper de cantidad con límite de stock */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                        Cantidad
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1a1a18', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateLineQuantity(idx, -1)}
                          style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px' }}
                        >-</button>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateLineQuantity(idx, 1)}
                          disabled={line.stock > 0 && line.quantity >= line.stock}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: line.stock > 0 && line.quantity >= line.stock ? 'var(--color-text-tertiary)' : '#fff',
                            padding: '6px 10px'
                          }}
                        >+</button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                        Subtotal
                      </label>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: line.unitPrice > 0 ? 'var(--color-gold)' : 'var(--color-text-tertiary)', paddingTop: '6px' }}>
                        {line.unitPrice > 0 ? formatCOP(line.subtotal) : 'Sin precio'}
                      </div>
                    </div>

                    {/* Eliminar fila */}
                    <div style={{ paddingBottom: '2px' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length === 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: lines.length === 1 ? 'var(--color-text-tertiary)' : 'var(--color-danger)',
                          padding: '4px',
                          opacity: lines.length === 1 ? 0.3 : 1
                        }}
                        title="Eliminar fila"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Advertencia de stock */}
                  {isOverStock && (
                    <div style={{ fontSize: '11px', color: 'var(--color-danger)', padding: '4px 6px', backgroundColor: 'rgba(248,113,113,0.08)', borderRadius: '3px' }}>
                      ⚠ Stock disponible: {line.stock} uds. Reduce la cantidad.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Notas */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              Notas u Observaciones del Pedido
            </label>
            <input
              type="text"
              placeholder="Ej: Empaque especial, entrega en recepción, cliente VIP..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>

        {/* Total y confirmar */}
        <div
          className="liquid-glass"
          style={{
            padding: '24px 28px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)' }}>
              Total Liquidado (COP)
            </span>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-ivory)' }}>
              {formatCOP(grandTotal)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-gold)' }}>
              {totalUnits} frasco{totalUnits !== 1 ? 's' : ''} seleccionado{totalUnits !== 1 ? 's' : ''}
            </span>
          </div>

          <button
            type="submit"
            style={{
              padding: '16px 36px',
              backgroundColor: 'var(--color-gold)',
              color: 'var(--color-obsidian)',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.25s ease'
            }}
          >
            <CheckCircle2 size={18} />
            <span>Confirmar &amp; Registrar Venta</span>
          </button>
        </div>
      </form>
    </div>
  );
};
