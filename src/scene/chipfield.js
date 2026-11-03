import * as THREE from 'three';

/**
 * Chipfield & Storm Particle System
 * Manages 3D potato chips and seasoning particles floating around the hero,
 * inside story chapters, and chip-storm transitions.
 */

export class ChipField {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.chips = [];
    this.seasoningParticles = null;
    this.scene.add(this.group);

    this.createChips();
    this.createSeasoningDust();
  }

  createChipGeometry(radius = 0.42, segments = 24) {
    const geom = new THREE.PlaneGeometry(radius * 2, radius * 1.5, segments, segments);
    const pos = geom.attributes.position;

    // Apply potato chip hyperbolic saddle shape: z = c*(x^2 - y^2)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      if (dist > radius) {
        // Trim corners into organic ellipse
        pos.setX(i, (x / dist) * radius);
        pos.setY(i, (y / dist) * (radius * 0.75));
      }
      const curl = (x * x * 0.45) - (y * y * 0.55);
      const ripple = Math.sin(x * 12) * 0.04;
      pos.setZ(i, curl + ripple);
    }
    geom.computeVertexNormals();
    return geom;
  }

  createChipMaterial() {
    // Crisp golden potato chip canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 120);
    grad.addColorStop(0, '#FFE382');
    grad.addColorStop(0.65, '#E5A51E');
    grad.addColorStop(1, '#9B5B05');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Seasoning dots
    ctx.fillStyle = 'rgba(194, 24, 24, 0.45)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 1.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide
    });
  }

  createChips(count = 28) {
    const chipGeom = this.createChipGeometry();
    const chipMat = this.createChipMaterial();

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(chipGeom, chipMat);
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 12;
      mesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 10 - 2
      );

      const scale = 0.5 + Math.random() * 0.7;
      mesh.scale.set(scale, scale, scale);

      mesh.userData = {
        rotSpeedX: (Math.random() - 0.5) * 0.02,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        rotSpeedZ: (Math.random() - 0.5) * 0.015,
        floatSpeed: 0.5 + Math.random() * 1.5,
        baseY: mesh.position.y,
        phase: Math.random() * Math.PI * 2
      };

      this.chips.push(mesh);
      this.group.add(mesh);
    }
  }

  createSeasoningDust(count = 220) {
    const geom = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const colorA = new THREE.Color('#FF4D4D');
    const colorB = new THREE.Color('#FFCC00');

    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 12
      );

      const c = Math.random() > 0.4 ? colorA : colorB;
      colors.push(c.r, c.g, c.b);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75
    });

    this.seasoningParticles = new THREE.Points(geom, mat);
    this.group.add(this.seasoningParticles);
  }

  triggerStorm(duration = 2.0) {
    // Quick burst of chips speeding across screen
    this.chips.forEach(chip => {
      chip.position.x = -15 - Math.random() * 10;
      chip.position.y = (Math.random() - 0.5) * 12;
      chip.userData.stormSpeed = 18 + Math.random() * 16;
    });
  }

  update(time, delta) {
    // Animate chips
    this.chips.forEach(chip => {
      if (chip.userData.stormSpeed) {
        chip.position.x += chip.userData.stormSpeed * delta;
        if (chip.position.x > 18) {
          chip.userData.stormSpeed = null; // stop storm mode
        }
      } else {
        chip.rotation.x += chip.userData.rotSpeedX;
        chip.rotation.y += chip.userData.rotSpeedY;
        chip.rotation.z += chip.userData.rotSpeedZ;
        chip.position.y = chip.userData.baseY + Math.sin(time * chip.userData.floatSpeed + chip.userData.phase) * 0.4;
      }
    });

    // Animate seasoning particles
    if (this.seasoningParticles) {
      this.seasoningParticles.rotation.y = time * 0.04;
      this.seasoningParticles.rotation.x = Math.sin(time * 0.02) * 0.05;
    }
  }
}

