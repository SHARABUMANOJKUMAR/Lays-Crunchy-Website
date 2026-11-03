import * as THREE from 'three';
import { textureService } from '../services/textureService.js';

/**
 * Creates authentic pillow-shaped snack bag geometry with crimped heat seals.
 */
export function createPillowBagGeometry(width = 3.2, height = 4.8, depth = 0.95, segmentsX = 48, segmentsY = 64) {
  const geom = new THREE.BufferGeometry();
  
  const vertices = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const sealHeight = 0.38; // height of flat crimped seal at top and bottom

  // 1. Generate Front and Back grid
  // We generate a double-sided pillow: grid of vertices for Front, then grid of vertices for Back, joined at the rims.
  
  const nx = segmentsX;
  const ny = segmentsY;

  // Front surface vertices
  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    const y = -halfH + v * height;

    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const x = -halfW + u * width;

      // Cushion pillow falloff
      const xFactor = Math.cos((x / halfW) * (Math.PI * 0.5));
      
      // Vertical cushion falloff (clamped flat at seals)
      let yFactor = 1.0;
      const distFromTop = halfH - y;
      const distFromBottom = y - (-halfH);

      let crimpZ = 0;
      if (distFromTop < sealHeight) {
        yFactor = 0.04;
        crimpZ = Math.sin(x * 55) * 0.02; // ribbed crimp teeth
      } else if (distFromBottom < sealHeight) {
        yFactor = 0.04;
        crimpZ = Math.sin(x * 55) * 0.02; // ribbed crimp teeth
      } else {
        const bodyYRatio = (y - (-halfH + sealHeight)) / (height - 2 * sealHeight);
        yFactor = Math.sin(bodyYRatio * Math.PI);
      }

      // Front puffed volume + subtle foil wrinkles
      const wrinkle = Math.sin(x * 12 + y * 6) * 0.03 * yFactor;
      const z = Math.max(0.005, depth * xFactor * yFactor + wrinkle + crimpZ);

      vertices.push(x, y, z);
      uvs.push(u, v);
    }
  }

  // Front indices
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const c = a + (nx + 1);
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  // Back surface vertices
  const backOffset = (nx + 1) * (ny + 1);
  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    const y = -halfH + v * height;

    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const x = -halfW + u * width;

      const xFactor = Math.cos((x / halfW) * (Math.PI * 0.5));
      let yFactor = 1.0;
      const distFromTop = halfH - y;
      const distFromBottom = y - (-halfH);

      let crimpZ = 0;
      if (distFromTop < sealHeight || distFromBottom < sealHeight) {
        yFactor = 0.04;
        crimpZ = Math.sin(x * 55) * 0.02;
      } else {
        const bodyYRatio = (y - (-halfH + sealHeight)) / (height - 2 * sealHeight);
        yFactor = Math.sin(bodyYRatio * Math.PI);
      }

      const wrinkle = Math.cos(x * 10 - y * 7) * 0.03 * yFactor;
      const z = -(Math.max(0.005, depth * xFactor * yFactor + wrinkle) + crimpZ);

      vertices.push(x, y, z);
      // Flip U for back face so text doesn't show backwards
      uvs.push(1.0 - u, v);
    }
  }

  // Back indices (inverted winding)
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = backOffset + j * (nx + 1) + i;
      const b = a + 1;
      const c = a + (nx + 1);
      const d = c + 1;
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  // Stitch edges between front and back
  // Left border
  for (let j = 0; j < ny; j++) {
    const fA = j * (nx + 1);
    const fB = (j + 1) * (nx + 1);
    const bA = backOffset + j * (nx + 1);
    const bB = backOffset + (j + 1) * (nx + 1);
    indices.push(fA, bB, fB);
    indices.push(fA, bA, bB);
  }

  // Right border
  for (let j = 0; j < ny; j++) {
    const fA = j * (nx + 1) + nx;
    const fB = (j + 1) * (nx + 1) + nx;
    const bA = backOffset + j * (nx + 1) + nx;
    const bB = backOffset + (j + 1) * (nx + 1) + nx;
    indices.push(fA, fB, bB);
    indices.push(fA, bB, bA);
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Creates a complete bag mesh with foil material and texture.
 */
export function createBagMesh(flavor, sharedGeometry = null) {
  const geom = sharedGeometry || createPillowBagGeometry();
  const texture = textureService.getBagTexture(flavor);

  const material = new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: 0.32,
    metalness: 0.15,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    reflectivity: 0.65,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    flavorId: flavor.id,
    flavor: flavor,
    baseRotY: 0,
    targetRotY: 0
  };

  return mesh;
}

