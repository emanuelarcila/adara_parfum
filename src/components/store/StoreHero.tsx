import React from 'react';
import { ArrowDownRight, Sparkles } from 'lucide-react';
import { resolveImageUrl } from '../../data/mockData';

/**
 * Sección Hero principal de la experiencia de compra de ADARA PARFUM.
 *
 * @remarks
 * Proporciona el impacto visual inicial de la marca empleando gradientes oscuros obsidianos,
 * iluminación volumétrica radial dorada y tipografía de alto contraste editorial.
 * Incluye llamada a la acción (CTA) con ancla suave hacia la galería '#coleccion'.
 *
 * @returns Elemento JSX que renderiza la portada inmersiva de la boutique.
 */
export const StoreHero: React.FC = () => {
  return (
    <section
      id="inicio"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '120px var(--page-gutter) 80px',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 70% 45%, #1f1d18 0%, #11110f 45%, #0b0b0a 85%)'
      }}
    >
      {/* Background Cinematic Texture & Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '5%',
          width: '650px',
          height: '650px',
          background: 'radial-gradient(circle, rgba(198, 161, 91, 0.08) 0%, rgba(11, 11, 10, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 0.85fr)',
          gap: 'clamp(2rem, 5vw, 5rem)',
          alignItems: 'center'
        }}
        className="hero-grid"
      >
        {/* Left Column: Typography & Narrative */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div className="eyebrow" style={{ marginBottom: '24px' }}>
            Alta Perfumería Contemporánea
          </div>

          <h1
            style={{
              fontSize: 'clamp(3.8rem, 7.5vw, 7.2rem)',
              lineHeight: 0.92,
              letterSpacing: '-0.035em',
              marginBottom: '32px'
            }}
          >
            Hay presencias <br />
            que saben <em style={{ color: 'var(--color-gold)', fontStyle: 'italic', fontWeight: 400 }}>permanecer.</em>
          </h1>

          <p
            style={{
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              maxWidth: '460px',
              lineHeight: 1.8,
              letterSpacing: '0.015em',
              marginBottom: '44px'
            }}
          >
            ADARA concibe la fragancia no como un accesorio, sino como una firma invisible: 
            densidades minerales de obsidiana, resinas sagradas y maderas silvestres que cobran vida en el calor de la piel.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
            <a
              href="#coleccion"
              data-cursor="EXPLORAR"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 36px',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-obsidian)',
                fontSize: '11px',
                letterSpacing: '0.18em',
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
                borderRadius: '2px',
                transition: 'all 0.35s var(--ease-cinematic)',
                boxShadow: '0 10px 30px rgba(198, 161, 91, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gold-light)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(198, 161, 91, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(198, 161, 91, 0.25)';
              }}
            >
              <span>Descubrir Colección</span>
              <ArrowDownRight size={16} />
            </a>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-text-tertiary)' }}>
                COLECCIÓN 2026
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-ivory)', fontWeight: 500 }}>
                6 Creaciones Exclusivas
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: High Fashion Visual Presentation */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Glass frame & spotlight */}
          <div
            className="liquid-glass-card animate-float"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(198, 161, 91, 0.25)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', paddingTop: '115%', overflow: 'hidden' }}>
              <img
                src={resolveImageUrl('/images/hero_adara.jpg')}
                alt="Frasco de alta perfumería ADARA PARFUM en obsidiana y oro"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 1.2s var(--ease-cinematic)'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />

              {/* Gradient rim shadow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 11, 10, 0.95) 0%, rgba(11, 11, 10, 0.2) 40%, transparent 100%)',
                  pointerEvents: 'none'
                }}
              />

              {/* Badge Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '24px',
                  left: '24px',
                  right: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  color: 'var(--color-ivory)'
                }}
              >
                <div>
                  <span style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--color-gold)' }}>
                    ESTUDIO 01 / OBSIDIANA
                  </span>
                  <h3 style={{ fontSize: '22px', fontWeight: 500, margin: '2px 0 0' }}>
                    ADARA PARFUM
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Extracto puro · 100 ml
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(11, 11, 10, 0.7)',
                    border: '1px solid rgba(198, 161, 91, 0.3)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <Sparkles size={12} color="var(--color-gold)" />
                  <span style={{ fontSize: '10px', letterSpacing: '0.1em', fontWeight: 600 }}>
                    DISPONIBLE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
