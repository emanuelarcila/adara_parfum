/**
 * ADARA PARFUM — Tipos y configuraciones para la portada cinematográfica 3D.
 */

export type HeroDeviceMode = 'desktop' | 'tablet' | 'mobile';

export interface HeroQualitySettings {
  /** Cantidad máxima de partículas de polvo dorado en suspensión */
  particleCount: number;
  /** Límite superior del multiplicador de píxeles para proteger la GPU */
  maxPixelRatio: number;
  /** Habilitación de antialiasing en el renderer WebGL */
  antialias: boolean;
  /** Distancia de cámara en el eje Z */
  cameraDistance: number;
  /** Desplazamiento horizontal del frasco en la composición */
  bottleOffsetX: number;
  /** Desplazamiento vertical del frasco */
  bottleOffsetY: number;
}

/**
 * Obtiene la configuración de calidad y encuadre 3D según el ancho del viewport.
 * Diseñado para garantizar 60 fps en procesadores con gráficos integrados (Intel i3 / 8GB RAM).
 */
export const getHeroQualitySettings = (width: number): HeroQualitySettings => {
  if (width < 768) {
    // Modo Móvil: Frasco centrado, encuadre vertical, partículas reducidas al mínimo
    return {
      particleCount: 32,
      maxPixelRatio: 1.5,
      antialias: false,
      cameraDistance: 8.6,
      bottleOffsetX: 0.0,
      bottleOffsetY: -0.35
    };
  }

  if (width < 1024) {
    // Modo Tablet: Encuadre equilibrado, ligera inclinación y partículas moderadas
    return {
      particleCount: 65,
      maxPixelRatio: 1.6,
      antialias: true,
      cameraDistance: 7.4,
      bottleOffsetX: 0.7,
      bottleOffsetY: -0.1
    };
  }

  // Modo Escritorio: Composición editorial asimétrica (texto a la izquierda, frasco dominante a la derecha)
  return {
    particleCount: 130,
    maxPixelRatio: 1.75,
    antialias: true,
    cameraDistance: 6.8,
    bottleOffsetX: 1.55,
    bottleOffsetY: -0.05
  };
};

