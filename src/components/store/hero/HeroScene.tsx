import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getHeroQualitySettings } from './types';
import { createHeroBottle, HeroBottleInstance } from './HeroBottle';
import { createHeroEnvironment, HeroEnvironmentInstance } from './HeroEnvironment';
import { createHeroParticles, HeroParticlesInstance } from './HeroParticles';
import { createHeroLighting, HeroLightingInstance } from './HeroLighting';
import { resolveImageUrl } from '../../../data/mockData';

/**
 * Comprueba de forma segura y sin excepciones si el navegador admite WebGL.
 */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Componente principal que orquesta el lienzo 3D cinematográfico en Three.js.
 *
 * @remarks
 * Implementa una arquitectura resiliente y de alto rendimiento:
 * - Detección proactiva de WebGL con fallback fotográfico si la GPU no responde.
 * - Sin controles de giro ni arrastre (orientación fija majestuosa según especificación).
 * - Control estricto de pixel ratio para no saturar gráficas integradas (Intel i3).
 * - Pausa automática de renderizado cuando la pestaña se oculta o el Hero sale de pantalla.
 * - Desmontaje exhaustivo de buffers, geometrías, materiales y texturas.
 */
export const HeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    // 1. Verificación inicial de WebGL
    if (!isWebGLAvailable()) {
      setHasWebGLError(true);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    let quality = getHeroQualitySettings(width);

    // Preferencia de accesibilidad por movimiento reducido
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    // 2. Creación de escena, cámara y renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(0, 1.4, quality.cameraDistance);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality.antialias,
        alpha: true,
        powerPreference: 'high-performance',
        precision: 'mediump'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
      renderer.setSize(width, height, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    } catch (err) {
      console.warn('[ADARA 3D Hero] Error inicializando WebGLRenderer, activando fallback:', err);
      setHasWebGLError(true);
      return;
    }

    // 3. Ensamblado modular de los elementos de la escena
    let environment: HeroEnvironmentInstance | null = null;
    let lighting: HeroLightingInstance | null = null;
    let bottle: HeroBottleInstance | null = null;
    let particles: HeroParticlesInstance | null = null;

    try {
      // Escenario de rocas y niebla
      environment = createHeroEnvironment(scene);
      scene.add(environment.group);

      // Iluminación de estudio
      lighting = createHeroLighting();
      scene.add(lighting.group);

      // Frasco ADARA monolítico
      bottle = createHeroBottle();
      scene.add(bottle.group);
      bottle.group.position.set(quality.bottleOffsetX, quality.bottleOffsetY, 0);

      // Polvo dorado suspendido
      particles = createHeroParticles(quality.particleCount);
      scene.add(particles.points);

      // Orientación fija de cámara hacia el frasco (sin interacción de giro)
      camera.lookAt(bottle.group.position.x, 1.4 + quality.bottleOffsetY, 0);
    } catch (err) {
      console.warn('[ADARA 3D Hero] Error al construir geometrías de la escena:', err);
      setHasWebGLError(true);
      return;
    }

    // 4. Gestión del ciclo de animación (RAF)
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let isTabVisible = !document.hidden;
    let isIntersecting = true;

    const renderLoop = () => {
      animationFrameId = requestAnimationFrame(renderLoop);

      // Suspender renderizado si el usuario no está viendo la pestaña o la sección
      if (!isTabVisible || !isIntersecting) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      if (bottle) bottle.update(elapsed, reducedMotion);
      if (lighting) lighting.update(elapsed, reducedMotion);
      if (particles) particles.update(elapsed, delta, reducedMotion);

      renderer.render(scene, camera);
    };

    renderLoop();

    // 5. Optimización: Pausar al cambiar de pestaña
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        clock.getDelta(); // Reiniciar delta para evitar saltos temporales
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6. Optimización: Pausar cuando el Hero sale de pantalla (scroll)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) clock.getDelta();
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // 7. Adaptación responsive mediante ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.floor(entry.contentRect.width);
        const newHeight = Math.floor(entry.contentRect.height);
        if (newWidth <= 0 || newHeight <= 0) continue;

        width = newWidth;
        height = newHeight;
        quality = getHeroQualitySettings(width);

        camera.aspect = width / height;
        camera.position.z = quality.cameraDistance;
        camera.updateProjectionMatrix();

        if (bottle) {
          bottle.group.position.set(quality.bottleOffsetX, quality.bottleOffsetY, 0);
          camera.lookAt(bottle.group.position.x, 1.4 + quality.bottleOffsetY, 0);
        }

        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.maxPixelRatio));
      }
    });
    resizeObserver.observe(container);

    // 8. Limpieza completa al desmontar (evita fugas en memoria GPU)
    return () => {
      cancelAnimationFrame(animationFrameId);
      motionQuery.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
      resizeObserver.disconnect();

      if (bottle) bottle.dispose();
      if (environment) environment.dispose();
      if (particles) particles.dispose();
      if (lighting) lighting.dispose();

      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  // Si WebGL falla o no está soportado, se muestra el fallback fotográfico oficial
  if (hasWebGLError) {
    return (
      <div
        className="hero-fallback-frame"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '10%',
          overflow: 'hidden',
          backgroundColor: '#0b0b0a'
        }}
      >
        <div
          className="liquid-glass-card hero-visual-frame"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '460px',
            aspectRatio: '3/4',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <img
            src={resolveImageUrl('/images/hero_adara.jpg')}
            alt="Frasco ADARA PARFUM en obsidiana y oro"
            className="hero-monolith-image"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="hero-3d-scene-container"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        overflow: 'hidden',
        pointerEvents: 'none', // Asegura que nunca bloquee el scroll ni los clics
        backgroundColor: '#070706'
      }}
      aria-label="Escena tridimensional del frasco de perfume ADARA PARFUM sobre obsidiana"
      role="img"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none' // CRÍTICO: Ningún arrastre ni giro por mouse/táctil
        }}
      />
    </div>
  );
};

