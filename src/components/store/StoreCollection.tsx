import React, { useState, useMemo } from 'react';
import { Product, isPurchasableProduct, isPricedProduct, isPurchasableVariant, isPricedVariant } from '../../types';
import { formatCOP, formatProductPrice } from '../../data/mockData';
import { Eye, Plus, SlidersHorizontal, Sparkles } from 'lucide-react';

interface StoreCollectionProps {
  products: Product[];
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const StoreCollection: React.FC<StoreCollectionProps> = ({
  products,
  searchQuery,
  onSelectProduct,
  onAddToCart
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');

  // Familias olfativas dinámicas: extraídas automáticamente de los productos presentes
  // sin excluir ninguna categoría válida del catálogo maestro o de futuras cargas
  const families = useMemo(() => {
    const uniqueFamilies = Array.from(
      new Set(
        products
          .map((p) => p.family)
          .filter((fam): fam is string => Boolean(fam && typeof fam === 'string' && fam.trim().length > 0))
      )
    ).sort((a, b) => a.localeCompare(b, 'es'));

    return [
      { id: 'all', label: 'Todas las Familias' },
      ...uniqueFamilies.map((fam) => ({ id: fam, label: fam }))
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesFamily = selectedFamily === 'all' || product.family === selectedFamily;
        if (!matchesFamily) return false;
        if (q === '') return true;

        const nameMatch = (product.name || '').toLowerCase().includes(q);
        const brandMatch = (product.brand || '').toLowerCase().includes(q);
        const descMatch = (product.description || '').toLowerCase().includes(q);
        const familyMatch = (product.family || '').toLowerCase().includes(q);

        const notes = [
          ...(product.notesTop || []),
          ...(product.notesHeart || []),
          ...(product.notesBase || []),
          ...(product.accords || [])
        ];
        const notesMatch = notes.some((note) => (note || '').toLowerCase().includes(q));

        return nameMatch || brandMatch || descMatch || familyMatch || notesMatch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          const priceA = a.priceCOP && a.priceCOP > 0 ? a.priceCOP : null;
          const priceB = b.priceCOP && b.priceCOP > 0 ? b.priceCOP : null;
          if (priceA !== null && priceB !== null) return priceA - priceB;
          if (priceA !== null && priceB === null) return -1; // Productos con precio primero
          if (priceA === null && priceB !== null) return 1;  // Sin precio al final
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'price-desc') {
          const priceA = a.priceCOP && a.priceCOP > 0 ? a.priceCOP : null;
          const priceB = b.priceCOP && b.priceCOP > 0 ? b.priceCOP : null;
          if (priceA !== null && priceB !== null) return priceB - priceA;
          if (priceA !== null && priceB === null) return -1;
          if (priceA === null && priceB !== null) return 1;
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedFamily, searchQuery, sortBy]);

  return (
    <section
      id="coleccion"
      style={{
        padding: '120px var(--page-gutter)',
        backgroundColor: 'var(--color-obsidian)',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        {/* Section Heading */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '24px',
            marginBottom: '48px'
          }}
        >
          <div>
            <div className="eyebrow" style={{ marginBottom: '14px' }}>
              Selección de Alta Gama
            </div>
            <h2 style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1 }}>
              La Colección
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', maxWidth: '340px' }}>
            Seis declaraciones olfativas formuladas como extractos puros. Densas, magnéticas e irrepetibles.
          </p>
        </div>

        {/* Toolbar: Filters & Sorting */}
        <div
          className="liquid-glass"
          style={{
            padding: '16px 24px',
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '18px',
            marginBottom: '56px'
          }}
        >
          {/* Family Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {families.map((fam) => {
              const active = selectedFamily === fam.id;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => setSelectedFamily(fam.id)}
                  data-cursor="FILTRO"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: active ? '1px solid var(--color-gold)' : '1px solid var(--color-border)',
                    backgroundColor: active ? 'rgba(198, 161, 91, 0.15)' : 'transparent',
                    color: active ? 'var(--color-gold)' : 'var(--color-text-secondary)',
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {fam.label}
                </button>
              );
            })}
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SlidersHorizontal size={14} color="var(--color-gold)" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-tertiary)' }}>
              Ordenar:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                backgroundColor: 'rgba(23, 23, 20, 0.9)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ivory)',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="featured">Destacados ADARA</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name">Alfabético</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--color-surface-dark)',
              borderRadius: '8px',
              border: '1px dashed var(--color-border)'
            }}
          >
            <p style={{ fontSize: '18px', color: 'var(--color-ivory)', marginBottom: '8px' }}>
              No se encontraron fragancias para "{searchQuery}"
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Intenta con otra nota o selecciona "Todas las Familias".
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '40px'
            }}
          >
            {filteredProducts.map((product) => {
              const hasVariants = Boolean(product.variants && product.variants.length > 0);
              const purchasableVariants = hasVariants ? product.variants!.filter(isPurchasableVariant) : [];
              const pricedVariants = hasVariants ? product.variants!.filter(isPricedVariant) : [];

              const isPriced = hasVariants
                ? pricedVariants.length > 0
                : isPricedProduct(product);

              const isAvailable = hasVariants
                ? product.variants!.some((v) => typeof v.stock === 'number' && v.stock > 0 && v.status === 'active')
                : (typeof product.stock === 'number' ? product.stock > 0 && product.status === 'active' : false);

              const canPurchase = hasVariants
                ? purchasableVariants.length > 0
                : isPurchasableProduct(product);

              const minVariantPrice = pricedVariants.length > 0
                ? Math.min(...pricedVariants.map((v) => v.priceCOP!))
                : null;
              const maxVariantPrice = pricedVariants.length > 0
                ? Math.max(...pricedVariants.map((v) => v.priceCOP!))
                : null;

              const priceDisplay = hasVariants
                ? (minVariantPrice !== null
                    ? (minVariantPrice === maxVariantPrice ? formatCOP(minVariantPrice) : `Desde ${formatCOP(minVariantPrice)}`)
                    : 'Bajo consulta')
                : formatProductPrice(product.priceCOP);

              const notesTopList = product.notesTop || [];
              const notesBaseList = product.notesBase || [];
              const accordsList = product.accords || [];

              return (
                <article
                  key={product.id}
                  className="liquid-glass-card"
                  style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {/* Image Container with Hover Zoom & Luxury Fallback */}
                  <div
                    style={{
                      position: 'relative',
                      paddingTop: '120%',
                      overflow: 'hidden',
                      backgroundColor: '#141412',
                      cursor: 'pointer'
                    }}
                    onClick={() => onSelectProduct(product)}
                    data-cursor="DETALLE"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = (e.currentTarget.parentElement as HTMLElement)?.querySelector('.luxury-fallback');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.8s var(--ease-cinematic)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    ) : null}

                    {/* Luxury Monogram Fallback (Active when no image or image load fails) */}
                    <div
                      className="luxury-fallback"
                      style={{
                        display: product.image ? 'none' : 'flex',
                        position: 'absolute',
                        inset: 0,
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#131311',
                        backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(198, 161, 91, 0.12) 0%, transparent 70%)',
                        padding: '24px',
                        textAlign: 'center'
                      }}
                    >
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          border: '1px solid rgba(198, 161, 91, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px',
                          backgroundColor: 'rgba(11, 11, 10, 0.6)'
                        }}
                      >
                        <Sparkles size={20} color="var(--color-gold)" />
                      </div>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', marginBottom: '4px' }}>
                        {product.brand || 'ADARA PARFUM'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ivory)', maxWidth: '90%' }}>
                        {product.name}
                      </span>
                    </div>

                    {/* Gradient bottom overlay */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(11, 11, 10, 0.85) 0%, transparent 45%)',
                        pointerEvents: 'none'
                      }}
                    />

                    {/* Family Tag */}
                    {product.family && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          left: '16px',
                          padding: '4px 10px',
                          backgroundColor: 'rgba(11, 11, 10, 0.75)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '4px',
                          border: '1px solid rgba(198, 161, 91, 0.25)',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          color: 'var(--color-gold)',
                          fontWeight: 600
                        }}
                      >
                        {product.family}
                      </div>
                    )}

                    {/* Stock status indicator badge */}
                    {!isAvailable && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(23, 23, 20, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '4px',
                          fontSize: '9px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: 'var(--color-text-tertiary)',
                          fontWeight: 600
                        }}
                      >
                        Agotado
                      </div>
                    )}

                    {/* Intensity Rating (Only shown if evaluated) */}
                    {isAvailable && typeof product.intensity === 'number' && product.intensity > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          right: '16px',
                          display: 'flex',
                          gap: '3px',
                          padding: '4px 8px',
                          backgroundColor: 'rgba(11, 11, 10, 0.75)',
                          borderRadius: '4px'
                        }}
                        title={`Intensidad: ${product.intensity}/5`}
                      >
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <span
                            key={lvl}
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              backgroundColor:
                                lvl <= (product.intensity || 0) ? 'var(--color-gold)' : 'var(--color-border)'
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Volume Stamp */}
                    {(hasVariants || product.volume) && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '16px',
                          left: '16px',
                          fontSize: '10px',
                          letterSpacing: '0.12em',
                          color: 'var(--color-text-secondary)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {hasVariants
                          ? product.variants!.map((v) => v.volume).join(' · ')
                          : product.volume}
                      </div>
                    )}
                  </div>

                  {/* Card Info */}
                  <div style={{ padding: '24px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '14px' }}>
                      <h3
                        onClick={() => onSelectProduct(product)}
                        data-cursor="DETALLE"
                        style={{
                          fontSize: '22px',
                          lineHeight: 1.1,
                          cursor: 'pointer',
                          color: 'var(--color-ivory)',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ivory)')}
                      >
                        {product.name}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--color-gold-deep)', marginTop: '2px', fontStyle: 'italic' }}>
                        {product.subtitle || (product.brand ? `Casa ${product.brand}` : 'ADARA PARFUM')}
                      </p>
                    </div>

                    {/* Notes or Accords snippet */}
                    <div
                      style={{
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        marginBottom: '20px'
                      }}
                    >
                      {notesTopList.length > 0 ? (
                        <>
                          {notesTopList.slice(0, 2).map((note, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10px',
                                padding: '3px 8px',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                color: 'var(--color-text-secondary)'
                              }}
                            >
                              {note}
                            </span>
                          ))}
                          {notesBaseList[0] && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '3px 8px',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(198, 161, 91, 0.08)',
                                color: 'var(--color-gold)'
                              }}
                            >
                              +{notesBaseList[0]}
                            </span>
                          )}
                        </>
                      ) : accordsList.length > 0 ? (
                        accordsList.slice(0, 2).map((acc, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10px',
                              padding: '3px 8px',
                              borderRadius: '3px',
                              backgroundColor: 'rgba(198, 161, 91, 0.08)',
                              color: 'var(--color-gold)'
                            }}
                          >
                            {acc}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                          Composición en catalogación
                        </span>
                      )}
                    </div>

                    {/* Bottom: Price & Actions */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-tertiary)' }}>
                          Precio COP
                        </span>
                        <p
                          style={{
                            fontSize: isPriced ? '17px' : '13px',
                            fontWeight: 600,
                            color: isPriced ? 'var(--color-ivory)' : 'var(--color-gold-light)',
                            margin: 0
                          }}
                        >
                          {priceDisplay}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          data-cursor="DETALLE"
                          style={{
                            padding: '10px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(23, 23, 20, 0.8)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-ivory)',
                            transition: 'all 0.2s ease'
                          }}
                          aria-label={`Ver detalles de ${product.name}`}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-gold)';
                            e.currentTarget.style.color = 'var(--color-gold)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                            e.currentTarget.style.color = 'var(--color-ivory)';
                          }}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!canPurchase) return;
                            if (hasVariants) {
                              onSelectProduct(product);
                            } else {
                              onAddToCart(product);
                            }
                          }}
                          disabled={!canPurchase}
                          data-cursor={canPurchase ? (hasVariants ? 'ELEGIR' : 'AÑADIR') : undefined}
                          title={
                            !isPriced
                              ? 'Fragancia bajo consulta. No habilitada para compra directa.'
                              : !isAvailable
                              ? 'Sin existencias en este momento.'
                              : hasVariants
                              ? 'Seleccionar presentación (30 ml, 50 ml, 100 ml)'
                              : 'Añadir a la bolsa de compra'
                          }
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '10px 16px',
                            borderRadius: '4px',
                            backgroundColor: canPurchase ? 'var(--color-gold)' : 'rgba(255, 255, 255, 0.04)',
                            border: canPurchase ? 'none' : '1px solid var(--color-border)',
                            color: canPurchase ? 'var(--color-obsidian)' : 'var(--color-text-tertiary)',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            cursor: canPurchase ? 'pointer' : 'not-allowed',
                            transition: 'all 0.25s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (canPurchase) e.currentTarget.style.backgroundColor = 'var(--color-gold-light)';
                          }}
                          onMouseLeave={(e) => {
                            if (canPurchase) e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                          }}
                        >
                          {canPurchase && <Plus size={14} />}
                          <span>
                            {canPurchase
                              ? (hasVariants ? 'Elegir' : 'Añadir')
                              : (!isPriced ? 'Consulta' : 'Agotado')}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
