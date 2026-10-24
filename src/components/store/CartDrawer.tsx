import React, { useEffect } from 'react';
import { CartItem, Order, getCartItemKey } from '../../types';
import { formatCOP } from '../../data/mockData';
import { createWhatsAppOrder } from '../../services/orderInventoryService';
import { X, Plus, Minus, Trash2, ArrowRight, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Propiedades del cajón lateral (drawer) de la bolsa de compras.
 */
interface CartDrawerProps {
  /** Indica si el drawer lateral se encuentra visible en pantalla. */
  isOpen: boolean;
  /** Disparador para cerrar el cajón lateral. */
  onClose: () => void;
  /** Lista de artículos presentes actualmente en el carrito. */
  items: CartItem[];
  /** Función para incrementar o decrementar la cantidad de una línea específica. */
  onUpdateQuantity: (productId: string, delta: number, variantId?: string) => void;
  /** Función para remover completamente una línea del carrito. */
  onRemoveItem: (productId: string, variantId?: string) => void;
  /** Función para vaciar la totalidad de los artículos de la bolsa. */
  onClearCart: () => void;
  /** Callback opcional invocado al despachar la orden hacia WhatsApp para persistirla en la cola de pedidos. */
  onInitiateWhatsAppOrder?: (order: Order) => void;
}

/**
 * Resuelve de forma segura el precio unitario en COP de un artículo del carrito.
 *
 * @remarks
 * Mantiene compatibilidad retrospectiva priorizando `unitPriceCOP` congelado en la línea,
 * o consultando la variante respectiva (`variantId`) o el precio base del producto.
 *
 * @param item - Artículo del carrito a evaluar {@link CartItem}.
 * @returns Precio numérico en COP o `null` si no tiene precio asignado.
 */
export const getItemUnitPrice = (item: CartItem): number | null => {
  if (typeof item.unitPriceCOP === 'number') {
    return item.unitPriceCOP;
  }
  if (item.variantId && Array.isArray(item.product.variants)) {
    const v = item.product.variants.find((vr) => vr.id === item.variantId);
    if (v && typeof v.priceCOP === 'number') return v.priceCOP;
  }
  return typeof item.product.priceCOP === 'number' ? item.product.priceCOP : null;
};

/**
 * Obtiene la denominación de volumen o presentación del artículo (ej. '30ml', '50ml', '100ml').
 *
 * @param item - Artículo del carrito {@link CartItem}.
 * @returns Cadena con el volumen o texto vacío si no está especificado.
 */
export const getItemVolume = (item: CartItem): string => {
  if (item.volume && item.volume.trim().length > 0) return item.volume;
  if (item.variantId && Array.isArray(item.product.variants)) {
    const v = item.product.variants.find((vr) => vr.id === item.variantId);
    if (v && v.volume) return v.volume;
  }
  return item.product.volume || '';
};

/**
 * Determina el límite máximo de existencias físicas disponibles para el artículo del carrito.
 *
 * @param item - Línea del carrito {@link CartItem}.
 * @returns Número entero con el stock disponible o 99 por defecto en catálogos sin control de existencias.
 */
export const getItemMaxStock = (item: CartItem): number => {
  if (item.variantId && Array.isArray(item.product.variants)) {
    const v = item.product.variants.find((vr) => vr.id === item.variantId);
    if (v && typeof v.stock === 'number') {
      return v.stock;
    }
  }
  return typeof item.product.stock === 'number' ? item.product.stock : 99;
};

/**
 * Cajón lateral deslizante (Drawer) de la bolsa de compras de ADARA PARFUM.
 *
 * @remarks
 * Despliega los artículos añadidos con desglose de presentación (volumen), precio unitario y subtotal.
 * Valida que no existan artículos sin precio o con cantidades superiores al inventario disponible.
 * Genera el pedido formal de WhatsApp en estado 'pending' (sin descontar inventario antes de la confirmación)
 * y redirige al chat oficial de la boutique con el mensaje preformateado.
 *
 * @param props - Propiedades del componente {@link CartDrawerProps}.
 * @returns Elemento JSX que renderiza el cajón o `null` si `isOpen === false`.
 */
export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onInitiateWhatsAppOrder
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasUnpricedItems = items.some((item) => {
    const price = getItemUnitPrice(item);
    return price === null || price <= 0;
  });

  const hasOverstockItems = items.some((item) => {
    const maxStock = getItemMaxStock(item);
    return item.quantity > maxStock;
  });

  const canCheckout = items.length > 0 && !hasUnpricedItems && !hasOverstockItems;

  const subtotal = items.reduce((acc, item) => {
    const price = getItemUnitPrice(item);
    return acc + (price && price > 0 ? price * item.quantity : 0);
  }, 0);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Generate WhatsApp order message with verified price checks & register pending order safely
  const handleWhatsAppCheckout = () => {
    if (!canCheckout) return;

    // Registrar pedido en cola administrativa en estado pending SIN descontar stock
    const waRes = createWhatsAppOrder(items);
    if (waRes.success && waRes.order && onInitiateWhatsAppOrder) {
      onInitiateWhatsAppOrder(waRes.order);
    }

    const orderLines = items
      .map((item) => {
        const unitPrice = getItemUnitPrice(item);
        const volume = getItemVolume(item);
        const volumeStr = volume ? ` [${volume}]` : '';
        const lineTotal = typeof unitPrice === 'number' && unitPrice > 0
          ? formatCOP(unitPrice * item.quantity)
          : 'Bajo consulta';
        const unitPriceStr = typeof unitPrice === 'number' && unitPrice > 0
          ? ` (${formatCOP(unitPrice)} c/u)`
          : '';
        return `• ${item.product.name}${volumeStr} (x${item.quantity}) - ${lineTotal}${unitPriceStr}`;
      })
      .join('%0A');

    const message = `Hola ADARA PARFUM, deseo coordinar mi pedido:%0A%0A${orderLines}%0A%0A*Total Estimado:* ${formatCOP(subtotal)}%0A%0A¿Tienen disponibilidad para despacho inmediato?`;
    window.open(`https://wa.me/573000000000?text=${message}`, '_blank');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(11, 11, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'opacity 0.3s ease'
      }}
      onClick={onClose}
    >
      <aside
        className="liquid-glass animate-rise"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'rgba(17, 17, 15, 0.94)',
          borderLeft: '1px solid var(--color-border-gold)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          padding: '32px 28px'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Bolsa de compra"
      >
        {/* Drawer Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: '4px' }}>
              Tu Selección
            </div>
            <h2 style={{ fontSize: '26px', margin: 0, color: 'var(--color-ivory)' }}>
              Bolsa ({totalItems < 10 ? `0${totalItems}` : totalItems})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 8px'
                }}
              >
                Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              data-cursor="CERRAR"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-ivory)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              aria-label="Cerrar bolsa"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0' }}>
          {items.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px'
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(198, 161, 91, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  border: '1px solid var(--color-border)'
                }}
              >
                <Sparkles size={24} color="var(--color-gold)" />
              </div>
              <h3 style={{ fontSize: '22px', marginBottom: '8px', color: 'var(--color-ivory)' }}>
                Tu bolsa está vacía
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '260px', lineHeight: 1.6 }}>
                Explora la colección y añade fragancias para iniciar tu experiencia sensorial.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item) => {
                const itemKey = getCartItemKey(item.product.id, item.variantId);
                const volume = getItemVolume(item);
                const unitPrice = getItemUnitPrice(item);
                const maxStock = getItemMaxStock(item);

                return (
                  <div
                    key={itemKey}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr auto',
                      gap: '16px',
                      alignItems: 'center',
                      paddingBottom: '20px',
                      borderBottom: '1px solid rgba(56, 48, 36, 0.4)'
                    }}
                  >
                    {/* Thumbnail & Fallback */}
                    <div
                      style={{
                        width: '72px',
                        height: '84px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#141412',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: '4px' }}>
                          <span style={{ fontSize: '9px', color: 'var(--color-gold)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            ADARA
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h4 style={{ fontSize: '15px', margin: 0, color: 'var(--color-ivory)' }}>
                        {item.product.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                        {volume && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(198, 161, 91, 0.15)',
                              color: 'var(--color-gold)',
                              border: '1px solid rgba(198, 161, 91, 0.3)'
                            }}
                          >
                            {volume}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {item.product.brand || 'ADARA PARFUM'}
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gold)', margin: '6px 0 8px' }}>
                        {unitPrice && unitPrice > 0 ? (
                          <>
                            <span>{formatCOP(unitPrice * item.quantity)}</span>
                            {item.quantity > 1 && (
                              <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 400, marginLeft: '6px' }}>
                                ({formatCOP(unitPrice)} c/u)
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={{ color: 'var(--color-gold-light)', fontStyle: 'italic', fontSize: '11px' }}>
                            Bajo consulta
                          </span>
                        )}
                      </p>

                      {/* Stepper with stock clamping */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          backgroundColor: 'rgba(11, 11, 10, 0.6)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '3px'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1, item.variantId)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-ivory)', padding: '4px 8px', cursor: 'pointer' }}
                          aria-label="Restar una unidad"
                        >
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: '12px', minWidth: '18px', textAlign: 'center', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= maxStock}
                          onClick={() => onUpdateQuantity(item.product.id, 1, item.variantId)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: item.quantity >= maxStock ? 'var(--color-text-tertiary)' : 'var(--color-ivory)',
                            padding: '4px 8px',
                            cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer'
                          }}
                          aria-label="Sumar una unidad"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id, item.variantId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        padding: '8px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
                      aria-label={`Eliminar ${item.product.name} de la bolsa`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div
            style={{
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Warning if unpriced items exist */}
            {hasUnpricedItems && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(217, 119, 6, 0.12)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  fontSize: '11px',
                  color: '#fbbf24',
                  lineHeight: 1.4
                }}
              >
                Atención: Su bolsa contiene fragancias cuyo precio está <strong>bajo consulta</strong>. Retírelas para liquidar pedido directo.
              </div>
            )}

            {/* Free shipping banner */}
            {!hasUnpricedItems && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(198, 161, 91, 0.1)',
                  border: '1px solid rgba(198, 161, 91, 0.25)',
                  fontSize: '11px',
                  color: 'var(--color-gold)'
                }}
              >
                <ShieldCheck size={14} />
                <span>Envío asegurado de cortesía en Colombia</span>
              </div>
            )}

            {/* Subtotal & Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-secondary)' }}>
                Total Estimado COP
              </span>
              <span style={{ fontSize: '22px', fontWeight: 600, color: 'var(--color-ivory)' }}>
                {formatCOP(subtotal)}
              </span>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              type="button"
              disabled={!canCheckout}
              onClick={handleWhatsAppCheckout}
              data-cursor={canCheckout ? 'PEDIDO' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px 24px',
                backgroundColor: canCheckout ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.04)',
                color: canCheckout ? 'var(--color-obsidian)' : 'var(--color-text-tertiary)',
                border: canCheckout ? 'none' : '1px solid var(--color-border)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                cursor: canCheckout ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: canCheckout ? '0 8px 24px rgba(198, 161, 91, 0.25)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (canCheckout) e.currentTarget.style.backgroundColor = 'var(--color-gold-light)';
              }}
              onMouseLeave={(e) => {
                if (canCheckout) e.currentTarget.style.backgroundColor = 'var(--color-gold)';
              }}
            >
              <MessageSquare size={16} />
              <span>
                {hasUnpricedItems
                  ? 'Bolsa con productos bajo consulta'
                  : hasOverstockItems
                  ? 'Ajustar cantidades a stock'
                  : 'Coordinar Pedido por WhatsApp'}
              </span>
              {canCheckout && <ArrowRight size={15} />}
            </button>

            <p style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: 0 }}>
              *Prototipo demostrativo · Conexión directa a canal oficial de atención
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
