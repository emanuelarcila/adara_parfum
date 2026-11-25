import * as THREE from 'three';

/**
 * Resultado de la construcción del frasco 3D de ADARA PARFUM.
 */
export interface HeroBottleInstance {
  /** Grupo raíz de Three.js que contiene todas las partes del frasco */
  group: THREE.Group;
  /** Función de actualización por cuadro para micro-respiración lumínica sutil */
  update: (elapsedTime: number, reducedMotion: boolean) => void;
  /** Función de limpieza para liberar memorias y geometrías de la GPU */
  dispose: () => void;
}

/**
 * Crea una textura de alta resolución en un elemento Canvas 2D en memoria
 * para estampar la tipografía oficial en pan de oro de ADARA PARFUM.
 */
function createAdaraFoilLabelTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 1024, 1024);

    // Gradiente metálico dorado de alta fidelidad
    const goldGradient = ctx.createLinearGradient(0, 360, 0, 680);
    goldGradient.addColorStop(0.0, '#FFF5D6');
    goldGradient.addColorStop(0.25, '#E5C175');
    goldGradient.addColorStop(0.55, '#C6A15B');
    goldGradient.addColorStop(0.85, '#8E713D');
    goldGradient.addColorStop(1.0, '#5A4620');

    ctx.fillStyle = goldGradient;
    ctx.textAlign = 'center';

    // 1. Logotipo Principal: ADARA (Serif clásico con espaciado editorial)
    ctx.font = '600 116px "Cormorant Garamond", Georgia, serif';
    ctx.letterSpacing = '14px';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillText('ADARA', 512, 490);

    // 2. Subtítulo: PARFUM (Sans-serif moderno)
    ctx.font = '600 28px "Manrope", sans-serif';
    ctx.letterSpacing = '18px';
    ctx.shadowBlur = 4;
    ctx.fillText('PARFUM', 512, 545);

    // 3. Ficha Técnica en Oro Sutil
    ctx.font = '500 14px "Manrope", sans-serif';
    ctx.letterSpacing = '7px';
    ctx.fillStyle = '#C6A15B';
    ctx.shadowBlur = 2;
    ctx.fillText('POUR FEMME · PARIS · 50ml ℮ 1.7 FL.OZ.', 512, 610);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Crea una textura circular para el grabado superior del tapón dorado de ADARA.
 */
function createAdaraCapEngravingTexture(): THREE.Texture {
  if (typeof document === 'undefined') {
    return new THREE.Texture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    // Fondo radial de oro cepillado
    const radial = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    radial.addColorStop(0.0, '#E8C77F');
    radial.addColorStop(0.7, '#C6A15B');
    radial.addColorStop(1.0, '#7A5E2A');
    ctx.fillStyle = radial;
    ctx.beginPath();
    ctx.arc(256, 256, 254, 0, Math.PI * 2);
    ctx.fill();

    // Aro exterior concéntrico
    ctx.strokeStyle = '#523E1C';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(256, 256, 230, 0, Math.PI * 2);
    ctx.stroke();

    // Monograma / Emblema grabado en el centro
    ctx.fillStyle = '#483515';
    ctx.textAlign = 'center';
    ctx.font = '600 68px "Cormorant Garamond", Georgia, serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('ADARA', 256, 280);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Construye el modelo tridimensional del frasco original de ADARA PARFUM.
 *
 * @remarks
 * Reproduce fielmente la silueta de `hero_adara.jpg`:
 * - Cuerpo de cristal de obsidiana facetado con biseles angulados (tipo esmeralda octogonal).
 * - Núcleo interior con la tonalidad ambarina profunda de la fragancia.
 * - Fondo de cristal macizo de alto grosor.
 * - Cuello metálico y aro con acabado oro cepillado.
 * - Tapón monolítico cilíndrico de oro con grabado superior.
 * - Etiqueta frontal en relieve de pan de oro auténtico.
 */
export function createHeroBottle(): HeroBottleInstance {
  const bottleGroup = new THREE.Group();
  bottleGroup.name = 'AdaraBottleMonolith';

  const disposableGeometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];
  const disposableTextures: THREE.Texture[] = [];

  // ==========================================
  // 1. MATERIALES DE ALTA FIDELIDAD
  // ==========================================

  // Vidrio exterior de obsidiana ahumada de ADARA
  const obsidianGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0c0b0a),
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.58, // Permite vislumbrar el cálido líquido interior
    ior: 1.54,
    thickness: 1.25,
    transparent: true,
    opacity: 0.96,
    specularIntensity: 1.4,
    specularColor: new THREE.Color(0xffefd2),
    reflectivity: 0.85
  });
  disposableMaterials.push(obsidianGlassMaterial);

  // Cristal macizo inferior de la base
  const solidBaseGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0f0e0c),
    roughness: 0.04,
    metalness: 0.02,
    transmission: 0.65,
    ior: 1.56,
    thickness: 1.8,
    transparent: true,
    opacity: 0.98,
    specularIntensity: 1.2,
    specularColor: new THREE.Color(0xffe8ba)
  });
  disposableMaterials.push(solidBaseGlassMaterial);

  // Líquido ambarino interior (Extracto puro)
  const amberLiquidMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xc97818),
    emissive: new THREE.Color(0x281404),
    emissiveIntensity: 0.45,
    roughness: 0.12,
    metalness: 0.0,
    transmission: 0.72,
    ior: 1.42,
    thickness: 0.75,
    transparent: true,
    opacity: 0.92
  });
  disposableMaterials.push(amberLiquidMaterial);

  // Oro cepillado de lujo (cuello y tapón)
  const brushedGoldMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xc6a15b),
    metalness: 0.92,
    roughness: 0.28,
    envMapIntensity: 1.6
  });
  disposableMaterials.push(brushedGoldMaterial);

  // ==========================================
  // 2. CUERPO FACETADO TIPO ESMERALDA (OCTOGONAL)
  // ==========================================

  // Sección transversal octogonal beveled en X-Z
  const bottleWidth = 2.45;
  const bottleDepth = 1.45;
  const cornerBevel = 0.42;

  const flaconShape = new THREE.Shape();
  flaconShape.moveTo(-bottleWidth / 2 + cornerBevel, -bottleDepth / 2);
  flaconShape.lineTo(bottleWidth / 2 - cornerBevel, -bottleDepth / 2);
  flaconShape.lineTo(bottleWidth / 2, -bottleDepth / 2 + cornerBevel);
  flaconShape.lineTo(bottleWidth / 2, bottleDepth / 2 - cornerBevel);
  flaconShape.lineTo(bottleWidth / 2 - cornerBevel, bottleDepth / 2);
  flaconShape.lineTo(-bottleWidth / 2 + cornerBevel, bottleDepth / 2);
  flaconShape.lineTo(-bottleWidth / 2, bottleDepth / 2 - cornerBevel);
  flaconShape.lineTo(-bottleWidth / 2, -bottleDepth / 2 + cornerBevel);
  flaconShape.closePath();

  // Extrusión con biselado suave de bordes
  const flaconExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 2.2,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.14,
    bevelThickness: 0.16
  };

  const flaconGeometry = new THREE.ExtrudeGeometry(flaconShape, flaconExtrudeSettings);
  flaconGeometry.rotateX(-Math.PI / 2); // Alinear extrusión vertical en eje Y
  flaconGeometry.center();
  disposableGeometries.push(flaconGeometry);

  const flaconMesh = new THREE.Mesh(flaconGeometry, obsidianGlassMaterial);
  flaconMesh.position.y = 0.95;
  bottleGroup.add(flaconMesh);

  // ==========================================
  // 3. HOMBROS CÓNICOS BISELADOS HACIA EL CUELLO
  // ==========================================
  const shoulderGeometry = new THREE.CylinderGeometry(0.68, 1.35, 0.45, 8);
  shoulderGeometry.rotateY(Math.PI / 8); // Alinear facetas octogonales
  disposableGeometries.push(shoulderGeometry);

  const shoulderMesh = new THREE.Mesh(shoulderGeometry, obsidianGlassMaterial);
  shoulderMesh.position.y = 2.22;
  bottleGroup.add(shoulderMesh);

  // ==========================================
  // 4. BASE MACIZA DE CRISTAL PESADO
  // ==========================================
  const baseGeometry = new THREE.CylinderGeometry(1.36, 1.40, 0.45, 8);
  baseGeometry.rotateY(Math.PI / 8);
  disposableGeometries.push(baseGeometry);

  const baseMesh = new THREE.Mesh(baseGeometry, solidBaseGlassMaterial);
  baseMesh.position.y = -0.15;
  bottleGroup.add(baseMesh);

  // ==========================================
  // 5. NÚCLEO LÍQUIDO AMBARINO INTERIOR
  // ==========================================
  const liquidGeometry = new THREE.BoxGeometry(1.85, 1.80, 0.95);
  disposableGeometries.push(liquidGeometry);

  const liquidMesh = new THREE.Mesh(liquidGeometry, amberLiquidMaterial);
  liquidMesh.position.y = 0.95;
  bottleGroup.add(liquidMesh);

  // ==========================================
  // 6. ETIQUETA FRONTAL EN PAN DE ORO ADARA
  // ==========================================
  const labelTexture = createAdaraFoilLabelTexture();
  disposableTextures.push(labelTexture);

  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    transparent: true,
    metalness: 0.96,
    roughness: 0.24,
    color: new THREE.Color(0xc6a15b),
    emissive: new THREE.Color(0x281905),
    emissiveIntensity: 0.35,
    depthWrite: false
  });
  disposableMaterials.push(labelMaterial);

  const labelGeometry = new THREE.PlaneGeometry(1.7, 1.7);
  disposableGeometries.push(labelGeometry);

  const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
  // Colocada inmediatamente frente a la faceta central anterior
  labelMesh.position.set(0, 0.92, bottleDepth / 2 + 0.165);
  bottleGroup.add(labelMesh);

  // ==========================================
  // 7. CUELLO Y ARO METÁLICO DORADO
  // ==========================================
  const neckRingBaseGeo = new THREE.CylinderGeometry(0.58, 0.62, 0.16, 48);
  disposableGeometries.push(neckRingBaseGeo);
  const neckRingBaseMesh = new THREE.Mesh(neckRingBaseGeo, brushedGoldMaterial);
  neckRingBaseMesh.position.y = 2.48;
  bottleGroup.add(neckRingBaseMesh);

  const neckSpindleGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 48);
  disposableGeometries.push(neckSpindleGeo);
  const neckSpindleMesh = new THREE.Mesh(neckSpindleGeo, brushedGoldMaterial);
  neckSpindleMesh.position.y = 2.66;
  bottleGroup.add(neckSpindleMesh);

  const neckFlaredGeo = new THREE.CylinderGeometry(0.72, 0.52, 0.22, 48);
  disposableGeometries.push(neckFlaredGeo);
  const neckFlaredMesh = new THREE.Mesh(neckFlaredGeo, brushedGoldMaterial);
  neckFlaredMesh.position.y = 2.88;
  bottleGroup.add(neckFlaredMesh);

  // ==========================================
  // 8. TAPÓN MONOLÍTICO DE ORO MACIZO ADARA
  // ==========================================
  // Cuerpo principal del tapón cilíndrico pesado
  const capBodyGeometry = new THREE.CylinderGeometry(1.02, 0.98, 0.82, 64);
  disposableGeometries.push(capBodyGeometry);
  const capBodyMesh = new THREE.Mesh(capBodyGeometry, brushedGoldMaterial);
  capBodyMesh.position.y = 3.38;
  bottleGroup.add(capBodyMesh);

  // Disco grabado superior del tapón
  const capTopTexture = createAdaraCapEngravingTexture();
  disposableTextures.push(capTopTexture);

  const capTopMaterial = new THREE.MeshStandardMaterial({
    map: capTopTexture,
    metalness: 0.92,
    roughness: 0.32
  });
  disposableMaterials.push(capTopMaterial);

  const capTopGeometry = new THREE.CircleGeometry(0.98, 64);
  capTopGeometry.rotateX(-Math.PI / 2);
  disposableGeometries.push(capTopGeometry);

  const capTopMesh = new THREE.Mesh(capTopGeometry, capTopMaterial);
  capTopMesh.position.y = 3.792;
  bottleGroup.add(capTopMesh);

  // Bisel dorado periférico superior
  const capBevelRingGeo = new THREE.TorusGeometry(0.98, 0.04, 16, 64);
  capBevelRingGeo.rotateX(Math.PI / 2);
  disposableGeometries.push(capBevelRingGeo);
  const capBevelRingMesh = new THREE.Mesh(capBevelRingGeo, brushedGoldMaterial);
  capBevelRingMesh.position.y = 3.79;
  bottleGroup.add(capBevelRingMesh);

  // ==========================================
  // 9. ORIENTACIÓN FIJA RECONOCIBLE
  // ==========================================
  // Ligera angulación fija (7.5 grados) para apreciar facetas y tridimensionalidad
  // sin perder legibilidad frontal
  bottleGroup.rotation.y = 0.13;
  bottleGroup.rotation.x = 0.02;

  const initialY = bottleGroup.position.y;

  return {
    group: bottleGroup,

    /**
     * Micro-respiración lumínica y ambiental casi imperceptible.
     * Mantiene el frasco sólido, fijo y majestuoso.
     */
    update: (elapsedTime: number, reducedMotion: boolean) => {
      if (reducedMotion) return;
      // Oscilación vertical mínima de flotación suspendida (0.028 unidades)
      bottleGroup.position.y = initialY + Math.sin(elapsedTime * 0.75) * 0.028;
      // Micro-inclinación estática sutil (0.005 rad)
      bottleGroup.rotation.y = 0.13 + Math.sin(elapsedTime * 0.5) * 0.008;
    },

    dispose: () => {
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      disposableTextures.forEach((t) => t.dispose());
    }
  };
}

