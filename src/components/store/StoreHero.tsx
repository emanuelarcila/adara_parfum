import React from 'react';
import { HeroScene } from './hero/HeroScene';
import { HeroOverlay } from './hero/HeroOverlay';

/**
 * Portada cinematográfica tridimensional de ADARA PARFUM.
 *
 * @remarks
 * Transforma la portada convencional en una experiencia 3D de alta perfumería construida con Three.js:
 * - Frasco icónico original de ADARA modelado en 3D (vidrio facetado de obsidiana, líquido ámbar, collar y tapón de oro cepillado).
 * - Escenario mineral de obsidiana y roca volcánica con iluminación de estudio y niebla profunda.
 * - Partículas suspendidas de polvo de oro que flotan lentamente con movimiento ascendente.
 * - Orientación fija del frasco sin interacción de arrastre ni giro para preservar su presencia majestuosa.
 * - Capa editorial de interfaz superpuesta con viñeta de contraste y navegación comercial hacia la colección.
 * - Sistema de contingencia automática (fallback) si WebGL no está disponible o falla en la GPU del usuario.
 */
export const StoreHero: React.FC = () => {
  return (
    <section
      id="inicio"
      className="hero-section-root"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: '#070706',
        display: 'flex',
        alignItems: 'center'
      }}
      aria-label="Portada cinematográfica tridimensional ADARA PARFUM"
    >
      {/* 1. Escena Tridimensional en Tiempo Real (Three.js WebGL) */}
      <HeroScene />

      {/* 2. Capa Editorial de Interfaz y Enlace Comercial */}
      <HeroOverlay />
    </section>
  );
};
