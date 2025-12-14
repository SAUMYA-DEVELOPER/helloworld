import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js";

let points, geometry;
let currentMode = "GALAXY";

export function initParticles(scene) {
  geometry = new THREE.BufferGeometry();
  const count = 50000;
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random()-0.5)*5;
    pos[i*3+1] = (Math.random()-0.5)*5;
    pos[i*3+2] = (Math.random()-0.5)*5;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xff66ff,
    blending: THREE.AdditiveBlending,
    transparent: true
  });

  points = new THREE.Points(geometry, mat);
  scene.add(points);
}

export function setMode(mode) {
  currentMode = mode;
  points.material.color.set(
    mode === "HEART" ? 0xff3366 :
    mode === "FLOWER" ? 0xffcc00 :
    0x66ccff
  );
}
