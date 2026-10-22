import React, { useState } from 'react';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { formatCOP } from '../../data/mockData';
import { Search, Eye, X } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus
}) => {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const filteredOrders = orders.filter((ord) => {
    const matchSearch =
      search === '' ||
      ord.reference.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerCity.toLowerCase().includes(search.toLowerCase());
    const matchChannel = filterChannel === 'all' || ord.channel === filterChannel;
    return matchSearch && matchChannel;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
            Gestión de Pedidos & Envíos
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Control de órdenes de compra, despachos y estado de pago multicanal
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="liquid-glass"
        style={{
          padding: '16px 20px',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'rgba(11, 11, 10, 0.7)',
            padding: '8px 14px',
            borderRadius: '4px',
            border: '1px solid var(--color-border)',
            minWidth: '280px'
          }}
        >
          <Search size={14} color="var(--color-gold)" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar referencia, cliente o ciudad..."
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ivory)',
              fontSize: '12px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Canal:
          </span>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            style={{
              backgroundColor: 'rgba(11, 11, 10, 0.8)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              padding: '6px 12px',
              color: 'var(--color-ivory)',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="all">Todos los canales</option>
            <option value="Tienda Web">Tienda Web</option>
            <option value="WhatsApp">WhatsApp Oficial</option>
            <option value="Boutique Bogotá">Boutique Bogotá</option>
            <option value="Distribuidor">Distribuidor</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div
        className="liquid-glass-card"
        style={{ borderRadius: '6px', overflow: 'hidden' }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Referencia</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Fecha</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Cliente</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Canal</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Total COP</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Pago</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Entrega</th>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', textAlign: 'right' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((ord) => (
              <tr key={ord.id} style={{ borderBottom: '1px solid rgba(56, 48, 36, 0.35)' }}>
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--color-gold)', fontWeight: 600 }}>
                  {ord.reference}
                </td>
                <td style={{ padding: '14px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                  {ord.date}
                </td>
                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{ord.customerName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{ord.customerCity}</div>
                </td>
                <td style={{ padding: '14px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--color-text-secondary)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {ord.channel}
                  </span>
                </td>
                <td style={{ padding: '14px', fontWeight: 600, color: 'var(--color-ivory)' }}>
                  {formatCOP(ord.totalCOP)}
                </td>
                <td style={{ padding: '14px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor:
                        ord.paymentStatus === 'paid'
                          ? 'rgba(74, 222, 128, 0.12)'
                          : ord.paymentStatus === 'pending'
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(96, 165, 250, 0.12)',
                      color:
                        ord.paymentStatus === 'paid'
                          ? 'var(--color-success)'
                          : ord.paymentStatus === 'pending'
                          ? 'var(--color-warning)'
                          : 'var(--color-info)'
                    }}
                  >
                    {ord.paymentStatus === 'paid'
                      ? 'Pagado'
                      : ord.paymentStatus === 'pending'
                      ? 'Pendiente'
                      : 'Contra Entrega'}
                  </span>
                </td>
                <td style={{ padding: '14px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      backgroundColor:
                        ord.orderStatus === 'delivered'
                          ? 'rgba(74, 222, 128, 0.12)'
                          : ord.orderStatus === 'shipped'
                          ? 'rgba(96, 165, 250, 0.12)'
                          : ord.orderStatus === 'cancelled'
                          ? 'rgba(248, 113, 113, 0.12)'
                          : 'rgba(251, 191, 36, 0.12)',
                      color:
                        ord.orderStatus === 'delivered'
                          ? 'var(--color-success)'
                          : ord.orderStatus === 'shipped'
                          ? 'var(--color-info)'
                          : ord.orderStatus === 'cancelled'
                          ? 'var(--color-danger)'
                          : 'var(--color-warning)'
                    }}
                  >
                    {ord.orderStatus === 'delivered'
                      ? 'Entregado'
                      : ord.orderStatus === 'shipped'
                      ? 'Enviado'
                      : ord.orderStatus === 'cancelled'
                      ? 'Cancelado'
                      : 'Preparación'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(ord)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-ivory)',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={13} />
                    <span>Ver</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backgroundColor: 'rgba(11, 11, 10, 0.85)',
            backdropFilter: 'blur(12px)'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="liquid-glass animate-rise"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'rgba(23, 23, 20, 0.98)',
              borderRadius: '8px',
              padding: '32px',
              border: '1px solid var(--color-border-gold)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-gold)' }}>
                  Detalle del Pedido
                </span>
                <h3 style={{ fontSize: '22px', margin: '4px 0 0', color: 'var(--color-ivory)' }}>
                  {selectedOrder.reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '13px' }}>
              <div style={{ padding: '14px', borderRadius: '4px', backgroundColor: 'rgba(11, 11, 10, 0.6)', border: '1px solid var(--color-border)' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-ivory)' }}>Cliente: {selectedOrder.customerName}</p>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>Teléfono: {selectedOrder.customerPhone}</p>
                <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '12px' }}>Destino: {selectedOrder.customerCity}</p>
                {selectedOrder.notes && (
                  <p style={{ margin: '8px 0 0', color: 'var(--color-gold)', fontStyle: 'italic', fontSize: '12px' }}>
                    Nota: "{selectedOrder.notes}"
                  </p>
                )}
              </div>

              {/* Items List */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
                  Fragancias Incluidas
                </span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(56, 48, 36, 0.3)'
                      }}
                    >
                      <span>{it.productName} (x{it.quantity})</span>
                      <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>{formatCOP(it.unitPriceCOP * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Changers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                {/* Inventory Status Indicator */}
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Inventario Físico:
                  </span>
                  {selectedOrder.orderStatus === 'cancelled' ? (
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>● Cancelado (Sin stock comprometido)</span>
                  ) : selectedOrder.inventoryDeducted ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>● Descontado y reservado en taller</span>
                  ) : (
                    <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>● Pendiente (Stock sin descontar)</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      Estado de Entrega
                    </label>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => {
                        const newStatus = e.target.value as OrderStatus;
                        onUpdateOrderStatus(selectedOrder.id, newStatus);
                        setSelectedOrder({
                          ...selectedOrder,
                          orderStatus: newStatus,
                          inventoryDeducted: newStatus === 'cancelled' ? false : (selectedOrder.inventoryDeducted || newStatus !== 'pending')
                        });
                      }}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    >
                      <option value="pending">Pendiente (Por confirmar)</option>
                      <option value="preparing">Preparación (Reserva stock)</option>
                      <option value="shipped">En camino / Enviado</option>
                      <option value="delivered">Entregado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Estado del Pago
                  </label>
                  <select
                    value={selectedOrder.paymentStatus}
                    onChange={(e) => {
                      onUpdatePaymentStatus(selectedOrder.id, e.target.value as PaymentStatus);
                      setSelectedOrder({ ...selectedOrder, paymentStatus: e.target.value as PaymentStatus });
                    }}
                    style={{ width: '100%', padding: '8px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                  >
                    <option value="paid">Confirmado / Pagado</option>
                    <option value="pending">Pendiente de Pago</option>
                    <option value="on_delivery">Contra Entrega</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Total COP */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Total Liquidado</span>
                <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-ivory)' }}>{formatCOP(selectedOrder.totalCOP)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
