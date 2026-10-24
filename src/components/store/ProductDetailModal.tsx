import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductVariantItem,
  isPurchasableProduct,
  isPricedProduct,
  isPurchasableVariant,
  isPricedVariant
} from '../../types';
import { formatCOP, formatProductPrice } from '../../data/mockData';
import { X, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';

/**
 * Propiedades del modal de ficha técnica y detalle inmersivo de la fragancia.
 */
interface ProductDetailModalProps {
  /** Fragancia seleccionada para desplegar o null si el modal está cerrado. */
  product: Product | null;
  /** Disparador para cerrar el modal (clic en overlay, tecla Escape o botón de cierre). */
  onClose: () => void;
  /** Disparador para agregar la cantidad y variante seleccionada al carrito de compras. */
  onAddToCart: (product: Product, quantity: number, selectedVariant?: ProductVariantItem) => void;
}

/**
 * Modal inmersivo para la inspección detallada de una fragancia en ADARA PARFUM.
 *
 * @remarks
 * Proporciona una vista cinematográfica con pirámide olfativa completa (salida, corazón, fondo),
 * acordes principales, descripción poética, selector dinámico de variante (ej. 30ml, 50ml, 100ml)
 * con actualización en tiempo real del precio unitario y existencias disponibles, control de cantidad
 * acotado al stock físico real, y cierre accesible mediante tecla Escape y bloqueo de scroll en el body.
 *
 * @param props - Propiedades del componente {@link ProductDetailModalProps}.
 * @returns Elemento modal interactivo o `null` si no hay producto activo.
 */
export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Inicializar selección de variante cuando cambia el producto
  useEffect(() => {
    setQuantity(1);
    setAddedAnimation(false);

    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      // Priorizar la primera variante comprable disponible, o la primera de la lista
      const firstPurchasable = product.variants.find(isPurchasableVariant);
      setSelectedVariantId(firstPurchasable ? firstPurchasable.id : product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
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

  const hasVariants = Boolean(Array.isArray(product.variants) && product.variants.length > 0);
  const activeVariant = hasVariants && product.variants
    ? product.variants.find((v) => v.id === selectedVariantId) || null
    : null;

  // Si tiene variantes, los precios y stock derivan estrictamente de la variante seleccionada
  const isPriced = hasVariants
    ? isPricedVariant(activeVariant)
    : isPricedProduct(product);

  const isAvailable = hasVariants
    ? Boolean(activeVariant && typeof activeVariant.stock === 'number' && activeVariant.stock > 0 && activeVariant.status === 'active')
    : (typeof product.stock === 'number' ? product.stock > 0 && product.status === 'active' : false);

  const canPurchase = hasVariants
    ? isPurchasableVariant(activeVariant)
    : isPurchasableProduct(product);

  const maxStock = hasVariants
    ? (activeVariant && typeof activeVariant.stock === 'number' && activeVariant.stock > 0 ? activeVariant.stock : 1)
    : (typeof product.stock === 'number' && product.stock > 0 ? product.stock : 1);

  const unitPrice = hasVariants
    ? (activeVariant ? activeVariant.priceCOP : null)
    : product.priceCOP;

  const handleAdd = () => {
    if (!canPurchase) return;
    onAddToCart(product, Math.min(quantity, maxStock), activeVariant || undefined);
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
          {/* Left: Product Visual & Luxury Fallback */}
          <div
            style={{
              position: 'relative',
              backgroundColor: '#11110f',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid var(--color-border)',
              overflow: 'hidden'
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = (e.currentTarget.parentElement as HTMLElement)?.querySelector('.modal-luxury-fallback');
                  if (fb) (fb as HTMLElement).style.display = 'flex';
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '520px',
                  objectFit: 'cover'
                }}
              />
            ) : null}

            {/* Fallback Monogram when no image or image load fails */}
            <div
              className="modal-luxury-fallback"
              style={{
                display: product.image ? 'none' : 'flex',
                position: 'absolute',
                inset: 0,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#121210',
                backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(198, 161, 91, 0.15) 0%, transparent 70%)',
                padding: '32px',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '1px solid rgba(198, 161, 91, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  backgroundColor: 'rgba(11, 11, 10, 0.7)'
                }}
              >
                <Sparkles size={26} color="var(--color-gold)" />
              </div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'var(--color-gold)', marginBottom: '6px' }}>
                {product.brand || 'ADARA PARFUM'}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-ivory)', maxWidth: '85%' }}>
                {product.name}
              </span>
            </div>

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
              {(product.brand || 'ADARA PARFUM').toUpperCase()}{activeVariant ? ` · ${activeVariant.volume.toUpperCase()}` : product.volume ? ` · ${product.volume.toUpperCase()}` : ''}
            </div>
          </div>

          {/* Right: Olfactory Experience & Specs */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
            {product.family && (
              <div className="eyebrow" style={{ marginBottom: '10px' }}>
                {product.family}
              </div>
            )}
            <h2 style={{ fontSize: '36px', lineHeight: 1.1, marginBottom: '6px' }}>
              {product.name}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-gold)', fontStyle: 'italic', marginBottom: '20px' }}>
              {product.subtitle || (product.brand ? `Creación por la casa ${product.brand}` : 'Extracto de Alta Perfumería')}
            </p>

            {product.description && (
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '28px' }}>
                {product.description}
              </p>
            )}

            {/* Olfactory Pyramid / Accords Section */}
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

              {(product.notesTop?.length || product.notesHeart?.length || product.notesBase?.length) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  {product.notesTop && product.notesTop.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                        Salida:
                      </span>
                      <span style={{ color: 'var(--color-ivory)' }}>
                        {product.notesTop.join(' · ')}
                      </span>
                    </div>
                  )}
                  {product.notesHeart && product.notesHeart.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                        Corazón:
                      </span>
                      <span style={{ color: 'var(--color-ivory)' }}>
                        {product.notesHeart.join(' · ')}
                      </span>
                    </div>
                  )}
                  {product.notesBase && product.notesBase.length > 0 && (
                    <div>
                      <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 600, marginRight: '8px' }}>
                        Fondo:
                      </span>
                      <span style={{ color: 'var(--color-gold-light)' }}>
                        {product.notesBase.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              ) : product.accords && product.accords.length > 0 ? (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '8px' }}>
                    Acordes Principales:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {product.accords.map((accord, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(198, 161, 91, 0.1)',
                          color: 'var(--color-gold)',
                          border: '1px solid rgba(198, 161, 91, 0.2)'
                        }}
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                  Composición y pirámide olfativa en proceso de catalogación oficial.
                </p>
              )}
            </div>

            {/* Presentation / Variant Selector (Fase 2.5A) */}
            {hasVariants && product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-gold)', fontWeight: 600 }}>
                    Seleccionar Presentación
                  </span>
                  {activeVariant && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {typeof activeVariant.stock === 'number' && activeVariant.stock > 0
                        ? `${activeVariant.stock} ${activeVariant.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`
                        : 'Agotado'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${product.variants.length}, 1fr)`, gap: '10px' }}>
                  {product.variants.map((variant) => {
                    const isSelected = variant.id === selectedVariantId;
                    const variantPriced = isPricedVariant(variant);
                    const variantPurchasable = isPurchasableVariant(variant);

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariantId(variant.id);
                          setQuantity(1);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 8px',
                          borderRadius: '6px',
                          border: isSelected
                            ? '1px solid var(--color-gold)'
                            : '1px solid var(--color-border)',
                          backgroundColor: isSelected
                            ? 'rgba(198, 161, 91, 0.12)'
                            : 'rgba(255, 255, 255, 0.02)',
                          color: isSelected ? 'var(--color-ivory)' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: variantPurchasable ? 1 : 0.45
                        }}
                      >
                        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: isSelected ? 'var(--color-gold-light)' : 'inherit' }}>
                          {variant.volume}
                        </span>
                        <span style={{ fontSize: '11px', marginTop: '4px', color: isSelected ? 'var(--color-ivory)' : 'var(--color-text-tertiary)' }}>
                          {variantPriced && typeof variant.priceCOP === 'number' ? formatCOP(variant.priceCOP) : 'Bajo consulta'}
                        </span>
                        {!variantPurchasable && (
                          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ff6b6b', marginTop: '2px' }}>
                            Agotado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  {activeVariant ? `Total ${activeVariant.volume} en COP` : 'Total en COP'}
                </span>
                <p
                  style={{
                    fontSize: isPriced ? '24px' : '18px',
                    fontWeight: 600,
                    color: isPriced ? 'var(--color-ivory)' : 'var(--color-gold-light)',
                    margin: 0
                  }}
                >
                  {isPriced && typeof unitPrice === 'number' ? formatCOP(unitPrice * quantity) : 'Bajo consulta'}
                </p>
              </div>

              {/* Quantity Stepper (Clamped to Available Stock) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: canPurchase ? 'rgba(11, 11, 10, 0.8)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  opacity: canPurchase ? 1 : 0.4
                }}
              >
                <button
                  type="button"
                  disabled={!canPurchase || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-ivory)',
                    padding: '8px 12px',
                    cursor: canPurchase && quantity > 1 ? 'pointer' : 'not-allowed'
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
                  disabled={!canPurchase || quantity >= maxStock}
                  onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-ivory)',
                    padding: '8px 12px',
                    cursor: canPurchase && quantity < maxStock ? 'pointer' : 'not-allowed'
                  }}
                  aria-label="Aumentar cantidad"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add / Action Button */}
              <button
                type="button"
                disabled={!canPurchase}
                onClick={handleAdd}
                data-cursor={canPurchase ? 'AÑADIR' : undefined}
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  backgroundColor: canPurchase
                    ? addedAnimation
                      ? 'var(--color-success)'
                      : 'var(--color-gold)'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: canPurchase ? 'var(--color-obsidian)' : 'var(--color-text-tertiary)',
                  border: canPurchase ? 'none' : '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: canPurchase ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                {canPurchase && <ShoppingBag size={16} />}
                <span>
                  {canPurchase
                    ? addedAnimation
                      ? '¡Agregado a la bolsa!'
                      : 'Añadir a la bolsa'
                    : !isPriced
                    ? 'Precio Bajo Consulta'
                    : 'Agotado'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
