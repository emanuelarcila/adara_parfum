import React, { useState, useEffect } from 'react';
import {
  Product,
  ProductVariantItem,
  isPurchasableProduct,
  isPricedProduct,
  isPurchasableVariant,
  isPricedVariant
} from '../../types';
import { formatCOP, getProductImageUrl } from '../../data/mockData';
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
 * En dispositivos móviles, la barra de acciones («Añadir a la bolsa», precio total y selector de cantidad)
 * permanece visible de forma fija (sticky) en el borde inferior del modal para permitir la conversión
 * inmediata sin obligar al usuario a desplazarse por toda la ficha técnica.
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
  const [productQuantity, setProductQuantity] = useState<number>(1);
  const [isAddedFeedbackActive, setIsAddedFeedbackActive] = useState<boolean>(false);

  // Inicializar selección de variante cuando cambia el producto activo
  useEffect(() => {
    setProductQuantity(1);
    setIsAddedFeedbackActive(false);

    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      // Priorizar la primera variante comprable disponible, o la primera de la lista
      const firstPurchasable = product.variants.find(isPurchasableVariant);
      setSelectedVariantId(firstPurchasable ? firstPurchasable.id : product.variants[0].id);
    } else {
      setSelectedVariantId(null);
    }
  }, [product]);

  // Manejo de teclado (Escape) y bloqueo de scroll en la ventana global
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
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
  const activeSelectedVariant = hasVariants && product.variants
    ? product.variants.find((variant) => variant.id === selectedVariantId) || null
    : null;

  // Derivaciones de negocio: Si tiene variantes, los precios y stock derivan estrictamente de la variante seleccionada
  const isProductOrVariantPriced = hasVariants
    ? isPricedVariant(activeSelectedVariant)
    : isPricedProduct(product);

  const isInventoryAvailable = hasVariants
    ? Boolean(activeSelectedVariant && typeof activeSelectedVariant.stock === 'number' && activeSelectedVariant.stock > 0 && activeSelectedVariant.status === 'active')
    : (typeof product.stock === 'number' ? product.stock > 0 && product.status === 'active' : false);

  const isEligibleForPurchase = hasVariants
    ? isPurchasableVariant(activeSelectedVariant)
    : isPurchasableProduct(product);

  const maximumAvailableStock = hasVariants
    ? (activeSelectedVariant && typeof activeSelectedVariant.stock === 'number' && activeSelectedVariant.stock > 0 ? activeSelectedVariant.stock : 1)
    : (typeof product.stock === 'number' && product.stock > 0 ? product.stock : 1);

  const activeUnitPriceCOP = hasVariants
    ? (activeSelectedVariant ? activeSelectedVariant.priceCOP : null)
    : product.priceCOP;

  /**
   * Ejecuta la adición del producto o variante al carrito y proporciona
   * retroalimentación háptica/visual inmediata cambiando el botón temporalmente.
   */
  const handleAddToCartAction = () => {
    if (!isEligibleForPurchase) return;
    onAddToCart(product, Math.min(productQuantity, maximumAvailableStock), activeSelectedVariant || undefined);
    setIsAddedFeedbackActive(true);
    setTimeout(() => setIsAddedFeedbackActive(false), 1400);
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
        className="liquid-glass animate-rise modal-container"
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
          className="modal-close-btn"
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
            display: 'grid'
          }}
          className="modal-grid"
        >
          {/* Left: Product Visual & Luxury Fallback */}
          <div
            className="modal-image-pane"
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
            {(() => {
              const displayImg = getProductImageUrl(product);
              return (
                <img
                  src={displayImg}
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
              );
            })()}

            {/* Fallback Monogram when no image or image load fails */}
            <div
              className="modal-luxury-fallback"
              style={{
                display: 'none',
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
              {(product.brand || 'ADARA PARFUM').toUpperCase()}{activeSelectedVariant ? ` · ${activeSelectedVariant.volume.toUpperCase()}` : product.volume ? ` · ${product.volume.toUpperCase()}` : ''}
            </div>
          </div>

          {/* Right: Olfactory Experience & Specs */}
          <div
            className="modal-content-pane"
            style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}
          >
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
              className="modal-notes-box"
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
              <div className="modal-variants-section" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-gold)', fontWeight: 600 }}>
                    Seleccionar Presentación
                  </span>
                  {activeSelectedVariant && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {typeof activeSelectedVariant.stock === 'number' && activeSelectedVariant.stock > 0
                        ? `${activeSelectedVariant.stock} ${activeSelectedVariant.stock === 1 ? 'unidad disponible' : 'unidades disponibles'}`
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
                          setProductQuantity(1);
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

            {/* Price & Quantity Action Bar (Sticky on Mobile, Integrated on Desktop) */}
            <div className="modal-action-bar">
              <div className="modal-action-bar-header">
                <div>
                  <span className="modal-action-bar-label">
                    {activeSelectedVariant ? `Total ${activeSelectedVariant.volume} en COP` : 'Total en COP'}
                  </span>
                  <p
                    className="modal-action-bar-price"
                    style={{
                      fontSize: isProductOrVariantPriced ? '24px' : '18px',
                      fontWeight: 600,
                      color: isProductOrVariantPriced ? 'var(--color-ivory)' : 'var(--color-gold-light)',
                      margin: 0
                    }}
                  >
                    {isProductOrVariantPriced && typeof activeUnitPriceCOP === 'number'
                      ? formatCOP(activeUnitPriceCOP * productQuantity)
                      : 'Bajo consulta'}
                  </p>
                </div>

                {/* Quantity Stepper (Clamped to Available Stock) */}
                <div
                  className="modal-stepper-container"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isEligibleForPurchase ? 'rgba(11, 11, 10, 0.8)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    opacity: isEligibleForPurchase ? 1 : 0.4
                  }}
                >
                  <button
                    type="button"
                    disabled={!isEligibleForPurchase || productQuantity <= 1}
                    onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))}
                    className="modal-stepper-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-ivory)',
                      padding: '8px 12px',
                      cursor: isEligibleForPurchase && productQuantity > 1 ? 'pointer' : 'not-allowed'
                    }}
                    aria-label="Disminuir cantidad"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="modal-stepper-value" style={{ minWidth: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                    {productQuantity}
                  </span>
                  <button
                    type="button"
                    disabled={!isEligibleForPurchase || productQuantity >= maximumAvailableStock}
                    onClick={() => setProductQuantity(Math.min(maximumAvailableStock, productQuantity + 1))}
                    className="modal-stepper-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-ivory)',
                      padding: '8px 12px',
                      cursor: isEligibleForPurchase && productQuantity < maximumAvailableStock ? 'pointer' : 'not-allowed'
                    }}
                    aria-label="Aumentar cantidad"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Add / Action Button */}
              <button
                type="button"
                disabled={!isEligibleForPurchase}
                onClick={handleAddToCartAction}
                data-cursor={isEligibleForPurchase ? 'AÑADIR' : undefined}
                className="modal-action-btn"
                style={{
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  backgroundColor: isEligibleForPurchase
                    ? isAddedFeedbackActive
                      ? 'var(--color-success)'
                      : 'var(--color-gold)'
                    : 'rgba(255, 255, 255, 0.04)',
                  color: isEligibleForPurchase ? 'var(--color-obsidian)' : 'var(--color-text-tertiary)',
                  border: isEligibleForPurchase ? 'none' : '1px solid var(--color-border)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: isEligibleForPurchase ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease'
                }}
              >
                {isEligibleForPurchase && <ShoppingBag size={16} />}
                <span>
                  {isEligibleForPurchase
                    ? isAddedFeedbackActive
                      ? '¡Agregado a la bolsa!'
                      : 'Añadir a la bolsa'
                    : !isProductOrVariantPriced
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
