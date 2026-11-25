import React from 'react';
import { ArrowDownRight, Sparkles } from 'lucide-react';

/**
 * Capa de interfaz editorial y elementos comerciales superpuestos sobre la escena 3D.
 *
 * @remarks
 * Diseñada para mantener una jerarquía visual de lujo:
 * - Gradientes de viñeta para garantizar legibilidad tipográfica sin tapar el frasco 3D.
 * - Textos editoriales alineados a la izquierda en escritorio y centrados en móviles.
 * - Enlace comercial real hacia la colección (`#coleccion`).
 * - Preservación de la identidad visual de ADARA PARFUM sin enlaces ficticios.
 */
export const HeroOverlay: React.FC = () => {
  return (
    <div
      className="hero-overlay-container"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 var(--page-gutter)'
      }}
    >
      {/* 1. Viñeta y gradiente de contraste para legibilidad de textos */}
      <div
        className="hero-readability-vignette"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 75% 50%, transparent 20%, rgba(11, 11, 10, 0.45) 60%, rgba(11, 11, 10, 0.92) 100%), linear-gradient(to right, rgba(11, 11, 10, 0.96) 0%, rgba(11, 11, 10, 0.75) 38%, rgba(11, 11, 10, 0.15) 70%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Gradiente de fusión inferior hacia el catálogo */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '140px',
          background: 'linear-gradient(to top, var(--color-obsidian) 0%, rgba(11, 11, 10, 0.8) 50%, transparent 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* 2. Contenido Editorial Superpuesto */}
      <div
        className="hero-content-wrapper"
        style={{
          position: 'relative',
          maxWidth: 'var(--max-width)',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(320px, 0.85fr)',
          alignItems: 'center',
          pointerEvents: 'none'
        }}
      >
        <div
          className="hero-narrative-box"
          style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '560px',
            pointerEvents: 'auto'
          }}
        >
          {/* Eyebrow de Lujo */}
          <div className="eyebrow" style={{ marginBottom: '20px' }}>
            Alta Perfumería Contemporánea
          </div>

          {/* Titular Principal de Campaña */}
          <h1
            style={{
              fontSize: 'clamp(2.6rem, 5.8vw, 6.2rem)',
              lineHeight: 0.95,
              letterSpacing: '-0.035em',
              marginBottom: '28px'
            }}
          >
            El arte de<br />
            <em
              style={{
                fontStyle: 'italic',
                fontFamily: 'var(--font-display)',
                fontWeight: 400
              }}
              className="gold-text-gradient"
            >
              permanecer.
            </em>
          </h1>

          {/* Lede Editorial */}
          <p
            style={{
              fontSize: 'clamp(14px, 1.3vw, 17px)',
              lineHeight: 1.8,
              color: 'var(--color-text-secondary)',
              marginBottom: '36px',
              maxWidth: '480px'
            }}
          >
            Extractos puros de alta concentración forjados entre la serenidad mineral de la obsidiana,
            resinas sagradas y maderas nobles que cobran vida en el calor de la piel.
          </p>

          {/* Botón de Llamada a la Acción (Comercial) */}
          <div
            className="hero-cta-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap'
            }}
          >
            <a
              href="#coleccion"
              data-cursor="EXPLORAR"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 36px',
                backgroundColor: 'var(--color-gold)',
                color: 'var(--color-obsidian)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                borderRadius: '4px',
                transition: 'all 0.3s var(--ease-cinematic)',
                textDecoration: 'none',
                boxShadow: '0 12px 32px -8px var(--color-gold-glow)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-ivory)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-gold)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explorar Colección</span>
              <ArrowDownRight size={15} />
            </a>

            {/* Micro-insignia de pureza de extracto */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-gold)'
              }}
            >
              <Sparkles size={14} />
              <span>Extrait de Parfum · 100 ml</span>
            </div>
          </div>
        </div>

        {/* Columna derecha vacía en el grid para permitir que el frasco 3D domine el encuadre */}
        <div aria-hidden="true" style={{ pointerEvents: 'none' }} />
      </div>

      {/* 3. Indicador de Colección en el costado inferior */}
      <div
        className="hero-bottom-badge"
        style={{
          position: 'absolute',
          bottom: '28px',
          right: 'var(--page-gutter)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: 'rgba(11, 11, 10, 0.75)',
          border: '1px solid rgba(198, 161, 91, 0.25)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--color-ivory)',
          pointerEvents: 'auto'
        }}
      >
        <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>ESTUDIO 01</span>
        <span style={{ opacity: 0.4 }}>/</span>
        <span>ESCENA 3D EN TIEMPO REAL</span>
      </div>
    </div>
  );
};

