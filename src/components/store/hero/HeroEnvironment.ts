import * as THREE from 'three';

/**
 * Instancia del entorno tridimensional (pedestal de obsidiana, rocas volcánicas y niebla).
 */
export interface HeroEnvironmentInstance {
  group: THREE.Group;
  dispose: () => void;
}

/**
 * Construye el escenario geológico de obsidiana y roca volcánica de ADARA PARFUM.
 *
 * @remarks
 * Inspirado en la fotografía original de `hero_adara.jpg`:
 * - Placa de basalto/obsidiana oscura con aristas rotas y facetas mates.
 * - Formaciones rocosas discretas en el fondo para generar profundidad atmosférica.
 * - Partículas estáticas de pan de oro espolvoreadas sobre la superficie de la roca.
 * - Plano de suelo sombreado que absorbe la luz y previene reflejos artificiales.
 */
export function createHeroEnvironment(scene: THREE.Scene): HeroEnvironmentInstance {
  const environmentGroup = new THREE.Group();
  environmentGroup.name = 'AdaraObsidianStage';

  const disposableGeometries: THREE.BufferGeometry[] = [];
  const disposableMaterials: THREE.Material[] = [];

  // 1. Niebla ambiental profunda (fondo negro carbón)
  scene.fog = new THREE.FogExp2(0x070706, 0.042);

  // 2. Material de roca volcánica / obsidiana mate
  const obsidianRockMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0x0b0a09),
    roughness: 0.88,
    metalness: 0.08,
    flatShading: true
  });
  disposableMaterials.push(obsidianRockMaterial);

  // 3. Pedestal Principal: Losa de obsidiana tallada
  // Usamos una geometría facetada con perturbación en vértices para aristas de roca volcánica
  const slabGeometry = new THREE.CylinderGeometry(4.2, 4.8, 0.9, 10);
  const positionAttr = slabGeometry.attributes.position;
  // Perturbación sutil en vértices para look de roca mineral natural
  for (let i = 0; i < positionAttr.count; i++) {
    const vx = positionAttr.getX(i);
    const vy = positionAttr.getY(i);
    const vz = positionAttr.getZ(i);
    // Variación orgánica pseudo-aleatoria determinística
    const noise = Math.sin(vx * 2.5 + vz * 3.1) * 0.12;
    positionAttr.setXYZ(i, vx + noise * 0.4, vy + noise * 0.3, vz + noise * 0.4);
  }
  slabGeometry.computeVertexNormals();
  disposableGeometries.push(slabGeometry);

  const slabMesh = new THREE.Mesh(slabGeometry, obsidianRockMaterial);
  slabMesh.position.set(0, -0.65, 0);
  slabMesh.receiveShadow = true;
  environmentGroup.add(slabMesh);

  // 4. Formaciones rocosas secundarias en profundidad (crean capas visuales)
  // Roca trasera izquierda
  const rockBackLeftGeo = new THREE.DodecahedronGeometry(2.2, 0);
  rockBackLeftGeo.scale(1.4, 0.9, 1.1);
  disposableGeometries.push(rockBackLeftGeo);
  const rockBackLeft = new THREE.Mesh(rockBackLeftGeo, obsidianRockMaterial);
  rockBackLeft.position.set(-4.2, -0.4, -3.2);
  rockBackLeft.rotation.set(0.3, 0.8, -0.2);
  environmentGroup.add(rockBackLeft);

  // Roca trasera derecha
  const rockBackRightGeo = new THREE.DodecahedronGeometry(1.8, 0);
  rockBackRightGeo.scale(1.2, 0.8, 1.3);
  disposableGeometries.push(rockBackRightGeo);
  const rockBackRight = new THREE.Mesh(rockBackRightGeo, obsidianRockMaterial);
  rockBackRight.position.set(4.6, -0.7, -2.8);
  rockBackRight.rotation.set(-0.2, 1.2, 0.4);
  environmentGroup.add(rockBackRight);

  // 5. Destellos de polvo dorado estático sobre la losa de roca (como en la foto de campaña)
  const speckCount = 180;
  const speckPositions = new Float32Array(speckCount * 3);
  for (let i = 0; i < speckCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.3 + Math.random() * 2.8;
    speckPositions[i * 3 + 0] = Math.cos(angle) * radius;
    speckPositions[i * 3 + 1] = -0.19 + (Math.random() - 0.5) * 0.04; // Sobre la superficie superior de la losa
    speckPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  const speckGeometry = new THREE.BufferGeometry();
  speckGeometry.setAttribute('position', new THREE.BufferAttribute(speckPositions, 3));
  disposableGeometries.push(speckGeometry);

  const speckMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(0xd4af37),
    size: 0.038,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending
  });
  disposableMaterials.push(speckMaterial);

  const specks = new THREE.Points(speckGeometry, speckMaterial);
  environmentGroup.add(specks);

  // 6. Plano de suelo infinito profundo para captar sombra y fundirse en la niebla
  const floorGeometry = new THREE.PlaneGeometry(36, 36);
  floorGeometry.rotateX(-Math.PI / 2);
  disposableGeometries.push(floorGeometry);

  const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x050505
  });
  disposableMaterials.push(floorMaterial);

  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.position.y = -1.2;
  environmentGroup.add(floorMesh);

  return {
    group: environmentGroup,
    dispose: () => {
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
    }
  };
}

