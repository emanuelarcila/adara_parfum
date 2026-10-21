import React, { useEffect } from 'react';
import { CartItem } from '../../types';
import { formatCOP } from '../../data/mockData';
import { X, Plus, Minus, Trash2, ArrowRight, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
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

  const subtotal = items.reduce((acc, item) => acc + item.product.priceCOP * item.quantity, 0);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // Generate WhatsApp order message
  const handleWhatsAppCheckout = () => {
    const orderLines = items
      .map((item) => `• ${item.product.name} (x${item.quantity}) - ${formatCOP(item.product.priceCOP * item.quantity)}`)
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
              {items.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    paddingBottom: '20px',
                    borderBottom: '1px solid rgba(56, 48, 36, 0.4)'
                  }}
                >
                  {/* Thumbnail */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    style={{
                      width: '72px',
                      height: '84px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      backgroundColor: '#111'
                    }}
                  />

                  {/* Info */}
                  <div>
                    <h4 style={{ fontSize: '16px', margin: 0, color: 'var(--color-ivory)' }}>
                      {item.product.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {item.product.volume}
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-gold)', margin: '4px 0 8px' }}>
                      {formatCOP(item.product.priceCOP)}
                    </p>

                    {/* Stepper */}
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
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-ivory)', padding: '4px 8px' }}
                        aria-label="Restar una unidad"
                      >
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: '12px', minWidth: '18px', textAlign: 'center', fontWeight: 600 }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-ivory)', padding: '4px 8px' }}
                        aria-label="Sumar una unidad"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-tertiary)',
                      padding: '8px'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
                    aria-label={`Eliminar ${item.product.name} de la bolsa`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
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
            {/* Free shipping banner */}
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
              onClick={handleWhatsAppCheckout}
              data-cursor="PEDIDO"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px 24px',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-obsidian)',
                border: 'none',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(198, 161, 91, 0.25)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold)')}
            >
              <MessageSquare size={16} />
              <span>Coordinar Pedido por WhatsApp</span>
              <ArrowRight size={15} />
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
