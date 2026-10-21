import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { formatCOP } from '../../data/mockData';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setAddedAnimation(false);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [product, onClose]);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  return (
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
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
      onClick={onClose}
    >
      <div
        className="liquid-glass animate-rise"
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '8px',
          padding: '0',
          position: 'relative',
          backgroundColor: 'var(--color-surface-dark)',
          border: '1px solid var(--color-border-gold)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Detalle de ${product.name}`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          data-cursor="CERRAR"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 20,
            background: 'rgba(11, 11, 10, 0.6)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-ivory)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-gold)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 1.05fr) minmax(320px, 1.25fr)'
          }}
          className="modal-grid"
        >
          {/* Left: Product Visual */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#11110f',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid var(--color-border)'
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '520px',
                objectFit: 'cover'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                padding: '6px 12px',
                borderRadius: '4px',
                backgroundColor: 'rgba(11, 11, 10, 0.8)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(198, 161, 91, 0.25)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--color-gold)'
              }}
            >
              ADARA STUDIO · 100 ML
            </div>
          </div>

          {/* Right: Olfactory Experience & Specs */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
            <div className="eyebrow" style={{ marginBottom: '10px' }}>
              {product.family}
            </div>
            <h2 style={{ fontSize: '36px', lineHeight: 1.1, marginBottom: '6px' }}>
              {product.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-gold)', fontStyle: 'italic', marginBottom: '20px' }}>
              {product.subtitle}
            </p>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '28px' }}>
              {product.description}
            </p>

            {/* Olfactory Pyramid */}
            <div
              style={{
                backgroundColor: 'rgba(11, 11, 10, 0.6)',
                borderRadius: '6px',
                padding: '18px',
                border: '1px solid var(--color-border)',
                marginBottom: '28px'
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-gold)', marginBottom: '12px', fontWeight: 600 }}>
                Pirámide Olfativa
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                    Salida:
                  </span>
                  <span style={{ color: 'var(--color-ivory)' }}>
                    {product.notesTop.join(' · ')}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                    Corazón:
                  </span>
                  <span style={{ color: 'var(--color-ivory)' }}>
                    {product.notesHeart.join(' · ')}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                    Fondo:
                  </span>
                  <span style={{ color: 'var(--color-gold-light)' }}>
                    {product.notesBase.join(' · ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Price & Quantity Bar */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-text-tertiary)' }}>
                  Total en COP
                </span>
                <p style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-ivory)', margin: 0 }}>
                  {formatCOP(product.priceCOP * quantity)}
                </p>
              </div>

              {/* Quantity Stepper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(11, 11, 10, 0.8)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-ivory)',
                    padding: '8px 12px'
                  }}
                  aria-label="Disminuir cantidad"
                >
                  <Minus size={14} />
                </button>
                <span style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-ivory)',
                    padding: '8px 12px'
                  }}
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAdd}
                data-cursor="AÑADIR"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  backgroundColor: addedAnimation ? 'var(--color-success)' : 'var(--color-gold)',
                  color: 'var(--color-obsidian)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s ease'
                }}
              >
                <ShoppingBag size={16} />
                <span>{addedAnimation ? '¡Agregado a la bolsa!' : 'Añadir a la bolsa'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
