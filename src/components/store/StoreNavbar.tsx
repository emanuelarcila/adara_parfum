import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X } from 'lucide-react';

/**
 * Propiedades recibidas por la barra de navegación superior de la tienda.
 */
interface StoreNavbarProps {
  /** Cantidad acumulada de artículos en el carrito de compras. */
  cartCount: number;
  /** Callback disparador para abrir el cajón lateral del carrito (drawer). */
  onOpenCart: () => void;
  /** Función para actualizar en tiempo real el término de búsqueda de fragancias. */
  onSearchChange: (query: string) => void;
  /** Valor actual de la consulta de búsqueda introducida por el usuario. */
  searchQuery: string;
}

/**
 * Barra de navegación principal de la boutique web ADARA PARFUM.
 *
 * @remarks
 * Implementa una barra flotante fija con efecto de vidrio líquido (liquid glass)
 * que se activa dinámicamente mediante scroll listener (offset > 40px).
 * Provee accesos a secciones editoriales ('#coleccion', '#universo', '#experiencia'),
 * buscador colapsable en línea, contador badge de la bolsa de compras y menú desplegable para móviles.
 *
 * @param props - Propiedades del componente {@link StoreNavbarProps}.
 * @returns Elemento JSX que contiene la cabecera interactiva de la tienda.
 */
export const StoreNavbar: React.FC<StoreNavbarProps> = ({
  cartCount,
  onOpenCart,
  onSearchChange,
  searchQuery
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'liquid-glass-nav py-4' : 'bg-transparent py-6'
      }`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        padding: isScrolled ? '16px var(--page-gutter)' : '24px var(--page-gutter)',
        transition: 'all 0.4s var(--ease-cinematic)',
        background: isScrolled
          ? 'rgba(11, 11, 10, 0.85)'
          : 'linear-gradient(to bottom, rgba(11, 11, 10, 0.9) 0%, rgba(11, 11, 10, 0) 100%)',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(198, 161, 91, 0.15)' : '1px solid transparent'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center'
        }}
      >
        {/* Left: Navigation links (Desktop) & Menu Toggle (Mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--color-ivory)',
              padding: '6px'
            }}
            className="mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav
            style={{ display: 'flex', alignItems: 'center', gap: '32px' }}
            className="desktop-nav"
            aria-label="Navegación principal"
          >
            <a
              href="#coleccion"
              data-cursor="VER"
              style={{
                fontSize: '11px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                transition: 'color 0.25s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              Colección
            </a>
            <a
              href="#universo"
              data-cursor="DESCUBRE"
              style={{
                fontSize: '11px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                transition: 'color 0.25s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              El Universo
            </a>
            <a
              href="#experiencia"
              data-cursor="LEER"
              style={{
                fontSize: '11px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                transition: 'color 0.25s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              Filosofía
            </a>
          </nav>
        </div>

        {/* Center: Brand Wordmark */}
        <div style={{ textAlign: 'center' }}>
          <a
            href="#"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            data-cursor="INICIO"
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                letterSpacing: '0.28em',
                fontWeight: 600,
                color: 'var(--color-ivory)',
                lineHeight: 1
              }}
            >
              ADARA
            </span>
            <span
              style={{
                fontSize: '8px',
                letterSpacing: '0.42em',
                fontWeight: 600,
                color: 'var(--color-gold)',
                marginTop: '4px',
                textTransform: 'uppercase'
              }}
            >
              PARFUM
            </span>
          </a>
        </div>

        {/* Right: Actions (Search, Cart) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '20px'
          }}
        >
          {/* Search Toggle / Input */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {isSearchOpen ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(23, 23, 20, 0.9)',
                  border: '1px solid var(--color-border-gold)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  gap: '6px'
                }}
              >
                <Search size={14} color="var(--color-gold)" />
                <input
                  type="text"
                  placeholder="Buscar notas, maderas..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-ivory)',
                    fontSize: '12px',
                    width: '140px',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    padding: '2px'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                data-cursor="BUSCAR"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                aria-label="Abrir buscador"
              >
                <Search size={17} />
              </button>
            )}
          </div>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            data-cursor="BOLSA"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-ivory)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              transition: 'all 0.25s ease'
            }}
            className="cart-btn"
            aria-label={`Abrir bolsa con ${cartCount} productos`}
          >
            <ShoppingBag size={18} color="var(--color-gold)" />
            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}
            >
              Bolsa
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '10px',
                backgroundColor: 'rgba(198, 161, 91, 0.18)',
                color: 'var(--color-gold)',
                fontSize: '11px',
                fontWeight: 700,
                border: '1px solid rgba(198, 161, 91, 0.35)'
              }}
            >
              {cartCount < 10 ? `0${cartCount}` : cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          className="liquid-glass animate-rise"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            padding: '24px var(--page-gutter)',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <a
              href="#coleccion"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '14px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory)'
              }}
            >
              Colección de Perfumes
            </a>
            <a
              href="#universo"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '14px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory)'
              }}
            >
              El Universo
            </a>
            <a
              href="#experiencia"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                fontSize: '14px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-ivory)'
              }}
            >
              Filosofía Olfativa
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
