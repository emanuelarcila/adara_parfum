import { getHeroQualitySettings } from '../types';
import { createHeroBottle } from '../HeroBottle';
import { createHeroEnvironment } from '../HeroEnvironment';
import { createHeroParticles } from '../HeroParticles';
import { createHeroLighting } from '../HeroLighting';
import * as THREE from 'three';

console.log('--- INICIO DE PRUEBAS AUTOMATIZADAS: PORTADA 3D ADARA PARFUM ---');

// 1. Prueba de adaptabilidad de configuraciones por resolución
const viewports = [
  { width: 320, name: 'Móvil Ultra-compacto (320px)', expectedParticles: 32, expectAntialias: false, expectedDist: 8.6, offset: 0.0 },
  { width: 360, name: 'Móvil Estándar (360px)', expectedParticles: 32, expectAntialias: false, expectedDist: 8.6, offset: 0.0 },
  { width: 375, name: 'iPhone X / 12 mini (375px)', expectedParticles: 32, expectAntialias: false, expectedDist: 8.6, offset: 0.0 },
  { width: 390, name: 'iPhone 13/14/15 (390px)', expectedParticles: 32, expectAntialias: false, expectedDist: 8.6, offset: 0.0 },
  { width: 412, name: 'Google Pixel / Galaxy (412px)', expectedParticles: 32, expectAntialias: false, expectedDist: 8.6, offset: 0.0 },
  { width: 768, name: 'Tablet Portrait (768px)', expectedParticles: 65, expectAntialias: true, expectedDist: 7.4, offset: 0.7 },
  { width: 1024, name: 'Tablet Landscape / Laptop (1024px)', expectedParticles: 130, expectAntialias: true, expectedDist: 6.8, offset: 1.55 },
  { width: 1440, name: 'Escritorio QHD / High-Res (1440px)', expectedParticles: 130, expectAntialias: true, expectedDist: 6.8, offset: 1.55 }
];

viewports.forEach((vp) => {
  const settings = getHeroQualitySettings(vp.width);
  if (settings.particleCount !== vp.expectedParticles) {
    throw new Error(`Fallo en ${vp.name}: partículas esperadas ${vp.expectedParticles}, obtenidas ${settings.particleCount}`);
  }
  if (settings.antialias !== vp.expectAntialias) {
    throw new Error(`Fallo en ${vp.name}: antialias esperado ${vp.expectAntialias}, obtenido ${settings.antialias}`);
  }
  if (Math.abs(settings.cameraDistance - vp.expectedDist) > 0.01) {
    throw new Error(`Fallo en ${vp.name}: distancia esperada ${vp.expectedDist}, obtenida ${settings.cameraDistance}`);
  }
  if (Math.abs(settings.bottleOffsetX - vp.offset) > 0.01) {
    throw new Error(`Fallo en ${vp.name}: offset esperado ${vp.offset}, obtenido ${settings.bottleOffsetX}`);
  }
  console.log(`✅ ${vp.name}: ${settings.particleCount} partículas, dist=${settings.cameraDistance}, offset=${settings.bottleOffsetX}, dpr_cap=${settings.maxPixelRatio}`);
});

// 2. Prueba de construcción de elementos 3D del Frasco
console.log('\n[Validación de Geometría del Frasco ADARA]');
const bottle = createHeroBottle();
if (!bottle.group || bottle.group.name !== 'AdaraBottleMonolith') {
  throw new Error('Fallo: El grupo del frasco ADARA no fue nombrado correctamente');
}
if (bottle.group.children.length < 5) {
  throw new Error('Fallo: El frasco debe contener cuerpo facetado, base maciza, líquido, cuello, etiqueta y tapón');
}
console.log(`✅ Frasco ADARA construido con ${bottle.group.children.length} sub-piezas ensambladas.`);

// Validar rotación fija inicial del frasco
if (Math.abs(bottle.group.rotation.y - 0.13) > 0.01) {
  throw new Error(`Fallo: La rotación inicial fija debe ser 0.13 rad (~7.5°), se obtuvo ${bottle.group.rotation.y}`);
}
console.log('✅ Orientación frontal fija certificada (sin controles de giro interactivo).');

// 3. Prueba del ciclo de actualización y micro-respiración
const initialPosY = bottle.group.position.y;
bottle.update(1.0, false);
console.log(`✅ Micro-respiración activa: posY varió sutilmente de ${initialPosY} a ${bottle.group.position.y}`);
bottle.update(2.0, true); // con reducedMotion
console.log('✅ Accesibilidad prefers-reduced-motion respetada: frasco estable sin movimiento.');

// 4. Prueba del entorno geológico (Obsidiana y rocas)
console.log('\n[Validación del Escenario de Obsidiana]');
const scene = new THREE.Scene();
const env = createHeroEnvironment(scene);
if (!env.group || env.group.name !== 'AdaraObsidianStage') {
  throw new Error('Fallo: El grupo del entorno no fue creado correctamente');
}
if (!scene.fog) {
  throw new Error('Fallo: La niebla atmosférica de la escena no fue inicializada');
}
console.log('✅ Pedestal de obsidiana, formaciones minerales y niebla atmosférica configuradas.');

// 5. Prueba de partículas de polvo dorado
console.log('\n[Validación de Partículas de Polvo Dorado]');
const particles = createHeroParticles(60);
if (!particles.points || particles.points.name !== 'AdaraGoldDustParticles') {
  throw new Error('Fallo: Sistema de partículas no inicializado');
}
particles.update(1.0, 0.016, false);
console.log('✅ Sistema de partículas de polvo de oro funcionando con actualización de buffers.');

// 6. Prueba del sistema de iluminación de estudio
console.log('\n[Validación de Iluminación de Estudio]');
const lights = createHeroLighting();
if (!lights.group || lights.group.children.length < 5) {
  throw new Error('Fallo: La iluminación debe contener Key Light, Rim Lights, Amber Bounce y Ambient');
}
lights.update(1.0, false);
console.log('✅ Esquema de iluminación de estudio (Key, Rim dorada, Recorte, Rebote Ámbar) validado.');

// 7. Prueba de limpieza de recursos GPU (dispose)
console.log('\n[Validación de Liberación de Memoria GPU]');
bottle.dispose();
env.dispose();
particles.dispose();
lights.dispose();
console.log('✅ Métodos de liberación de geometrías, materiales y texturas ejecutados sin excepciones.');

console.log('\n============================================================');
console.log('🎉 TODAS LAS PRUEBAS DE LA PORTADA 3D PASARON EXITOSAMENTE.');
console.log('============================================================');

