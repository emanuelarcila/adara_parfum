import React from 'react';
import { ArrowUp } from 'lucide-react';

interface StoreFooterProps {
  onOpenAdmin: () => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      style={{
        backgroundColor: '#070706',
        borderTop: '1px solid var(--color-border)',
        padding: '80px var(--page-gutter) 40px',
        position: 'relative'
      }}
    >
      <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '48px',
            marginBottom: '60px'
          }}
        >
          {/* Col 1: Wordmark & Manifesto */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '28px', letterSpacing: '0.22em', fontWeight: 600, color: 'var(--color-ivory)' }}>
                ADARA
              </span>
              <span style={{ display: 'block', fontSize: '8px', letterSpacing: '0.44em', color: 'var(--color-gold)', marginTop: '4px' }}>
                PARFUM
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: '320px' }}>
              Perfumería contemporánea concebida como un gesto personal: sereno, profundo y propio. Obsidiana y oro champagne.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', marginBottom: '18px', fontWeight: 600 }}>
              Exploración
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#coleccion" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}>
                  Colección de Extractos
                </a>
              </li>
              <li>
                <a href="#universo" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}>
                  El Universo ADARA
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-gold)',
                    fontSize: '13px',
                    textAlign: 'left',
                    padding: 0,
                    fontWeight: 500
                  }}
                  data-cursor="ADMIN"
                >
                  Acceso Administrativo (Demo) ↗
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Atención y Región */}
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--color-gold)', marginBottom: '18px', fontWeight: 600 }}>
              Atención & Despachos
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
              Operación nacional en Colombia · Envíos asegurados en Bogotá, Medellín, Cali, Barranquilla y todo el territorio nacional en pesos colombianos (COP).
            </p>
            <span style={{ display: 'inline-block', marginTop: '12px', fontSize: '11px', color: 'var(--color-gold)', borderBottom: '1px solid var(--color-border-gold)', paddingBottom: '2px' }}>
              Canal de Concierge: Bogotá, D.C.
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '32px',
            borderTop: '1px solid rgba(56, 48, 36, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '11px',
            color: 'var(--color-text-tertiary)'
          }}
        >
          <div>
            © {new Date().getFullYear()} ADARA PARFUM. Todos los derechos reservados.
            <span style={{ marginLeft: '12px', color: 'var(--color-gold)' }}>[Fase 1: Prototipo Visual de Alta Fidelidad]</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            data-cursor="SUBIR"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            <span>Volver arriba</span>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};
