import React from 'react';
import { Compass, Flame, Droplets } from 'lucide-react';

export const StoreEditorial: React.FC = () => {
  return (
    <section
      id="universo"
      style={{
        padding: '120px var(--page-gutter)',
        backgroundColor: 'var(--color-obsidian-subtle)',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div className="eyebrow" style={{ marginBottom: '16px' }}>
            Filosofía & Manifiesto
          </div>
          <h2
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              maxWidth: '850px',
              margin: '0 auto 24px'
            }}
          >
            La elegancia de lo <em>inolvidable.</em>
          </h2>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--color-text-secondary)',
              maxWidth: '680px',
              margin: '0 auto',
              lineHeight: 1.8
            }}
          >
            "El verdadero lujo no necesita levantar la voz. Se revela en la solidez del cristal ahumado,
            en la temperatura de la obsidiana y en la persistencia de un aroma que desafía el paso de las horas."
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px'
          }}
        >
          <div
            className="liquid-glass-card"
            style={{
              padding: '40px 32px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(198, 161, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}
            >
              <Compass size={20} color="var(--color-gold)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--color-ivory)' }}>
              Obsidiana & Geometría
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              Cada frasco es tallado con aristas precisas en vidrio de alta densidad. El tapón de latón macizo con cierre magnético sella la fragancia como una reliquia contemporánea.
            </p>
          </div>

          <div
            className="liquid-glass-card"
            style={{
              padding: '40px 32px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(198, 161, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}
            >
              <Droplets size={20} color="var(--color-gold)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--color-ivory)' }}>
              Concentración Extrait
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              Formulaciones con concentraciones de aceites puros superiores al 28%. Maceración de 90 días en oscuridad absoluta para asegurar una estela sedosa y prolongada.
            </p>
          </div>

          <div
            className="liquid-glass-card"
            style={{
              padding: '40px 32px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'rgba(198, 161, 91, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px'
              }}
            >
              <Flame size={20} color="var(--color-gold)" />
            </div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px', color: 'var(--color-ivory)' }}>
              Alquimia de la Piel
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              Materias primas nobles (Oud silvestre, Rosa de Damasco, Ládano, Sándalo) diseñadas para mutar con la temperatura corporal, convirtiéndose en un sello personal irrepetible.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
