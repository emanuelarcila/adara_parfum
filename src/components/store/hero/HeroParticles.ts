import * as THREE from 'three';

/**
 * Instancia del sistema de partículas de polvo dorado suspendido.
 */
export interface HeroParticlesInstance {
  points: THREE.Points;
  update: (elapsedTime: number, deltaTime: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Crea una textura radial suave en memoria para dar a cada partícula la apariencia
 * de un grano de polvo de oro reflectante con halo difuso.
 */
function createGoldParticleTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 245, 210, 1.0)');
    grad.addColorStop(0.25, 'rgba(218, 175, 85, 0.85)');
    grad.addColorStop(0.65, 'rgba(166, 124, 45, 0.35)');
    grad.addColorStop(1.0, 'rgba(100, 75, 20, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Genera el sistema de polvo dorado cinematográfico de ADARA PARFUM.
 *
 * @param count - Cantidad de partículas adaptada al dispositivo.
 * @returns Instancia controlable de partículas con actualización optimizada.
 */
export function createHeroParticles(count: number): HeroParticlesInstance {
  const particleTexture = createGoldParticleTexture();

  // Arreglos tipados para la geometría
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  // Límites del volumen tridimensional alrededor del frasco
  const xSpan = 8.0;
  const yMin = -1.2;
  const yMax = 5.8;
  const zSpan = 6.0;

  for (let i = 0; i < count; i++) {
    // Posición inicial aleatoria
    positions[i * 3 + 0] = (Math.random() - 0.5) * xSpan;
    positions[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
    positions[i * 3 + 2] = (Math.random() - 0.5) * zSpan;

    // Velocidades muy lentas de deriva ascendente
    velocities[i * 3 + 0] = (Math.random() - 0.5) * 0.08;
    velocities[i * 3 + 1] = 0.08 + Math.random() * 0.14; // Ascenso lento
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.08;

    // Fase sinusoidal individual
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', positionAttribute);

  const material = new THREE.PointsMaterial({
    map: particleTexture,
    size: 0.18,
    color: new THREE.Color(0xd6ad5c),
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'AdaraGoldDustParticles';

  return {
    points,

    /**
     * Ciclo de animación del polvo suspendido.
     * Reutiliza el buffer de posiciones sin instanciaciones en memoria.
     */
    update: (elapsedTime: number, deltaTime: number, reducedMotion: boolean) => {
      if (reducedMotion) return;

      const pos = positionAttribute.array as Float32Array;
      const dt = Math.min(deltaTime, 0.05); // Prevenir saltos bruscos si hay lag

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const phase = phases[i];

        // 1. Desplazamiento vertical constante
        pos[i3 + 1] += velocities[i3 + 1] * dt;

        // 2. Micro-ondulación orbital suave en X y Z
        pos[i3 + 0] += Math.sin(elapsedTime * 0.6 + phase) * 0.003;
        pos[i3 + 2] += Math.cos(elapsedTime * 0.5 + phase) * 0.0025;

        // 3. Reencauche suave cuando la partícula supera el techo
        if (pos[i3 + 1] > yMax) {
          pos[i3 + 1] = yMin;
          pos[i3 + 0] = (Math.random() - 0.5) * xSpan;
          pos[i3 + 2] = (Math.random() - 0.5) * zSpan;
        }
      }

      positionAttribute.needsUpdate = true;
    },

    dispose: () => {
      geometry.dispose();
      material.dispose();
      particleTexture.dispose();
    }
  };
}

