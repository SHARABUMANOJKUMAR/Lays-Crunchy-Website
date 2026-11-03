import * as THREE from 'three';
import { FLAVORS, DEFAULT_FLAVOR_ID, getFlavorById } from '../domain/flavors.js';
import { createPillowBagGeometry, createBagMesh } from './bagGeometry.js';
import { ChipField } from './chipfield.js';
import { ConcentricRingsBackground } from './concentricRings.js';

/**
 * SceneManager
 * Manages the shared WebGL context, camera, lighting, hero carousel arc,
 * and story scroll inspection poses.
 */

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Active state
    this.activeIndex = FLAVORS.findIndex(f => f.id === DEFAULT_FLAVOR_ID);
    if (this.activeIndex === -1) this.activeIndex = 0;
    this.targetActive = this.activeIndex;
    this.scrollProgress = 0; // 0 (Hero) -> 1 (Story end)
    this.mode = 'hero'; // 'hero', 'story', 'rack'

    this.initThree();
    this.initLights();
    this.initBackground();
    this.initBags();
    this.initChipField();
    this.bindEvents();
    this.startLoop();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 9.8);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient fill
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    // Key directional light with warm soft shadow
    this.keyLight = new THREE.DirectionalLight(0xfff6e6, 2.2);
    this.keyLight.position.set(4, 7, 6);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Fill rim light from left
    this.rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.rimLight.position.set(-6, 3, 3);
    this.scene.add(this.rimLight);

    // Dynamic flavor glow light
    this.flavorLight = new THREE.PointLight(FLAVORS[this.activeIndex].color, 2.0, 15);
    this.flavorLight.position.set(0, -1, 4);
    this.scene.add(this.flavorLight);
  }

  initBackground() {
    this.background = new ConcentricRingsBackground(this.scene);
    this.background.setFlavor(FLAVORS[this.activeIndex]);
  }

  initBags() {
    this.bagGroup = new THREE.Group();
    this.scene.add(this.bagGroup);

    this.sharedGeometry = createPillowBagGeometry(3.1, 4.6, 0.95, 42, 54);
    this.bagMeshes = [];

    FLAVORS.forEach((flavor) => {
      const bag = createBagMesh(flavor, this.sharedGeometry);
      this.bagMeshes.push(bag);
      this.bagGroup.add(bag);
    });

    this.updateBagPoses(0);
  }

  initChipField() {
    this.chipField = new ChipField(this.scene);
  }

  setActiveFlavorIndex(index) {
    const N = FLAVORS.length;
    this.targetActive = ((index % N) + N) % N;
    const currentFlavor = FLAVORS[this.targetActive];
    this.background.setFlavor(currentFlavor);
    this.flavorLight.color.set(currentFlavor.color);
  }

  getActiveFlavor() {
    return FLAVORS[this.targetActive];
  }

  /**
   * Arc Layout positioning for Hero Carousel
   * As specified in PSEUDOCODE.md:
   * offset = wrap(i - active)
   * target.position/rotation/scale = arcLayout(offset)
   */
  getArcLayout(offset) {
    // offset ranges from -4 to 4
    const spacingX = 2.45;
    const x = offset * spacingX;
    
    // Depth falls back in circular arc
    const z = -Math.abs(offset) * 1.35;
    
    // Subtle arch in Y
    const y = -Math.pow(offset, 2) * 0.12 - 0.15;
    
    // Bag turns slightly inward toward center
    const rotY = -offset * 0.22;
    const rotZ = -offset * 0.04;
    
    // Scale tapers off with distance
    const dist = Math.abs(offset);
    const scale = Math.max(0.48, 1.0 - dist * 0.14);

    return { x, y, z, rotX: 0.05, rotY, rotZ, scale };
  }

  /**
   * Story chapter pose scrubbing
   */
  getStoryPose(progress) {
    // During story, hero bag zooms in and rotates for hotspot callouts
    // Progress 0..1 corresponds to chapters 1..4
    const rotY = progress * Math.PI * 1.8;
    const rotX = Math.sin(progress * Math.PI * 2) * 0.18;
    const z = 2.4 + Math.sin(progress * Math.PI) * 0.8;
    const x = 0.95; // shift to the right to leave room for story copy on left
    const y = 0.1;
    return { x, y, z, rotX, rotY, rotZ: 0.05, scale: 0.95 };
  }

  updateBagPoses(delta) {
    const N = FLAVORS.length;
    // Smooth lerp of active carousel index
    const diff = this.targetActive - this.activeIndex;
    // Shortest circular wrap for smooth rotation
    const wrappedDiff = Math.atan2(Math.sin((diff * 2 * Math.PI) / N), Math.cos((diff * 2 * Math.PI) / N)) * (N / (2 * Math.PI));
    this.activeIndex += wrappedDiff * Math.min(1.0, delta * 6.5);

    const isHero = this.scrollProgress < 0.15;
    const storyBlend = THREE.MathUtils.clamp((this.scrollProgress - 0.15) / 0.7, 0, 1);

    this.bagMeshes.forEach((bag, i) => {
      // Calculate circular distance
      let offset = i - this.activeIndex;
      while (offset > N / 2) offset -= N;
      while (offset < -N / 2) offset += N;

      const heroPose = this.getArcLayout(offset);

      if (i === this.targetActive && storyBlend > 0) {
        // Active bag morphs into story pose
        const storyPose = this.getStoryPose(this.scrollProgress);
        
        bag.position.x = THREE.MathUtils.lerp(heroPose.x, storyPose.x, storyBlend);
        bag.position.y = THREE.MathUtils.lerp(heroPose.y, storyPose.y, storyBlend);
        bag.position.z = THREE.MathUtils.lerp(heroPose.z, storyPose.z, storyBlend);

        bag.rotation.x = THREE.MathUtils.lerp(heroPose.rotX, storyPose.rotX, storyBlend);
        bag.rotation.y = THREE.MathUtils.lerp(heroPose.rotY, storyPose.rotY, storyBlend);
        bag.rotation.z = THREE.MathUtils.lerp(heroPose.rotZ, storyPose.rotZ, storyBlend);

        const s = THREE.MathUtils.lerp(heroPose.scale, storyPose.scale, storyBlend);
        bag.scale.set(s, s, s);
        bag.visible = true;
      } else {
        // Other bags fade/recede during story
        const fadeOut = 1.0 - storyBlend;
        bag.position.x = heroPose.x;
        bag.position.y = heroPose.y;
        bag.position.z = heroPose.z - (storyBlend * 8.0);
        bag.rotation.x = heroPose.rotX;
        bag.rotation.y = heroPose.rotY;
        bag.rotation.z = heroPose.rotZ;

        const s = heroPose.scale * fadeOut;
        bag.scale.set(s, s, s);
        bag.visible = fadeOut > 0.05 && Math.abs(offset) < 3.5;
      }
    });

    // Fade background rings opacity when scrolling past the story into shop
    if (this.scrollProgress > 0.8) {
      const shopFade = THREE.MathUtils.clamp((this.scrollProgress - 0.8) / 0.15, 0, 1);
      this.background.setOpacity(1.0 - shopFade);
    } else {
      this.background.setOpacity(1.0);
    }
  }

  setScrollProgress(progress) {
    this.scrollProgress = progress;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
      this.background.onResize(this.width, this.height);
    });
  }

  startLoop() {
    this.clock = new THREE.Clock();

    const render = () => {
      requestAnimationFrame(render);
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      this.updateBagPoses(delta);
      this.background.update(elapsed, delta);
      this.chipField.update(elapsed, delta);

      this.renderer.render(this.scene, this.camera);
    };

    render();
  }
}

