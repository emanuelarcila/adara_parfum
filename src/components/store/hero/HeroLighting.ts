import * as THREE from 'three';

/**
 * Instancia del sistema de iluminación de estudio de alta perfumería.
 */
export interface HeroLightingInstance {
  group: THREE.Group;
  update: (elapsedTime: number, reducedMotion: boolean) => void;
  dispose: () => void;
}

/**
 * Configura la iluminación cinematográfica de estudio para ADARA PARFUM.
 *
 * @remarks
 * Diseñada para realzar el vidrio facetado de obsidiana y el oro cepillado:
 * - Luz principal cálida que modela la volumetría y el logotipo frontal.
 * - Luz de contorno dorada intensa que dibuja la silueta del frasco y su hombro derecho.
 * - Luz de recorte izquierda que separa la botella del fondo negro profundo.
 * - Foco puntual ambarino inferior que genera translucidez cálida a través del líquido y la base de cristal.
 * - Luz ambiental sutil para conservar riqueza de detalle sin empastar sombras.
 */
export function createHeroLighting(): HeroLightingInstance {
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'AdaraStudioLighting';

  // 1. Luz Ambiental cálida y difusa
  const ambientLight = new THREE.AmbientLight(0x181612, 0.6);
  lightingGroup.add(ambientLight);

  // 2. Luz Principal (Key Light) — Suave, cálida, frontal superior izquierda
  const keyLight = new THREE.DirectionalLight(0xffeed4, 2.7);
  keyLight.position.set(-2.8, 4.8, 4.2);
  lightingGroup.add(keyLight);

  // 3. Luz de Contorno Dorada (Golden Rim Light) — Trasera superior derecha
  // Dibuja el filo brillante en el borde del frasco y el tapón
  const rimLightGold = new THREE.DirectionalLight(0xc6a15b, 4.2);
  rimLightGold.position.set(4.4, 3.2, -3.2);
  lightingGroup.add(rimLightGold);

  // 4. Luz de Recorte Secundaria (Secondary Kicker) — Trasera izquierda
  const rimLightSecondary = new THREE.DirectionalLight(0x91733e, 2.1);
  rimLightSecondary.position.set(-3.8, 2.2, -2.8);
  lightingGroup.add(rimLightSecondary);

  // 5. Rebote Ambarino Inferior (Under-Bottle Amber Transillumination)
  // Ilumina el líquido interior y produce el tono coñac cálido característico
  const amberUplight = new THREE.PointLight(0xd48b28, 1.8, 7.5, 1.2);
  amberUplight.position.set(0.2, -0.9, 0.9);
  lightingGroup.add(amberUplight);

  // 6. Luz de destello frontal suave sobre el oro
  const specularFill = new THREE.DirectionalLight(0xfffaed, 0.8);
  specularFill.position.set(0.0, 1.5, 5.0);
  lightingGroup.add(specularFill);

  const baseKeyIntensity = keyLight.intensity;
  const baseRimIntensity = rimLightGold.intensity;

  return {
    group: lightingGroup,

    /**
     * Modulación lumínica sutil (respiración de reflejos sin desplazamiento físico).
     */
    update: (elapsedTime: number, reducedMotion: boolean) => {
      if (reducedMotion) return;
      const breathFactor = Math.sin(elapsedTime * 0.65) * 0.05; // Variación del 5%
      keyLight.intensity = baseKeyIntensity * (1 + breathFactor);
      rimLightGold.intensity = baseRimIntensity * (1 - breathFactor * 0.8);
    },

    dispose: () => {
      keyLight.dispose();
      rimLightGold.dispose();
      rimLightSecondary.dispose();
      amberUplight.dispose();
      specularFill.dispose();
      ambientLight.dispose();
    }
  };
}

