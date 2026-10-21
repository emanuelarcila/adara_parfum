import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { formatCOP } from '../../data/mockData';
import { Eye, Plus, SlidersHorizontal } from 'lucide-react';

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

  const families: { id: string; label: string }[] = [
    { id: 'all', label: 'Todas las Familias' },
    { id: 'Oriental & Ámbar', label: 'Oriental & Ámbar' },
    { id: 'Cuero & Humo', label: 'Cuero & Humo' },
    { id: 'Floral Oscuro', label: 'Floral Oscuro' },
    { id: 'Amaderada', label: 'Amaderadas Nobles' }
  ];

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesFamily = selectedFamily === 'all' || product.family === selectedFamily;
        const matchesSearch =
          searchQuery.trim() === '' ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
          [...product.notesTop, ...product.notesHeart, ...product.notesBase].some((note) =>
            note.toLowerCase().includes(searchQuery.toLowerCase())
          );
        return matchesFamily && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.priceCOP - b.priceCOP;
        if (sortBy === 'price-desc') return b.priceCOP - a.priceCOP;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
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
            {filteredProducts.map((product) => (
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
                {/* Image Container with Hover Zoom */}
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
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
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

                  {/* Intensity Rating */}
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
                            lvl <= product.intensity ? 'var(--color-gold)' : 'var(--color-border)'
                        }}
                      />
                    ))}
                  </div>

                  {/* Volume Stamp */}
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
                    {product.volume}
                  </div>
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
                      {product.subtitle}
                    </p>
                  </div>

                  {/* Notes snippet */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: '20px'
                    }}
                  >
                    {product.notesTop.slice(0, 2).map((note, idx) => (
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
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(198, 161, 91, 0.08)',
                        color: 'var(--color-gold)'
                      }}
                    >
                      +{product.notesBase[0]}
                    </span>
                  </div>

                  {/* Bottom: Price & Actions */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-text-tertiary)' }}>
                        Precio COP
                      </span>
                      <p style={{ fontSize: '17px', fontWeight: 600, color: 'var(--color-ivory)', margin: 0 }}>
                        {formatCOP(product.priceCOP)}
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
                        onClick={() => onAddToCart(product)}
                        data-cursor="AÑADIR"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-gold)',
                          border: 'none',
                          color: 'var(--color-obsidian)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          transition: 'all 0.25s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold-light)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-gold)')}
                      >
                        <Plus size={14} />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
