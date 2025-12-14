import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { SHAPES } from "./shapes.js";
import { lerp } from "../utils/smooth.js";

let points, geometry, positions;
let currentShape = "GALAXY";

export function initParticles(scene) {
  geometry = new THREE.BufferGeometry();
  positions = new Float32Array(50000 * 3);

  for (let i = 0; i < positions.length; i++) {
    positions[i] = (Math.random() - 0.5) * 200;
  }

  geometry.setAttribute("position",
    new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 1.2,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  points = new THREE.Points(geometry, mat);
  scene.add(points);
}

export function setShape(shape) {
  if (SHAPES[shape]) currentShape = shape;
}

export function updateParticles() {
  const pos = geometry.attributes.position.array;

  for (let i = 0; i < pos.length; i += 3) {
    const t = i * 0.01;
    const target = SHAPES[currentShape](t);

    pos[i]   = lerp(pos[i], target.x, 0.02);
    pos[i+1] = lerp(pos[i+1], target.y, 0.02);
    pos[i+2] = lerp(pos[i+2], target.z, 0.02);
  }

  geometry.attributes.position.needsUpdate = true;
}
