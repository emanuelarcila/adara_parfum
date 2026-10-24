import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCOP } from '../../data/mockData';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

/**
 * Propiedades del módulo de gestión de inventario y taller.
 */
interface AdminInventoryProps {
  /** Catálogo de productos con información de existencias. */
  products: Product[];
  /** Callback para asentar ajustes manuales de stock con justificación auditable. */
  onAdjustStock: (productId: string, delta: number, reason: string, variantId?: string) => void;
}

/**
 * Devuelve el stock total efectivo de un producto (suma de variantes si aplica o stock base).
 *
 * @param p - Fragancia a cuantificar.
 * @returns Número total de unidades físicas disponibles.
 */
function getProductEffectiveStock(p: Product): number {
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    return p.variants.reduce((sum, v) => sum + (typeof v.stock === 'number' ? v.stock : 0), 0);
  }
  return typeof p.stock === 'number' ? p.stock : 0;
}

/**
 * Devuelve la valorización en COP de un producto (suma de variante.stock * variante.priceCOP).
 *
 * @param p - Fragancia a valorizar.
 * @returns Valorización monetaria total en pesos colombianos.
 */
function getProductEffectiveValue(p: Product): number {
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    return p.variants.reduce((sum, v) => {
      const price = typeof v.priceCOP === 'number' && v.priceCOP > 0 ? v.priceCOP : (p.priceCOP || 0);
      const stock = typeof v.stock === 'number' ? v.stock : 0;
      return sum + stock * price;
    }, 0);
  }
  return (typeof p.stock === 'number' ? p.stock : 0) * (typeof p.priceCOP === 'number' ? p.priceCOP : 0);
}

/**
 * Evalúa si el producto o alguna de sus variantes está en estado crítico (stock <= umbral).
 *
 * @param p - Fragancia a evaluar.
 * @returns `true` si el stock está por debajo o igual al umbral mínimo de seguridad.
 */
function isProductCritical(p: Product): boolean {
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    return p.variants.some((v) => {
      const th = typeof v.threshold === 'number' ? v.threshold : (p.threshold ?? 3);
      return (typeof v.stock === 'number' ? v.stock : 0) <= th;
    });
  }
  return (typeof p.stock === 'number' ? p.stock : 0) <= (p.threshold ?? 3);
}

/**
 * Evalúa si el producto o todas sus variantes están agotadas (0 uds).
 *
 * @param p - Fragancia a evaluar.
 * @returns `true` si todas las presentaciones tienen 0 unidades.
 */
function isProductFullyOutOfStock(p: Product): boolean {
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    return p.variants.every((v) => (typeof v.stock === 'number' ? v.stock : 0) === 0);
  }
  return (typeof p.stock === 'number' ? p.stock : 0) === 0;
}

/**
 * Módulo de control de inventario físico, valoración de existencias y ajustes manuales.
 *
 * @remarks
 * Calcula el inventario global consolidado y valorizado a precios de catálogo,
 * supervisa umbrales críticos de seguridad por variante y fragancia base,
 * y permite abrir modales de ajuste rápido (+delta para maceración/ingresos, -delta para mermas/roturas)
 * con selección explícita de presentación cuando el producto maneja variantes.
 *
 * @param props - Propiedades del componente {@link AdminInventoryProps}.
 * @returns Elemento JSX representativo del módulo de almacén.
 */
export const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  onAdjustStock
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(5);
  const [adjustReason, setAdjustReason] = useState<string>('Llegada de nuevo lote de producción');

  // Al abrir el modal de un producto, inicializar la variante seleccionada si tiene variantes
  const handleOpenAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setSelectedVariantId(product.variants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setAdjustAmount(5);
  };

  const handleApplyAdjustment = (delta: number) => {
    if (!selectedProduct) return;
    const variantIdToPass = (Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0)
      ? selectedVariantId
      : undefined;

    onAdjustStock(selectedProduct.id, delta, adjustReason, variantIdToPass);
    setSelectedProduct(null);
  };

  // KPIs calculados respetando la fuente de verdad (variantes independientes o stock base)
  const totalStockUnits = products.reduce((acc, p) => acc + getProductEffectiveStock(p), 0);
  const totalStockValue = products.reduce((acc, p) => acc + getProductEffectiveValue(p), 0);
  const criticalStockCount = products.filter(isProductCritical).length;

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
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{products.length} referencias en catálogo</span>
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
              const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
              const effectiveStock = getProductEffectiveStock(p);
              const effectiveValue = getProductEffectiveValue(p);
              const isZero = isProductFullyOutOfStock(p);
              const isCritical = isProductCritical(p);

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(56, 48, 36, 0.35)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{ width: '40px', height: '48px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#111' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '48px',
                            borderRadius: '4px',
                            backgroundColor: '#161614',
                            border: '1px solid rgba(198, 161, 91, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ fontSize: '9px', color: 'var(--color-gold)', fontWeight: 700 }}>ADR</span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-ivory)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                          {p.family}{p.volume ? ` · ${p.volume}` : ''}
                        </div>
                        {hasVariants && (
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {p.variants!.map((v) => (
                              <span
                                key={v.id}
                                style={{
                                  fontSize: '10px',
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  backgroundColor: v.stock <= (v.threshold ?? 3)
                                    ? (v.stock === 0 ? 'rgba(248, 113, 113, 0.15)' : 'rgba(251, 191, 36, 0.15)')
                                    : 'rgba(255, 255, 255, 0.05)',
                                  color: v.stock <= (v.threshold ?? 3)
                                    ? (v.stock === 0 ? 'var(--color-danger)' : 'var(--color-warning)')
                                    : 'var(--color-text-secondary)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                              >
                                {v.volume}: <strong>{v.stock}</strong> uds
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 600, fontSize: '14px', color: 'var(--color-ivory)' }}>
                    {effectiveStock} uds
                    {hasVariants && (
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                        Total consolidado
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-text-secondary)' }}>
                    {p.threshold ?? 3} uds mín.
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
                          : isCritical
                          ? 'rgba(251, 191, 36, 0.12)'
                          : 'rgba(74, 222, 128, 0.12)',
                        color: isZero
                          ? 'var(--color-danger)'
                          : isCritical
                          ? 'var(--color-warning)'
                          : 'var(--color-success)'
                      }}
                    >
                      {isZero ? <AlertTriangle size={12} /> : isCritical ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                      <span>{isZero ? 'Agotado' : isCritical ? 'Stock Bajo' : 'Óptimo'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--color-gold)', fontWeight: 600 }}>
                    {effectiveValue > 0 ? (
                      formatCOP(effectiveValue)
                    ) : (
                      <span style={{ color: 'var(--color-gold-light)', fontStyle: 'italic', fontSize: '11px' }}>
                        Bajo consulta
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenAdjustModal(p)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(198, 161, 91, 0.12)',
                        border: '1px solid var(--color-border-gold)',
                        color: 'var(--color-gold)',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        cursor: 'pointer'
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
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Selector de variante si el producto tiene presentaciones múltiples */}
            {Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 ? (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Presentación / Variante a Ajustar
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#111',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px'
                  }}
                >
                  {selectedProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.volume} — Stock actual: {v.stock} uds {v.priceCOP ? `(${formatCOP(v.priceCOP)})` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px', marginBottom: 0 }}>
                  Stock de presentación seleccionada:{' '}
                  <strong style={{ color: 'var(--color-gold)' }}>
                    {selectedProduct.variants.find((v) => v.id === selectedVariantId)?.stock ?? 0} unidades
                  </strong>
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                Stock actual: <strong style={{ color: 'var(--color-ivory)' }}>{selectedProduct.stock} unidades</strong>
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Cantidad de Frascos a Modificar
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
                    textTransform: 'uppercase',
                    cursor: 'pointer'
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
                    textTransform: 'uppercase',
                    cursor: 'pointer'
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
