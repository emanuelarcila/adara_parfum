import React, { useState } from 'react';
import { Product, Order, SalesChannel, PaymentStatus } from '../../types';
import { formatCOP } from '../../data/mockData';
import { Plus, Trash2, CheckCircle2, User, Phone, MapPin } from 'lucide-react';

interface AdminManualSaleProps {
  products: Product[];
  onCompleteSale: (newOrder: Order) => void;
}

interface SaleLine {
  productId: string;
  quantity: number;
}

export const AdminManualSale: React.FC<AdminManualSaleProps> = ({
  products,
  onCompleteSale
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('Bogotá, D.C.');
  const [channel, setChannel] = useState<SalesChannel>('WhatsApp');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancolombia / Nequi');
  const [notes, setNotes] = useState('');

  // Initial line
  const [lines, setLines] = useState<SaleLine[]>([
    { productId: products[0]?.id || '', quantity: 1 }
  ]);

  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Add line
  const handleAddLine = () => {
    setLines([...lines, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  // Remove line
  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Update line product
  const handleUpdateLineProduct = (index: number, productId: string) => {
    const next = [...lines];
    next[index].productId = productId;
    setLines(next);
  };

  // Update line quantity
  const handleUpdateLineQuantity = (index: number, delta: number) => {
    const next = [...lines];
    const newQty = Math.max(1, next[index].quantity + delta);
    next[index].quantity = newQty;
    setLines(next);
  };

  // Calculate Subtotal
  const lineDetails = lines.map((line) => {
    const p = products.find((prod) => prod.id === line.productId) || products[0];
    const subtotal = p ? p.priceCOP * line.quantity : 0;
    return { ...line, product: p, subtotal };
  });

  const grandTotal = lineDetails.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || lines.length === 0) return;

    const orderReference = `AD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      reference: orderReference,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerName,
      customerPhone: customerPhone || '+57 300 000 0000',
      customerCity,
      channel,
      items: lineDetails.map((l) => ({
        productId: l.product.id,
        productName: `${l.product.name} (100ml)`,
        quantity: l.quantity,
        unitPriceCOP: l.product.priceCOP
      })),
      totalCOP: grandTotal,
      paymentStatus,
      orderStatus: 'preparing',
      notes: notes ? `${notes} · Método: ${paymentMethod}` : `Método: ${paymentMethod}`
    };

    onCompleteSale(newOrder);
    setFeedbackSuccess(true);

    // Reset Form
    setTimeout(() => {
      setFeedbackSuccess(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setLines([{ productId: products[0]?.id || '', quantity: 1 }]);
    }, 2000);
  };

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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Step 1: Customer & Channel Details */}
        <div
          className="liquid-glass-card"
          style={{ padding: '28px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-gold)', fontWeight: 600 }}>
            1. Datos del Comprador & Canal
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
                  onChange={(e) => setCustomerName(e.target.value)}
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

        {/* Step 2: Multi-line Fragrance Selector */}
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
            {lineDetails.map((line, idx) => (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 1.8fr) 110px 140px 40px',
                  gap: '14px',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(11, 11, 10, 0.7)',
                  border: '1px solid var(--color-border)'
                }}
              >
                {/* Product Select */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                    Fragancia
                  </label>
                  <select
                    value={line.productId}
                    onChange={(e) => handleUpdateLineProduct(idx, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1a1a18',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.volume} — ({formatCOP(p.priceCOP)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity Stepper */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                    Cantidad
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#1a1a18',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQuantity(idx, -1)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px' }}
                    >
                      -
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '12px', fontWeight: 600 }}>
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateLineQuantity(idx, 1)}
                      style={{ background: 'none', border: 'none', color: '#fff', padding: '6px 10px' }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Line Subtotal */}
                <div>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '4px' }}>
                    Subtotal
                  </label>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-gold)', paddingTop: '6px' }}>
                    {formatCOP(line.subtotal)}
                  </div>
                </div>

                {/* Remove button */}
                <div style={{ paddingTop: '16px' }}>
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
            ))}
          </div>

          {/* Notes */}
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

        {/* Total Calculation & Confirm Button */}
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
              {lines.reduce((acc, l) => acc + l.quantity, 0)} frascos de extracto seleccionados
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
            <span>Confirmar & Registrar Venta</span>
          </button>
        </div>
      </form>
    </div>
  );
};
