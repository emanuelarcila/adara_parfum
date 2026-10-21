import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCOP } from '../../data/mockData';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface AdminInventoryProps {
  products: Product[];
  onAdjustStock: (productId: string, delta: number, reason: string) => void;
}

export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  onAdjustStock
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Llegada de nuevo lote de producción');

  const handleApplyAdjustment = (delta: number) => {
    if (!selectedProduct) return;
    onAdjustStock(selectedProduct.id, delta, adjustReason);
    setSelectedProduct(null);
  };

  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const criticalStockCount = products.filter((p) => p.stock <= p.threshold).length;
  const totalStockValue = products.reduce((acc, p) => acc + p.stock * p.priceCOP, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', margin: 0, color: 'var(--color-ivory)' }}>
          Control de Inventario & Stock Físico
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
          Monitoreo de existencias en taller de Bogotá, alertas de reposición y valorización
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="liquid-glass-card" style={{ padding: '20px', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
            Unidades Totales
          </span>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-ivory)', marginTop: '6px' }}>
            {totalStockUnits} frascos
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>6 referencias activas</span>
        </div>

        <div className="liquid-glass-card" style={{ padding: '20px', borderRadius: '6px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
            Valorización de Stock (COP)
          </span>
          <div style={{ fontSize: '26px', fontWeight: 600, color: 'var(--color-gold)', marginTop: '6px' }}>
            {formatCOP(totalStockValue)}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>A precio de venta</span>
        </div>

        <div
          className="liquid-glass-card"
          style={{
            padding: '20px',
            borderRadius: '6px',
            border: criticalStockCount > 0 ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid var(--color-border)'
          }}
        >
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
            Referencias en Alerta
          </span>
          <div style={{ fontSize: '26px', fontWeight: 600, color: criticalStockCount > 0 ? 'var(--color-warning)' : 'var(--color-success)', marginTop: '6px' }}>
            {criticalStockCount} en umbral crítico
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Bajo nivel de seguridad</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="liquid-glass-card" style={{ borderRadius: '6px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)', textAlign: 'left' }}>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Fragancia</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Stock Actual</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Umbral Mínimo</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Estado Operativo</th>
              <th style={{ padding: '14px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px' }}>Valor en Stock</th>
              <th style={{ padding: '14px 20px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10px', textAlign: 'right' }}>Ajustar</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const isLow = p.stock <= p.threshold;
              const isZero = p.stock === 0;
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(56, 48, 36, 0.35)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#111' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{p.family} · 100ml</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, fontSize: '14px', color: 'var(--color-ivory)' }}>
                    {p.stock} uds
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-text-secondary)' }}>
                    {p.threshold} uds mín.
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        backgroundColor: isZero
                          ? 'rgba(248, 113, 113, 0.12)'
                          : isLow
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(74, 222, 128, 0.12)',
                        color: isZero
                          ? 'var(--color-danger)'
                          : isLow
                          ? 'var(--color-warning)'
                          : 'var(--color-success)'
                      }}
                    >
                      {isZero ? <AlertTriangle size={12} /> : isLow ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      <span>{isZero ? 'Agotado' : isLow ? 'Stock Bajo' : 'Óptimo'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {formatCOP(p.stock * p.priceCOP)}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(p)}
                      style={{
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
                      Ajustar Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Modal */}
      {selectedProduct && (
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
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="liquid-glass animate-rise"
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'rgba(23, 23, 20, 0.98)',
              borderRadius: '8px',
              padding: '32px',
              border: '1px solid var(--color-border-gold)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--color-ivory)' }}>
                Ajustar Stock: {selectedProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Stock actual: <strong style={{ color: 'var(--color-ivory)' }}>{selectedProduct.stock} unidades</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Cantidad a Modificar
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Motivo del Movimiento
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#111', border: '1px solid var(--color-border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                >
                  <option value="Llegada de nuevo lote de producción">Llegada de nuevo lote de producción</option>
                  <option value="Muestra para prensa / cliente VIP">Muestra para prensa / cliente VIP</option>
                  <option value="Ajuste de inventario físico periódico">Ajuste de inventario físico periódico</option>
                  <option value="Merma o frasco dañado">Merma o frasco dañado</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyAdjustment(-adjustAmount)}
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(248, 113, 113, 0.12)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    color: 'var(--color-danger)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  - Descontar ({adjustAmount})
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyAdjustment(adjustAmount)}
                  style={{
                    padding: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(74, 222, 128, 0.15)',
                    border: '1px solid rgba(74, 222, 128, 0.4)',
                    color: 'var(--color-success)',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  + Agregar ({adjustAmount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
