import * as THREE from 'three';

/**
 * Concentric Ripples Background
 * Renders the iconic flavor-themed concentric rings radiating from the center,
 * smoothly interpolating between flavor transitions as seen in screen-1.png.
 */

export class ConcentricRingsBackground {
  constructor(scene) {
    this.scene = scene;
    
    this.currColor = new THREE.Color('#C21818');
    this.currDeep = new THREE.Color('#3D0404');
    this.targetColor = new THREE.Color('#C21818');
    this.targetDeep = new THREE.Color('#3D0404');
    
    this.uniforms = {
      uTime: { value: 0 },
      uColor: { value: this.currColor },
      uDeep: { value: this.currDeep },
      uAspect: { value: window.innerWidth / window.innerHeight },
      uOpacity: { value: 1.0 }
    };

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.9999, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uDeep;
      uniform float uAspect;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 uvCorrected = vUv - center;
        uvCorrected.x *= uAspect;

        float dist = length(uvCorrected) * 2.2;
        
        // Concentric ripples radiating outward
        float rings = sin(dist * 18.0 - uTime * 0.45);
        rings = smoothstep(-0.25, 0.65, rings);

        // Mix between deep vignette and flavor highlight
        vec3 col = mix(uDeep, uColor, rings * 0.65);

        // Radial falloff vignette at outer edges
        float vignette = smoothstep(2.4, 0.2, dist);
        col *= vignette;

        gl_FragColor = vec4(col, uOpacity);
      }
    `;

    const geom = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      depthWrite: false,
      depthTest: false
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  setFlavor(flavor) {
    this.targetColor.set(flavor.color);
    this.targetDeep.set(flavor.deep);
  }

  setOpacity(val) {
    this.uniforms.uOpacity.value = val;
  }

  onResize(width, height) {
    this.uniforms.uAspect.value = width / height;
  }

  update(time, delta) {
    this.uniforms.uTime.value = time;
    // Smooth lerp color transitions
    this.currColor.lerp(this.targetColor, delta * 3.5);
    this.currDeep.lerp(this.targetDeep, delta * 3.5);
  }
}

